
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Invoice } from '../src/modules/sales/entities/invoice.entity';

async function run() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const invoiceRepo = dataSource.getRepository(Invoice);

    // Find last cancelled invoice
    const invoice = await invoiceRepo.findOne({
        where: { status: 'cancelled' },
        order: { createdAt: 'DESC' },
        relations: ['items'] // to check what we are deleting
    });

    if (invoice) {
        console.log(`Deleting Invoice ${invoice.invoiceNumber} (${invoice.id})`);

        // Manual deletion of related items if cascade isn't perfect, but usually cascade works.
        // However, stock was likely released during cancellation.
        // Deleting the record is just data cleanup as requested.

        await invoiceRepo.remove(invoice);
        console.log('Deleted successfully.');
    } else {
        console.log('No cancelled invoice found.');
    }

    await app.close();
}

run();
