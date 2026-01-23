
import { DataSource } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PaymentMethod } from '../src/modules/sales/entities/payment-method.entity';

async function resetAndSeed() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    console.log('🗑️  Wiping Data...');
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
        // Disable FK checks
        await queryRunner.query('TRUNCATE TABLE payment_methods CASCADE');
        await queryRunner.query('TRUNCATE TABLE payments CASCADE');
        await queryRunner.query('TRUNCATE TABLE invoice_items CASCADE');
        await queryRunner.query('TRUNCATE TABLE invoices CASCADE');
        await queryRunner.query('TRUNCATE TABLE order_items CASCADE');
        await queryRunner.query('TRUNCATE TABLE orders CASCADE');
        // await queryRunner.query('TRUNCATE TABLE stock_items CASCADE'); // Optional: Wipe stock? User said "products"
        // Assuming wiping products too:
        await queryRunner.query('TRUNCATE TABLE product_variants CASCADE');
        await queryRunner.query('TRUNCATE TABLE products CASCADE');

        // Optional: Wiping expenses to start fresh "Safe"
        await queryRunner.query('TRUNCATE TABLE expenses CASCADE');

        console.log('✅ Data Wiped.');

        console.log('🌱 Seeding Payment Methods...');
        const methodRepo = dataSource.getRepository(PaymentMethod);

        const methods = [
            {
                code: 'cash',
                nameEn: 'Cash',
                nameAr: 'نقد',
                isAvailableOnPos: true,
                isAvailableOnline: false, // Online is usually COD
                isActive: true
            },
            {
                code: 'cod',
                nameEn: 'Cash on Delivery',
                nameAr: 'دفع عند الاستلام',
                isAvailableOnPos: false, // POS is direct cash
                isAvailableOnline: true,
                isActive: true
            },
            {
                code: 'vodafone_cash',
                nameEn: 'Vodafone Cash',
                nameAr: 'فودافون كاش',
                isAvailableOnPos: true,
                isAvailableOnline: false, // Can be added later if needed
                isActive: true
            },
            {
                code: 'instapay',
                nameEn: 'Instapay',
                nameAr: 'إنستاباي',
                isAvailableOnPos: true,
                isAvailableOnline: false,
                isActive: true
            },
            {
                code: 'visa',
                nameEn: 'Visa / Online Payment',
                nameAr: 'فيزا / دفع إلكتروني',
                isAvailableOnPos: false, // POS usually distinct machine, but can be true if integrated. User said "Cash options" and "Visa Online". Let's stick to user request.
                isAvailableOnline: true,
                isActive: true
            }
        ];

        for (const m of methods) {
            await methodRepo.save(m);
        }

        console.log('✅ Payment Methods Seeded.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await app.close();
    }
}

resetAndSeed();
