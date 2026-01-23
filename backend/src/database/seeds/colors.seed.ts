import { DataSource } from 'typeorm';
import { Color } from '../../modules/products/entities/color.entity';

export async function seedColors(dataSource: DataSource) {
  const colorRepository = dataSource.getRepository(Color);

  const validCodes = [
    'BLACK', 'WHITE', 'OFF_WHITE', 'PETROLI', 'JANZARI', 'BROWN', 'CAMEL', 'GREEN', 
    'OLIVE', 'ZAYTOUNI', 'MINT_GREEN', 'RED', 'NABYTI', 'BETINGANI', 'ANABI', 
    'YELLOW', 'MUSTARD', 'SIMON', 'GOLD', 'SILVER', 'GRAY', 'BLUE', 'PINK', 
    'NAVY', 'BABY_BLUE', 'BEIGE', 'SKY_BLUE', 'LAVENDER', 'BURGUNDY', 
    'CASHMERE', 'MAUVE', 'ROSE', 'TURQUOISE'
  ];

  const colors = [
    { code: 'BLACK', nameAr: 'أسود', nameEn: 'Black', hexCode: '#000000', sortOrder: 1 },
    { code: 'WHITE', nameAr: 'أبيض', nameEn: 'White', hexCode: '#FFFFFF', sortOrder: 2 },
    { code: 'OFF_WHITE', nameAr: 'اوف وايت', nameEn: 'Off White', hexCode: '#FAF9F6', sortOrder: 3 },
    { code: 'PETROLI', nameAr: 'بترولي', nameEn: 'Petroli', hexCode: '#005F6B', sortOrder: 4 },
    { code: 'JANZARI', nameAr: 'جنزاري', nameEn: 'Janzari', hexCode: '#008080', sortOrder: 5 },
    { code: 'BROWN', nameAr: 'بني', nameEn: 'Brown', hexCode: '#8B4513', sortOrder: 6 },
    { code: 'CAMEL', nameAr: 'جملي', nameEn: 'Camel', hexCode: '#C19A6B', sortOrder: 7 },
    { code: 'GREEN', nameAr: 'اخضر', nameEn: 'Green', hexCode: '#008000', sortOrder: 8 },
    { code: 'OLIVE', nameAr: 'زيتي', nameEn: 'Olive', hexCode: '#808000', sortOrder: 9 },
    { code: 'ZAYTOUNI', nameAr: 'زيتوني', nameEn: 'Zaytouni', hexCode: '#6B8E23', sortOrder: 10 },
    { code: 'MINT_GREEN', nameAr: 'منت جرين', nameEn: 'Mint Green', hexCode: '#98FB98', sortOrder: 11 },
    { code: 'RED', nameAr: 'احمر', nameEn: 'Red', hexCode: '#FF0000', sortOrder: 12 },
    { code: 'NABYTI', nameAr: 'نبيتي', nameEn: 'Nabyti', hexCode: '#8B0000', sortOrder: 13 },
    { code: 'BETINGANI', nameAr: 'بتنجاني', nameEn: 'Betingani', hexCode: '#4B0082', sortOrder: 14 },
    { code: 'ANABI', nameAr: 'عنابي', nameEn: 'Anabi', hexCode: '#800020', sortOrder: 15 },
    { code: 'YELLOW', nameAr: 'اصفر', nameEn: 'Yellow', hexCode: '#FFFF00', sortOrder: 16 },
    { code: 'MUSTARD', nameAr: 'مستطرده', nameEn: 'Mustard', hexCode: '#FFDB58', sortOrder: 17 },
    { code: 'SIMON', nameAr: 'سيمون', nameEn: 'Simon', hexCode: '#FA8072', sortOrder: 18 },
    { code: 'GOLD', nameAr: 'دهبي', nameEn: 'Gold', hexCode: '#FFD700', sortOrder: 19 },
    { code: 'SILVER', nameAr: 'فضي', nameEn: 'Silver', hexCode: '#C0C0C0', sortOrder: 20 },
    { code: 'GRAY', nameAr: 'رصاصي', nameEn: 'Gray', hexCode: '#808080', sortOrder: 21 },
    { code: 'BLUE', nameAr: 'ازرق', nameEn: 'Blue', hexCode: '#0000FF', sortOrder: 22 },
    { code: 'PINK', nameAr: 'زهري', nameEn: 'Pink', hexCode: '#FFC0CB', sortOrder: 23 },
    { code: 'NAVY', nameAr: 'كحلي', nameEn: 'Navy', hexCode: '#000080', sortOrder: 24 },
    { code: 'BABY_BLUE', nameAr: 'بيبي بلو', nameEn: 'Baby Blue', hexCode: '#89CFF0', sortOrder: 25 },
    { code: 'BEIGE', nameAr: 'بيج', nameEn: 'Beige', hexCode: '#F5F5DC', sortOrder: 26 },
    { code: 'SKY_BLUE', nameAr: 'ازرق سماوي', nameEn: 'Sky Blue', hexCode: '#87CEEB', sortOrder: 27 },
    { code: 'LAVENDER', nameAr: 'لافندر', nameEn: 'Lavender', hexCode: '#E6E6FA', sortOrder: 28 },
    { code: 'BURGUNDY', nameAr: 'برجاندي', nameEn: 'Burgundy', hexCode: '#800020', sortOrder: 29 },
    { code: 'CASHMERE', nameAr: 'كشميري', nameEn: 'Cashmere', hexCode: '#E6D5B8', sortOrder: 30 },
    { code: 'MAUVE', nameAr: 'موف', nameEn: 'Mauve', hexCode: '#E0B0FF', sortOrder: 31 },
    { code: 'ROSE', nameAr: 'روز', nameEn: 'Rose', hexCode: '#FF007F', sortOrder: 32 },
    { code: 'TURQUOISE', nameAr: 'تركواز', nameEn: 'Turquoise', hexCode: '#40E0D0', sortOrder: 33 },
  ];

  for (const colorData of colors) {
    let color = await colorRepository.findOne({ where: { code: colorData.code } });
    if (!color) {
      color = colorRepository.create(colorData);
      await colorRepository.save(color);
      console.log(`✅ Created color: ${color.code} - ${color.nameAr}`);
    } else {
      // Update existing color to ensure names are correct
      color.nameAr = colorData.nameAr;
      color.nameEn = colorData.nameEn;
      color.hexCode = colorData.hexCode;
      color.sortOrder = colorData.sortOrder;
      await colorRepository.save(color);
      console.log(`🔄 Updated color: ${color.code} - ${color.nameAr}`);
    }
  }

  // Handle the case where ZITONI exists but should be ZAYTOUNI
  const oldZitoni = await colorRepository.findOne({ where: { code: 'ZITONI' } });
  if (oldZitoni) {
    // Update ZITONI to ZAYTOUNI instead of deleting to avoid FK constraint
    oldZitoni.code = 'ZAYTOUNI';
    oldZitoni.nameAr = 'زيتوني';
    oldZitoni.nameEn = 'Zaytouni';
    await colorRepository.save(oldZitoni);
    console.log(`🔄 Updated ZITONI to ZAYTOUNI`);
  }

  // Disable (not delete) colors that are not in the new list to avoid FK constraint issues
  const allColors = await colorRepository.find();
  for (const color of allColors) {
    if (!validCodes.includes(color.code) && color.code !== 'ZITONI') {
      // Note: We can't easily disable colors if there's no isActive field
      // So we'll just leave them but they won't be in the valid list
      console.log(`⚠️  Old color ${color.code} still exists but not in new list (not deleted due to existing variants)`);
    }
  }
}


