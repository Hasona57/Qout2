# 🌱 Database Seeding Guide

دليل إعداد قاعدة البيانات الأولية على Supabase.

## 📦 معلومات Supabase

- **Project ID**: `qlpkhofninwegrzyqgmp`
- **URL**: `https://qlpkhofninwegrzyqgmp.supabase.co`
- **Password**: `Hassanebad.90`

## 🔧 الطريقة 1: استخدام Supabase SQL Editor

### الخطوة 1: الاتصال بقاعدة البيانات

1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك (`qlpkhofninwegrzyqgmp`)
3. SQL Editor → New Query

### الخطوة 2: تشغيل SQL Scripts

قم بتشغيل SQL scripts من مجلد `backend/src/database/seeds/` بالترتيب:

1. `roles.seed.ts` - الأدوار
2. `users.seed.ts` - المستخدمين
3. `sizes.seed.ts` - المقاسات
4. `colors.seed.ts` - الألوان
5. `categories.seed.ts` - الفئات
6. `stock-locations.seed.ts` - مواقع المخزون
7. `payment-methods.seed.ts` - طرق الدفع

## 🔧 الطريقة 2: استخدام Node.js Script

### الخطوة 1: إعداد Environment Variables

أنشئ ملف `.env` في مجلد `backend`:

```env
DB_HOST=db.qlpkhofninwegrzyqgmp.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=Hassanebad.90
DB_DATABASE=postgres
DB_SSL=true
```

### الخطوة 2: تشغيل Seeding Script

```bash
cd backend
npm install
npm run seed:run
```

## 📋 البيانات الأولية

### Roles (الأدوار)
- `admin` - المدير
- `sales_employee` - موظف المبيعات
- `factory_manager` - مدير المصنع
- `storekeeper` - أمين المخزن
- `customer` - العميل

### Sizes (المقاسات)
- `1`
- `2`
- `FREE_SIZE`

### Colors (الألوان)
- أسود، أبيض، أوف وايت، بترولي، جنزاري، بني، جملي، أخضر، زيتي، زيتوني، منت جرين، أحمر، نبيتي، بتنجاني، عنابي، أصفر، مستطرده، سيمون، دهبي، فضي، رصاصي، أزرق، زهري، كحلي، بيبي بلو، بيج، أزرق سماوي، لافندر، برجاندي، كشميري، موف، روز، تركواز

### Payment Methods (طرق الدفع)
- نقد
- بطاقة
- تحويل بنكي
- أخرى

## ✅ التحقق من البيانات

بعد Seeding، تحقق من البيانات في Supabase Dashboard:

1. Table Editor → اختر الجدول
2. تأكد من وجود البيانات

## 🆘 حل المشاكل

### Connection Error
- تحقق من كلمة المرور: `Hassanebad.90`
- تأكد من SSL connection
- تحقق من Host: `db.qlpkhofninwegrzyqgmp.supabase.co`

### Foreign Key Violations
- تأكد من تشغيل Seeds بالترتيب الصحيح
- تحقق من وجود Roles قبل Users












