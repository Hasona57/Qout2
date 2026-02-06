# Stock Display Debug Guide

## المشكلة
المخزون لا يظهر في صفحة Inventory عند اختيار أي موقع (Warehouse أو Store).

## خطوات التحقق

### 1. التحقق من وجود بيانات في قاعدة البيانات

افتح Supabase Dashboard واذهب إلى SQL Editor، ثم نفذ الاستعلام التالي:

```sql
-- التحقق من وجود بيانات في stock_items
SELECT COUNT(*) as total_stock_items FROM stock_items;

-- عرض عينة من البيانات
SELECT 
  si.id,
  si."variantId",
  si."locationId",
  si.quantity,
  sl.name as location_name,
  pv.sku as variant_sku
FROM stock_items si
LEFT JOIN stock_locations sl ON si."locationId" = sl.id
LEFT JOIN product_variants pv ON si."variantId" = pv.id
LIMIT 10;

-- التحقق من المخزون لكل موقع
SELECT 
  sl.name as location_name,
  COUNT(si.id) as stock_items_count,
  SUM(si.quantity) as total_quantity
FROM stock_locations sl
LEFT JOIN stock_items si ON sl.id = si."locationId"
GROUP BY sl.id, sl.name;
```

### 2. التحقق من RLS (Row Level Security)

إذا كان RLS مفعلاً، تأكد من وجود policies تسمح بالقراءة:

```sql
-- التحقق من RLS policies لجدول stock_items
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'stock_items';
```

إذا لم تكن هناك policies، أضف policy للقراءة:

```sql
-- إنشاء policy للقراءة (للمستخدمين المصرح لهم)
CREATE POLICY "Allow service role to read stock_items"
ON stock_items
FOR SELECT
TO service_role
USING (true);

-- أو للعامة (إذا كان RLS غير مفعّل)
CREATE POLICY "Allow public read access to stock_items"
ON stock_items
FOR SELECT
TO public
USING (true);
```

### 3. التحقق من Logs في Vercel

1. اذهب إلى Vercel Dashboard
2. اختر مشروع Admin
3. اذهب إلى Logs
4. ابحث عن رسائل "STOCK API DEBUG" أو "ASSIGN STOCK DEBUG"
5. تحقق من الأخطاء أو البيانات المرسلة

### 4. التحقق من Console في المتصفح

1. افتح Developer Tools (F12)
2. اذهب إلى Console
3. ابحث عن رسائل "Loading stock for location"
4. تحقق من "Stock API response" - يجب أن يحتوي على `data` array

### 5. إنشاء بيانات تجريبية

إذا لم تكن هناك بيانات، أنشئ بيانات تجريبية:

```sql
-- الحصول على variant و location IDs
SELECT id, sku FROM product_variants LIMIT 1;
SELECT id, name FROM stock_locations LIMIT 2;

-- إنشاء stock item تجريبي
-- استبدل 'variant-id-here' و 'location-id-here' بالقيم الفعلية
INSERT INTO stock_items ("variantId", "locationId", quantity, "reservedQuantity", "minStockLevel")
VALUES 
  ('variant-id-here', 'location-id-here', 10, 0, 5)
ON CONFLICT DO NOTHING;
```

### 6. التحقق من Service Role Key

تأكد من أن `SUPABASE_SERVICE_ROLE_KEY` في Vercel Environment Variables:
1. اذهب إلى Vercel Dashboard
2. اختر المشروع
3. Settings > Environment Variables
4. تحقق من وجود `SUPABASE_SERVICE_ROLE_KEY` مع القيمة الصحيحة

### 7. اختبار API مباشرة

بعد إعادة النشر، اختبر API مباشرة:

```bash
# استبدل YOUR-VERCEL-URL و LOCATION-ID
curl "https://YOUR-VERCEL-URL/api/inventory/stock?locationId=LOCATION-ID"
```

يجب أن يعيد JSON مع `data` array.

## الحلول المحتملة

### الحل 1: تفعيل RLS Policies
إذا كان RLS مفعلاً بدون policies، أضف policies كما هو موضح في `enable_rls.sql`.

### الحل 2: تعطيل RLS مؤقتاً (للتطوير فقط)
```sql
ALTER TABLE stock_items DISABLE ROW LEVEL SECURITY;
```

**تحذير:** لا تفعل هذا في الإنتاج!

### الحل 3: التحقق من البيانات
تأكد من وجود بيانات في `stock_items` مرتبطة بالمواقع الصحيحة.

### الحل 4: إعادة تعيين البيانات
إذا كانت البيانات موجودة لكن لا تظهر، جرب:
1. حذف جميع stock_items
2. إعادة إنشائها من خلال صفحة "Assign Stock"

## بعد إصلاح المشكلة

بعد تطبيق الحلول:
1. أعد نشر التطبيق على Vercel
2. امسح Cache في المتصفح (Ctrl+Shift+Delete)
3. اختبر صفحة Inventory مرة أخرى
4. تحقق من Console و Vercel Logs للتأكد من عدم وجود أخطاء





