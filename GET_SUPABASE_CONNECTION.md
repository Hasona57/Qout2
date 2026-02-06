# 🔗 كيفية الحصول على Connection String الصحيح من Supabase

## 📍 الخطوات التفصيلية

### 1. اذهب إلى Supabase Dashboard

1. افتح المتصفح واذهب إلى: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. سجل دخولك
3. اختر مشروعك: **qlpkhofninwegrzyqgmp**

### 2. الحصول على Connection String

#### الطريقة الأولى: Connection Pooling (موصى به)

1. في القائمة الجانبية، اضغط على **Settings** (الإعدادات)
2. اضغط على **Database**
3. ابحث عن قسم **Connection Pooling**
4. ستجد **Connection String** مع خيارات:
   - **Session mode** ← اختر هذا
   - **Transaction mode**
5. انسخ Connection String (سيبدو مثل):
   ```
   postgresql://postgres.qlpkhofninwegrzyqgmp:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
6. **مهم**: استبدل `[YOUR-PASSWORD]` بـ `Hassanebad.90`

#### الطريقة الثانية: Direct Connection

1. في نفس الصفحة (Settings → Database)
2. ابحث عن **Connection String** (بدون Pooling)
3. اختر **URI** أو **Node.js**
4. انسخ Connection String
5. استبدل `[YOUR-PASSWORD]` بـ `Hassanebad.90`

### 3. مثال على Connection String الصحيح

بعد استبدال كلمة المرور، يجب أن يبدو مثل:

```
postgresql://postgres.qlpkhofninwegrzyqgmp:Hassanebad.90@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

أو:

```
postgresql://postgres:Hassanebad.90@db.qlpkhofninwegrzyqgmp.supabase.co:5432/postgres
```

### 4. استخدام Connection String في ملف .env

في ملف `backend/.env`، استخدم:

```env
DATABASE_URL=postgresql://postgres.qlpkhofninwegrzyqgmp:Hassanebad.90@aws-0-us-east-1.pooler.supabase.com:6543/postgres
NODE_ENV=production
```

**ملاحظة مهمة**: 
- استبدل `aws-0-us-east-1.pooler.supabase.com` و `6543` بالقيم الصحيحة من Supabase Dashboard
- قد يكون الـ hostname مختلف حسب منطقتك (us-east-1, eu-west-1, etc.)

---

## 🔍 إذا لم تجد Connection String

### تحقق من:

1. **المشروع نشط**: تأكد من أن المشروع `qlpkhofninwegrzyqgmp` موجود ونشط
2. **Database موجود**: تأكد من أن Database تم إنشاؤه
3. **Permissions**: تأكد من أن لديك صلاحيات للوصول إلى Database settings

### بديل: استخدام Supabase SQL Editor

إذا استمرت المشكلة، استخدم SQL Editor مباشرة:

1. في Supabase Dashboard، اضغط على **SQL Editor**
2. اضغط على **New Query**
3. انسخ محتوى ملفات Seed من `backend/src/database/seeds/`
4. شغلها مباشرة

---

## ✅ التحقق من Connection String

بعد الحصول على Connection String:

1. تأكد من أنه يحتوي على:
   - `postgresql://` في البداية
   - اسم المستخدم (مثل `postgres.qlpkhofninwegrzyqgmp`)
   - كلمة المرور: `Hassanebad.90`
   - Hostname (مثل `aws-0-us-east-1.pooler.supabase.com`)
   - Port (مثل `6543` أو `5432`)
   - Database name: `postgres`

2. تأكد من عدم وجود مسافات أو أحرف إضافية

---

## 🆘 إذا استمرت المشكلة

### الخطأ: "Tenant or user not found"

هذا يعني أن:
- اسم المستخدم غير صحيح
- أو Connection String غير صحيح

**الحل**:
1. تأكد من نسخ Connection String كاملاً من Supabase Dashboard
2. تأكد من استبدال `[YOUR-PASSWORD]` بـ `Hassanebad.90`
3. تأكد من عدم وجود مسافات في Connection String
4. جرب Connection Pooling بدلاً من Direct Connection










