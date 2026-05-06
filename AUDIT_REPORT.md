# تقرير فحص شامل - Hello Staff (ما قبل الإطلاق)

**تاريخ الفحص:** 6 مايو 2026
**إصدار Next.js:** 16.2.4
**إصدار React:** 19.0.1
**قاعدة البيانات:** Supabase (Postgres)
**حالة Build:** ناجح (بدون Turbopack)

---

## 1. ملخص تنفيذي

التطبيق بنية جيدة بشكل عام مع هيكلية واضحة وفصل بين المسارات العامة ولوحة الإدارة. واجهة المستخدم جذابة ومتوافقة مع الجوال بشكل مقبول. **ومع ذلك، هناك أخطاء حرجة في قاعدة البيانات والأمان يجب إصلاحها قبل الإطلاق**.

| البُعد | التقييم | الحالة |
|--------|---------|--------|
| بنية الكود | جيد | ⚠️ يحتاج تحسينات |
| أمان Backend | ضعيف | 🔴 يحتاج إصلاح عاجل |
| أمان Frontend | مقبول | 🟡 يحتاج إصلاح |
| أداء | مقبول | 🟡 يحتاج تحسين |
| UX/UI | جيد | 🟢 مقبول للإطلاق |
| سلامة البيانات | ضعيف | 🔴 يحتاج إصلاح عاجل |

---

## 2. الأخطاء الحرجة (Blockers - يجب إصلاحها قبل الإطلاق)

### 🔴 A. أخطاء قاعدة البيانات (Schema)

| # | المشكلة | الموقع | التأثير |
|---|---------|--------|---------|
| A1 | **المخطط `private` غير موجود** - Triggers تستدعي `private.handle_new_application()` و `private.handle_application_update()` | `supabase/schema.sql` السطر 337 و 362 | **الإشعارات لن تعمل نهائياً** - سيفشل إدراج أي طلب توظيف |
| A2 | **جدول `messages` غير معرّف** | يُستخدم في `admin/messages/page.tsx` | صفحة الرسائل في لوحة الإدارة ستفشل بالكامل |
| A3 | **عمود `max_articles_per_month` مفقود** في `subscription_plans` | يُستخدم في `dashboard/articles/page.tsx` | سيحدث خطأ عند حساب استهلاك المقالات |
| A4 | **عمود `duration_days` مفقود** في `subscription_plans` | يُستخدم في `admin/subscriptions/page.tsx` | خطأ في عرض الاشتراكات |
| A5 | **عمود `published_at` مفقود** في `articles` | يُستخدم في `api/admin/articles/route.ts` | فشل إنشاء المقالات عند النشر |
| A6 | **أعمدة `site_name`, `logo_url`, `maintenance_mode` مفقودة** في `platform_settings` | يُستخدم في `admin/settings/page.tsx` | فقدان البيانات عند الحفظ |
| A7 | **Buckets غير معرّفة:** `platform_assets` و `article_images` | `admin/settings`, `admin/articles`, `dashboard/articles` | فشل رفع الملفات |
| A8 | **RLS على `notifications.insert` تحظر جميع الإدراجات** | `schema.sql` السطر 266-268 | Triggers لن تستطيع إنشاء إشعارات |

### 🔴 B. أخطاء أمان Backend

| # | المشكلة | الموقع | التأثير |
|---|---------|--------|---------|
| B1 | **XSS عبر `dangerouslySetInnerHTML`** - محتوى المقالات يُعرض بدون تطهير | `blog/[slug]/page.tsx` | إمكانية حقن سكريبتات ضارة |
| B2 | **أي مستخدم يمكنه تعديل حالة أي طلب توظيف** | `actions/applications.ts` `updateApplicationStatus` | تلاعب غير مصرح في بيانات المستخدمين |
| B3 | **أي مستخدم يمكنه رؤية أي وظيفة بمعرفها** | `actions/jobs.ts` `getJobById` | كشف وظائف غير معتمدة/مغلقة |
| B4 | **لا توجد تحقق من نوع الملف أو حجمه** عند الرفع | `pricing/page.tsx`, `AvatarUpload.tsx` | إمكانية رفع ملفات ضارة |
| B5 | **API حذف المستخدمين لا يتحقق من وجود المستخدم** | `api/admin/users/[id]/route.ts` | قد يُرجع "نجاح" رغم عدم وجود المستخدم |
| B6 | **لا توجد حماية Rate Limiting** على أي API | جميع Routes | عرضة للـ DDoS و brute force |

