
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Order } from '../src/modules/ecommerce/entities/order.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const ordersRepo = dataSource.getRepository(Order);

    // Find the LAST order created
    const lastOrder = await ordersRepo.find({
        order: { createdAt: 'DESC' },
        take: 1
    });

    if (lastOrder.length > 0) {
        const order = lastOrder[0];
        console.log(`Deleting latest order: ${order.orderNumber} (${order.id})`);

        await ordersRepo.remove(order);
        console.log('Order deleted successfully!');
    } else {
        console.log('No orders found to delete.');
    }

    await app.close();
}

bootstrap();
