-- ============================================
-- Stock Items Check and Fix Script
-- ============================================
-- هذا الملف للتحقق من بيانات المخزون وإصلاحها
-- نفذ هذا الملف في Supabase SQL Editor

-- ============================================
-- 1. التحقق من وجود بيانات
-- ============================================

-- عدد جميع stock_items
SELECT COUNT(*) as total_stock_items FROM stock_items;

-- عرض جميع stock_items مع معلومات الموقع والمنتج
SELECT 
  si.id,
  si."variantId",
  si."locationId",
  si.quantity,
  si."reservedQuantity",
  si."minStockLevel",
  sl.name as location_name,
  pv.sku as variant_sku,
  p.name_en as product_name
FROM stock_items si
LEFT JOIN stock_locations sl ON si."locationId" = sl.id
LEFT JOIN product_variants pv ON si."variantId" = pv.id
LEFT JOIN products p ON pv."productId" = p.id
ORDER BY si."createdAt" DESC
LIMIT 20;

-- التحقق من المخزون لكل موقع
SELECT 
  sl.id as location_id,
  sl.name as location_name,
  COUNT(si.id) as stock_items_count,
  SUM(si.quantity) as total_quantity,
  SUM(si."reservedQuantity") as total_reserved
FROM stock_locations sl
LEFT JOIN stock_items si ON sl.id = si."locationId"
GROUP BY sl.id, sl.name
ORDER BY stock_items_count DESC;

-- ============================================
-- 2. التحقق من RLS Policies
-- ============================================

-- عرض جميع policies لجدول stock_items
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

-- ============================================
-- 3. إنشاء بيانات تجريبية (إذا لم تكن موجودة)
-- ============================================

-- الحصول على أول variant و location
DO $$
DECLARE
  v_variant_id UUID;
  v_location_id UUID;
  v_store_location_id UUID;
  v_warehouse_location_id UUID;
BEGIN
  -- الحصول على أول variant
  SELECT id INTO v_variant_id FROM product_variants LIMIT 1;
  
  -- الحصول على Store location
  SELECT id INTO v_store_location_id 
  FROM stock_locations 
  WHERE name ILIKE '%store%' OR name ILIKE '%متجر%' 
  LIMIT 1;
  
  -- الحصول على Warehouse location
  SELECT id INTO v_warehouse_location_id 
  FROM stock_locations 
  WHERE name ILIKE '%warehouse%' OR name ILIKE '%مستودع%' 
  LIMIT 1;
  
  -- إنشاء stock items تجريبية
  IF v_variant_id IS NOT NULL THEN
    -- للـ Store
    IF v_store_location_id IS NOT NULL THEN
      INSERT INTO stock_items ("variantId", "locationId", quantity, "reservedQuantity", "minStockLevel")
      VALUES (v_variant_id, v_store_location_id, 10, 0, 5)
      ON CONFLICT DO NOTHING;
      
      RAISE NOTICE 'Created stock item for Store location: %', v_store_location_id;
    END IF;
    
    -- للـ Warehouse
    IF v_warehouse_location_id IS NOT NULL THEN
      INSERT INTO stock_items ("variantId", "locationId", quantity, "reservedQuantity", "minStockLevel")
      VALUES (v_variant_id, v_warehouse_location_id, 20, 0, 10)
      ON CONFLICT DO NOTHING;
      
      RAISE NOTICE 'Created stock item for Warehouse location: %', v_warehouse_location_id;
    END IF;
  ELSE
    RAISE NOTICE 'No variants found. Please create products and variants first.';
  END IF;
END $$;

-- ============================================
-- 4. إصلاح RLS Policies (إذا لزم الأمر)
-- ============================================

-- حذف policies القديمة (إذا كانت موجودة)
DROP POLICY IF EXISTS "Allow service role to read stock_items" ON stock_items;
DROP POLICY IF EXISTS "Allow public read access to stock_items" ON stock_items;
DROP POLICY IF EXISTS "Allow service role to insert stock_items" ON stock_items;
DROP POLICY IF EXISTS "Allow service role to update stock_items" ON stock_items;
DROP POLICY IF EXISTS "Allow service role to delete stock_items" ON stock_items;

-- إنشاء policies جديدة للـ service_role
CREATE POLICY "Allow service role full access to stock_items"
ON stock_items
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- إذا كان RLS مفعلاً وترغب في السماح بالقراءة للعامة (للتطوير فقط)
-- CREATE POLICY "Allow public read access to stock_items"
-- ON stock_items
-- FOR SELECT
-- TO public
-- USING (true);

-- ============================================
-- 5. التحقق النهائي
-- ============================================

-- التحقق من البيانات بعد الإصلاح
SELECT 
  'Total stock items' as check_type,
  COUNT(*)::text as result
FROM stock_items
UNION ALL
SELECT 
  'Stock items with quantity > 0' as check_type,
  COUNT(*)::text as result
FROM stock_items
WHERE quantity > 0
UNION ALL
SELECT 
  'Locations with stock' as check_type,
  COUNT(DISTINCT "locationId")::text as result
FROM stock_items
WHERE quantity > 0;





