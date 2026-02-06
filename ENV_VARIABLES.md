# 🔑 Environment Variables - جميع المفاتيح

## 📦 معلومات Supabase

- **Project ID**: `qlpkhofninwegrzyqgmp`
- **URL**: `https://qlpkhofninwegrzyqgmp.supabase.co`
- **Database Host**: `db.qlpkhofninwegrzyqgmp.supabase.co`
- **Database Port**: `5432`
- **Database Name**: `postgres`
- **Database Username**: `postgres`
- **Database Password**: `Hassanebad.90`

## 🔑 API Keys

### Anon Key (Public - للـ Frontend)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscGtob2ZuaW53ZWdyenlxZ21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxODAxNjksImV4cCI6MjA4NDc1NjE2OX0.2gNmrwRURVB0a6N2sKhNUmzd0QJfCUQgij7cwja8A9Q
```

### Service Role Key (Secret - للـ Serverless Functions فقط)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscGtob2ZuaW53ZWdyenlxZ21wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE4MDE2OSwiZXhwIjoyMDg0NzU2MTY5fQ.bF022Px5expD9sSLZUzclhbH5FdKiOSUSNJLbMUyl3k
```

### JWT Secret (للتوقيع على Tokens)
```
3a5d32aa8a5547c0caef762bf802e559f7a16997d4ad40ee147584be79506684
```

## 🌐 Environment Variables لـ Vercel

### Store / Admin / POS

```env
NEXT_PUBLIC_SUPABASE_URL=https://qlpkhofninwegrzyqgmp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscGtob2ZuaW53ZWdyenlxZ21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxODAxNjksImV4cCI6MjA4NDc1NjE2OX0.2gNmrwRURVB0a6N2sKhNUmzd0QJfCUQgij7cwja8A9Q
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscGtob2ZuaW53ZWdyenlxZ21wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE4MDE2OSwiZXhwIjoyMDg0NzU2MTY5fQ.bF022Px5expD9sSLZUzclhbH5FdKiOSUSNJLbMUyl3k
JWT_SECRET=3a5d32aa8a5547c0caef762bf802e559f7a16997d4ad40ee147584be79506684
```

## 🔧 Environment Variables للـ Backend (Seeding)

```env
DB_HOST=db.qlpkhofninwegrzyqgmp.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=Hassanebad.90
DB_DATABASE=postgres
DB_SSL=true
NODE_ENV=production
```

## ⚠️ ملاحظات أمنية

1. **Anon Key**: آمن للاستخدام في Frontend (public)
2. **Service Role Key**: سري - استخدمه فقط في Serverless Functions (API Routes)
3. **JWT Secret**: سري - لا تشاركه أبداً
4. **Database Password**: سري - لا تشاركه أبداً

## 📝 كيفية الاستخدام

### في Vercel:
1. اذهب إلى Project Settings → Environment Variables
2. أضف جميع المتغيرات أعلاه
3. تأكد من تطبيقها على Production, Preview, Development

### محلياً:
أنشئ ملف `.env.local` في كل frontend مع المتغيرات أعلاه.










