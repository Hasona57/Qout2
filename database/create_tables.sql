-- ============================================
-- Create Database Tables Script
-- ============================================
-- هذا الملف لإنشاء جميع الجداول في قاعدة البيانات
-- نفذ هذا الملف في Supabase SQL Editor قبل تشغيل reset_and_seed.sql
-- ⚠️ تحذير: هذا سينشئ الجداول من الصفر!

-- ============================================
-- Enable UUID extension
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Create Base Tables (without foreign keys)
-- ============================================

-- Permissions
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(100),
  action VARCHAR(50),
  description VARCHAR(200),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Roles
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(100),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Role Permissions (junction table)
CREATE TABLE IF NOT EXISTS public.role_permissions (
  "roleId" UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  "permissionId" UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY ("roleId", "permissionId")
);

-- Sizes
CREATE TABLE IF NOT EXISTS public.sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  "nameAr" VARCHAR(100) NOT NULL,
  "nameEn" VARCHAR(100) NOT NULL,
  "sortOrder" INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS sizes_code_unique ON public.sizes(code) WHERE code IS NOT NULL;

-- Colors
CREATE TABLE IF NOT EXISTS public.colors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  "nameAr" VARCHAR(100) NOT NULL,
  "nameEn" VARCHAR(100) NOT NULL,
  "hexCode" VARCHAR(7),
  "sortOrder" INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS colors_code_unique ON public.colors(code) WHERE code IS NOT NULL;

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "nameAr" VARCHAR(100) NOT NULL,
  "nameEn" VARCHAR(100) NOT NULL,
  "descriptionAr" TEXT,
  "descriptionEn" TEXT,
  "parentId" UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  "imageUrl" VARCHAR(200),
  "sortOrder" INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Stock Locations
CREATE TABLE IF NOT EXISTS public.stock_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  address VARCHAR(200),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Payment Methods
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  "nameAr" VARCHAR(100) NOT NULL,
  "nameEn" VARCHAR(100) NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "isAvailableOnPos" BOOLEAN DEFAULT true,
  "isAvailableOnline" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. Create User Tables
-- ============================================

-- Users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  password VARCHAR(255) NOT NULL,
  "roleId" UUID NOT NULL REFERENCES public.roles(id),
  "isActive" BOOLEAN DEFAULT true,
  "commissionRate" DECIMAL(10, 2) DEFAULT 0,
  "employeeCode" VARCHAR(50),
  salary DECIMAL(10, 2) DEFAULT 0,
  "jobTitle" VARCHAR(100),
  "employmentDate" DATE,
  "lastLoginAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON public.users(email);
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique ON public.users(phone) WHERE phone IS NOT NULL;

-- Addresses
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  "addressLine1" VARCHAR(200) NOT NULL,
  "addressLine2" VARCHAR(200),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  "postalCode" VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Egypt',
  "isDefault" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. Create Product Tables
-- ============================================

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "nameAr" VARCHAR(200) NOT NULL,
  "nameEn" VARCHAR(200) NOT NULL,
  "descriptionAr" TEXT,
  "descriptionEn" TEXT,
  sku VARCHAR(100) UNIQUE,
  "categoryId" UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  "costPrice" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "retailPrice" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "isFeatured" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique ON public.products(sku) WHERE sku IS NOT NULL;

-- Product Variants
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "productId" UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  "sizeId" UUID NOT NULL REFERENCES public.sizes(id),
  "colorId" UUID NOT NULL REFERENCES public.colors(id),
  sku VARCHAR(100) UNIQUE NOT NULL,
  weight DECIMAL(10, 2) NOT NULL DEFAULT 0.5,
  "costPrice" DECIMAL(10, 2),
  "retailPrice" DECIMAL(10, 2),
  barcode VARCHAR(50),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS product_variants_sku_unique ON public.product_variants(sku);

-- Product Images
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "productId" UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  "altTextAr" VARCHAR(200),
  "altTextEn" VARCHAR(200),
  "sortOrder" INTEGER DEFAULT 0,
  "isPrimary" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 4. Create Inventory Tables
-- ============================================

-- Stock Items
CREATE TABLE IF NOT EXISTS public.stock_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "variantId" UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  "locationId" UUID NOT NULL REFERENCES public.stock_locations(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
  "minStockLevel" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE ("variantId", "locationId")
);

CREATE UNIQUE INDEX IF NOT EXISTS stock_items_variant_location_unique ON public.stock_items("variantId", "locationId");

