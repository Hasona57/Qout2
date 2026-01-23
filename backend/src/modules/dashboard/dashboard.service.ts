import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { Invoice } from '../sales/entities/invoice.entity';
import { Order } from '../ecommerce/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Payment } from '../sales/entities/payment.entity';
import { Return } from '../sales/entities/return.entity';
import { Expense } from '../finance/entities/expense.entity';
import { PaymentMethod } from '../sales/entities/payment-method.entity';
import { StockItem } from '../inventory/entities/stock-item.entity';
import { DecimalUtil } from '../../common/utils/decimal.util';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Invoice) private invoicesRepository: Repository<Invoice>,
        @InjectRepository(Order) private ordersRepository: Repository<Order>,
        @InjectRepository(Product) private productsRepository: Repository<Product>,
        @InjectRepository(ProductVariant) private productVariantsRepository: Repository<ProductVariant>,
        @InjectRepository(Payment) private paymentsRepository: Repository<Payment>,
        @InjectRepository(Return) private returnsRepository: Repository<Return>,
        @InjectRepository(Expense) private expensesRepository: Repository<Expense>,
        @InjectRepository(PaymentMethod) private paymentMethodsRepository: Repository<PaymentMethod>,
        @InjectRepository(StockItem) private stockItemsRepository: Repository<StockItem>,
    ) { }

    async getDashboardStats() {
        // 1. Total Products
        const productsCount = await this.productsRepository.count();

        // 2. Total Orders (Ecommerce)
        const ordersCount = await this.ordersRepository.count();

        // 3. Low Stock (Quantity <= minStockLevel)
        const lowStockCount = await this.stockItemsRepository
            .createQueryBuilder('stockItem')
            .where('stockItem.quantity <= stockItem.minStockLevel')
            .getCount();

        // 4. Total Sales (Revenue) - Aligned with Finance V5 (Total Income)
        // Paid Invoices
        const paidInvoices = await this.invoicesRepository.find({ where: { status: 'paid' } });
        let totalSales = DecimalUtil.from(0);
        paidInvoices.forEach(i => {
            totalSales = DecimalUtil.add(totalSales, i.total);
        });

        // Delivered Orders (Ecommerce Cash)
        const deliveredOrders = await this.ordersRepository.find({ where: { status: 'delivered' } });
        deliveredOrders.forEach(o => {
            totalSales = DecimalUtil.add(totalSales, o.total);
        });

        // NOTE: Finance V5 'Total Income' does NOT deduct returns. 
        // If we want Net Sales, we would deduct them. 
        // Based on user request to "align with Finance", we use Gross here.

        // 5. Recent Activity (Unified Timeline V6 Logic)
        // Fetch Top 5 of each
        const rawPayments = await this.paymentsRepository.find({ order: { createdAt: 'DESC' }, take: 5 });
        const rawExpenses = await this.expensesRepository.find({ order: { date: 'DESC' }, take: 5 });
        const rawReturns = await this.returnsRepository.find({ order: { createdAt: 'DESC' }, take: 5 });

        // Helper to fetch invoice status
        const invoiceIds = rawPayments.map(p => p.invoiceId).filter(id => id);
        let invoiceMap = new Map<string, Invoice>();
        if (invoiceIds.length > 0) {
            const invs = await this.invoicesRepository.find({ where: { id: In(invoiceIds) } });
            invoiceMap = new Map(invs.map(i => [i.id, i]));
        }

        const activities = [
            ...rawPayments.map(p => {
                const inv = p.invoiceId ? invoiceMap.get(p.invoiceId) : null;

                // Check logic: 
                if (inv?.status === 'returned') return null;

                let title = `Payment Received`;
                if (inv && inv.invoiceNumber) title = `Payment #${inv.invoiceNumber}`;
                else if (p.paymentMethodId) title = `Payment`; // Simplify

                return {
                    id: p.id,
                    date: p.createdAt,
                    title: title,
                    amount: p.amount,
                    type: 'income',
                    status: p.status
                };
            }).filter(x => x),

            ...rawExpenses.map(e => ({
                id: e.id,
                date: e.date instanceof Date ? e.date : new Date(e.date),
                title: `Expense: ${e.title}`,
                amount: e.amount,
                type: 'expense',
                status: 'paid'
            })),

            ...rawReturns.map(r => ({
                id: r.id,
                date: r.createdAt,
                title: `Return #${r.returnNumber}`,
                amount: r.refundAmount,
                type: 'refund',
                status: r.status
            }))
        ];

        // Sort and Take 10
        activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const recentActivity = activities.slice(0, 10);

        return {
            products: productsCount,
            orders: ordersCount,
            sales: totalSales.toString(),
            lowStock: lowStockCount,
            recentActivity
        };
    }
}
