# 🌱 Supabase Database Seeding

دليل إعداد قاعدة البيانات على Supabase.

## 📦 معلومات الاتصال

- **Host**: `db.qlpkhofninwegrzyqgmp.supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **Username**: `postgres`
- **Password**: `Hassanebad.90`
- **SSL**: Required

## 🔧 الطريقة السريعة: استخدام Supabase Dashboard

### 1. الاتصال بقاعدة البيانات

1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك: `qlpkhofninwegrzyqgmp`
3. SQL Editor → New Query

### 2. تشغيل SQL Scripts

قم بتشغيل SQL scripts من مجلد `backend/src/database/seeds/` بالترتيب.

## 🔧 الطريقة المتقدمة: استخدام Node.js

### 1. إعداد Environment Variables

أنشئ ملف `.env` في مجلد `backend`:

```env
DB_HOST=db.qlpkhofninwegrzyqgmp.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=Hassanebad.90
DB_DATABASE=postgres
DB_SSL=true
NODE_ENV=production
```

### 2. تثبيت Dependencies

```bash
cd backend
npm install
```

### 3. تشغيل Seeding

```bash
npm run seed:run
```

أو مباشرة:

```bash
npx ts-node src/database/seeds/run-seeds.ts
```

## 📋 ترتيب Seeding

1. **Roles** - الأدوار (admin, customer, etc.)
2. **Users** - المستخدمين
3. **Sizes** - المقاسات (1, 2, FREE_SIZE)
4. **Colors** - الألوان (33 لون)
5. **Categories** - الفئات
6. **Stock Locations** - مواقع المخزون
7. **Payment Methods** - طرق الدفع

## ✅ التحقق

بعد Seeding، تحقق من البيانات:

1. Supabase Dashboard → Table Editor
2. تحقق من كل جدول
3. تأكد من وجود البيانات

## 🆘 حل المشاكل

### Connection Error
```
Error: connect ECONNREFUSED
```
**الحل**: تأكد من:
- Host: `db.qlpkhofninwegrzyqgmp.supabase.co`
- Password: `Hassanebad.90`
- SSL: `true`

### SSL Error
```
Error: self signed certificate
```
**الحل**: تأكد من `ssl: { rejectUnauthorized: false }` في data-source.ts

### Foreign Key Violations
```
Error: update or delete on table violates foreign key constraint
```
**الحل**: تأكد من تشغيل Seeds بالترتيب الصحيح












