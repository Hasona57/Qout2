# 🔗 كيفية الحصول على Connection String - خطوة بخطوة

## ✅ أنت الآن في Database Settings - ممتاز!

من المعلومات التي شاركتها، لدينا:
- ✅ Password: `Hassanebad.90`
- ✅ Project ID: `qlpkhofninwegrzyqgmp`

---

## 📍 الخطوة 1: العثور على Connection String

في صفحة **Database Settings** التي أنت فيها الآن:

1. **ابحث عن زر "Connect"** في أعلى الصفحة
   - عادة يكون في الزاوية اليمنى العليا
   - أو في قسم "Connection Info"

2. **اضغط على "Connect"**
   - سيظهر لك قائمة بخيارات الاتصال

---

## 📋 الخطوة 2: اختر نوع الاتصال

ستجد 3 خيارات:

### خيار 1: Direct Connection (IPv6 only)
```
postgresql://postgres:[YOUR-PASSWORD]@db.qlpkhofninwegrzyqgmp.supabase.co:5432/postgres
```
⚠️ **ملاحظة**: قد لا يعمل على Windows إذا لم يكن IPv6 مفعّل

### خيار 2: Pooler Session Mode (موصى به لـ Windows)
```
postgres://postgres.qlpkhofninwegrzyqgmp:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```
✅ **يدعم IPv4** - يعمل على Windows

### خيار 3: Pooler Transaction Mode (للـ Serverless)
```
postgres://postgres:[YOUR-PASSWORD]@db.qlpkhofninwegrzyqgmp.supabase.co:6543/postgres
```
✅ **يدعم IPv4** - يعمل على Windows

---

## 🔧 الخطوة 3: استبدال كلمة المرور

في أي Connection String تختاره، استبدل `[YOUR-PASSWORD]` بـ `Hassanebad.90`

**مثال:**
```
postgres://postgres.qlpkhofninwegrzyqgmp:Hassanebad.90@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

---

## 📝 الخطوة 4: استخدام Connection String في ملف .env

### الطريقة الأولى: استخدام DATABASE_URL (موصى به)

1. افتح ملف `backend/.env`
2. اكتب:

```env
DATABASE_URL=postgres://postgres.qlpkhofninwegrzyqgmp:Hassanebad.90@aws-0-us-east-1.pooler.supabase.com:5432/postgres
NODE_ENV=production
```

**ملاحظة**: استبدل `aws-0-us-east-1.pooler.supabase.com` بالقيمة الصحيحة من Supabase Dashboard

### الطريقة الثانية: استخدام متغيرات منفصلة (إذا لم يعمل DATABASE_URL)

في ملف `backend/.env`:

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

## ✅ الخطوة 5: اختبار الاتصال

بعد حفظ ملف `.env`:

```bash
cd backend
npm run seed:run
```

---

## 🆘 إذا لم تجد زر "Connect"

### بديل: استخدام Connection Info

1. في صفحة Database Settings
2. ابحث عن قسم **Connection Info** أو **Connection String**
3. قد تجد معلومات مثل:
   - Host
   - Port
   - Database
   - User

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

## 💡 نصيحة

**لـ Windows**: استخدم **Pooler Session Mode** أو **Pooler Transaction Mode** لأنها تدعم IPv4.

**لـ Seeding**: يمكنك استخدام أي من الخيارات، لكن **Pooler Session Mode** أفضل للعمليات الطويلة.

---

## 📸 أين تجد Connection String في Dashboard؟

1. **Settings** → **Database**
2. ابحث عن:
   - زر **"Connect"** في الأعلى
   - أو قسم **"Connection String"**
   - أو **"Connection Pooling"**

3. اضغط على **"Connect"** وستجد جميع الخيارات

---

## ✅ Checklist

- [ ] وجدت زر "Connect" في Database Settings
- [ ] نسخت Connection String
- [ ] استبدلت `[YOUR-PASSWORD]` بـ `Hassanebad.90`
- [ ] حفظت Connection String في `backend/.env`
- [ ] جربت `npm run seed:run`

---

## 🎯 الخطوة التالية

بعد الحصول على Connection String:

1. افتح `backend/.env`
2. الصق Connection String (بعد استبدال كلمة المرور)
3. احفظ الملف
4. شغل: `npm run seed:run`

---

## 🆘 إذا استمرت المشكلة

استخدم **Supabase SQL Editor** مباشرة:

1. في Supabase Dashboard، اضغط على **SQL Editor**
2. اضغط على **New Query**
3. انسخ محتوى ملفات Seed من `backend/src/database/seeds/`
4. شغلها مباشرة












