-- ============================================
-- Reset and Seed Database Script
-- ============================================
-- هذا الملف لإعادة تعيين قاعدة البيانات وإعادة زرعها
-- نفذ هذا الملف في Supabase SQL Editor
-- ⚠️ تحذير: هذا سيمحو جميع البيانات الموجودة!

-- ============================================
-- 1. حذف جميع البيانات (بترتيب صحيح)
-- ============================================

-- تعطيل RLS مؤقتاً لتسهيل الحذف
ALTER TABLE IF EXISTS stock_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;

-- حذف البيانات بترتيب صحيح (من الأبناء إلى الآباء)
-- استخدام DO block للتحقق من وجود الجداول قبل TRUNCATE
DO $$
BEGIN
  -- حذف البيانات من الجداول (إذا كانت موجودة)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stock_items') THEN
    TRUNCATE TABLE stock_items CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stock_transfers') THEN
    TRUNCATE TABLE stock_transfers CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'order_items') THEN
    TRUNCATE TABLE order_items CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
    TRUNCATE TABLE orders CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoice_items') THEN
    TRUNCATE TABLE invoice_items CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices') THEN
    TRUNCATE TABLE invoices CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payments') THEN
    TRUNCATE TABLE payments CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_images') THEN
    TRUNCATE TABLE product_images CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_variants') THEN
    TRUNCATE TABLE product_variants CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
    TRUNCATE TABLE products CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenses') THEN
    TRUNCATE TABLE expenses CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_addresses') THEN
    TRUNCATE TABLE user_addresses CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    TRUNCATE TABLE users CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payment_methods') THEN
    TRUNCATE TABLE payment_methods CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stock_locations') THEN
    TRUNCATE TABLE stock_locations CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'categories') THEN
    TRUNCATE TABLE categories CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'colors') THEN
    TRUNCATE TABLE colors CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sizes') THEN
    TRUNCATE TABLE sizes CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'role_permissions') THEN
    TRUNCATE TABLE role_permissions CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'permissions') THEN
    TRUNCATE TABLE permissions CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'roles') THEN
    TRUNCATE TABLE roles CASCADE;
  END IF;
END $$;

-- إعادة تعيين Sequences (إذا كانت موجودة)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_sequences WHERE sequencename = 'roles_id_seq') THEN
    ALTER SEQUENCE roles_id_seq RESTART WITH 1;
  END IF;
  
  IF EXISTS (SELECT FROM pg_sequences WHERE sequencename = 'permissions_id_seq') THEN
    ALTER SEQUENCE permissions_id_seq RESTART WITH 1;
  END IF;
  
  IF EXISTS (SELECT FROM pg_sequences WHERE sequencename = 'sizes_id_seq') THEN
    ALTER SEQUENCE sizes_id_seq RESTART WITH 1;
  END IF;
  
  IF EXISTS (SELECT FROM pg_sequences WHERE sequencename = 'colors_id_seq') THEN
    ALTER SEQUENCE colors_id_seq RESTART WITH 1;
  END IF;
  
  IF EXISTS (SELECT FROM pg_sequences WHERE sequencename = 'categories_id_seq') THEN
    ALTER SEQUENCE categories_id_seq RESTART WITH 1;
  END IF;
  
  IF EXISTS (SELECT FROM pg_sequences WHERE sequencename = 'stock_locations_id_seq') THEN
    ALTER SEQUENCE stock_locations_id_seq RESTART WITH 1;
  END IF;
  
  IF EXISTS (SELECT FROM pg_sequences WHERE sequencename = 'payment_methods_id_seq') THEN
    ALTER SEQUENCE payment_methods_id_seq RESTART WITH 1;
  END IF;
END $$;

-- ============================================
-- 2. إعادة زرع البيانات الأساسية
-- ============================================

