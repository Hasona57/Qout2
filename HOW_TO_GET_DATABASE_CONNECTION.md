# 🔗 كيفية الحصول على Database Connection String من Supabase

## 📍 الخطوات التفصيلية

### الخطوة 1: اذهب إلى Database Settings

1. في Supabase Dashboard، من القائمة الجانبية اليسرى
2. اضغط على **Settings** (الإعدادات) - أيقونة الترس ⚙️
3. من القائمة الفرعية، اضغط على **Database** (وليس API)

### الخطوة 2: ابحث عن Connection String

في صفحة Database Settings، ستجد قسم **Connection String** أو **Connection Pooling**

#### خيار 1: Connection Pooling (موصى به)

1. ابحث عن **Connection Pooling**
2. ستجد خيارات:
   - **Session mode** ← اختر هذا
   - **Transaction mode**
3. انسخ Connection String (سيبدو مثل):
   ```
   postgresql://postgres.qlpkhofninwegrzyqgmp:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

#### خيار 2: Direct Connection

1. ابحث عن **Connection String** (بدون Pooling)
2. اختر **URI** أو **Node.js**
3. انسخ Connection String
4. سيبدو مثل:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.qlpkhofninwegrzyqgmp.supabase.co:5432/postgres
   ```

### الخطوة 3: استبدال كلمة المرور

في Connection String، استبدل `[YOUR-PASSWORD]` بـ `Hassanebad.90`

**مثال:**
```
postgresql://postgres.qlpkhofninwegrzyqgmp:Hassanebad.90@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### الخطوة 4: استخدام Connection String في ملف .env

1. افتح ملف `backend/.env` (أو أنشئه إذا لم يكن موجوداً)
2. اكتب:

```env
DATABASE_URL=postgresql://postgres.qlpkhofninwegrzyqgmp:Hassanebad.90@aws-0-us-east-1.pooler.supabase.com:6543/postgres
NODE_ENV=production
```

**ملاحظة مهمة**: 
- استبدل `aws-0-us-east-1.pooler.supabase.com` و `6543` بالقيم الصحيحة من Supabase Dashboard
- قد يكون الـ hostname مختلف حسب منطقتك

---

## 🔍 إذا لم تجد Connection String

### بديل: استخدام Connection Info

إذا لم تجد Connection String مباشرة:

1. في صفحة Database Settings
2. ابحث عن **Connection Info** أو **Database URL**
3. ستجد معلومات مثل:
   - **Host**: `db.qlpkhofninwegrzyqgmp.supabase.co`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: (ستحتاج إلى إدخالها)

4. استخدم هذه المعلومات في ملف `.env`:

```env
DB_HOST=db.qlpkhofninwegrzyqgmp.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=Hassanebad.90
DB_DATABASE=postgres
DB_SSL=true
NODE_ENV=production
```

---

## ✅ بعد الحصول على Connection String

1. احفظ ملف `.env` في مجلد `backend`
2. شغل Seeding:
   ```bash
   cd backend
   npm run seed:run
   ```

---

## 🆘 إذا استمرت المشكلة

### استخدم Supabase SQL Editor مباشرة

1. في Supabase Dashboard، اضغط على **SQL Editor** من القائمة الجانبية
2. اضغط على **New Query**
3. انسخ محتوى ملفات Seed من `backend/src/database/seeds/`
4. شغلها مباشرة في SQL Editor

---

## 📝 ملاحظات

- **Connection Pooling** أفضل للاستخدام في Production
- **Direct Connection** أسهل للاختبار
- تأكد من استبدال `[YOUR-PASSWORD]` بكلمة المرور الصحيحة: `Hassanebad.90`
- لا تشارك Connection String أبداً - إنه سري!












