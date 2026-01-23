import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Address } from './entities/address.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Invoice } from '../sales/entities/invoice.entity';
import { Order } from '../ecommerce/entities/order.entity';
import { DecimalUtil } from '../../common/utils/decimal.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(Address)
    private addressesRepository: Repository<Address>,
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const role = await this.rolesRepository.findOne({
      where: { id: createUserDto.roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      phone: createUserDto.phone,
      password: hashedPassword,
      roleId: role.id,
      commissionRate: (createUserDto.commissionRate || 0).toString(),
      employeeCode: createUserDto.employeeCode,
    });

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      relations: ['role', 'role.permissions'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role', 'role.permissions', 'addresses'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['role', 'role.permissions'],
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { phone },
      relations: ['role', 'role.permissions'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    if (updateUserDto.roleId) {
      const role = await this.rolesRepository.findOne({
        where: { id: updateUserDto.roleId },
      });
      if (!role) {
        throw new NotFoundException('Role not found');
      }
      user.role = role;
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  async findRoleByName(name: string): Promise<Role | null> {
    return this.rolesRepository.findOne({
      where: { name },
    });
  }

  async findAllRoles(): Promise<Role[]> {
    return this.rolesRepository.find({
      relations: ['permissions'],
    });
  }

  async getUserAddresses(userId: string): Promise<Address[]> {
    return this.addressesRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async createAddress(userId: string, addressDto: Partial<Address> & { isDefault?: boolean }): Promise<Address> {
    // If this is set as default, unset other defaults
    if (addressDto.isDefault) {
      await this.addressesRepository.update(
        { userId },
        { isDefault: false },
      );
    }

    const address: Address = this.addressesRepository.create({
      userId,
      ...addressDto,
    });

    return this.addressesRepository.save<Address>(address);
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const address = await this.addressesRepository.findOne({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.addressesRepository.remove(address);
  }

  async getUserStatistics(userId: string): Promise<any> {
    const user = await this.findOne(userId);
    const roleName = user.role?.name?.toLowerCase() || '';

    let orders: Order[] = [];
    let invoices: Invoice[] = [];
    let totalPiecesSold = 0;
    let totalSales = DecimalUtil.from(0);
    let totalProfit = DecimalUtil.from(0);
    let totalOrders = 0;
    let totalInvoices = 0;

    // For customers: get their orders
    if (roleName === 'customer' || roleName === 'user') {
      orders = await this.ordersRepository.find({
        where: { userId },
        relations: ['items', 'items.variant', 'items.variant.product'],
        order: { createdAt: 'DESC' },
      });

      totalOrders = orders.length;
      for (const order of orders) {
        for (const item of order.items) {
          totalPiecesSold += item.quantity;
        }
        totalSales = DecimalUtil.add(totalSales, DecimalUtil.from(order.total || '0'));
        
        // Calculate profit for order using stored costPrice from order item
        for (const item of order.items) {
          const unitPrice = DecimalUtil.from(item.unitPrice || '0');
          // Use stored costPrice from order item (at time of sale), fallback to variant if not stored
          const costPrice = DecimalUtil.from(
            item.costPrice || 
            item.variant?.costPrice || 
            item.variant?.product?.costPrice || 
            '0'
          );
          const profit = DecimalUtil.multiply(
            DecimalUtil.subtract(unitPrice, costPrice),
            item.quantity
          );
          totalProfit = DecimalUtil.add(totalProfit, profit);
        }
      }
    }

    // For POS managers/employees: get invoices they created
    if (roleName === 'pos manager' || roleName === 'employee' || roleName === 'sales') {
      invoices = await this.invoicesRepository.find({
        where: { createdById: userId },
        relations: ['items', 'items.variant', 'items.variant.product', 'customer', 'payments', 'payments.paymentMethod'],
        order: { createdAt: 'DESC' },
      });

      totalInvoices = invoices.length;
      for (const invoice of invoices) {
        for (const item of invoice.items) {
          totalPiecesSold += item.quantity;
        }
        totalSales = DecimalUtil.add(totalSales, DecimalUtil.from(invoice.total || '0'));
        
        // Calculate profit for invoice
        for (const item of invoice.items) {
          const unitPrice = DecimalUtil.from(item.unitPrice || '0');
          const costPrice = DecimalUtil.from(item.costPrice || '0');
          const profit = DecimalUtil.multiply(
            DecimalUtil.subtract(unitPrice, costPrice),
            item.quantity
          );
          totalProfit = DecimalUtil.add(totalProfit, profit);
        }
      }
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name,
      },
      statistics: {
        totalOrders,
        totalInvoices,
        totalPiecesSold,
        totalSales: totalSales.toString(),
        totalProfit: totalProfit.toString(),
      },
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.total,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          id: item.id,
          productName: item.variant?.product?.nameAr || item.variant?.product?.nameEn,
          variant: `${item.variant?.size?.nameAr || item.variant?.size?.code} / ${item.variant?.color?.nameAr || item.variant?.color?.code}`,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice,
          total: item.total,
        })),
      })),
      invoices: invoices.map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        saleType: invoice.saleType,
        subtotal: invoice.subtotal,
        discountAmount: invoice.discountAmount,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        paidAmount: invoice.paidAmount,
        commissionAmount: invoice.commissionAmount,
        notes: invoice.notes,
        customer: invoice.customer ? {
          id: invoice.customer.id,
          name: invoice.customer.name,
          email: invoice.customer.email,
          phone: invoice.customer.phone,
        } : null,
        customerName: invoice.customer?.name || 'عميل عابر',
        paymentMethods: invoice.payments?.map(payment => ({
          id: payment.id,
          method: payment.paymentMethod?.nameAr || payment.paymentMethod?.nameEn || 'غير محدد',
          methodCode: payment.paymentMethod?.code || '',
          amount: payment.amount,
          status: payment.status,
          transactionId: payment.transactionId,
          createdAt: payment.createdAt,
        })) || [],
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
        items: invoice.items.map(item => ({
          id: item.id,
          productName: item.variant?.product?.nameAr || item.variant?.product?.nameEn,
          variant: {
            id: item.variant?.id,
            product: {
              nameAr: item.variant?.product?.nameAr,
              nameEn: item.variant?.product?.nameEn,
            },
            size: {
              nameAr: item.variant?.size?.nameAr,
              nameEn: item.variant?.size?.nameEn,
              code: item.variant?.size?.code,
            },
            color: {
              nameAr: item.variant?.color?.nameAr,
              nameEn: item.variant?.color?.nameEn,
              code: item.variant?.color?.code,
            },
            sku: item.variant?.sku,
          },
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice,
          total: item.total,
          profitMargin: item.profitMargin,
        })),
      })),
    };
  }
}

