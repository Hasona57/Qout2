import { AppDataSource } from '../../config/data-source';
import { seedRoles } from './roles.seed';
import { seedUsers } from './users.seed';
import { seedSizes } from './sizes.seed';
import { seedColors } from './colors.seed';
import { seedCategories } from './categories.seed';
import { seedStockLocations } from './stock-locations.seed';
import { seedPaymentMethods } from './payment-methods.seed';

async function runSeeds() {
  const dataSource = AppDataSource;
  await dataSource.initialize();

  try {
    console.log('🌱 Starting database seeding...');

    await seedRoles(dataSource);
    await seedUsers(dataSource);
    await seedSizes(dataSource);
    await seedColors(dataSource);
    await seedCategories(dataSource);
    await seedStockLocations(dataSource);
    await seedPaymentMethods(dataSource);

    console.log('✅ Database seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

runSeeds();