### 🔴 C. أخطاء منطقية

| # | المشكلة | الموقع | التأثير |
|---|---------|--------|---------|
| C1 | **تغيير الدور يرسل `'job_seeker'` بدلاً من `'seeker'`** | `admin/users/page.tsx` `handleChangeRole` | فشل تغيير الدور من الواجهة |
| C2 | **الصفحة الرئيسية تُرسل 4 استعلامات متزامنة** | `page.tsx` | بطء تحميل الصفحة |
| C3 | **صفحة الإعدادات (`setup`) تحتوي على معلومات قديمة** | `setup/page.tsx` | تربك المستخدمين (تذكر VITE بدلاً من NEXT_PUBLIC) |
| C4 | **التواصل عبر WhatsApp لا يُضيف رمز الدولة** | `jobs/[id]/page.tsx` | قد يفشل الرابط إذا لم يُدخل المستخدم `+` |

---

## 3. الأخطاء المتوسطة (يجب إصلاحها في الأسبوع الأول)

### 🟡 D. نواقص Frontend

| # | المشكلة | الموقع |
|---|---------|--------|
| D1 | صفحة "تنبيهات الوظائف" (`/job-alerts`) صفحة فارغة | `job-alerts/page.tsx` |
| D2 | صفحة "الرسائل" (`/messages`) واجهة فارغة لا تعمل | `messages/page.tsx` |
| D3 | صفحة "اتصل بنا" لا ترسل البيانات فعلياً | `contact/page.tsx` |
| D4 | صفحة "الملف الشخصي" حقول `readOnly` - لا يوجد تعديل فعلي | `profile/page.tsx` |
| D5 | صفحة "البحث في السير الذاتية" بيانات وهمية ثابتة | `search-resumes/page.tsx` |
| D6 | صفحة "إدارة الوظائف" في الأدمن أزرار لا تعمل | `admin/jobs/page.tsx` |
| D7 | أسعار الاشتراكات تُعرض بـ `$` بدلاً من `₪` | `pricing/page.tsx` |
| D8 | لا يوجد pagination في أي جدول | جميع الجداول |

### 🟡 E. مشاكل TypeScript & Build

| # | المشكمة | الموقع |
|---|---------|--------|
| E1 | `"strict": false` في `tsconfig.json` | يسمح بأخطاء كثيرة تمر دون اكتشاف |
| E2 | تحذير: `middleware` file convention deprecated | `build.log` - يُنصح باستخدام `proxy` |
| E3 | Turbopack Panic في البيئة (OneDrive) | `build` - يجب تعطيل Turbopack في Windows/OneDrive |

---

## 4. التوصيات العاجلة (قبل الإطلاق بـ 48 ساعة)

### الخطوة 1: إصلاح قاعدة البيانات
```sql
-- 1. إصلاح Triggers
-- غير `private.` إلى `public.` في السطر 337 و 362

-- 2. إنشاء جدول messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id uuid REFERENCES public.profiles ON DELETE SET NULL,
  receiver_id uuid REFERENCES public.profiles ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3. إضافة الأعمدة المفقودة
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS max_articles_per_month integer DEFAULT 0;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS duration_days integer DEFAULT 30;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS published_at timestamp with time zone;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS site_name text DEFAULT 'Hello Staff';
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS maintenance_mode boolean DEFAULT false;

-- 4. إنشاء Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('platform_assets', 'platform_assets', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('article_images', 'article_images', true) ON CONFLICT (id) DO NOTHING;

-- 5. إصلاح RLS للإشعارات
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
```

