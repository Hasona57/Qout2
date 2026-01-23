import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Invoice } from '../sales/entities/invoice.entity';
import { Order } from '../ecommerce/entities/order.entity';
import { CommissionRecord } from '../sales/entities/commission-record.entity';
import { DecimalUtil } from '../../common/utils/decimal.util';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(CommissionRecord)
    private commissionRecordsRepository: Repository<CommissionRecord>,
  ) { }

  async getSalesReport(startDate: Date, endDate: Date) {
    // Adjust endDate to include the full day
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setHours(23, 59, 59, 999);

    // 1. Fetch Invoices (POS Sales)
    const invoices = await this.invoicesRepository.find({
      where: {
        createdAt: Between(startDate, adjustedEndDate),
        status: 'paid',
      },
      relations: ['items'],
    });

    // 2. Fetch Orders (Online Sales)
    // Considering 'confirmed', 'shipped', 'delivered' as valid sales
    const orders = await this.ordersRepository.find({
      where: {
        createdAt: Between(startDate, adjustedEndDate),
        // We can use In(...) from typeorm if imported, or just raw query, but let's filter in memory or simple array if possible
        // status: In(['confirmed', 'shipped', 'delivered']) 
        // For simplicity with standard find, let's just exclude cancelled/pending if easy, or fetch and filter.
      },
      relations: ['items', 'items.variant', 'items.variant.product'],
    });

    const validOrders = orders.filter(o =>
      ['pending', 'processing', 'confirmed', 'shipped', 'delivered'].includes(o.status)
    );

    // 3. Calculate POS Totals
    const posSales = invoices.reduce(
      (sum, inv) => DecimalUtil.add(sum, inv.total),
      DecimalUtil.from(0),
    );

    const posProfit = invoices.reduce(
      (sum, inv) => {
        const invProfit = inv.items.reduce(
          (iSum, item) => {
            // Robust Profit: Sale - Cost
            const price = DecimalUtil.from(item.unitPrice || '0');
            const cost = DecimalUtil.from(item.costPrice || '0');
            const qty = item.quantity;
            const p = DecimalUtil.multiply(DecimalUtil.subtract(price, cost), qty);
            return DecimalUtil.add(iSum, p);
          },
          DecimalUtil.from(0)
        );
        return DecimalUtil.add(sum, invProfit);
      },
      DecimalUtil.from(0),
    );

    // 4. Calculate Online Order Totals (Net of Shipping)
    const onlineSales = validOrders.reduce(
      (sum, order) => {
        const total = DecimalUtil.from(order.total || '0');
        const shipping = DecimalUtil.from(order.shippingFee || '0');
        const net = DecimalUtil.subtract(total, shipping);
        return DecimalUtil.add(sum, net);
      },
      DecimalUtil.from(0),
    );

    let onlineProfit = DecimalUtil.from(0);
    for (const order of validOrders) {
      for (const item of order.items) {
        // Profit = (Selling Price - Cost Price) * Qty
        // Use stored costPrice from order item (at time of sale) if available,
        // otherwise fallback to current variant costPrice
        const costPrice = item.costPrice || item.variant?.costPrice || item.variant?.product?.costPrice || '0';
        const costPriceDecimal = DecimalUtil.from(costPrice.toString());
        const unitPriceDecimal = DecimalUtil.from(item.unitPrice || '0');
        const profitPerItem = DecimalUtil.subtract(unitPriceDecimal, costPriceDecimal);
        const totalItemProfit = DecimalUtil.multiply(profitPerItem, item.quantity);
        onlineProfit = DecimalUtil.add(onlineProfit, totalItemProfit);
      }
    }

    // 5. Fetch Returns (Refunds)
    const { Return } = await import('../sales/entities/return.entity');
    const returnRepo = this.invoicesRepository.manager.getRepository(Return); // Access via manager to avoid injection issues if module not exported
    // Or inject properly if possible. Assuming module structure allows, best to inject.
    // But for quick fix in service logic:
    const returns = await returnRepo.find({
      where: {
        createdAt: Between(startDate, endDate),
        // Include both 'approved' and 'refunded' status returns
        // status: In(['approved', 'refunded'])
      },
      relations: [
        'items',
        'items.invoiceItem', 'items.invoiceItem.variant', 'items.invoiceItem.variant.product',
        'items.orderItem', 'items.orderItem.variant', 'items.orderItem.variant.product'
      ]
    });

    // Filter returns to only include approved/refunded (exclude rejected/cancelled)
    const validReturns = returns.filter(r => 
      r.status === 'approved' || r.status === 'refunded'
    );

    let totalRefunds = DecimalUtil.from(0);
    let totalProfitReduction = DecimalUtil.from(0);

    for (const ret of validReturns) {
      totalRefunds = DecimalUtil.add(totalRefunds, DecimalUtil.from(ret.refundAmount || '0'));

      for (const item of ret.items) {
        let costPrice = '0';
        let unitPrice = '0'; // Refunded unit price

        if (item.invoiceItem) {
          // Get cost price from invoice item (stored at time of sale)
          costPrice = item.invoiceItem.costPrice || '0';
          unitPrice = item.invoiceItem.unitPrice || '0';
          // Fallback to variant if not in invoice item
          if (costPrice === '0' && item.invoiceItem.variant) {
            costPrice = (item.invoiceItem.variant.costPrice?.toString() || 
                       item.invoiceItem.variant.product?.costPrice?.toString() || '0');
          }
        } else if (item.orderItem) {
          // Get cost price from order item (stored at time of sale) if available
          costPrice = item.orderItem.costPrice || '0';
          unitPrice = item.orderItem.unitPrice || '0';
          // Fallback to variant if not in order item
          if (costPrice === '0' && item.orderItem.variant) {
            const variant = item.orderItem.variant;
            costPrice = (variant?.costPrice?.toString() || variant?.product?.costPrice?.toString() || '0');
          }
        }

        // Profit Lost = RefundAmount - (CostPrice * Quantity)
        // This represents the profit that was originally made but is now lost due to return
        const costPriceDecimal = DecimalUtil.from(costPrice.toString());
        const costTotal = DecimalUtil.multiply(costPriceDecimal, item.quantity);
        const itemRefund = DecimalUtil.from(item.refundAmount || '0');
        const profitLost = DecimalUtil.subtract(itemRefund, costTotal);

        totalProfitReduction = DecimalUtil.add(totalProfitReduction, profitLost);
      }
    }

    // 6. Aggregate
    const totalSales = DecimalUtil.subtract(DecimalUtil.add(posSales, onlineSales), totalRefunds);
    const totalProfit = DecimalUtil.subtract(DecimalUtil.add(posProfit, onlineProfit), totalProfitReduction);

    // Merge transactions for detailed view
    const transactions = [
      ...invoices.map(inv => ({
        id: inv.id,
        type: 'POS Invoice',
        number: inv.invoiceNumber,
        date: inv.createdAt,
        total: inv.total,
        status: inv.status,
        customer: inv.customer?.name || 'Walk-in'
      })),
      ...validOrders.map(ord => {
        const total = DecimalUtil.from(ord.total || '0');
        const shipping = DecimalUtil.from(ord.shippingFee || '0');
        return {
          id: ord.id,
          type: 'Online Order',
          number: ord.orderNumber,
          date: ord.createdAt,
          total: DecimalUtil.subtract(total, shipping).toString(), // Net Total
          status: ord.status,
          customer: ord.user?.name || 'Online Customer'
        };
      })
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      period: { startDate, endDate },
      totalInvoices: invoices.length + validOrders.length, // Transactions
      totalReturns: returns.length,
      totalSales: totalSales.toString(),
      totalProfit: totalProfit.toString(),
      transactions, // Detailed list
      breakdown: {
        pos: {
          count: invoices.length,
          sales: posSales.toString(),
          profit: posProfit.toString(),
        },
        online: {
          count: validOrders.length,
          sales: onlineSales.toString(),
          profit: onlineProfit.toString(),
        },
        returns: {
          count: validReturns.length,
          amount: totalRefunds.toString(),
          profitReduction: totalProfitReduction.toString()
        }
      }
    };
  }

  async getCommissionReport(employeeId: string, startDate: Date, endDate: Date) {
    const commissions = await this.commissionRecordsRepository.find({
      where: {
        employeeId,
        createdAt: Between(startDate, endDate),
        status: 'approved',
      },
    });

    const totalCommission = commissions.reduce(
      (sum, comm) => DecimalUtil.add(sum, comm.commissionAmount),
      DecimalUtil.from(0),
    );

    return {
      employeeId,
      period: { startDate, endDate },
      totalCommissions: commissions.length,
      totalAmount: totalCommission.toString(),
      commissions,
    };
  }
}


