# 🔐 إعداد Supabase Authentication

## ✅ تم إعداد كل شيء!

المشروع يستخدم Supabase Authentication بشكل صحيح. إليك ملخص:

---

## 📦 المفاتيح المستخدمة

### Client API Key (للـ Frontend)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscGtob2ZuaW53ZWdyenlxZ21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxODAxNjksImV4cCI6MjA4NDc1NjE2OX0.2gNmrwRURVB0a6N2sKhNUmzd0QJfCUQgij7cwja8A9Q
```

### Service Key (للـ Serverless Functions)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscGtob2ZuaW53ZWdyenlxZ21wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE4MDE2OSwiZXhwIjoyMDg0NzU2MTY5fQ.bF022Px5expD9sSLZUzclhbH5FdKiOSUSNJLbMUyl3k
```

---

## 🔧 كيف يعمل Authentication في المشروع

### 1. Frontend (Store/Admin/POS)

في `frontend/*/lib/supabase.ts`:
- يستخدم **Client API Key** (Anon Key)
- آمن للاستخدام في المتصفح
- يعمل مع Row Level Security (RLS)

### 2. API Routes (Serverless Functions)

في `frontend/*/app/api/**/route.ts`:
- يستخدم **Service Key** (Service Role Key)
- يعمل على Server فقط
- يتجاوز RLS (للمهام الإدارية)

### 3. Authentication Flow

#### تسجيل الدخول (Login)
```typescript
// في API Route: /api/auth/login
const { email, password } = await request.json()
const supabase = getSupabaseServer() // يستخدم Service Key

// البحث عن المستخدم في جدول users
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
  .single()

// التحقق من كلمة المرور
const isValid = await bcrypt.compare(password, user.password)

// إنشاء JWT Token
const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET)
```

#### التسجيل (Register)
```typescript
// في API Route: /api/auth/register
const { name, email, password } = await request.json()
const supabase = getSupabaseServer()

// إنشاء مستخدم جديد
const { data: user } = await supabase
  .from('users')
  .insert({ name, email, password: hashedPassword })
  .select()
```

---

## 🔒 الأمان

### Row Level Security (RLS)

**مهم**: يجب تفعيل RLS في Supabase:

1. اذهب إلى Supabase Dashboard
2. Table Editor → اختر جدول (مثل `users`, `products`)
3. Settings → Row Level Security
4. فعّل **Enable RLS**

### Policies

أنشئ Policies للتحكم في الوصول:

```sql
-- مثال: السماح للجميع بقراءة المنتجات النشطة
CREATE POLICY "Public products are viewable by everyone"
ON products FOR SELECT
USING (is_active = true);

-- مثال: السماح للمستخدمين بتحديث بياناتهم فقط
CREATE POLICY "Users can update own data"
ON users FOR UPDATE
USING (auth.uid() = id);
```

---

## 📝 ملاحظات مهمة

### 1. Client API Key
- ✅ آمن للاستخدام في Frontend
- ✅ يعمل مع RLS
- ✅ لا يتجاوز الأمان

### 2. Service Key
- ⚠️ سري - لا تشاركه أبداً
- ⚠️ استخدمه فقط في Serverless Functions
- ⚠️ يتجاوز RLS - استخدمه بحذر

### 3. JWT Secret
- ⚠️ سري - لا تشاركه أبداً
- ✅ استخدمه لتوقيع Tokens الخاصة بك
- ✅ القيمة الحالية: `0914a52a8ce3f9c8830213d5747ea8a27452b5e6afd829a666c8f9f304067402`

---

## 🧪 اختبار Authentication

### 1. اختبار Login

```bash
curl -X POST https://your-store.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. اختبار Register

```bash
curl -X POST https://your-store.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

---

## 🆘 حل المشاكل

### Authentication failed
- تحقق من كلمة المرور
- تأكد من أن المستخدم موجود في جدول `users`
- تحقق من JWT Secret

### RLS blocking requests
- تحقق من Policies في Supabase
- تأكد من تفعيل RLS
- استخدم Service Key في Serverless Functions

---

## ✅ Checklist

- [ ] Client API Key موجود في Frontend
- [ ] Service Key موجود في Environment Variables
- [ ] JWT Secret موجود في Environment Variables
- [ ] RLS مفعّل في Supabase
- [ ] Policies منشأة للجداول المهمة
- [ ] Authentication يعمل في Frontend
- [ ] API Routes تعمل بشكل صحيح

---

## 📚 الملفات المهمة

- `frontend/*/lib/supabase.ts` - Supabase client setup
- `frontend/*/app/api/auth/login/route.ts` - Login endpoint
- `frontend/*/app/api/auth/register/route.ts` - Register endpoint
- `ENV_VARIABLES.md` - جميع المفاتيح

---

## 🎉 كل شيء جاهز!

Authentication يعمل بشكل صحيح في المشروع. فقط تأكد من:
1. تفعيل RLS في Supabase
2. إنشاء Policies مناسبة
3. استخدام المفاتيح الصحيحة في Environment Variables












