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
  -- استخدام EXECUTE لتجنب أخطاء compile-time
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_items') THEN
    EXECUTE 'TRUNCATE TABLE stock_items CASCADE';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_transfers') THEN
    EXECUTE 'TRUNCATE TABLE stock_transfers CASCADE';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    EXECUTE 'TRUNCATE TABLE order_items CASCADE';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    EXECUTE 'TRUNCATE TABLE orders CASCADE';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoice_items') THEN
    EXECUTE 'TRUNCATE TABLE invoice_items CASCADE';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
    EXECUTE 'TRUNCATE TABLE invoices CASCADE';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    EXECUTE 'TRUNCATE TABLE payments CASCADE';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_images') THEN
    EXECUTE 'TRUNCATE TABLE product_images CASCADE';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_variants') THEN
    EXECUTE 'TRUNCATE TABLE product_variants CASCADE';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    EXECUTE 'TRUNCATE TABLE products CASCADE';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
    EXECUTE 'TRUNCATE TABLE expenses CASCADE';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_addresses') THEN
    EXECUTE 'TRUNCATE TABLE user_addresses CASCADE';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    EXECUTE 'TRUNCATE TABLE users CASCADE';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_methods') THEN
    EXECUTE 'TRUNCATE TABLE payment_methods CASCADE';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_locations') THEN
    EXECUTE 'TRUNCATE TABLE stock_locations CASCADE';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    EXECUTE 'TRUNCATE TABLE categories CASCADE';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'colors') THEN
    EXECUTE 'TRUNCATE TABLE colors CASCADE';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sizes') THEN
    EXECUTE 'TRUNCATE TABLE sizes CASCADE';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'role_permissions') THEN
    EXECUTE 'TRUNCATE TABLE role_permissions CASCADE';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'permissions') THEN
    EXECUTE 'TRUNCATE TABLE permissions CASCADE';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roles') THEN
    EXECUTE 'TRUNCATE TABLE roles CASCADE';
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
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'permissions') THEN
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
  END IF;
END $$;

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
  -- التحقق من وجود جدول roles
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roles') THEN
    RETURN;
  END IF;
  
  -- إنشاء الأدوار باستخدام EXECUTE
  EXECUTE '
    INSERT INTO roles (id, name, description, "createdAt", "updatedAt")
    VALUES
      (gen_random_uuid(), ''admin'', ''Full system access'', NOW(), NOW()),
      (gen_random_uuid(), ''sales_employee'', ''POS access only'', NOW(), NOW()),
      (gen_random_uuid(), ''factory_manager'', ''Production management'', NOW(), NOW()),
      (gen_random_uuid(), ''storekeeper'', ''Inventory management'', NOW(), NOW()),
      (gen_random_uuid(), ''customer'', ''Customer access'', NOW(), NOW())
    ON CONFLICT DO NOTHING';

  -- الحصول على IDs للأدوار
  EXECUTE 'SELECT id FROM roles WHERE name = ''admin''' INTO v_admin_role_id;
  EXECUTE 'SELECT id FROM roles WHERE name = ''sales_employee''' INTO v_sales_role_id;
  EXECUTE 'SELECT id FROM roles WHERE name = ''factory_manager''' INTO v_factory_role_id;
  EXECUTE 'SELECT id FROM roles WHERE name = ''storekeeper''' INTO v_storekeeper_role_id;
  EXECUTE 'SELECT id FROM roles WHERE name = ''customer''' INTO v_customer_role_id;

  -- ربط الصلاحيات بالأدوار (فقط إذا كان جدول permissions موجود)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'permissions') 
     AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'role_permissions') THEN
    -- Admin: جميع الصلاحيات
    FOR v_perm_id IN EXECUTE 'SELECT id FROM permissions' LOOP
      EXECUTE format('INSERT INTO role_permissions ("roleId", "permissionId") VALUES (%L, %L) ON CONFLICT DO NOTHING', v_admin_role_id, v_perm_id);
    END LOOP;

    -- Sales Employee: sales و products.read
    FOR v_perm_id IN EXECUTE 'SELECT id FROM permissions WHERE name LIKE ''sales%%'' OR name = ''products.read''' LOOP
      EXECUTE format('INSERT INTO role_permissions ("roleId", "permissionId") VALUES (%L, %L) ON CONFLICT DO NOTHING', v_sales_role_id, v_perm_id);
    END LOOP;

    -- Factory Manager: production و inventory
    FOR v_perm_id IN EXECUTE 'SELECT id FROM permissions WHERE name LIKE ''production%%'' OR name LIKE ''inventory%%''' LOOP
      EXECUTE format('INSERT INTO role_permissions ("roleId", "permissionId") VALUES (%L, %L) ON CONFLICT DO NOTHING', v_factory_role_id, v_perm_id);
    END LOOP;

    -- Storekeeper: inventory و products.read
    FOR v_perm_id IN EXECUTE 'SELECT id FROM permissions WHERE name LIKE ''inventory%%'' OR name = ''products.read''' LOOP
      EXECUTE format('INSERT INTO role_permissions ("roleId", "permissionId") VALUES (%L, %L) ON CONFLICT DO NOTHING', v_storekeeper_role_id, v_perm_id);
    END LOOP;

    -- Customer: products.read فقط
    EXECUTE 'SELECT id FROM permissions WHERE name = ''products.read''' INTO v_perm_id;
    IF v_perm_id IS NOT NULL THEN
      EXECUTE format('INSERT INTO role_permissions ("roleId", "permissionId") VALUES (%L, %L) ON CONFLICT DO NOTHING', v_customer_role_id, v_perm_id);
    END IF;
  END IF;
