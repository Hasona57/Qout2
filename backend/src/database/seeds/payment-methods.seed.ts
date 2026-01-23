import { DataSource } from 'typeorm';
import { PaymentMethod } from '../../modules/sales/entities/payment-method.entity';

export async function seedPaymentMethods(dataSource: DataSource) {
  const paymentMethodRepository = dataSource.getRepository(PaymentMethod);

  // User requested: Remove Visa/Online, Add Vodafone Cash, Instapay.
  // Existing: cash, cod.

  // We should ideally disable or delete old ones if they exist, but simple seed typically creates if missing.
  // I will check/create the required ones. User can manually delete old ones if desired, or I can try to deactivate them if I had the code.
  // For now, I ensure valid ones exist.

  const methods = [
    { code: 'cash', nameAr: 'نقد', nameEn: 'Cash', isAvailableOnPos: true, isAvailableOnline: false },
    { code: 'vodafone_cash', nameAr: 'فودافون كاش', nameEn: 'Vodafone Cash', isAvailableOnPos: true, isAvailableOnline: true },
    { code: 'instapay', nameAr: 'انستا باي', nameEn: 'Instapay', isAvailableOnPos: true, isAvailableOnline: true },
    { code: 'fawry', nameAr: 'فوري', nameEn: 'Fawry', isAvailableOnPos: true, isAvailableOnline: true },
    { code: 'cod', nameAr: 'الدفع عند الاستلام', nameEn: 'Cash on Delivery', isAvailableOnPos: false, isAvailableOnline: true },
  ];

  for (const methodData of methods) {
    let method = await paymentMethodRepository.findOne({ where: { code: methodData.code } });
    if (!method) {
      method = paymentMethodRepository.create(methodData);
      await paymentMethodRepository.save(method);
      console.log(`✅ Created payment method: ${method.code}`);
    } else {
      // Ensure names and availability are updated if needed
      let needsUpdate = false;
      if (method.nameAr !== methodData.nameAr || method.nameEn !== methodData.nameEn) {
        method.nameAr = methodData.nameAr;
        method.nameEn = methodData.nameEn;
        needsUpdate = true;
      }
      if (methodData.isAvailableOnPos !== undefined && method.isAvailableOnPos !== methodData.isAvailableOnPos) {
        method.isAvailableOnPos = methodData.isAvailableOnPos;
        needsUpdate = true;
      }
      if (methodData.isAvailableOnline !== undefined && method.isAvailableOnline !== methodData.isAvailableOnline) {
        method.isAvailableOnline = methodData.isAvailableOnline;
        needsUpdate = true;
      }
      if (needsUpdate) {
        await paymentMethodRepository.save(method);
      }
    }
  }

  // Optional: Remove unwanted ones? 
  // const unwanted = ['card', 'bank_transfer', 'online'];
  // for (const code for unwanted) {
  //    await paymentMethodRepository.delete({ code });
  // }
  // Deleting might break FK constraints if used in old records. Safer to leave them alone or users delete manually.
  // But user said "remove Visa / Online ... as it is not going to be included".
  // I will attempt to delete them if unused.

  try {
    const unwanted = ['card', 'bank_transfer', 'online', 'visa'];
    for (const code of unwanted) {
      const m = await paymentMethodRepository.findOne({ where: { code } });
      if (m) {
        // Try delete. If FK violation, ignore.
        try {
          await paymentMethodRepository.delete(m.id);
          console.log(`🗑️ Deleted payment method: ${code}`);
        } catch (e) {
          console.warn(`Could not delete ${code} (likely used in history)`);
        }
      }
    }
  } catch (e) { }
}

