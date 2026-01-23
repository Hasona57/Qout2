
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FinanceService } from './modules/finance/finance.service';
import { DataSource } from 'typeorm';
import * as fs from 'fs';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const financeService = app.get(FinanceService);
    const dataSource = app.get(DataSource);

    try {
        const invoicesRepository = dataSource.getRepository('Invoice');

        // Fetch Paid Invoices exactly like FinanceService
        const paidInvoices = await invoicesRepository.find({
            where: { status: 'paid' },
            relations: ['payments', 'payments.paymentMethod'],
            order: { createdAt: 'DESC' },
            take: 10 // Last 10 to see recent ones
        });

        const report = [];

        for (const inv of paidInvoices) {
            const invData = {
                invoiceNumber: inv.invoiceNumber,
                total: inv.total,
                paymentsCount: inv.payments?.length || 0,
                payments: inv.payments?.map(p => ({
                    amount: p.amount,
                    methodId: p.paymentMethodId,
                    methodCode: p.paymentMethod?.code,
                    methodName: p.paymentMethod?.nameEn
                }))
            };
            report.push(invData);
        }

        fs.writeFileSync('debug-finance-output.json', JSON.stringify(report, null, 2));
        console.log('Debug report written to debug-finance-output.json');

    } catch (error) {
        console.error('Error during debug:', error);
    } finally {
        await app.close();
    }
}

bootstrap();