END $$;

-- 2.3 Users (المستخدمين)
-- كلمة المرور: admin123 و pos123 (hashed with bcrypt)
-- Hashes تم توليدها مسبقاً باستخدام bcrypt
DO $$
DECLARE
  v_admin_role_id UUID;
  v_sales_role_id UUID;
BEGIN
  -- التحقق من وجود جدول users
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    RETURN;
  END IF;
  
  -- التحقق من وجود جدول roles
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roles') THEN
    RETURN;
  END IF;
  
  EXECUTE 'SELECT id FROM roles WHERE name = ''admin''' INTO v_admin_role_id;
  EXECUTE 'SELECT id FROM roles WHERE name = ''sales_employee''' INTO v_sales_role_id;

  -- كلمات المرور: admin123 و pos123
  -- Hashes تم توليدها باستخدام: bcrypt.hash('admin123', 10) و bcrypt.hash('pos123', 10)
  -- استخدام format مع تمرير bcrypt hashes كمعاملات لتجنب مشكلة $ في format
  EXECUTE format('
    INSERT INTO users (id, name, email, password, "roleId", "isActive", "employeeCode", "commissionRate", "createdAt", "updatedAt")
    VALUES
      (
        gen_random_uuid(), 
        ''Admin User'', 
        ''admin@qote.com'', 
        %L,
        %L, 
        true,
        NULL,
        NULL,
        NOW(), 
        NOW()
      ),
      (
        gen_random_uuid(), 
        ''POS Sales Employee'', 
        ''pos@qote.com'', 
        %L,
        %L, 
        true,
        ''POS001'',
        ''5.00'',
        NOW(), 
        NOW()
      )
    ON CONFLICT (email) DO UPDATE SET
      password = EXCLUDED.password,
      "roleId" = EXCLUDED."roleId",
      "isActive" = true', 
    '$2b$10$IGpMpJedxL2/ewHHYXXEV.qSpDj6b.Szp.rjhYInM7oPbXlpFFuPy', -- admin123
    v_admin_role_id,
    '$2b$10$0WaGdu9ieYIYCu3AsCZLQO3i1scYye2jaAXFRm91oDw/gEvzvCMKi', -- pos123
    v_sales_role_id);
END $$;

-- 2.4 Sizes (المقاسات)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sizes') THEN
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
  END IF;
END $$;

-- 2.5 Colors (الألوان)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'colors') THEN
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
  END IF;
END $$;

-- 2.6 Categories (الفئات)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    INSERT INTO categories (id, "nameAr", "nameEn", "sortOrder", "createdAt", "updatedAt")
    SELECT gen_random_uuid(), 'عبايات', 'Abayas', 1, NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE "nameEn" = 'Abayas')
    UNION ALL
    SELECT gen_random_uuid(), 'جاكيتات', 'Jackets', 2, NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE "nameEn" = 'Jackets')
    UNION ALL
    SELECT gen_random_uuid(), 'فساتين', 'Dresses', 3, NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE "nameEn" = 'Dresses');
  END IF;
END $$;

-- 2.7 Stock Locations (مواقع المخزون)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_locations') THEN
    INSERT INTO stock_locations (id, name, address, "isActive", "createdAt", "updatedAt")
    SELECT gen_random_uuid(), 'Store', 'Store Address', true, NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM stock_locations WHERE name = 'Store')
    UNION ALL
    SELECT gen_random_uuid(), 'Warehouse', 'Main Warehouse', true, NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM stock_locations WHERE name = 'Warehouse');
  END IF;
END $$;

-- 2.8 Payment Methods (طرق الدفع)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_methods') THEN
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
  END IF;
END $$;

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

DO $$
DECLARE
  v_result TEXT := '';
BEGIN
  -- التحقق من البيانات في الجداول الموجودة فقط
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roles') THEN
    EXECUTE 'SELECT COUNT(*) FROM roles' INTO v_result;
    RAISE NOTICE 'Roles: %', v_result;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    EXECUTE 'SELECT COUNT(*) FROM users' INTO v_result;
    RAISE NOTICE 'Users: %', v_result;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sizes') THEN
    EXECUTE 'SELECT COUNT(*) FROM sizes' INTO v_result;
    RAISE NOTICE 'Sizes: %', v_result;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'colors') THEN
    EXECUTE 'SELECT COUNT(*) FROM colors' INTO v_result;
    RAISE NOTICE 'Colors: %', v_result;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    EXECUTE 'SELECT COUNT(*) FROM categories' INTO v_result;
    RAISE NOTICE 'Categories: %', v_result;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_locations') THEN
    EXECUTE 'SELECT COUNT(*) FROM stock_locations' INTO v_result;
    RAISE NOTICE 'Stock Locations: %', v_result;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_methods') THEN
    EXECUTE 'SELECT COUNT(*) FROM payment_methods' INTO v_result;
    RAISE NOTICE 'Payment Methods: %', v_result;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'permissions') THEN
    EXECUTE 'SELECT COUNT(*) FROM permissions' INTO v_result;
    RAISE NOTICE 'Permissions: %', v_result;
  END IF;
END $$;

-- ============================================
-- ملاحظات مهمة:
-- ============================================
-- 1. كلمات المرور في Users هي placeholders
--    استخدم bcrypt لتوليد hash صحيح قبل الإنتاج
-- 2. بعد تشغيل هذا السكريبت، تأكد من تفعيل RLS policies
--    استخدم ملف enable_rls.sql
-- 3. يمكنك إنشاء منتجات ومتغيرات ومخزون من خلال واجهة Admin