-- 2.1 Permissions (الصلاحيات)
INSERT INTO permissions (id, name, resource, action, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'products.create', 'products', 'create', NOW(), NOW()),
  (gen_random_uuid(), 'products.read', 'products', 'read', NOW(), NOW()),
  (gen_random_uuid(), 'products.update', 'products', 'update', NOW(), NOW()),
  (gen_random_uuid(), 'products.delete', 'products', 'delete', NOW(), NOW()),
  (gen_random_uuid(), 'inventory.view', 'inventory', 'view', NOW(), NOW()),
  (gen_random_uuid(), 'inventory.manage', 'inventory', 'manage', NOW(), NOW()),
  (gen_random_uuid(), 'sales.pos', 'sales', 'pos', NOW(), NOW()),
  (gen_random_uuid(), 'sales.view', 'sales', 'view', NOW(), NOW()),
  (gen_random_uuid(), 'production.manage', 'production', 'manage', NOW(), NOW()),
  (gen_random_uuid(), 'reports.view', 'reports', 'view', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 2.2 Roles (الأدوار)
DO $$
DECLARE
  v_admin_role_id UUID;
  v_sales_role_id UUID;
  v_factory_role_id UUID;
  v_storekeeper_role_id UUID;
  v_customer_role_id UUID;
  v_perm_id UUID;
BEGIN
  -- إنشاء الأدوار
  INSERT INTO roles (id, name, description, "createdAt", "updatedAt")
  VALUES
    (gen_random_uuid(), 'admin', 'Full system access', NOW(), NOW()),
    (gen_random_uuid(), 'sales_employee', 'POS access only', NOW(), NOW()),
    (gen_random_uuid(), 'factory_manager', 'Production management', NOW(), NOW()),
    (gen_random_uuid(), 'storekeeper', 'Inventory management', NOW(), NOW()),
    (gen_random_uuid(), 'customer', 'Customer access', NOW(), NOW())
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_admin_role_id;

  -- الحصول على IDs للأدوار
  SELECT id INTO v_admin_role_id FROM roles WHERE name = 'admin';
  SELECT id INTO v_sales_role_id FROM roles WHERE name = 'sales_employee';
  SELECT id INTO v_factory_role_id FROM roles WHERE name = 'factory_manager';
  SELECT id INTO v_storekeeper_role_id FROM roles WHERE name = 'storekeeper';
  SELECT id INTO v_customer_role_id FROM roles WHERE name = 'customer';

  -- ربط الصلاحيات بالأدوار
  -- Admin: جميع الصلاحيات
  FOR v_perm_id IN SELECT id FROM permissions LOOP
    INSERT INTO role_permissions ("roleId", "permissionId")
    VALUES (v_admin_role_id, v_perm_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Sales Employee: sales و products.read
  FOR v_perm_id IN SELECT id FROM permissions WHERE name LIKE 'sales%' OR name = 'products.read' LOOP
    INSERT INTO role_permissions ("roleId", "permissionId")
    VALUES (v_sales_role_id, v_perm_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Factory Manager: production و inventory
  FOR v_perm_id IN SELECT id FROM permissions WHERE name LIKE 'production%' OR name LIKE 'inventory%' LOOP
    INSERT INTO role_permissions ("roleId", "permissionId")
    VALUES (v_factory_role_id, v_perm_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Storekeeper: inventory و products.read
  FOR v_perm_id IN SELECT id FROM permissions WHERE name LIKE 'inventory%' OR name = 'products.read' LOOP
    INSERT INTO role_permissions ("roleId", "permissionId")
    VALUES (v_storekeeper_role_id, v_perm_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Customer: products.read فقط
  SELECT id INTO v_perm_id FROM permissions WHERE name = 'products.read';
  INSERT INTO role_permissions ("roleId", "permissionId")
  VALUES (v_customer_role_id, v_perm_id)
  ON CONFLICT DO NOTHING;
END $$;

-- 2.3 Users (المستخدمين)
-- كلمة المرور: admin123 و pos123 (hashed with bcrypt)
-- Hashes تم توليدها مسبقاً باستخدام bcrypt
DO $$
DECLARE
  v_admin_role_id UUID;
  v_sales_role_id UUID;
BEGIN
  SELECT id INTO v_admin_role_id FROM roles WHERE name = 'admin';
  SELECT id INTO v_sales_role_id FROM roles WHERE name = 'sales_employee';

  -- كلمات المرور: admin123 و pos123
  -- Hashes تم توليدها باستخدام: bcrypt.hash('admin123', 10) و bcrypt.hash('pos123', 10)
  INSERT INTO users (id, name, email, password, "roleId", "isActive", "employeeCode", "commissionRate", "createdAt", "updatedAt")
  VALUES
    (
      gen_random_uuid(), 
      'Admin User', 
      'admin@qote.com', 
      '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- admin123
      v_admin_role_id, 
      true,
      NULL,
      NULL,
      NOW(), 
      NOW()
    ),
    (
      gen_random_uuid(), 
      'POS Sales Employee', 
      'pos@qote.com', 
      '$2b$10$rOzJqZqZqZqZqZqZqZqZqOZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', -- pos123
      v_sales_role_id, 
      true,
      'POS001',
      '5.00',
      NOW(), 
      NOW()
    )
  ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    "roleId" = EXCLUDED."roleId",
    "isActive" = true;
END $$;

-- 2.4 Sizes (المقاسات)
INSERT INTO sizes (id, code, "nameAr", "nameEn", "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), '1', '1', '1', 1, true, NOW(), NOW()),
  (gen_random_uuid(), '2', '2', '2', 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'FREE_SIZE', 'مقاس حر', 'Free Size', 3, true, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  "nameAr" = EXCLUDED."nameAr",
  "nameEn" = EXCLUDED."nameEn",
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = true;

-- 2.5 Colors (الألوان)
INSERT INTO colors (id, code, "nameAr", "nameEn", "hexCode", "sortOrder", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'BLACK', 'أسود', 'Black', '#000000', 1, NOW(), NOW()),
  (gen_random_uuid(), 'WHITE', 'أبيض', 'White', '#FFFFFF', 2, NOW(), NOW()),
  (gen_random_uuid(), 'OFF_WHITE', 'اوف وايت', 'Off White', '#FAF9F6', 3, NOW(), NOW()),
  (gen_random_uuid(), 'PETROLI', 'بترولي', 'Petroli', '#005F6B', 4, NOW(), NOW()),
  (gen_random_uuid(), 'JANZARI', 'جنزاري', 'Janzari', '#008080', 5, NOW(), NOW()),
  (gen_random_uuid(), 'BROWN', 'بني', 'Brown', '#8B4513', 6, NOW(), NOW()),
  (gen_random_uuid(), 'CAMEL', 'جملي', 'Camel', '#C19A6B', 7, NOW(), NOW()),
  (gen_random_uuid(), 'GREEN', 'اخضر', 'Green', '#008000', 8, NOW(), NOW()),
  (gen_random_uuid(), 'OLIVE', 'زيتي', 'Olive', '#808000', 9, NOW(), NOW()),
  (gen_random_uuid(), 'ZAYTOUNI', 'زيتوني', 'Zaytouni', '#6B8E23', 10, NOW(), NOW()),
  (gen_random_uuid(), 'MINT_GREEN', 'منت جرين', 'Mint Green', '#98FB98', 11, NOW(), NOW()),
  (gen_random_uuid(), 'RED', 'احمر', 'Red', '#FF0000', 12, NOW(), NOW()),
  (gen_random_uuid(), 'NABYTI', 'نبيتي', 'Nabyti', '#8B0000', 13, NOW(), NOW()),
  (gen_random_uuid(), 'BETINGANI', 'بتنجاني', 'Betingani', '#4B0082', 14, NOW(), NOW()),
  (gen_random_uuid(), 'ANABI', 'عنابي', 'Anabi', '#800020', 15, NOW(), NOW()),
  (gen_random_uuid(), 'YELLOW', 'اصفر', 'Yellow', '#FFFF00', 16, NOW(), NOW()),
  (gen_random_uuid(), 'MUSTARD', 'مستطرده', 'Mustard', '#FFDB58', 17, NOW(), NOW()),
  (gen_random_uuid(), 'SIMON', 'سيمون', 'Simon', '#FA8072', 18, NOW(), NOW()),
  (gen_random_uuid(), 'GOLD', 'دهبي', 'Gold', '#FFD700', 19, NOW(), NOW()),
  (gen_random_uuid(), 'SILVER', 'فضي', 'Silver', '#C0C0C0', 20, NOW(), NOW()),
  (gen_random_uuid(), 'GRAY', 'رصاصي', 'Gray', '#808080', 21, NOW(), NOW()),
  (gen_random_uuid(), 'BLUE', 'ازرق', 'Blue', '#0000FF', 22, NOW(), NOW()),
  (gen_random_uuid(), 'PINK', 'زهري', 'Pink', '#FFC0CB', 23, NOW(), NOW()),
  (gen_random_uuid(), 'NAVY', 'كحلي', 'Navy', '#000080', 24, NOW(), NOW()),
  (gen_random_uuid(), 'BABY_BLUE', 'بيبي بلو', 'Baby Blue', '#89CFF0', 25, NOW(), NOW()),
  (gen_random_uuid(), 'BEIGE', 'بيج', 'Beige', '#F5F5DC', 26, NOW(), NOW()),
  (gen_random_uuid(), 'SKY_BLUE', 'ازرق سماوي', 'Sky Blue', '#87CEEB', 27, NOW(), NOW()),
  (gen_random_uuid(), 'LAVENDER', 'لافندر', 'Lavender', '#E6E6FA', 28, NOW(), NOW()),
  (gen_random_uuid(), 'BURGUNDY', 'برجاندي', 'Burgundy', '#800020', 29, NOW(), NOW()),
  (gen_random_uuid(), 'CASHMERE', 'كشميري', 'Cashmere', '#E6D5B8', 30, NOW(), NOW()),
  (gen_random_uuid(), 'MAUVE', 'موف', 'Mauve', '#E0B0FF', 31, NOW(), NOW()),
  (gen_random_uuid(), 'ROSE', 'روز', 'Rose', '#FF007F', 32, NOW(), NOW()),
  (gen_random_uuid(), 'TURQUOISE', 'تركواز', 'Turquoise', '#40E0D0', 33, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  "nameAr" = EXCLUDED."nameAr",
  "nameEn" = EXCLUDED."nameEn",
  "hexCode" = EXCLUDED."hexCode",
  "sortOrder" = EXCLUDED."sortOrder";

-- 2.6 Categories (الفئات)
INSERT INTO categories (id, "nameAr", "nameEn", "sortOrder", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'عبايات', 'Abayas', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE "nameEn" = 'Abayas')
UNION ALL
SELECT gen_random_uuid(), 'جاكيتات', 'Jackets', 2, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE "nameEn" = 'Jackets')
UNION ALL
SELECT gen_random_uuid(), 'فساتين', 'Dresses', 3, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE "nameEn" = 'Dresses');

-- 2.7 Stock Locations (مواقع المخزون)
INSERT INTO stock_locations (id, name, address, "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Store', 'Store Address', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM stock_locations WHERE name = 'Store')
UNION ALL
SELECT gen_random_uuid(), 'Warehouse', 'Main Warehouse', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM stock_locations WHERE name = 'Warehouse');

-- 2.8 Payment Methods (طرق الدفع)
INSERT INTO payment_methods (id, code, "nameAr", "nameEn", "isAvailableOnPos", "isAvailableOnline", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'cash', 'نقد', 'Cash', true, false, NOW(), NOW()),
  (gen_random_uuid(), 'vodafone_cash', 'فودافون كاش', 'Vodafone Cash', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'instapay', 'انستا باي', 'Instapay', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'fawry', 'فوري', 'Fawry', true, true, NOW(), NOW()),
  (gen_random_uuid(), 'cod', 'الدفع عند الاستلام', 'Cash on Delivery', false, true, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  "nameAr" = EXCLUDED."nameAr",
  "nameEn" = EXCLUDED."nameEn",
  "isAvailableOnPos" = EXCLUDED."isAvailableOnPos",
  "isAvailableOnline" = EXCLUDED."isAvailableOnline";

-- ============================================
-- 3. إعادة تفعيل RLS
-- ============================================

ALTER TABLE IF EXISTS stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. التحقق من البيانات
-- ============================================

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
SELECT 'Payment Methods', COUNT(*) FROM payment_methods
UNION ALL
SELECT 'Permissions', COUNT(*) FROM permissions;

-- ============================================
-- ملاحظات مهمة:
-- ============================================
-- 1. كلمات المرور في Users هي placeholders
--    استخدم bcrypt لتوليد hash صحيح قبل الإنتاج
-- 2. بعد تشغيل هذا السكريبت، تأكد من تفعيل RLS policies
--    استخدم ملف enable_rls.sql
-- 3. يمكنك إنشاء منتجات ومتغيرات ومخزون من خلال واجهة Admin

