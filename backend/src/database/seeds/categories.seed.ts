import { DataSource } from 'typeorm';
import { Category } from '../../modules/products/entities/category.entity';

export async function seedCategories(dataSource: DataSource) {
  const categoryRepository = dataSource.getRepository(Category);

  const categories = [
    { nameAr: 'عبايات', nameEn: 'Abayas', sortOrder: 1 },
    { nameAr: 'جاكيتات', nameEn: 'Jackets', sortOrder: 2 },
    { nameAr: 'فساتين', nameEn: 'Dresses', sortOrder: 3 },
  ];

  for (const catData of categories) {
    let category = await categoryRepository.findOne({ where: { nameEn: catData.nameEn } });
    if (!category) {
      category = categoryRepository.create(catData);
      await categoryRepository.save(category);
      console.log(`✅ Created category: ${category.nameEn}`);
    }
  }
}








