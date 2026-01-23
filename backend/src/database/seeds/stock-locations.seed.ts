import { DataSource } from 'typeorm';
import { StockLocation } from '../../modules/inventory/entities/stock-location.entity';

export async function seedStockLocations(dataSource: DataSource) {
  const locationRepository = dataSource.getRepository(StockLocation);

  const locations = [
    { name: 'Store', address: 'Store Address' },
    { name: 'Warehouse', address: 'Main Warehouse' },
  ];

  for (const locData of locations) {
    let location = await locationRepository.findOne({ where: { name: locData.name } });
    if (!location) {
      location = locationRepository.create(locData);
      await locationRepository.save(location);
      console.log(`✅ Created location: ${location.name}`);
    }
  }
}






