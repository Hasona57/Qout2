import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { Payment } from './entities/payment.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { Return } from './entities/return.entity';
import { CommissionRecord } from './entities/commission-record.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateReturnDto } from './dto/create-return.dto';
import { DecimalUtil } from '../../common/utils/decimal.util';
import { InventoryService } from '../inventory/inventory.service';
import { ReturnItem } from './entities/return-item.entity';
// Order is imported dynamically to avoid circular dependency, but type can be used if imported as type
import type { Order } from '../ecommerce/entities/order.entity';

@Injectable()
export class SalesService implements OnModuleInit {
  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private invoiceItemsRepository: Repository<InvoiceItem>,
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(PaymentMethod)
    private paymentMethodsRepository: Repository<PaymentMethod>,
    @InjectRepository(Return)
    private returnsRepository: Repository<Return>,
    @InjectRepository(CommissionRecord)
    private commissionRecordsRepository: Repository<CommissionRecord>,
    private inventoryService: InventoryService,
    private dataSource: DataSource,
  ) { }

  async onModuleInit() {
    await this.seedPaymentMethods();
  }

  private async seedPaymentMethods() {
    const methods = [
      { code: 'cash', nameAr: 'نقد', nameEn: 'Cash', isAvailableOnPos: true, isAvailableOnline: false },
      { code: 'vodafone_cash', nameAr: 'فودافون كاش', nameEn: 'Vodafone Cash', isAvailableOnPos: true, isAvailableOnline: true },
      { code: 'instapay', nameAr: 'انستا باي', nameEn: 'Instapay', isAvailableOnPos: true, isAvailableOnline: true },
      { code: 'fawry', nameAr: 'فوري', nameEn: 'Fawry', isAvailableOnPos: true, isAvailableOnline: true },
      { code: 'cod', nameAr: 'الدفع عند الاستلام', nameEn: 'Cash on Delivery', isAvailableOnPos: false, isAvailableOnline: true },
    ];

    for (const m of methods) {
      const exists = await this.paymentMethodsRepository.findOne({ where: { code: m.code } });
      if (!exists) {
        await this.paymentMethodsRepository.save(this.paymentMethodsRepository.create(m));
        console.log(`Auto-seeded payment method: ${m.code}`);
      } else {
        // Update names and availability just in case
        let needsUpdate = false;
        if (exists.nameAr !== m.nameAr || exists.nameEn !== m.nameEn) {
          exists.nameAr = m.nameAr;
          exists.nameEn = m.nameEn;
          needsUpdate = true;
        }
        if (m.isAvailableOnPos !== undefined && exists.isAvailableOnPos !== m.isAvailableOnPos) {
          exists.isAvailableOnPos = m.isAvailableOnPos;
          needsUpdate = true;
        }
        if (m.isAvailableOnline !== undefined && exists.isAvailableOnline !== m.isAvailableOnline) {
          exists.isAvailableOnline = m.isAvailableOnline;
          needsUpdate = true;
        }
        if (needsUpdate) {
          await this.paymentMethodsRepository.save(exists);
        }
      }
    }
  }

  // Invoices
  async createInvoice(createInvoiceDto: CreateInvoiceDto, userId: string): Promise<Invoice> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invoiceNumber = await this.generateInvoiceNumber();
      const saleType = this.determineSaleType(createInvoiceDto.items);

      // Check stock availability
      for (const item of createInvoiceDto.items) {
        const available = await this.inventoryService.getAvailableQuantity(
          item.variantId,
          createInvoiceDto.locationId || 'store-location-id', // Should be passed or defaulted
        );
        if (available < item.quantity) {
          throw new BadRequestException(`Insufficient stock for variant ${item.variantId}`);
        }
      }

      // Calculate totals
      let subtotal = DecimalUtil.from(0);
      let totalProfitMargin = DecimalUtil.from(0);

      const invoice = this.invoicesRepository.create({
        invoiceNumber,
        customerId: createInvoiceDto.customerId,
        createdById: userId,
        saleType,
        status: 'pending',
        subtotal: '0',
        total: '0',
        locationId: createInvoiceDto.locationId,
      });

      const savedInvoice = await queryRunner.manager.save(invoice);

      // Create invoice items
      for (const itemDto of createInvoiceDto.items) {
        // Get variant to access pricing
        const { ProductVariant } = await import('../products/entities/product-variant.entity');
        const variantRepo = this.dataSource.getRepository(ProductVariant);
        const variant = await variantRepo.findOne({
          where: { id: itemDto.variantId },
          relations: ['product', 'size', 'color'],
        });

        if (!variant) {
          throw new NotFoundException(`Variant ${itemDto.variantId} not found`);
        }

        // Use provided unitPrice or calculate from variant
        const unitPrice = itemDto.unitPrice
          ? DecimalUtil.from(itemDto.unitPrice.toString())
          : this.calculateUnitPriceFromVariant(variant, saleType, itemDto.quantity);

        // Ensure accurate cost price from variant or product
        const costPrice = DecimalUtil.from(variant.costPrice || variant.product?.costPrice || '0');

        // Note: Allow selling below cost (negative profit) - this is a business decision
        // Profit will be calculated correctly as (unitPrice - costPrice) * quantity

        const itemTotal = DecimalUtil.multiply(unitPrice, itemDto.quantity);
        const profitMargin = DecimalUtil.multiply(
          DecimalUtil.subtract(unitPrice, costPrice),
          itemDto.quantity,
        );

        subtotal = DecimalUtil.add(subtotal, itemTotal);
        totalProfitMargin = DecimalUtil.add(totalProfitMargin, profitMargin);

        const item = this.invoiceItemsRepository.create({
          invoiceId: savedInvoice.id,
          variantId: itemDto.variantId,
          quantity: itemDto.quantity,
          unitPrice: unitPrice.toString(),
          costPrice: costPrice.toString(),
          total: itemTotal.toString(),
          profitMargin: profitMargin.toString(),
        });

        await queryRunner.manager.save(item);

        // Reserve stock
        await this.inventoryService.reserveStock(
          itemDto.variantId,
          createInvoiceDto.locationId || 'store-location-id',
          itemDto.quantity,
        );
      }

      // Calculate commission
      const employee = await queryRunner.manager.findOne('User', { where: { id: userId } }) as any;
      const commissionRate = DecimalUtil.from((employee?.commissionRate || '0').toString());
      const commissionAmount = DecimalUtil.percentage(totalProfitMargin, commissionRate);

      savedInvoice.subtotal = subtotal.toString();
      savedInvoice.total = subtotal.toString(); // Before discount/tax
      savedInvoice.commissionAmount = commissionAmount.toString();
      await queryRunner.manager.save(savedInvoice);

      // Create commission record
      if (commissionAmount.greaterThan(0)) {
        const commissionRecord = this.commissionRecordsRepository.create({
          employeeId: userId,
          invoiceId: savedInvoice.id,
          profitMargin: totalProfitMargin.toString(),
          commissionRate: commissionRate.toString(),
          commissionAmount: commissionAmount.toString(),
        });
        await queryRunner.manager.save(commissionRecord);
      }

      await queryRunner.commitTransaction();
      return this.findOneInvoice(savedInvoice.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async completeInvoice(invoiceId: string): Promise<Invoice> {
    const invoice = await this.findOneInvoice(invoiceId);

    if (['paid', 'cancelled'].includes(invoice.status)) {
      throw new BadRequestException(`Invoice is already ${invoice.status}`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Deduct stock
      for (const item of invoice.items) {
        await this.inventoryService.deductStock(
          item.variantId,
          invoice.locationId || 'store-location-id',
          item.quantity,
        );
      }

      invoice.status = 'paid';
      await queryRunner.manager.save(invoice);

      await queryRunner.commitTransaction();
      return invoice;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllInvoices(): Promise<Invoice[]> {
    return this.invoicesRepository.find({
      relations: ['items', 'items.variant', 'items.variant.product', 'payments', 'customer', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneInvoice(id: string): Promise<Invoice> {
    const invoice = await this.invoicesRepository.findOne({
      where: { id },
      relations: ['items', 'items.variant', 'items.variant.product', 'payments', 'customer', 'createdBy'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  private calculateUnitPriceFromVariant(variant: any, saleType: string, quantity: number): import('decimal.js').Decimal {
    return DecimalUtil.from(variant.retailPrice || variant.product?.retailPrice || '0');
  }

  private calculateUnitPrice(item: any, saleType: string): import('decimal.js').Decimal {
    // Fallback: use provided unitPrice
    return DecimalUtil.from(item.unitPrice || '0');
  }

  private determineSaleType(items: any[]): string {
    return 'retail';
  }

  private async generateInvoiceNumber(): Promise<string> {
    const count = await this.invoicesRepository.count();
    return `INV-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
  }

  private async generateReturnNumber(): Promise<string> {
    const count = await this.returnsRepository.count();
    return `RET-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
  }

  // Payments
  async createPayment(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    try {
      const invoice = await this.findOneInvoice(createPaymentDto.invoiceId);
      const paymentMethod = await this.paymentMethodsRepository.findOne({
        where: { id: createPaymentDto.paymentMethodId },
      });

      if (!paymentMethod) {
        throw new NotFoundException('Payment method not found');
      }

      console.log('Creating payment with DTO:', JSON.stringify(createPaymentDto));

      const paymentData = {
        invoiceId: createPaymentDto.invoiceId,
        paymentMethodId: createPaymentDto.paymentMethodId,
        amount: createPaymentDto.amount.toString(),
        transactionId: createPaymentDto.transactionId || null,
        notes: createPaymentDto.notes || '',
        status: 'completed'
      };

      const savedPayment = await this.paymentsRepository.save(paymentData);

      // Verify paidAmount is valid
      const currentPaid = invoice.paidAmount || '0';

      // Update invoice paid amount
      const totalPaid = DecimalUtil.add(currentPaid, createPaymentDto.amount.toString());
      invoice.paidAmount = totalPaid.toString();

      if (totalPaid.greaterThanOrEqualTo(DecimalUtil.from(invoice.total))) {
        // Save the paid amount but keep status as pending/partially_paid so completeInvoice can process it
        await this.invoicesRepository.save(invoice);

        // Auto-complete invoice and deduct stock
        await this.completeInvoice(invoice.id);
      } else if (totalPaid.greaterThan(0)) {
        invoice.status = 'partially_paid';
        await this.invoicesRepository.save(invoice);
      }

      return savedPayment;
    } catch (error) {
      console.error('CreatePayment Error:', error);
      throw new BadRequestException(error.message);
    }
  }

  // Returns
  async createReturn(createReturnDto: CreateReturnDto, userId: string): Promise<Return> {
    const { invoiceId, orderId, items } = createReturnDto;

    if (!invoiceId && !orderId) {
      throw new BadRequestException('Must provide either invoiceId or orderId');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const returnNumber = await this.generateReturnNumber();
      let totalRefund = DecimalUtil.from(0);
      const returnItems: ReturnItem[] = [];

      // Create return entity shell
      const returnEntity = this.returnsRepository.create({
        returnNumber,
        createdById: userId,
        status: 'refunded', // Direct refund for POS/Admin actions to ensure finance deduction
        reason: createReturnDto.reason,
        notes: createReturnDto.notes,
        refundMethod: createReturnDto.refundMethod || 'cash_pos', // Default to cash_pos if not specified
        invoiceId,
        orderId,
      });

      // 1. Handle Invoice Return
      if (invoiceId) {
        const invoice = await this.findOneInvoice(invoiceId);

        // Fetch all previous returns for this invoice to calculate remaining quantities
        const previousReturns = await this.returnsRepository.find({
          where: { invoiceId },
          relations: ['items']
        });

        // Calculate already returned quantities per invoice item
        const returnedQuantities: { [invoiceItemId: string]: number } = {};
        for (const prevReturn of previousReturns) {
          for (const prevItem of prevReturn.items) {
            if (prevItem.invoiceItemId) {
              returnedQuantities[prevItem.invoiceItemId] = 
                (returnedQuantities[prevItem.invoiceItemId] || 0) + prevItem.quantity;
            }
          }
        }

        for (const itemDto of items) {
          const invoiceItem = invoice.items.find(i => i.id === itemDto.invoiceItemId);
          if (!invoiceItem) throw new BadRequestException(`Invoice Item ${itemDto.invoiceItemId} not found in invoice`);

          // Calculate remaining quantity (original - already returned)
          const alreadyReturned = returnedQuantities[itemDto.invoiceItemId] || 0;
          const remainingQuantity = invoiceItem.quantity - alreadyReturned;

          if (itemDto.quantity > remainingQuantity) {
            throw new BadRequestException(
              `Cannot return more than remaining quantity for item ${invoiceItem.variant?.sku}. ` +
              `Original: ${invoiceItem.quantity}, Already returned: ${alreadyReturned}, Remaining: ${remainingQuantity}`
            );
          }

          if (remainingQuantity <= 0) {
            throw new BadRequestException(`Item ${invoiceItem.variant?.sku} has already been fully returned`);
          }

          const refundAmount = DecimalUtil.multiply(DecimalUtil.from(invoiceItem.unitPrice), itemDto.quantity);
          totalRefund = DecimalUtil.add(totalRefund, refundAmount);

          const returnItem = new ReturnItem();
          returnItem.invoiceItemId = invoiceItem.id;
          returnItem.quantity = itemDto.quantity;
          returnItem.refundAmount = refundAmount.toString();
          returnItems.push(returnItem);

          await this.inventoryService.addStock(
            invoiceItem.variantId,
            invoice.locationId || 'store-location-id',
            itemDto.quantity
          );
        }
      }
      // 2. Handle Order Return
      else if (orderId) {
        const { Order } = await import('../ecommerce/entities/order.entity');
        const orderRepo = this.dataSource.getRepository(Order);
        const order = await orderRepo.findOne({
          where: { id: orderId },
          relations: ['items', 'items.variant']
        });

        if (!order) throw new NotFoundException('Order not found');

        // Fetch all previous returns for this order to calculate remaining quantities
        const previousReturns = await this.returnsRepository.find({
          where: { orderId },
          relations: ['items']
        });

        // Calculate already returned quantities per order item
        const returnedQuantities: { [orderItemId: string]: number } = {};
        for (const prevReturn of previousReturns) {
          for (const prevItem of prevReturn.items) {
            if (prevItem.orderItemId) {
              returnedQuantities[prevItem.orderItemId] = 
                (returnedQuantities[prevItem.orderItemId] || 0) + prevItem.quantity;
            }
          }
        }

        const validLocations = await this.inventoryService.findAllLocations();
        const storeLoc = validLocations.find(l => l.name.toLowerCase().includes('store')) || validLocations[0];
        const locationId = storeLoc?.id || 'store-location-id';

        for (const itemDto of items) {
          // Flexible matching for Item ID (InvoiceItemId DTO field used for OrderItemId)
          const oid = (itemDto as any).orderItemId || itemDto.invoiceItemId;
          const found = order.items.find(i => i.id === oid);

          if (!found) {
            // Warning: Frontend might be sending wrong ID or DTO mismatch. 
            // We'll proceed if we can find it, else throw.
            throw new BadRequestException(`Order Item ${oid} not found in order`);
          }

          // Calculate remaining quantity (original - already returned)
          const alreadyReturned = returnedQuantities[found.id] || 0;
          const remainingQuantity = found.quantity - alreadyReturned;

          if (itemDto.quantity > remainingQuantity) {
            throw new BadRequestException(
              `Cannot return more than remaining quantity for item ${found.variant?.sku || found.id}. ` +
              `Original: ${found.quantity}, Already returned: ${alreadyReturned}, Remaining: ${remainingQuantity}`
            );
          }

          if (remainingQuantity <= 0) {
            throw new BadRequestException(`Item ${found.variant?.sku || found.id} has already been fully returned`);
          }

          const refundAmount = DecimalUtil.multiply(DecimalUtil.from(found.unitPrice), itemDto.quantity);
          totalRefund = DecimalUtil.add(totalRefund, refundAmount);

          const returnItem = new ReturnItem();
          returnItem.orderItemId = found.id;
          returnItem.quantity = itemDto.quantity;
          returnItem.refundAmount = refundAmount.toString();
          returnItems.push(returnItem);
          await this.inventoryService.addStock(
            found.variantId,
            locationId,
            itemDto.quantity
          );
        }

        // Add shipping fee if requested
        if (createReturnDto.refundShipping && order.shippingFee) {
          const shippingFee = DecimalUtil.from(order.shippingFee);
          if (shippingFee.greaterThan(0)) {
            totalRefund = DecimalUtil.add(totalRefund, shippingFee);
          }
        }
      }

      returnEntity.refundAmount = totalRefund.toString();
      returnEntity.items = returnItems;

      const savedReturn = await queryRunner.manager.save(returnEntity);

      // 3. Update Parent Status
      if (invoiceId) {
        const invoiceRepo = queryRunner.manager.getRepository('Invoice');
        const invoice = await invoiceRepo.findOne({ where: { id: invoiceId } }) as any;
        if (invoice) {
          const invoiceTotal = DecimalUtil.from(invoice.total || '0');
          // Use queryRunner manager to see the current return within transaction
          const prevReturns = await queryRunner.manager.find('Return', { where: { invoiceId } }) as any[];
          let totalRefunded = DecimalUtil.from(0);
          prevReturns.forEach(r => totalRefunded = DecimalUtil.add(totalRefunded, DecimalUtil.from(r.refundAmount || '0')));

          // Include current return
          totalRefunded = DecimalUtil.add(totalRefunded, totalRefund);

          if (totalRefunded.greaterThanOrEqualTo(invoiceTotal)) {
            invoice.status = 'returned';
          } else {
            invoice.status = 'partially_returned';
          }
          await invoiceRepo.save(invoice);
        }
      } else if (orderId) {
        const { Order } = await import('../ecommerce/entities/order.entity');
        const orderRepo = queryRunner.manager.getRepository(Order);
        const order = await orderRepo.findOne({ where: { id: orderId } });

        if (order) {
          const orderTotal = DecimalUtil.from(order.total || '0');
          // Use queryRunner manager to see the current return within transaction
          const prevReturns = await queryRunner.manager.find('Return', { where: { orderId } }) as any[];
          let totalRefunded = DecimalUtil.from(0);
          prevReturns.forEach(r => totalRefunded = DecimalUtil.add(totalRefunded, DecimalUtil.from(r.refundAmount || '0')));
          totalRefunded = DecimalUtil.add(totalRefunded, totalRefund);

          if (totalRefunded.greaterThanOrEqualTo(orderTotal)) {
            order.status = 'returned';
            order.paymentStatus = 'refunded';
          } else {
            order.status = 'partially_returned';
            order.paymentStatus = 'partially_refunded';
          }
          await orderRepo.save(order);
        }
      }

      await queryRunner.commitTransaction();
      return savedReturn;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllPaymentMethods(): Promise<PaymentMethod[]> {
    return this.paymentMethodsRepository.find();
  }

  async findReturns(invoiceId?: string, orderId?: string): Promise<Return[]> {
    const where: any = {};
    if (invoiceId) {
      where.invoiceId = invoiceId;
    }
    if (orderId) {
      where.orderId = orderId;
    }
    return this.returnsRepository.find({
      where,
      relations: ['items', 'items.invoiceItem', 'items.orderItem'],
      order: { createdAt: 'DESC' }
    });
  }
  async cancelInvoice(invoiceId: string): Promise<Invoice> {
    const invoice = await this.findOneInvoice(invoiceId);

    if (invoice.status === 'cancelled') {
      throw new BadRequestException('Invoice is already cancelled');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const item of invoice.items) {
        // Logic: If invoice involved actual stock deduction, add it back.
        // If it only involved reservation, release it.
        // CompleteInvoice deducts stock and sets status 'paid'.
        // So if 'paid' or 'partially_paid', we assume deduction might have happened or we treat it safely.
        // Actually, partially_paid might NOT have deducted if not completed.

        // Safer check: check if it was completed? 
        // Or just check status. 
        // If status is 'paid', stock WAS deducted.
        if (invoice.status === 'paid') {
          await this.inventoryService.addStock(
            item.variantId,
            invoice.locationId || 'store-location-id',
            item.quantity
          );
        } else {
          // If pending or partially_paid (and not completed), stock is reserved.
          await this.inventoryService.releaseStock(
            item.variantId,
            invoice.locationId || 'store-location-id',
            item.quantity
          );
        }
      }

      invoice.status = 'cancelled';
      await queryRunner.manager.save(invoice);

      await queryRunner.commitTransaction();
      return invoice;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

