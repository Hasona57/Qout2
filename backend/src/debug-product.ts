
import { AppDataSource } from './config/data-source';
import { Product } from './modules/products/entities/product.entity';
import { ColumnNumericTransformer } from './common/transformers/numeric.transformer';

async function run() {
    try {
        console.log('Connecting to database...');
        await AppDataSource.initialize();
        console.log('Connected!');

        const productRepo = AppDataSource.getRepository(Product);

        // Find one product
        const product = await productRepo.findOne({ where: {} });

        if (product) {
            console.log('Found Product:', product.id);
            console.log('CostPrice Type:', typeof product.costPrice);
            console.log('CostPrice Value:', product.costPrice);

            // Try update
            product.costPrice = 150.50;
            console.log('Updating CostPrice to 150.50');

            await productRepo.save(product);
            console.log('Saved successfully');

            const p2 = await productRepo.findOne({ where: { id: product.id } });
            console.log('Reloaded CostPrice:', p2?.costPrice);
        } else {
            console.log('No products found to test.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

run();
