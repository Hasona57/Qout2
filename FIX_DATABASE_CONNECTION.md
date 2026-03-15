# 🔧 حل مشكلة الاتصال بقاعدة البيانات

## ❌ المشكلة

```
Error: getaddrinfo ENOTFOUND db.qlpkhofninwegrzyqgmp.supabase.co
```

هذا يعني أن النظام لا يستطيع العثور على الـ hostname.

---

## ✅ الحل: الحصول على Connection String من Supabase

### الخطوة 1: الحصول على Connection String

1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك: `qlpkhofninwegrzyqgmp`
3. اذهب إلى **Settings** (في القائمة الجانبية)
4. اضغط على **Database**
5. ابحث عن **Connection String** أو **Connection Pooling**
6. اختر **Connection Pooling** → **Session mode**
7. ستجد connection string مثل:
   ```
   postgresql://postgres.qlpkhofninwegrzyqgmp:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
   أو:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.qlpkhofninwegrzyqgmp.supabase.co:5432/postgres
   ```

### الخطوة 2: استبدال كلمة المرور

في Connection String، استبدل `[YOUR-PASSWORD]` بـ `Hassanebad.90`

مثال:
```
postgresql://postgres:Hassanebad.90@db.qlpkhofninwegrzyqgmp.supabase.co:5432/postgres
```

### الخطوة 3: استخراج المعلومات

من Connection String، استخرج:
- **Host**: الجزء بعد `@` وقبل `:`
- **Port**: الرقم بعد `:` (عادة `5432` أو `6543`)
- **Database**: عادة `postgres`
- **Username**: عادة `postgres`
- **Password**: `Hassanebad.90`

---

## 🔧 الحل البديل: استخدام Connection Pooling

إذا كان الـ hostname العادي لا يعمل، استخدم **Connection Pooling**:

### 1. في Supabase Dashboard:
- Settings → Database → Connection Pooling
- انسخ **Connection String** من **Session mode**

### 2. في ملف `.env`:

استخدم Connection String مباشرة:

```env
DATABASE_URL=postgresql://postgres.qlpkhofninwegrzyqgmp:Hassanebad.90@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

أو استخدم المتغيرات المنفصلة:

```env
DB_HOST=aws-0-us-east-1.pooler.supabase.com
DB_PORT=6543
DB_USERNAME=postgres.qlpkhofninwegrzyqgmp
DB_PASSWORD=Hassanebad.90
DB_DATABASE=postgres
DB_SSL=true
NODE_ENV=production
```

---

## 📝 تحديث ملف .env

1. افتح ملف `.env` في مجلد `backend`
2. استبدل المحتوى بالـ Connection String الصحيح من Supabase Dashboard
3. احفظ الملف

---

## 🧪 اختبار الاتصال

بعد تحديث `.env`، جرب:

```bash
cd backend
npm run seed:run
```

---

## 🆘 إذا استمرت المشكلة

### الحل 1: استخدام Supabase SQL Editor مباشرة

1. اذهب إلى Supabase Dashboard
2. SQL Editor → New Query
3. انسخ محتوى ملفات Seed من `backend/src/database/seeds/`
4. شغلها مباشرة في SQL Editor

### الحل 2: التحقق من الإنترنت

تأكد من أنك متصل بالإنترنت وأن Firewall لا يمنع الاتصال.

### الحل 3: استخدام IP بدلاً من Hostname

إذا كان متاحاً في Supabase Dashboard، استخدم IP address بدلاً من hostname.

---

## 📞 ملاحظة

إذا لم تجد Connection String في Supabase Dashboard:
1. تأكد من أن المشروع نشط
2. تحقق من أن Database موجود
3. جرب إعادة تحميل الصفحة
4. تأكد من أنك في المشروع الصحيح: `qlpkhofninwegrzyqgmp`












