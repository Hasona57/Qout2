
import { AppDataSource } from './config/data-source';
import { Payment } from './modules/sales/entities/payment.entity';
import { PaymentMethod } from './modules/sales/entities/payment-method.entity';
import { Order } from './modules/ecommerce/entities/order.entity';

async function run() {
    try {
        console.log('Connecting to database...');
        await AppDataSource.initialize();
        console.log('Connected!');

        const paymentsRepo = AppDataSource.getRepository(Payment);
        const methodsRepo = AppDataSource.getRepository(PaymentMethod);
        const ordersRepo = AppDataSource.getRepository(Order);

        // Check Methods
        const methods = await methodsRepo.find();
        console.log('--- Payment Methods ---');
        console.table(methods.map(m => ({ id: m.id, code: m.code, nameEn: m.nameEn })));

        // Check Payments
        const count = await paymentsRepo.count();
        console.log(`\nTotal Payments: ${count}`);

        const payments = await paymentsRepo.find({
            relations: ['paymentMethod'],
            take: 20,
            order: { createdAt: 'DESC' }
        });

        console.log('\n--- Recent Payments ---');
        payments.forEach(p => {
            console.log(`ID: ${p.id} | Amount: ${p.amount} | Method: ${p.paymentMethod?.code} (${p.paymentMethod?.nameEn}) | Status: ${p.status}`);
        });

        // Check Delivered Orders
        const delivered = await ordersRepo.find({ where: { status: 'delivered' } });
        console.log(`\nDelivered Orders: ${delivered.length}`);
        delivered.forEach(o => console.log(`Order: ${o.orderNumber} | Total: ${o.total}`));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

run();
