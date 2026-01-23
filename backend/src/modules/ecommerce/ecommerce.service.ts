import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { DecimalUtil } from '../../common/utils/decimal.util';
import { InventoryService } from '../inventory/inventory.service';
import { ShippingService } from '../shipping/shipping.service';

@Injectable()
export class EcommerceService {
  constructor(
    @InjectRepository(Cart)
    private cartsRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemsRepository: Repository<CartItem>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    private inventoryService: InventoryService,
    private shippingService: ShippingService,
    private dataSource: DataSource,
  ) { }

  // Cart
  async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartsRepository.findOne({
      where: { userId },
      relations: ['items', 'items.variant', 'items.variant.product'],
    });

    if (!cart) {
      cart = this.cartsRepository.create({ userId });
      cart = await this.cartsRepository.save(cart);
    }

    return cart;
  }

  async addToCart(userId: string, variantId: string, quantity: number): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);
    let cartItem = await this.cartItemsRepository.findOne({
      where: { cartId: cart.id, variantId },
    });

    if (cartItem) {
      cartItem.quantity += quantity;
    } else {
      cartItem = this.cartItemsRepository.create({
        cartId: cart.id,
        variantId,
        quantity,
      });
    }

    await this.cartItemsRepository.save(cartItem);
    return this.getOrCreateCart(userId);
  }

  async removeFromCart(userId: string, cartItemId: string): Promise<void> {
    await this.cartItemsRepository.delete({ id: cartItemId, cart: { userId } });
  }

  async updateCartItem(userId: string, cartItemId: string, quantity: number): Promise<Cart> {
    const cartItem = await this.cartItemsRepository.findOne({
      where: { id: cartItemId, cart: { userId } },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (quantity <= 0) {
      await this.cartItemsRepository.remove(cartItem);
    } else {
      cartItem.quantity = quantity;
      await this.cartItemsRepository.save(cartItem);
    }

    return this.getOrCreateCart(userId);
  }

  // Orders
  async createOrder(createOrderDto: CreateOrderDto, userId: string): Promise<Order> {
    const cart = await this.getOrCreateCart(userId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get default store location (Prefer 'Main Store' or similar, else first active)
      const locations = await this.inventoryService.findAllLocations();
      let location = locations.find(l => l.name.toLowerCase().includes('store') || l.name.toLowerCase().includes('main'));
      if (!location) location = locations[0];

      if (!location) {
        throw new BadRequestException('No stock location configured');
      }

      // Check stock availability
      for (const cartItem of cart.items) {
        const available = await this.inventoryService.getAvailableQuantity(
          cartItem.variantId,
          location.id,
        );
        if (available < cartItem.quantity) {
          throw new BadRequestException(`Insufficient stock for ${cartItem.variant.sku || 'product'}`);
        }
      }

      // Determine order type (always retail)
      const orderType = 'retail';

      // Calculate subtotal
      let subtotal = DecimalUtil.from(0);
      const orderNumber = await this.generateOrderNumber();

      const order = this.ordersRepository.create({
        orderNumber,
        userId,
        deliveryAddressId: createOrderDto.deliveryAddressId,
        orderType,
        status: 'pending',
        paymentMethod: createOrderDto.paymentMethod,
        subtotal: '0',
        total: '0',
      });

      const savedOrder = await queryRunner.manager.save(order);

      // Create order items
      for (const cartItem of cart.items) {
        // Get pricing based on order type
        const unitPrice = this.getPriceForOrderType(cartItem.variant, orderType);
        // Get cost price from variant or product (for profit calculation)
        const costPrice = DecimalUtil.from(
          cartItem.variant.costPrice || cartItem.variant.product?.costPrice || '0'
        );
        const itemTotal = DecimalUtil.multiply(unitPrice, cartItem.quantity);
        subtotal = DecimalUtil.add(subtotal, itemTotal);

        const orderItem = this.orderItemsRepository.create({
          orderId: savedOrder.id,
          variantId: cartItem.variantId,
          quantity: cartItem.quantity,
          unitPrice: unitPrice.toString(),
          costPrice: costPrice.toString(), // Store cost price at time of sale
          total: itemTotal.toString(),
        });

        await queryRunner.manager.save(orderItem);

        // Deduct stock immediately (Using transaction manager)
        await this.inventoryService.deductStock(
          cartItem.variantId,
          location.id,
          cartItem.quantity,
          queryRunner.manager,
        );
      }

      // Calculate shipping fee
      const shippingFee = await this.shippingService.calculateShippingFee(
        createOrderDto.deliveryAddressId,
        cart.items,
      );

      // Calculate total
      const total = DecimalUtil.add(subtotal, shippingFee);

      savedOrder.subtotal = subtotal.toString();
      savedOrder.shippingFee = shippingFee.toString();
      savedOrder.total = total.toString();
      await queryRunner.manager.save(savedOrder);

      // Clear cart
      await this.cartItemsRepository.delete({ cartId: cart.id });

      await queryRunner.commitTransaction();
      return this.findOneOrder(savedOrder.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllOrders(userId?: string): Promise<Order[]> {
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }

    return this.ordersRepository.find({
      where,
      relations: ['items', 'items.variant', 'items.variant.product', 'deliveryAddress', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneOrder(id: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['items', 'items.variant', 'items.variant.product', 'deliveryAddress', 'user'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateOrderStatus(id: string, status: string, userId: string): Promise<Order> {
    const order = await this.findOneOrder(id);

    // Status transition logic could go here
    order.status = status;

    // If sent for delivery, we might want to ensure stock was deducted (it is deducted at creation now)

    return this.ordersRepository.save(order);
  }

  private getPriceForOrderType(variant: any, orderType: string): import('decimal.js').Decimal {
    return DecimalUtil.from(variant.retailPrice || variant.product.retailPrice);
  }

  private async generateOrderNumber(): Promise<string> {
    const count = await this.ordersRepository.count();
    return `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
  }
}

