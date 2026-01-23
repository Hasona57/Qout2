import { DataSource } from 'typeorm';
import { Size } from '../../modules/products/entities/size.entity';

export async function seedSizes(dataSource: DataSource) {
  const sizeRepository = dataSource.getRepository(Size);

  const sizes = [
    { code: '1', nameAr: '1', nameEn: '1', sortOrder: 1 },
    { code: '2', nameAr: '2', nameEn: '2', sortOrder: 2 },
    { code: 'FREE_SIZE', nameAr: 'مقاس حر', nameEn: 'Free Size', sortOrder: 3 },
  ];

  // Update or create sizes
  for (const sizeData of sizes) {
    let size = await sizeRepository.findOne({ where: { code: sizeData.code } });
    if (!size) {
      size = sizeRepository.create(sizeData);
      await sizeRepository.save(size);
      console.log(`✅ Created size: ${size.code}`);
    } else {
      // Update existing size to ensure names are correct
      size.nameAr = sizeData.nameAr;
      size.nameEn = sizeData.nameEn;
      size.sortOrder = sizeData.sortOrder;
      await sizeRepository.save(size);
      console.log(`🔄 Updated size: ${size.code}`);
    }
  }

  // Disable (not delete) sizes that are not in the new list to avoid FK constraint issues
  const validCodes = ['1', '2', 'FREE_SIZE'];
  const allSizes = await sizeRepository.find();
  for (const size of allSizes) {
    if (!validCodes.includes(size.code)) {
      size.isActive = false;
      await sizeRepository.save(size);
      console.log(`⚠️  Disabled old size: ${size.code} (not deleted due to existing variants)`);
    }
  }
}


