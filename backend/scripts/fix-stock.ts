
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { InventoryService } from '../src/modules/inventory/inventory.service';
import { ProductsService } from '../src/modules/products/products.service';
import { DataSource } from 'typeorm';
import { ProductVariant } from '../src/modules/products/entities/product-variant.entity';
import { StockLocation } from '../src/modules/inventory/entities/stock-location.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const inventoryService = app.get(InventoryService);
    const dataSource = app.get(DataSource);
    const variantsRepo = dataSource.getRepository(ProductVariant);
    const locationsRepo = dataSource.getRepository(StockLocation);

    console.log('Finding locations...');
    const locations = await locationsRepo.find();
    if (locations.length === 0) {
        console.error('No locations found!');
        process.exit(1);
    }
    const defaultLocation = locations[0];
    console.log(`Using Location: ${defaultLocation.name} (${defaultLocation.id})`);

    console.log('Finding variant W5K3P-S-BLACK-7U5IA...');
    const variant = await variantsRepo.findOne({ where: { sku: 'W5K3P-S-BLACK-7U5IA' } });

    if (!variant) {
        console.error('Variant not found!');
        // Try to find ANY variant to fix
        const anyVariant = await variantsRepo.findOne({});
        if (anyVariant) {
            console.log(`Fallback: Adding stock to ${anyVariant.sku} instead.`);
            await inventoryService.addStock(anyVariant.id, defaultLocation.id, 100);
            console.log('Stock added!');
        }
    } else {
        console.log(`Adding 100 stock to ${variant.sku}...`);
        await inventoryService.addStock(variant.id, defaultLocation.id, 100);
        console.log('Stock added successfully!');
    }

    await app.close();
}

bootstrap();