-- Stock Transfers
CREATE TABLE IF NOT EXISTS public.stock_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "fromLocationId" UUID NOT NULL REFERENCES public.stock_locations(id),
  "toLocationId" UUID NOT NULL REFERENCES public.stock_locations(id),
  "transferDate" TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending',
  "createdById" UUID REFERENCES public.users(id),
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Stock Transfer Items
CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "transferId" UUID NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
  "variantId" UUID NOT NULL REFERENCES public.product_variants(id),
  quantity INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Stock Adjustments
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "locationId" UUID NOT NULL REFERENCES public.stock_locations(id),
  "adjustmentDate" TIMESTAMP DEFAULT NOW(),
  reason VARCHAR(200),
  "createdById" UUID REFERENCES public.users(id),
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Stock Adjustment Items
CREATE TABLE IF NOT EXISTS public.stock_adjustment_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "adjustmentId" UUID NOT NULL REFERENCES public.stock_adjustments(id) ON DELETE CASCADE,
  "variantId" UUID NOT NULL REFERENCES public.product_variants(id),
  "previousQuantity" INTEGER NOT NULL,
  "newQuantity" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 5. Create Sales Tables
-- ============================================

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "invoiceNumber" VARCHAR(50) UNIQUE NOT NULL,
  "customerId" UUID REFERENCES public.users(id) ON DELETE SET NULL,
  "createdById" UUID NOT NULL REFERENCES public.users(id),
  status VARCHAR(50) DEFAULT 'draft',
  "saleType" VARCHAR(20) DEFAULT 'retail',
  subtotal DECIMAL(10, 2) DEFAULT 0,
  "discountAmount" DECIMAL(10, 2) DEFAULT 0,
  "taxAmount" DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) DEFAULT 0,
  "paidAmount" DECIMAL(10, 2) DEFAULT 0,
  "commissionAmount" DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  "locationId" UUID REFERENCES public.stock_locations(id),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS invoices_invoice_number_unique ON public.invoices("invoiceNumber");

-- Invoice Items
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "invoiceId" UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  "variantId" UUID NOT NULL REFERENCES public.product_variants(id),
  quantity INTEGER NOT NULL,
  "unitPrice" DECIMAL(10, 2) NOT NULL,
  "discountAmount" DECIMAL(10, 2) DEFAULT 0,
  subtotal DECIMAL(10, 2) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "invoiceId" UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  "paymentMethodId" UUID REFERENCES public.payment_methods(id),
  amount DECIMAL(10, 2) NOT NULL,
  "paymentDate" TIMESTAMP DEFAULT NOW(),
  "transactionId" VARCHAR(100),
  status VARCHAR(50) DEFAULT 'completed',
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Returns
CREATE TABLE IF NOT EXISTS public.returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "invoiceId" UUID NOT NULL REFERENCES public.invoices(id),
  "returnNumber" VARCHAR(50) UNIQUE NOT NULL,
  reason VARCHAR(200),
  status VARCHAR(50) DEFAULT 'pending',
  "refundAmount" DECIMAL(10, 2) DEFAULT 0,
  "createdById" UUID REFERENCES public.users(id),
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS returns_return_number_unique ON public.returns("returnNumber");

-- Return Items
CREATE TABLE IF NOT EXISTS public.return_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "returnId" UUID NOT NULL REFERENCES public.returns(id) ON DELETE CASCADE,
  "invoiceItemId" UUID NOT NULL REFERENCES public.invoice_items(id),
  quantity INTEGER NOT NULL,
  "refundAmount" DECIMAL(10, 2) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Commission Records
CREATE TABLE IF NOT EXISTS public.commission_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES public.users(id),
  "invoiceId" UUID NOT NULL REFERENCES public.invoices(id),
  "commissionRate" DECIMAL(10, 2) NOT NULL,
  "commissionAmount" DECIMAL(10, 2) NOT NULL,
  "paymentStatus" VARCHAR(50) DEFAULT 'pending',
  "paidAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 6. Create E-commerce Tables
-- ============================================

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderNumber" VARCHAR(50) UNIQUE NOT NULL,
  "userId" UUID NOT NULL REFERENCES public.users(id),
  "deliveryAddressId" UUID NOT NULL REFERENCES public.addresses(id),
  "orderType" VARCHAR(20) DEFAULT 'retail',
  status VARCHAR(50) DEFAULT 'pending',
  subtotal DECIMAL(10, 2) DEFAULT 0,
  "shippingFee" DECIMAL(10, 2) DEFAULT 0,
  "discountAmount" DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) DEFAULT 0,
  "paymentStatus" VARCHAR(50) DEFAULT 'pending',
  "paymentMethod" VARCHAR(50) NOT NULL,
  "paymentTransactionId" VARCHAR(100),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_unique ON public.orders("orderNumber");

-- Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderId" UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  "variantId" UUID NOT NULL REFERENCES public.product_variants(id),
  quantity INTEGER NOT NULL,
  "unitPrice" DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Carts
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE ("userId")
);

CREATE UNIQUE INDEX IF NOT EXISTS carts_user_unique ON public.carts("userId");

-- Cart Items
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "cartId" UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  "variantId" UUID NOT NULL REFERENCES public.product_variants(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE ("cartId", "variantId")
);

CREATE UNIQUE INDEX IF NOT EXISTS cart_items_cart_variant_unique ON public.cart_items("cartId", "variantId");

-- ============================================
-- 7. Create Shipping Tables
-- ============================================

-- Delivery Zones
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Shipping Rates
CREATE TABLE IF NOT EXISTS public.shipping_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "zoneId" UUID NOT NULL REFERENCES public.delivery_zones(id),
  "minWeight" DECIMAL(10, 2) DEFAULT 0,
  "maxWeight" DECIMAL(10, 2),
  rate DECIMAL(10, 2) NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Courier Companies
CREATE TABLE IF NOT EXISTS public.courier_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  "contactPhone" VARCHAR(20),
  "contactEmail" VARCHAR(100),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Shipments
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderId" UUID NOT NULL REFERENCES public.orders(id),
  "courierCompanyId" UUID REFERENCES public.courier_companies(id),
  "trackingNumber" VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  "shippedAt" TIMESTAMP,
  "deliveredAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 8. Create Other Tables
-- ============================================

-- Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  "expenseDate" DATE NOT NULL,
  "createdById" UUID REFERENCES public.users(id),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Attachments
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "entityType" VARCHAR(50) NOT NULL,
  "entityId" UUID NOT NULL,
  url VARCHAR(500) NOT NULL,
  "fileName" VARCHAR(200),
  "fileSize" INTEGER,
  "mimeType" VARCHAR(100),
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID REFERENCES public.users(id),
  "entityType" VARCHAR(100) NOT NULL,
  "entityId" UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  "oldValues" JSONB,
  "newValues" JSONB,
  "ipAddress" VARCHAR(200),
  "userAgent" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON public.audit_logs("entityType", "entityId");
CREATE INDEX IF NOT EXISTS audit_logs_user_idx ON public.audit_logs("userId");
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs("createdAt");

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  "isRead" BOOLEAN DEFAULT false,
  "readAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications("userId");
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications("isRead");

-- ============================================
-- 9. Create Indexes for Performance
-- ============================================

-- Product indexes
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products("categoryId");
CREATE INDEX IF NOT EXISTS products_is_active_idx ON public.products("isActive");

-- Product variant indexes
CREATE INDEX IF NOT EXISTS product_variants_product_idx ON public.product_variants("productId");
CREATE INDEX IF NOT EXISTS product_variants_size_idx ON public.product_variants("sizeId");
CREATE INDEX IF NOT EXISTS product_variants_color_idx ON public.product_variants("colorId");

-- Stock item indexes
CREATE INDEX IF NOT EXISTS stock_items_variant_idx ON public.stock_items("variantId");
CREATE INDEX IF NOT EXISTS stock_items_location_idx ON public.stock_items("locationId");

-- Invoice indexes
CREATE INDEX IF NOT EXISTS invoices_customer_idx ON public.invoices("customerId");
CREATE INDEX IF NOT EXISTS invoices_created_by_idx ON public.invoices("createdById");
CREATE INDEX IF NOT EXISTS invoices_status_idx ON public.invoices(status);

-- Order indexes
CREATE INDEX IF NOT EXISTS orders_user_idx ON public.orders("userId");
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);

-- ============================================
-- 10. Verification
-- ============================================

DO $$
DECLARE
  v_table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'roles', 'permissions', 'role_permissions',
      'users', 'addresses',
      'sizes', 'colors', 'categories',
      'products', 'product_variants', 'product_images',
      'stock_locations', 'stock_items',
      'payment_methods',
      'invoices', 'invoice_items', 'payments',
      'orders', 'order_items',
      'carts', 'cart_items'
    );
  
  RAISE NOTICE 'Total tables created: %', v_table_count;
END $$;

