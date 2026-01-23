
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { PaymentMethod } from '../src/modules/sales/entities/payment-method.entity';

dotenv.config();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'qote_db',
    entities: [PaymentMethod],
    synchronize: false,
});

async function run() {
    await AppDataSource.initialize();
    console.log('Database connected');

    const repo = AppDataSource.getRepository(PaymentMethod);

    const methods = [
        { code: 'cash', nameEn: 'Cash', nameAr: 'نقد', isAvailableOnPos: true, isAvailableOnline: false },
        { code: 'vodafone_cash', nameEn: 'Vodafone Cash', nameAr: 'فودافون كاش', isAvailableOnPos: true, isAvailableOnline: true },
        { code: 'instapay', nameEn: 'Instapay', nameAr: 'أنستا باي', isAvailableOnPos: true, isAvailableOnline: true },
        { code: 'card', nameEn: 'Credit Card', nameAr: 'بطاقة ائتمان', isAvailableOnPos: false, isAvailableOnline: false },
        { code: 'cod', nameEn: 'Cash on Delivery', nameAr: 'دفع عند الاستلام', isAvailableOnPos: false, isAvailableOnline: true },
    ];

    for (const m of methods) {
        let pm = await repo.findOne({ where: { code: m.code } });
        if (!pm) {
            console.log(`Creating ${m.code}...`);
            pm = repo.create(m);
        } else {
            console.log(`Updating ${m.code}...`);
            pm.isAvailableOnPos = m.isAvailableOnPos;
            pm.isAvailableOnline = m.isAvailableOnline;
            // Ensure names require update if missing? 
            // Just updating flags primarily.
        }
        await repo.save(pm);
    }

    console.log('Payment methods updated successfully.');
    await AppDataSource.destroy();
}

run().catch(console.error);
