# Qote Abaya - ERP + E-commerce + POS System

نظام متكامل لإدارة المتجر الإلكتروني ونقاط البيع.

## 🚀 النشر على Vercel

تم دمج Backend مع Frontend. كل شيء يعمل على Vercel فقط!

راجع [VERCEL_COMPLETE_SETUP.md](./VERCEL_COMPLETE_SETUP.md) للدليل الكامل.

## 📦 معلومات Supabase

- **Project ID**: `qlpkhofninwegrzyqgmp`
- **URL**: `https://qlpkhofninwegrzyqgmp.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscGtob2ZuaW53ZWdyenlxZ21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxODAxNjksImV4cCI6MjA4NDc1NjE2OX0.2gNmrwRURVB0a6N2sKhNUmzd0QJfCUQgij7cwja8A9Q`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscGtob2ZuaW53ZWdyenlxZ21wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE4MDE2OSwiZXhwIjoyMDg0NzU2MTY5fQ.bF022Px5expD9sSLZUzclhbH5FdKiOSUSNJLbMUyl3k`
- **Password**: `Hassanebad.90`
- **JWT Secret**: `3a5d32aa8a5547c0caef762bf802e559f7a16997d4ad40ee147584be79506684`

## 🔧 الإعداد المحلي

### 1. تثبيت Dependencies

```bash
# Store
cd frontend/store
npm install

# Admin
cd ../admin
npm install

# POS
cd ../pos
npm install
```

### 2. إعداد Environment Variables

أنشئ ملف `.env.local` في كل frontend:

```env
NEXT_PUBLIC_SUPABASE_URL=https://qlpkhofninwegrzyqgmp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscGtob2ZuaW53ZWdyenlxZ21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxODAxNjksImV4cCI6MjA4NDc1NjE2OX0.2gNmrwRURVB0a6N2sKhNUmzd0QJfCUQgij7cwja8A9Q
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscGtob2ZuaW53ZWdyenlxZ21wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE4MDE2OSwiZXhwIjoyMDg0NzU2MTY5fQ.bF022Px5expD9sSLZUzclhbH5FdKiOSUSNJLbMUyl3k
JWT_SECRET=3a5d32aa8a5547c0caef762bf802e559f7a16997d4ad40ee147584be79506684
```

### 3. تشغيل المشروع

```bash
# Store
cd frontend/store
npm run dev

# Admin
cd frontend/admin
npm run dev

# POS
cd frontend/pos
npm run dev
```

## 🌱 Database Seeding

لإعداد قاعدة البيانات الأولية، راجع [DATABASE_SEEDING.md](./DATABASE_SEEDING.md).

## 📚 الملفات المهمة

- `VERCEL_COMPLETE_SETUP.md` - دليل النشر الكامل
- `DATABASE_SEEDING.md` - دليل إعداد قاعدة البيانات
- `frontend/*/lib/supabase.ts` - Supabase client
- `frontend/*/app/api/**/route.ts` - API Routes

## ✅ المميزات

- ✅ كل شيء على Vercel فقط
- ✅ لا يحتاج Backend منفصل
- ✅ مجاني تماماً
- ✅ سريع جداً (Serverless)
- ✅ يتوسع تلقائياً
