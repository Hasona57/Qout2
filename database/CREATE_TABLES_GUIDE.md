# 📊 Create Database Tables Guide

## دليل إنشاء جداول قاعدة البيانات

### ⚠️ المشكلة
جدول `products` (وجداول أخرى) غير موجود في قاعدة البيانات، مما يسبب خطأ 500 عند محاولة إنشاء منتج.

### ✅ الحل
قم بتشغيل سكريبت `create_tables.sql` أولاً لإنشاء جميع الجداول، ثم شغّل `reset_and_seed.sql` لملء البيانات.

---

## 📋 خطوات الإعداد الكاملة

### الخطوة 1: إنشاء الجداول

1. افتح [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك: `qlpkhofninwegrzyqgmp`
3. اذهب إلى **SQL Editor** → **New Query**
4. افتح ملف `database/create_tables.sql`
5. انسخ **جميع** المحتوى
6. الصق في SQL Editor
7. اضغط **Run**

**النتيجة المتوقعة:**
- ✅ سيتم إنشاء جميع الجداول
- ✅ ستظهر رسالة في Messages tab تعرض عدد الجداول المنشأة

### الخطوة 2: إعادة تعيين وزرع البيانات

بعد إنشاء الجداول:

1. افتح ملف `database/reset_and_seed.sql`
2. انسخ **جميع** المحتوى
3. الصق في SQL Editor
4. اضغط **Run**

**النتيجة المتوقعة:**
- ✅ سيتم حذف أي بيانات موجودة
- ✅ سيتم إنشاء البيانات الأساسية (Roles, Users, Sizes, Colors, Categories, Stock Locations, Payment Methods)

### الخطوة 3: تفعيل RLS Policies

بعد seeding:

1. افتح ملف `database/enable_rls.sql`
2. انسخ **جميع** المحتوى
3. الصق في SQL Editor
4. اضغط **Run**

**النتيجة المتوقعة:**
- ✅ سيتم تفعيل RLS على جميع الجداول
- ✅ سيتم إنشاء policies للـ service_role

---

## 📊 الجداول التي سيتم إنشاؤها

### الجداول الأساسية:
- ✅ `roles` - الأدوار
- ✅ `permissions` - الصلاحيات
- ✅ `role_permissions` - ربط الأدوار بالصلاحيات
- ✅ `sizes` - المقاسات
- ✅ `colors` - الألوان
- ✅ `categories` - الفئات
- ✅ `stock_locations` - مواقع المخزون
- ✅ `payment_methods` - طرق الدفع

### جداول المستخدمين:
- ✅ `users` - المستخدمين
- ✅ `addresses` - العناوين

### جداول المنتجات:
- ✅ `products` - المنتجات
- ✅ `product_variants` - متغيرات المنتجات
- ✅ `product_images` - صور المنتجات

### جداول المخزون:
- ✅ `stock_items` - عناصر المخزون
- ✅ `stock_transfers` - تحويلات المخزون
- ✅ `stock_transfer_items` - عناصر التحويل
- ✅ `stock_adjustments` - تعديلات المخزون
- ✅ `stock_adjustment_items` - عناصر التعديل

### جداول المبيعات:
- ✅ `invoices` - الفواتير
- ✅ `invoice_items` - عناصر الفواتير
- ✅ `payments` - المدفوعات
- ✅ `returns` - المرتجعات
- ✅ `return_items` - عناصر المرتجعات
- ✅ `commission_records` - سجلات العمولات

### جداول التجارة الإلكترونية:
- ✅ `orders` - الطلبات
- ✅ `order_items` - عناصر الطلبات
- ✅ `carts` - سلات التسوق
- ✅ `cart_items` - عناصر السلة

### جداول الشحن:
- ✅ `delivery_zones` - مناطق التوصيل
- ✅ `shipping_rates` - أسعار الشحن
- ✅ `courier_companies` - شركات الشحن
- ✅ `shipments` - الشحنات

### جداول أخرى:
- ✅ `expenses` - المصروفات
- ✅ `attachments` - المرفقات
- ✅ `audit_logs` - سجلات التدقيق
- ✅ `notifications` - الإشعارات

---

## ✅ التحقق من النجاح

بعد تشغيل جميع السكريبتات، تحقق من:

```sql
-- التحقق من وجود الجداول الرئيسية
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('products', 'users', 'roles', 'categories', 'sizes', 'colors')
ORDER BY table_name;
```

يجب أن ترى 6 جداول على الأقل.

---

## 🆘 حل المشاكل

### خطأ: "relation already exists"
- الجداول موجودة بالفعل
- يمكنك تخطي `create_tables.sql` والانتقال مباشرة إلى `reset_and_seed.sql`

### خطأ: "permission denied"
- تأكد من استخدام Supabase SQL Editor (ليس من تطبيق خارجي)
- تأكد من أنك تستخدم حساب Admin في Supabase

### خطأ: "foreign key constraint"
- تأكد من تشغيل السكريبتات بالترتيب الصحيح:
  1. `create_tables.sql` أولاً
  2. `reset_and_seed.sql` ثانياً
  3. `enable_rls.sql` أخيراً

---

## 📝 ملاحظات مهمة

1. **الترتيب مهم**: يجب تشغيل `create_tables.sql` قبل `reset_and_seed.sql`
2. **البيانات**: بعد تشغيل `reset_and_seed.sql`، ستجد:
   - Admin user: `admin@qote.com` / `admin123`
   - POS user: `pos@qote.com` / `pos123`
3. **RLS**: بعد تفعيل RLS، تأكد من تشغيل `enable_rls.sql` لإنشاء policies

---

## 🎯 بعد الإعداد

بعد إكمال جميع الخطوات:

1. ✅ سجّل الدخول باستخدام `admin@qote.com` / `admin123`
2. ✅ أنشئ منتجات من صفحة Products
3. ✅ عيّن مخزون من صفحة Inventory → Assign Stock
4. ✅ اختبر النظام للتأكد من أن كل شيء يعمل








