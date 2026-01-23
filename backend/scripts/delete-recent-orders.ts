import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from '../src/modules/ecommerce/entities/order.entity';
import { DataSource } from 'typeorm';

async function cleanupOrders() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const ordersRepo = dataSource.getRepository(Order);

    // Find the last 3 orders
    const orders = await ordersRepo.find({
        order: {
            createdAt: 'DESC',
        },
        take: 3,
        relations: ['items'] // Load relations if needed for cascade, but TypeORM usually handles it
    });

    if (orders.length === 0) {
        console.log('No orders found to delete.');
        await app.close();
        return;
    }

    console.log(`Found ${orders.length} orders to delete:`);
    for (const order of orders) {
        console.log(`- Deleting Order #${order.orderNumber} (ID: ${order.id})`);
        await ordersRepo.remove(order);
    }

    console.log('Deletion complete.');
    await app.close();
}

cleanupOrders();
