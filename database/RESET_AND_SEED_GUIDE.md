# 🔄 Reset and Seed Database Guide

## دليل إعادة تعيين قاعدة البيانات وإعادة زرعها

### ⚠️ تحذير مهم
هذا السكريبت سيمحو **جميع البيانات** الموجودة في قاعدة البيانات ويبدأ من جديد!

---

## 📋 الخطوات

### 1. فتح Supabase SQL Editor

1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك: `qlpkhofninwegrzyqgmp`
3. اذهب إلى **SQL Editor** → **New Query**

### 2. تشغيل Reset and Seed Script

1. افتح ملف `database/reset_and_seed.sql`
2. انسخ **جميع** المحتوى
3. الصق في SQL Editor
4. اضغط **Run** أو **Ctrl+Enter**

### 3. انتظار اكتمال العملية

سترى رسائل نجاح لكل قسم:
- ✅ حذف البيانات
- ✅ إنشاء Permissions
- ✅ إنشاء Roles
- ✅ إنشاء Users
- ✅ إنشاء Sizes
- ✅ إنشاء Colors
- ✅ إنشاء Categories
- ✅ إنشاء Stock Locations
- ✅ إنشاء Payment Methods

### 4. تفعيل RLS Policies

بعد اكتمال seeding، شغّل ملف `database/enable_rls.sql` لتفعيل Row Level Security:

1. افتح `database/enable_rls.sql`
2. انسخ المحتوى
3. الصق في SQL Editor
4. اضغط **Run**

---

## 📊 البيانات التي سيتم إنشاؤها

### Users (المستخدمين)
- **Admin**: `admin@qote.com` / `admin123`
- **POS Employee**: `pos@qote.com` / `pos123`

### Roles (الأدوار)
- `admin` - Full system access
- `sales_employee` - POS access only
- `factory_manager` - Production management
- `storekeeper` - Inventory management
- `customer` - Customer access

### Sizes (المقاسات)
- `1`
- `2`
- `FREE_SIZE` (مقاس حر)

### Colors (الألوان)
33 لون (أسود، أبيض، بترولي، إلخ...)

### Categories (الفئات)
- عبايات (Abayas)
- جاكيتات (Jackets)
- فساتين (Dresses)

### Stock Locations (مواقع المخزون)
- `Store` (المتجر)
- `Warehouse` (المستودع)

### Payment Methods (طرق الدفع)
- `cash` - نقد
- `vodafone_cash` - فودافون كاش
- `instapay` - انستا باي
- `fawry` - فوري
- `cod` - الدفع عند الاستلام

---

## ✅ التحقق من النجاح

بعد تشغيل السكريبت، تحقق من:

```sql
-- التحقق من عدد السجلات في كل جدول
SELECT 'Roles' as table_name, COUNT(*) as count FROM roles
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Sizes', COUNT(*) FROM sizes
UNION ALL
SELECT 'Colors', COUNT(*) FROM colors
UNION ALL
SELECT 'Categories', COUNT(*) FROM categories
UNION ALL
SELECT 'Stock Locations', COUNT(*) FROM stock_locations
UNION ALL
SELECT 'Payment Methods', COUNT(*) FROM payment_methods;
```

يجب أن ترى:
- Roles: 5
- Users: 2
- Sizes: 3
- Colors: 33
- Categories: 3
- Stock Locations: 2
- Payment Methods: 5

---

## 🔧 بعد Reset

بعد إعادة تعيين قاعدة البيانات:

1. **سجّل الدخول** باستخدام:
   - Email: `admin@qote.com`
   - Password: `admin123`

2. **أنشئ منتجات** من خلال صفحة Products في Admin

3. **عيّن مخزون** من خلال صفحة Inventory → Assign Stock

4. **اختبر النظام** للتأكد من أن كل شيء يعمل بشكل صحيح

---

## 🆘 حل المشاكل

### خطأ: "relation does not exist"
- تأكد من أن جميع الجداول موجودة في قاعدة البيانات
- قد تحتاج إلى تشغيل migrations أولاً

### خطأ: "duplicate key value"
- السكريبت يستخدم `ON CONFLICT DO NOTHING` أو `ON CONFLICT DO UPDATE`
- يجب أن يعمل بشكل صحيح حتى لو كانت بعض البيانات موجودة

### خطأ: "foreign key constraint"
- تأكد من تشغيل السكريبت بالترتيب الصحيح
- السكريبت مصمم لحذف البيانات بالترتيب الصحيح

---

## 📝 ملاحظات

- كلمات المرور مشفرة باستخدام bcrypt
- جميع التواريخ يتم تعيينها تلقائياً
- UUIDs يتم توليدها تلقائياً
- السكريبت آمن للتشغيل المتكرر (idempotent)








