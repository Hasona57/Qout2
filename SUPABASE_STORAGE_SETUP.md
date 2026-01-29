# إعداد Supabase Storage لرفع الصور (Supabase Storage Setup for Image Uploads)

## المشكلة (Problem)
إذا كنت تواجه خطأ 500 عند رفع الصور، فالمشكلة على الأرجح أن Supabase Storage bucket غير موجود.

## الحل (Solution)

### 1. إنشاء Storage Bucket في Supabase

1. افتح [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك
3. اذهب إلى **Storage** من القائمة الجانبية
4. اضغط على **New bucket**
5. أدخل اسم الـ bucket (أحد الأسماء التالية):
   - `product-images` (موصى به)
   - `attachments`
   - `images`
6. اختر **Public bucket** (للوصول العام للصور)
7. اضغط **Create bucket**

### 2. إعداد الصلاحيات (Permissions)

بعد إنشاء الـ bucket:

1. اضغط على الـ bucket الذي أنشأته
2. اذهب إلى **Policies**
3. أضف سياسة جديدة:
   - **Policy name**: `Allow public uploads`
   - **Allowed operation**: `INSERT`
   - **Policy definition**: 
     ```sql
     (bucket_id = 'product-images'::text)
     ```
   - **Policy using expression**: `true`

4. أضف سياسة أخرى للقراءة:
   - **Policy name**: `Allow public reads`
   - **Allowed operation**: `SELECT`
   - **Policy definition**: 
     ```sql
     (bucket_id = 'product-images'::text)
     ```
   - **Policy using expression**: `true`

### 3. التحقق من الإعداد

بعد إعداد الـ bucket، جرب رفع صورة مرة أخرى. يجب أن يعمل الآن.

## ملاحظات مهمة (Important Notes)

- **Public vs Private**: إذا اخترت Public bucket، ستكون الصور متاحة للجميع عبر URL مباشر
- **Security**: تأكد من إعداد Policies بشكل صحيح لمنع الوصول غير المصرح به
- **Storage Limits**: تأكد من أن لديك مساحة كافية في خطة Supabase المجانية (500MB)

## استكشاف الأخطاء (Troubleshooting)

### خطأ: "Bucket not found"
- تأكد من أن اسم الـ bucket يطابق أحد الأسماء: `product-images`, `attachments`, أو `images`
- تأكد من أن الـ bucket موجود في Supabase Dashboard

### خطأ: "Permission denied"
- تأكد من إعداد Policies بشكل صحيح
- تأكد من أن الـ bucket هو Public

### خطأ: "Storage quota exceeded"
- تحقق من استخدامك للمساحة في Supabase Dashboard
- احذف الصور القديمة غير المستخدمة

## بديل: استخدام URLs خارجية (Alternative: External URLs)

إذا لم ترد استخدام Supabase Storage، يمكنك:
1. رفع الصور إلى خدمة خارجية (مثل Cloudinary, Imgur, etc.)
2. حفظ URLs في قاعدة البيانات مباشرة
3. تعديل الكود ليقبل URLs مباشرة بدلاً من رفع الملفات



