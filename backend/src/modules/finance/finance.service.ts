import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Payment } from '../sales/entities/payment.entity';
import { PaymentMethod } from '../sales/entities/payment-method.entity';
import { User } from '../users/entities/user.entity';
import { Order } from '../ecommerce/entities/order.entity';
import { Invoice } from '../sales/entities/invoice.entity';
import { Return } from '../sales/entities/return.entity';
import { DecimalUtil } from '../../common/utils/decimal.util';

@Injectable()
export class FinanceService {
    constructor(
        @InjectRepository(Expense)
        private expensesRepository: Repository<Expense>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Payment)
        private paymentsRepository: Repository<Payment>,
        @InjectRepository(PaymentMethod)
        private paymentMethodsRepository: Repository<PaymentMethod>,
        @InjectRepository(Order)
        private ordersRepository: Repository<Order>,
        @InjectRepository(Invoice)
        private invoicesRepository: Repository<Invoice>,
        @InjectRepository(Return)
        private returnsRepository: Repository<Return>,
    ) { }

    async create(createExpenseDto: CreateExpenseDto): Promise<Expense> {
        const expense = this.expensesRepository.create(createExpenseDto);
        return this.expensesRepository.save(expense);
    }

    async findAll(): Promise<Expense[]> {
        return this.expensesRepository.find({ order: { date: 'DESC' } });
    }

    async findRecuring(): Promise<Expense[]> {
        return this.expensesRepository.find({ where: { isRecurring: true } });
    }

    async findOne(id: string): Promise<Expense> {
        const expense = await this.expensesRepository.findOne({ where: { id } });
        if (!expense) throw new NotFoundException('Expense not found');
        return expense;
    }

    async update(id: string, updateExpenseDto: UpdateExpenseDto): Promise<Expense> {
        await this.expensesRepository.update(id, updateExpenseDto);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        await this.expensesRepository.delete(id);
    }

    async checkRecurringDue(): Promise<any[]> {
        const recurring = await this.findRecuring();
        return recurring;
    }

    async getPayroll(): Promise<any> {
        const users = await this.usersRepository.find({ where: { isActive: true } });
        const salariedUsers = users.filter(u => u.salary > 0);

        const totalMonthly = salariedUsers.reduce((sum, u) => sum + Number(u.salary), 0);

        return {
            users: salariedUsers,
            totalMonthly,
            count: salariedUsers.length
        };
    }

    async getSafeStatus(startDate?: Date, endDate?: Date): Promise<any> {
        // ------------------------------------------------------------------
        // V5 Core Calculation: Invoice-Driven Logic (Matches ReportsService)
        // REFACTOR: Query Payments directly to ensure accurate breakdown
        // Fix: Fetch 'completed' payments even if invoice is missing/null (orphaned)
        
        // Build date filter for payments
        let paymentWhereConditions: any[] = [
            { invoice: { status: 'paid' } },
            { status: 'completed' }
        ];

        if (startDate || endDate) {
            const dateCondition: any = {};
            if (startDate && endDate) {
                const adjustedEndDate = new Date(endDate);
                adjustedEndDate.setHours(23, 59, 59, 999);
                dateCondition.createdAt = Between(startDate, adjustedEndDate);
            } else if (startDate) {
                dateCondition.createdAt = MoreThanOrEqual(startDate);
            } else if (endDate) {
                const adjustedEndDate = new Date(endDate);
                adjustedEndDate.setHours(23, 59, 59, 999);
                dateCondition.createdAt = LessThanOrEqual(adjustedEndDate);
            }
            paymentWhereConditions = paymentWhereConditions.map(cond => ({ ...cond, ...dateCondition }));
        }

        const payments = await this.paymentsRepository.find({
            where: paymentWhereConditions,
            relations: ['paymentMethod', 'invoice']
        });

        const breakdown = {
            cash_pos: DecimalUtil.from(0),
            cod: DecimalUtil.from(0),
            vodafone_cash: DecimalUtil.from(0),
            instapay: DecimalUtil.from(0),
            fawry: DecimalUtil.from(0),
            other: DecimalUtil.from(0)
        };

        let totalIncome = DecimalUtil.from(0);
        const processedInvoiceIds = new Set<string>();
        const processedPaymentIds = new Set<string>();

        // 1. Process explicit payments
        for (const p of payments) {
            if (processedPaymentIds.has(p.id)) continue;
            processedPaymentIds.add(p.id);

            const pAmount = DecimalUtil.from(p.amount || '0');
            const code = p.paymentMethod?.code?.trim()?.toLowerCase();

            // Accumulate Income
            totalIncome = DecimalUtil.add(totalIncome, pAmount);
            if (p.invoiceId) processedInvoiceIds.add(p.invoiceId);

            if (code === 'cash') {
                // Cash payments from invoices (POS) go to cash_pos
                breakdown.cash_pos = DecimalUtil.add(breakdown.cash_pos, pAmount);
            } else if (code === 'cod') {
                // COD payments go to cod
                breakdown.cod = DecimalUtil.add(breakdown.cod, pAmount);
            } else if (code === 'vodafone_cash') {
                breakdown.vodafone_cash = DecimalUtil.add(breakdown.vodafone_cash, pAmount);
            } else if (code === 'instapay') {
                breakdown.instapay = DecimalUtil.add(breakdown.instapay, pAmount);
            } else if (code === 'fawry') {
                breakdown.fawry = DecimalUtil.add(breakdown.fawry, pAmount);
            } else {
                breakdown.other = DecimalUtil.add(breakdown.other, pAmount);
            }
        }

        // 2. [REMOVED] Catch generic 'paid' invoices with NO payments
        // Reason: This causes double counting if valid payments exist but are orphaned (unlinked).
        // Since we now fetch orphaned payments in Step 1, we should rely on Payments + Orders only.
        // Assuming SalesService always creates a Payment entity for paid invoices.

        /*
        const paidInvoices = await this.invoicesRepository.find({
            where: { status: 'paid' }
        });

        for (const inv of paidInvoices) {
            if (!processedInvoiceIds.has(inv.id)) {
                // This invoice has NO payment records found above -> Default to Cash
                const amount = DecimalUtil.from(inv.total || '0');
                totalIncome = DecimalUtil.add(totalIncome, amount);
                breakdown.cash = DecimalUtil.add(breakdown.cash, amount);
                console.log(`Invoice ${inv.invoiceNumber} has no payment records. Added ${amount} to Cash.`);
            }
        }
        */

        console.log('Safe Breakdown Calculated:', {
            cash_pos: breakdown.cash_pos.toString(),
            cod: breakdown.cod.toString(),
            vf: breakdown.vodafone_cash.toString(),
            insta: breakdown.instapay.toString(),
            fawry: breakdown.fawry.toString()
        });

        // 3. Get Active Online Orders (Pending/Shipped/Confirmed)
        // User requested these be added to Safe Cash (previously 'Expected Revenue')
        // We EXCLUDE 'delivered' because those likely have associated Payment records
        // and would cause double counting.
        const orderWhere: any = {};
        if (startDate || endDate) {
            if (startDate && endDate) {
                const adjustedEndDate = new Date(endDate);
                adjustedEndDate.setHours(23, 59, 59, 999);
                orderWhere.createdAt = Between(startDate, adjustedEndDate);
            } else if (startDate) {
                orderWhere.createdAt = MoreThanOrEqual(startDate);
            } else if (endDate) {
                const adjustedEndDate = new Date(endDate);
                adjustedEndDate.setHours(23, 59, 59, 999);
                orderWhere.createdAt = LessThanOrEqual(adjustedEndDate);
            }
        }

        const activeOrders = await this.ordersRepository.find(
            Object.keys(orderWhere).length > 0 ? { where: orderWhere } : {}
        );

        for (const order of activeOrders) {
            const status = (order.status || '').toLowerCase();
            const payMethod = (order.paymentMethod || '').toLowerCase();

            // Include key "In-Flight" statuses.
            // Exclude 'delivered' (assume paid/in payments), 'cancelled', 'returned'
            // Also EXCLUDE if paymentStatus is 'paid' or 'partially_paid' because those should have associated Payment records
            // processed in Step 1.
            const pStatus = (order.paymentStatus || '').toLowerCase();
            const isPaid = ['paid', 'partially_paid', 'refunded'].includes(pStatus);

            if (['pending', 'confirmed', 'processing', 'shipped'].includes(status) && !isPaid) {
                const total = DecimalUtil.from(order.total ? order.total.toString() : '0');
                const shipping = DecimalUtil.from(order.shippingFee ? order.shippingFee.toString() : '0');

                // User Requirement: Exclude Shipping Fee (collected effectively by courier)
                // Store Revenue = Total - Shipping
                const netAmount = DecimalUtil.subtract(total, shipping);

                totalIncome = DecimalUtil.add(totalIncome, netAmount);

                // Categorize Order Revenue
                if (payMethod.includes('vodafone')) {
                    breakdown.vodafone_cash = DecimalUtil.add(breakdown.vodafone_cash, netAmount);
                } else if (payMethod.includes('insta')) {
                    breakdown.instapay = DecimalUtil.add(breakdown.instapay, netAmount);
                } else if (payMethod.includes('fawry')) {
                    breakdown.fawry = DecimalUtil.add(breakdown.fawry, netAmount);
                } else {
                    // Default to COD for online orders (unless specified otherwise)
                    breakdown.cod = DecimalUtil.add(breakdown.cod, netAmount);
                }
            }
        }

        // 4. Get Expenses
        const expenseWhere: any = {};
        if (startDate || endDate) {
            if (startDate && endDate) {
                const adjustedEndDate = new Date(endDate);
                adjustedEndDate.setHours(23, 59, 59, 999);
                expenseWhere.date = Between(startDate, adjustedEndDate);
            } else if (startDate) {
                expenseWhere.date = MoreThanOrEqual(startDate);
            } else if (endDate) {
                const adjustedEndDate = new Date(endDate);
                adjustedEndDate.setHours(23, 59, 59, 999);
                expenseWhere.date = LessThanOrEqual(adjustedEndDate);
            }
        }

        const rawExpenses = await this.expensesRepository.find({
            ...(Object.keys(expenseWhere).length > 0 ? { where: expenseWhere } : {}),
            order: { date: 'DESC' }
        });
        let totalExpenses = DecimalUtil.from(0);

        rawExpenses.forEach(e => {
            totalExpenses = DecimalUtil.add(totalExpenses, e.amount);
        });

        // 4.5 Process Returns (Deductions) from Total Income
        // Fetch ALL returns to subtract from the balance (ensure we catch everything)
        // Use the refundMethod field to know which 'pot' to take money out of
        const returnWhere: any = {
            status: In(['refunded', 'approved'])
        };
        if (startDate || endDate) {
            if (startDate && endDate) {
                const adjustedEndDate = new Date(endDate);
                adjustedEndDate.setHours(23, 59, 59, 999);
                returnWhere.createdAt = Between(startDate, adjustedEndDate);
            } else if (startDate) {
                returnWhere.createdAt = MoreThanOrEqual(startDate);
            } else if (endDate) {
                const adjustedEndDate = new Date(endDate);
                adjustedEndDate.setHours(23, 59, 59, 999);
                returnWhere.createdAt = LessThanOrEqual(adjustedEndDate);
            }
        }

        const allReturns = await this.returnsRepository.find({
            where: returnWhere,
            relations: ['invoice', 'invoice.payments', 'invoice.payments.paymentMethod', 'order']
        });

        for (const ret of allReturns) {
            // Deduct confirmed refunds
            if (ret.status === 'rejected' || ret.status === 'cancelled') continue;

            const refundAmount = DecimalUtil.from(ret.refundAmount || '0');

            // Use refundMethod if available, otherwise fallback to original payment method
            let methodCode = ret.refundMethod?.toLowerCase() || 'cash_pos'; // Default to cash_pos

            // If refundMethod is not set, try to infer from original payment
            if (!ret.refundMethod) {
                if (ret.order) {
                    const orderMethod = (ret.order.paymentMethod || '').toLowerCase();
                    if (orderMethod.includes('vodafone')) methodCode = 'vodafone_cash';
                    else if (orderMethod.includes('insta')) methodCode = 'instapay';
                    else if (orderMethod.includes('cod')) methodCode = 'cod';
                    else methodCode = 'cash_pos';
                } else if (ret.invoice) {
                    if (ret.invoice.payments?.length > 0) {
                        const validPay = ret.invoice.payments.find(p => p.status === 'completed') || ret.invoice.payments[0];
                        if (validPay?.paymentMethod) {
                            methodCode = validPay.paymentMethod.code.toLowerCase();
                        }
                    } else {
                        const fullInvoice = await this.invoicesRepository.findOne({
                            where: { id: ret.invoice.id },
                            relations: ['payments', 'payments.paymentMethod']
                        });

                        if (fullInvoice && fullInvoice.payments?.length > 0) {
                            const validPay = fullInvoice.payments.find(p => p.status === 'completed') || fullInvoice.payments[0];
                            if (validPay?.paymentMethod) {
                                methodCode = validPay.paymentMethod.code.toLowerCase();
                            }
                        }
                    }
                }
            }

            // Deduct from Total Income
            totalIncome = DecimalUtil.subtract(totalIncome, refundAmount);

            // Deduct from Breakdown based on refundMethod
            if (methodCode === 'vodafone_cash') {
                breakdown.vodafone_cash = DecimalUtil.subtract(breakdown.vodafone_cash, refundAmount);
            } else if (methodCode === 'instapay') {
                breakdown.instapay = DecimalUtil.subtract(breakdown.instapay, refundAmount);
            } else if (methodCode === 'fawry') {
                breakdown.fawry = DecimalUtil.subtract(breakdown.fawry, refundAmount);
            } else if (methodCode === 'cod') {
                breakdown.cod = DecimalUtil.subtract(breakdown.cod, refundAmount);
            } else {
                // Default to cash_pos for 'cash' or 'cash_pos' or any other cash-related code
                breakdown.cash_pos = DecimalUtil.subtract(breakdown.cash_pos, refundAmount);
            }
        }

        // User Request: "Net Cash" should be Total Income (All Methods) - Expenses
        const netCash = DecimalUtil.subtract(totalIncome, totalExpenses);

        // ------------------------------------------------------------------
        // V6: Unified Recent Movements (Payments + Expenses + Returns)
        // ------------------------------------------------------------------

        // Fetch Top 20 Payments (with date filter if provided)
        const paymentQuery: any = {
            order: { createdAt: 'DESC' },
            take: 20,
            relations: ['invoice', 'paymentMethod']
        };
        if (startDate || endDate) {
            if (startDate && endDate) {
                const adjustedEndDate = new Date(endDate);
                adjustedEndDate.setHours(23, 59, 59, 999);
                paymentQuery.where = { createdAt: Between(startDate, adjustedEndDate) };
            } else if (startDate) {
                paymentQuery.where = { createdAt: MoreThanOrEqual(startDate) };
            } else if (endDate) {
                const adjustedEndDate = new Date(endDate);
                adjustedEndDate.setHours(23, 59, 59, 999);
                paymentQuery.where = { createdAt: LessThanOrEqual(adjustedEndDate) };
            }
        }
        const rawPayments = await this.paymentsRepository.find(paymentQuery);

        // Fetch Top 20 Returns (with date filter if provided)
        const returnQuery: any = {
            order: { createdAt: 'DESC' },
            take: 20
        };
        if (startDate || endDate) {
            if (startDate && endDate) {
                const adjustedEndDate = new Date(endDate);
                adjustedEndDate.setHours(23, 59, 59, 999);
                returnQuery.where = { createdAt: Between(startDate, adjustedEndDate) };
            } else if (startDate) {
                returnQuery.where = { createdAt: MoreThanOrEqual(startDate) };
            } else if (endDate) {
                const adjustedEndDate = new Date(endDate);
                adjustedEndDate.setHours(23, 59, 59, 999);
                returnQuery.where = { createdAt: LessThanOrEqual(adjustedEndDate) };
            }
        }
        const rawReturns = await this.returnsRepository.find(returnQuery);

        // Normalize Payments
        const paymentEvents = rawPayments.map(p => {
            const inv = p.invoice;
            const method = p.paymentMethod;

            let displayStatus = p.status;

            if (inv?.status === 'returned') {
                displayStatus = 'Returned (Excluded)';
            } else if (inv?.status !== 'paid' && p.status === 'completed') {
                displayStatus = `Paid (Invoice: ${inv?.status || 'Unknown'})`;
            }

            // Fallback Reference Logic
            let reference = 'N/A';
            if (p.transactionId) reference = p.transactionId;
            else if (inv?.invoiceNumber) reference = inv.invoiceNumber;
            else reference = 'POS-Pay';

            return {
                id: p.id,
                date: p.createdAt,
                amount: p.amount,
                method: method?.nameEn || 'Unknown',
                code: method?.code,
                type: 'income',
                isexcluded: inv?.status === 'returned',
                reference: reference, // Improved fallback
                status: displayStatus
            };
        });

        // Normalize Expenses
        const expenseEvents = rawExpenses.slice(0, 20).map(e => ({
            id: e.id,
            date: e.date instanceof Date ? e.date : new Date(e.date),
            amount: e.amount.toString(),
            method: 'Cash',
            code: 'cash',
            type: 'expense',
            reference: e.title,
            status: 'paid'
        }));

        // Normalize Returns
        const returnEvents = rawReturns.map(r => ({
            id: r.id,
            date: r.createdAt,
            amount: r.refundAmount.toString(),
            method: 'Refund',
            code: 'refund',
            type: 'refund',
            reference: r.returnNumber,
            status: r.status
        }));

        // Normalize Orders (for Recent Movements)
        // Only including the activeOrders (Pending/Shipped/Confirmed) to match the Cash calculation logic
        // and avoid checking delivered ones (which should be in Payments)
        const orderEvents = activeOrders.map(o => {
            const total = DecimalUtil.from(o.total ? o.total.toString() : '0');
            const shipping = DecimalUtil.from(o.shippingFee ? o.shippingFee.toString() : '0');
            const netAmount = DecimalUtil.subtract(total, shipping);

            return {
                id: o.id,
                date: o.createdAt,
                amount: netAmount.toString(), // Show Net Amount (excl. shipping)
                method: o.paymentMethod || 'Online',
                code: 'order',
                type: 'income',
                isexcluded: false,
                reference: o.orderNumber,
                status: o.status
            };
        });

        // Merge and Sort
        const allEvents = [...paymentEvents, ...expenseEvents, ...returnEvents, ...orderEvents];
        allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Slice Top 20 combined
        const recentTransactions = allEvents.slice(0, 20);

        return {
            debug_info: {
                databaseName: process.env.DB_DATABASE || 'default(qote_db)',
                databaseHost: process.env.DB_HOST || 'localhost',
                invoicesFound: 0, // Disabled fallback
                scanType: 'Unified Timeline (V6)',
            },
            breakdown: {
                cash_pos: breakdown.cash_pos.toString(),
                cod: breakdown.cod.toString(),
                vodafone_cash: breakdown.vodafone_cash.toString(),
                instapay: breakdown.instapay.toString(),
                fawry: breakdown.fawry.toString(),
                other: breakdown.other.toString(),
            },
            totalIncome: totalIncome.toString(),
            totalExpenses: totalExpenses.toString(),
            netCashInHand: netCash.toString(),
            recentTransactions,
            netTotal: DecimalUtil.subtract(totalIncome, totalExpenses).toString()
        };
    }
}