### الخطوة 2: إصلاحات كود عاجلة

1. **تطهير محتوى المقالات قبل العرض:**
   - استخدم مكتبة `dompurify` أو `isomorphic-dompurify` لتطهير HTML قبل `dangerouslySetInnerHTML`

2. **إصلاح `updateApplicationStatus`:**
   - أضف تحققاً من أن المستخدم هو صاحب الوظيفة المرتبطة بالطلب

3. **إصلاح `getJobById`:**
   - أضف `.eq('status', 'approved')` للمستخدمين العاديين

4. **إصلاح `handleChangeRole`:**
   - غيّر `'job_seeker'` إلى `'seeker'`

5. **إصلاح `page.tsx` الرئيسية:**
   - استخدم `Promise.all` لجلب الإحصائيات

### الخطوة 3: تعطيل Turbopack

في `package.json`:
```json
"build": "cross-env NEXT_TURBOPACK=0 next build"
```

أو أنشئ `next.config.ts` بـ:
```ts
const nextConfig = {
  turbopack: false,
  // ...existing config
}
```

---

## 5. قائمة الملفات التي تحتاج تعديل

| الملف | الأولوية | نوع التعديل |
|-------|----------|-------------|
| `supabase/schema.sql` | 🔴 حرجة | إصلاح Triggers + إضافة جداول وأعمدة |
| `src/app/blog/[slug]/page.tsx` | 🔴 حرجة | إضافة تطهير HTML |
| `src/app/actions/applications.ts` | 🔴 حرجة | إصلاح التحقق من الصلاحيات |
| `src/app/actions/jobs.ts` | 🔴 حرجة | إضافة تحقق من status |
| `src/app/admin/users/page.tsx` | 🔴 حرجة | إصلاح 'job_seeker' إلى 'seeker' |
| `src/app/page.tsx` | 🟡 متوسطة | استخدام Promise.all |
| `src/app/pricing/page.tsx` | 🟡 متوسطة | تغيير $ إلى ₪ |
| `src/app/contact/page.tsx` | 🟡 متوسطة | ربط النموذج بـ API |
| `src/app/profile/page.tsx` | 🟡 متوسطة | تفعيل تعديل البيانات |
| `src/app/search-resumes/page.tsx` | 🟡 متوسطة | الربط بقاعدة البيانات |
| `src/app/admin/jobs/page.tsx` | 🟡 متوسطة | تفعيل الأزرار |
| `src/app/setup/page.tsx` | 🟢 منخفضة | تحديث المتغيرات |
| `package.json` | 🟡 متوسطة | تعطيل Turbopack |
| `tsconfig.json` | 🟡 متوسطة | تفعيل strict |

---

## 6. ملاحظات إضافية

### إيجابيات المشروع:
- ✅ استخدام Next.js 16 مع App Router
- ✅ استخدام Supabase SSR بشكل صحيح
- ✅ RLS مفعل على جميع الجداول
- ✅ Middleware يحمي المسارات الإدارية
- ✅ تصميم متجاوب (Responsive) بشكل جيد
- ✅ دعم RTL كامل
- ✅ UI/UX احترافي وممتاز

### تحذيرات:
- ⚠️ المشروع على OneDrive - قد يسبب مشاكل في أداء Build
- ⚠️ لا يوجد اختبارات (Tests) نهائياً
- ⚠️ لا يوجد `robots.txt` أو `sitemap.xml`
- ⚠️ لا يوجد صفحات `loading.tsx` أو `error.tsx` مخصصة
- ⚠️ لا يوجد Rate Limiting أو Captcha

---

**الخلاصة:** المشروع جاهز تقريباً من ناحية الواجهة، لكن يوجد **3 أخطاء حرجة** في قاعدة البيانات و**3 أخطاء حرجة** في الأمان يجب إصلاحها فوراً قبل فتح المنصة للمستخدمين.
