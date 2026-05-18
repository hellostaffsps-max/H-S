# التقرير الشامل لتحليل منصة Hello Staff

> **تاريخ التقرير:** 2026-05-18  
> **إصدار المنصة:** 0.0.0  
> **التقنية الأساسية:** Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + Supabase  

---

## 1. نظرة عامة على المنصة

**Hello Staff** هي منصة توظيف متخصصة في قطاع الضيافة الفلسطيني (مطاعم، مقاهي، فنادق). تربط بين:
- **أصحاب العمل (Employers):** ينشرون الوظائف ويديرون المتقدمين.
- **الباحثين عن عمل (Seekers):** يبحثون عن وظائف ويتقدمون لها ويبنون سيرهم الذاتية.
- **الإدارة (Admin):** تشرف على المحتوى، الاشتراكات، البلاغات، والصلاحيات.

### أهداف المنصة
- التوظيف السريع بدون "واسطات".
- ملفات مرشحين واضحة (CV Builder مدمج).
- نظام اشتراكات مرن لأصحاب العمل.
- محتوى توعوي (مدونة) وإعلانات مميزة.

---

## 2. الهيكل التقني (Tech Stack)

| الطبقة | التقنية | التفاصيل |
|--------|---------|----------|
| **Frontend Framework** | Next.js 16.2.4 | App Router, SSR/SSG, Server Actions |
| **UI Library** | React 19.0.1 | Server Components + Client Components |
| **Styling** | Tailwind CSS 4.1.14 | مع PostCSS و Autoprefixer |
| **Font** | Cairo (Google Fonts) | دعم كامل للعربية واللاتينية |
| **Database & Auth** | Supabase (PostgreSQL) | Auth via supabase-ssr, RLS Policies |
| **Storage** | Supabase Storage | Buckets: avatars, payment_receipts, article_images, ads, platform_assets |
| **State Management** | React Hooks | useAuth, useSubscription, useNotifications |
| **Animations** | motion (Framer Motion successor) | animate-in, transitions, staggerChildren |
| **Forms/Validation** | Zod 4.4.3 | (مستورد ولكن غير مستخدم بشكل واسع في الكود الحالي) |
| **Rate Limiting** | @upstash/ratelimit + Redis | Fallback إلى in-memory map للتطوير |
| **Security** | Cloudflare Turnstile | Captcha في تسجيل الدخول والتسجيل |
| **Analytics** | Vercel Analytics | تتبع الزيارات |
| **PWA** | Service Worker (`/sw.js`) | Push notifications, install prompt |
| **Testing** | Vitest + jsdom + Testing Library | Tests لـ ApplyButton, CookieConsent, SearchBox, Pagination, rate-limit, redis, admin-auth |

### متغيرات البيئة (Env)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
UPSTASH_REDIS_REST_URL / TOKEN
NEXT_PUBLIC_TURNSTILE_SITE_KEY
GEMINI_API_KEY
```

---

## 3. صفحات الموقع بالتفصيل

### 3.1 الصفحات العامة (Public Pages)

| المسار | الوصف | SEO |
|--------|-------|-----|
| `/` | **الصفحة الرئيسية** - Hero section, إحصائيات, تصنيفات الوظائف, أحدث الوظائف, باقات للأصحاب, مقالات, CTA | ✅ كامل (OpenGraph, Twitter, meta tags) |
| `/jobs` | قائمة الوظائف مع فلترة (بحث، تصنيف، موقع، نوع الدوام) | ✅ |
| `/jobs/[id]` | تفاصيل الوظيفة - معرضة بشكل احترافي مع معلومات الشركة، الراتب، واتساب، تقديم | ✅ generateMetadata ديناميكي |
| `/blog` | المدونة - قائمة المقالات المنشورة | ✅ |
| `/blog/[slug]` | صفحة مقال فردي | ✅ |
| `/about` | من نحن | ✅ |
| `/contact` | تواصل معنا | ✅ |
| `/help` | مركز المساعدة | ✅ |
| `/interview-tips` | نصائح المقابلة | ✅ |
| `/job-alerts` | تنبيهات الوظائف | ✅ |
| `/search-resumes` | البحث في السير الذاتية | ✅ |
| `/pricing` | صفحة الباقات والاشتراكات | ✅ |
| `/cv-builder` | **منشئ السيرة الذاتية** - أداة تفاعلية لبناء CV مع preview مباشر وتصدير PDF | ✅ |
| `/terms` | شروط الاستخدام | ✅ |
| `/privacy` | سياسة الخصوصية | ✅ |
| `/cookies` | سياسة الكوكيز | ✅ |

### 3.2 صفحات المصادقة (Auth)

| المسار | الوصف |
|--------|-------|
| `/auth/login` | تسجيل الدخول (email + password + Turnstile Captcha) |
| `/auth/signup` | إنشاء حساب جديد (اختيار الدور: seeker/employer + Google OAuth) |
| `/auth/callback` | معالجة redirect بعد OAuth |
| `/auth/logout` | تسجيل الخروج |

### 3.3 صفحات لوحة التحكم (Dashboard) - للمستخدمين

| المسار | الوصول | الوصف |
|--------|--------|-------|
| `/dashboard` | Employer / Seeker | **الصفحة الرئيسية للوحة التحكم** - إحصائيات، خط سير التوظيف (Pipeline)، إجراءات سريعة |
| `/dashboard/jobs` | Employer فقط | إدارة الوظائف المنشورة (تعديل، تفعيل/إيقاف، حذف) |
| `/dashboard/shortlist` | Employer | القائمة المختصرة للمرشحين |
| `/dashboard/team` | Employer | **فريق العمل** - عرض الموظفين المقبولين حسب الوظيفة، إنهاء العمل |
| `/dashboard/articles` | Employer (باشتراك) | إدارة مقالات المنشأة الإعلانية |
| `/dashboard/ads` | Employer (باشتراك) | إدارة الإعلانات (صور/فيديو) في الصفحة الرئيسية |
| `/messages` | الجميع | **نظام الرسائل الداخلي** - WhatsApp-like UI، محادثات فورية، حذف محادثات |
| `/profile` | الجميع | إدارة الملف الشخصي (بيانات المنشأة أو بيانات الباحث) |
| `/post-job` | Employer | نشر/تعديل وظيفة جديدة |

### 3.4 صفحات الإدارة (Admin Panel)

| المسار | الصلاحية المطلوبة | الوصف |
|--------|-------------------|-------|
| `/admin` | أي Admin | **لوحة التحكم الإدارية** - نظرة عامة بإحصائيات المنصة |
| `/admin/users` | `users:manage` | إدارة المستخدمين |
| `/admin/employers` | `users:view` | أصحاب العمل |
| `/admin/candidates` | `users:view` | المرشحون (الباحثون) |
| `/admin/trusted-employers` | `settings_edit` | المنشآت الموثوقة |
| `/admin/jobs` | `jobs:manage` | مراجعة وإدارة الوظائف |
| `/admin/applications` | `jobs:manage` | طلبات التوظيف |
| `/admin/subscriptions` | `subscriptions_manage` | إدارة الاشتراكات (تفعيل/رفض/ترقية) |
| `/admin/academy` | `subscriptions_manage` | الأكاديمية |
| `/admin/payments` | `payments:view` | الدفع والفواتير |
| `/admin/plans` | `subscriptions_manage` | إدارة الباقات (إضافة/تعديل/حذف) |
| `/admin/articles` | `articles:manage` | إدارة المقالات/المدونة |
| `/admin/messages` | `broadcast:send` | إرسال تعميمات/إشعارات للجميع |
| `/admin/ads` | `ads:manage` | إدارة الإعلانات |
| `/admin/support` | `support:manage` | البلاغات والدعم الفني |
| `/admin/reports` | `jobs:manage` | التقارير |
| `/admin/settings` | `settings_edit` | إعدادات المنصة (اسم الموقع، لوجو، ألوان، بنك، QR) |
| `/admin/roles` | `roles:manage` | **إدارة الأدوار والصلاحيات** + إضافة مشرفين جدد |
| `/admin/audit-logs` | `__super_admin_only__` | سجل النشاطات (Super Admin فقط) |

> **ملاحظة:** Admin Layout يتحقق من الصلاحيات تلقائياً ويُخفي العناصر غير المصرح بها ويُعيد التوجيه إن لزم.

---

## 4. قاعدة البيانات (Schema Analysis)

### 4.1 الجداول الرئيسية

```
profiles          - بيانات المستخدم الأساسية (role: employer/seeker/admin)
employers         - تفاصيل صاحب العمل (company_name, logo, description, ...)
seekers           - تفاصيل الباحث (job_title, skills, cv_url, resume_data, experience_years, is_available)
jobs              - الوظائف المنشورة (status: pending/approved/rejected/closed/expired)
applications      - طلبات التقديم (status pipeline: قيد المراجعة → قائمة مختصرة → مقابلة → مقبول/لم يتم التوظيف)
notifications     - إشعارات النظام
articles          - مقالات المدونة (status: draft/pending_approval/published/rejected)
user_subscriptions - اشتراكات المستخدمين (status: active/pending/expired/canceled/free)
subscription_plans - تعريف الباقات المتاحة
messages          - الرسائل الداخلية (بين المستخدمين + broadcast من الإدارة)
support_tickets   - تذاكر الدعم الفني
ticket_replies    - ردود التذاكر
advertisements    - الإعلانات (image/video، status: pending/approved/rejected)
job_alerts        - تنبيهات الوظائف (keyword, category, location)
platform_settings - إعدادات المنصة العامة (site_name, logo_url, primary_color, maintenance_mode, bank_details, wallet_qr_url)
admin_roles       - أدوار الإدارة المخصصة
admin_permissions - تعريف الصلاحيات
admin_role_permissions - ربط الأدوار بالصلاحيات
admin_audit_logs  - سجل العمليات الإدارية
```

### 4.2 Row Level Security (RLS) Policies

- **profiles:** الجميع يقرأ، المستخدم يعدل/يحذف ملفه فقط.
- **employers/seekers:** الجميع يقرأ، المالك فقط يعدل.
- **jobs:** الجميع يرى المعتمدة (approved)، صاحب العمل يرى وظائفه، الأدمن يرى الكل.
- **applications:** صاحب العمل يرى طلبات وظائفه فقط، الباحث يرى طلباته.
- **articles:** الجميع يرى المنشور، الأدمن يرى الكل، الكاتب يرى مقالاته.
- **advertisements:** المعتمدة فقط للعامة، صاحبها يراها، الأدمن يرى الكل.
- **messages:** المرسل/المستقبل فقط (مع استثناء anonymous contact form).

### 4.3 Triggers (المحفزات التلقائية)

1. **`on_application_created`** → يُرسل إشعار لصاحب العمل عند تقديم جديد.
2. **`on_application_updated`** → يُرسل إشعار للباحث عند تغيير حالة طلبه.
3. **`on_job_approved_alert`** → يُرسل إشعارات لمشتركي "تنبيهات الوظائف" عند نشر وظيفة جديدة مطابقة.
4. **`on_auth_user_email_updated`** → يُزامن بريد المستخدم بين auth.users و profiles.
5. **`on_articles_updated`** → يحدث updated_at تلقائياً.

---

## 5. نظام الأمان والصلاحيات (Security & Permissions)

### 5.1 سياسات الأمان العامة

- **CSP Headers:** مُفعّلة في `next.config.ts` مع تقييد مصادر JavaScript, styles, images, connect, frame.
- **X-Frame-Options:** DENY (منع الـ Clickjacking).
- **X-Content-Type-Options:** nosniff.
- **Strict-Transport-Security:** HSTS مع preload.
- **Permissions-Policy:** كاميرا، ميكروفون، GPS مغلقة.
- **Referrer-Policy:** strict-origin-when-cross-origin.

### 5.2 التحقق من الملفات (File Security)

ملف مركزي: `src/lib/file-security.ts`

| النوع | الامتدادات المسموحة | الحد الأقصى |
|-------|---------------------|-------------|
| Avatar | JPG, PNG, WebP, GIF | 3 MB |
| Image (general) | JPG, PNG, WebP | 5 MB |
| CV / Resume | PDF فقط | 5 MB |
| Receipt (إيصالات) | JPG, PNG, WebP, PDF | 5 MB |

**التحقق يشمل:**
1. MIME type check.
2. File extension double-check (منع spoofing).
3. File size limit.
4. Zero-byte file rejection.

### 5.3 Rate Limiting

- مكتبة: `src/lib/rate-limit.ts`
- يستخدم Upstash Redis في الإنتاج، و fallback إلى in-memory Map في التطوير.
- يُحسب حسب IP أو userId.

### 5.4 نظام الأدوار (RBAC) في الإدارة

**الجداول:**
- `admin_roles`: تعريف الدور (مثال: مدير محتوى، مدير مالي).
- `admin_permissions`: تعريف الصلاحية (مثال: `articles:manage`, `users:manage`).
- `admin_role_permissions`: ربط الدور بالصلاحيات.

**طريقة عمل الصلاحيات:**
- Super Admin: `admin_role_id IS NULL` → صلاحيات كاملة.
- Moderator: لديه `admin_role_id` معين → صلاحيات محددة فقط.
- التحقق يتم في `verifyAdmin()` و `adminGuard()`.
- **Audit Logging:** كل عملية إدارية تُسجل في `admin_audit_logs` مع IP واسم المشرف والتفاصيل.

### 5.5 إنشاء مشرف جديد

- Endpoint: `POST /api/admin/users/create-moderator`
- يتطلب: `users:manage` + Captcha/Auth.
- يُنشئ مستخدم في Supabase Auth ببريد وهمي (`username@admin.local`).
- يُحدث `profiles` ليصبح `role = 'admin'` مع `admin_role_id` المختار.

---

## 6. الفلو (Flow) والتزامن

### 6.1 فلو تسجيل حساب جديد

```
Visitor
  → /auth/signup
  → اختيار الدور (seeker / employer)
  → إدخال الاسم + البريد + كلمة المرور (6 أحف minimum)
  → Turnstile Captcha
  → الموافقة على الشروط
  → Supabase Auth signUp
  → إذا لم يُرجع session: يُطلب تأكيد البريد
  → إذا employer: redirect إلى /pricing
  → إذا seeker: redirect إلى /dashboard
```

### 6.2 فلو نشر وظيفة (Employer)

```
Employer
  → /post-job (أو /dashboard/jobs → نشر جديد)
  → التحقق من اكتمال ملف المنشأة (logo, phone, email, city, name)
  → التحقق من حد الوظائف في الباقة (job_limit)
  → تعبئة النموذج: title, category, type, location, description, salary, whatsapp
  → createJob Server Action
  → إذا employer موثق (is_verified): الوظيفة approved مباشرة
  → إذا غير موثق: الوظيفة pending لمراجعة الإدارة
  → إشعار للأدمن
  → revalidatePath('/jobs', '/dashboard')
```

### 6.3 فلو التقديم على وظيفة (Seeker)

```
Seeker
  → تصفح الوظائف (/jobs)
  → فتح تفاصيل الوظيفة (/jobs/[id])
  → التحقق من اكتمال الملف (completionPercent >= 90%)
  → applyToJob Server Action
  → إشعار لصاحب العمل
  → Trigger: on_application_created
  → حالة الطلب: "قيد المراجعة"
```

### 6.4 فلو إدارة المتقدمين (Employer Hiring Pipeline)

```
قيد المراجعة
    ↓ (Employer يحدّث الحالة)
قائمة مختصرة (Shortlist)
    ↓
مقابلة (Interview - مع إمكانية تحديد التاريخ والموقع والملاحظات)
    ↓
مقبول (Accepted) → يرسل إشعار تهنئة للباحث + يُغلق الوظيفة تلقائياً (status: filled)
    ↓
أو: لم يتم التوظيف (Rejected) → يرسل إشعار للباحث + يبقى متاحاً للباقي
```

### 6.5 فلو فريق العمل (Team)

- عندما يصبح طلب التقديم بـ `status = 'مقبول'`، يظهر الموظف في `/dashboard/team`.
- صاحب العمل يستطيع:
  - مراجعة بيانات الموظف بالكامل (CV، مهارات، تواصل).
  - مراسلته عبر `/messages`.
  - **إنهاء العمل** (Terminate) → يتحول status إلى `لم يتم التوظيف` + إشعار للموظف.

### 6.6 فلو الرسائل (Messages)

- **Real-time:** عبر `supabase.channel` مع `postgres_changes` على جدول messages.
- **Optimistic UI:** الرسالة تظهر فوراً قبل تأكيد السيرفر.
- **Seeker Protection:** الباحث لا يستطيع إرسال رسالة أولى إلا إذا كان موثقاً (verified) أو تلقى رسالة من صاحب العمل أولاً.
- **Broadcast:** الإدارة تستطيع إرسال إعلانات لجميع المستخدمين.

---

## 7. نظام رفع الملفات والصور

### 7.1 مكونات الرفع

| المكون | المسار | الاستخدام |
|--------|--------|----------|
| `AvatarUpload` | `src/components/AvatarUpload.tsx` | رفع صورة الملف الشخصي (مع ضغط تلقائي إلى 500KB) |
| `ImageUpload` | `src/components/ImageUpload.tsx` | رفع صور عامة (مقالات، غلاف، إلخ) |
| رفع يدوي | Dashboard Pages | إعلانات، إيصالات دفع |

### 7.2 Storage Buckets

| Bucket | الوصول | الاستخدام |
|--------|--------|----------|
| `avatars` | Public | صور الملفات الشخصية |
| `payment_receipts` | Public (مع signed URLs) | إيصالات الدفع للاشتراكات |
| `article_images` | Public | صور مقالات المدونة |
| `ads` | Public | إعلانات الصور/الفيديو |
| `platform_assets` | Public | أصول المنصة العامة |

### 7.3 سياسات التخزين (Storage RLS)

- **Avatar:** المستخدم يستطيع رفع/تعديل/حذف صوره فقط (foldername = auth.uid).
- **Receipts:** نفس المنطق.
- **Article images:** نفس المنطق.
- **Ads / Platform assets:** الأدمن فقط يستطيع الرفع، الجميع يستطيع القراءة.

---

## 8. اللوجو والهوية البصرية

### 8.1 مواقع اللوجو

| الملف | المسار | الاستخدام |
|-------|--------|----------|
| Logo PNG | `/public/logo.png` | Navbar, Admin Sidebar, Signup page, PWA icons |
| Favicon ICO | `/public/favicon.ico` | Browser tab icon |
| Apple Icon | `/public/apple-icon.png` | iOS home screen |
| Icons (PWA) | `/public/icons/` | 72x72 حتى 512x512 للـ manifest |
| Manifest | `/public/manifest.json` | PWA configuration |
| Service Worker | `/public/sw.js` | Push notifications & offline caching |

### 8.2 إعدادات المنصة القابلة للتخصيص

جدول `platform_settings` يحتوي على:
- `site_name` (افتراضي: Hello Staff)
- `logo_url` (يمكن تغييره من الإدارة)
- `primary_color` (افتراضي: #0f766e)
- `maintenance_mode` (true/false)
- `wallet_qr_url` (رمز QR للمحفظة الإلكترونية)
- `bank_details` (تفاصيل الحساب البنكي للتحويل)

---

## 9. نظام الباقات والاشتراكات

### 9.1 جدول الباقات (`subscription_plans`)

| الحقل | الوصف |
|-------|-------|
| `name` | اسم الباقة |
| `price` | السعر (شيكل) |
| `job_limit` | عدد الوظائف المسموح نشرها |
| `duration_days` | مدة الباقة بالأيام |
| `max_articles_per_month` | عدد المقالات المسموح بنشرها |
| `allow_articles` | هل يسمح بنشر مقالات |
| `featured_listings` | هل الوظائف تظهر بشكل مميز |
| `allow_ads` | هل يسمح بإنشاء إعلانات |
| `is_active` | هل الباقة متاحة للعرض |

### 9.2 الباقات الافتراضية (Seed Data)

1. **باقة مجانية** - ₪0 - 1 وظيفة - 30 يوم
2. **باقة أساسية** - ₪49 - 5 وظائف - 30 يوم
3. **باقة احترافية** - ₪149 - 20 وظيفة - 30 يوم
4. **باقة مؤسسات** - ₪399 - 999 وظيفة - 30 يوم

### 9.3 فلو الاشتراك

```
Employer
  → /pricing
  → عرض الباقات النشطة (من subscription_plans)
  → اختيار الباقة
  → إذا سعر = 0: تفعيل فوري (status: free)
  → إذا سعر > 0:
    → عرض طرق الدفع (تحويل بنكي + QR محفظة)
    → رفع إيصال الدفع (validateReceiptFile)
    → حفظ في `payment_receipts` bucket
    → إنشاء subscription بـ status: pending
    → إشعار للإدارة
  → Admin Panel (/admin/subscriptions)
    → مراجعة الإيصال
    → إما: تفعيل (active) مع تحديد plan_id و dates
    → أو: رفض (rejected)
```

### 9.4 مدة الاشتراك وانتهاء الصلاحية

- **`starts_at`**: تاريخ بدء الاشتراك.
- **`ends_at`**: تاريخ الانتهاء (يُحسب من duration_days).
- **الانتهاء التلقائي:** لا يوجد Cron job واضح في الكود الحالي للتحقق التلقائي من `ends_at`. الإدارة تتحكم يدوياً أو يمكن إضافة Edge Function.
- **الحد الوظيفي:** يُحسب ديناميكياً عبر `useSubscription` ويمنع النشر عند الوصول للحد.

---

## 10. المدونة والإعلانات

### 10.1 المدونة (Blog / Articles)

- **الكتابة:** Employer يكتب مقال في `/dashboard/articles`.
- **المراجعة:** المقال يدخل بـ `status: pending_approval`.
- **النشر:** Admin يوافق عليه في `/admin/articles` → يصبح `published`.
- **العرض:** يظهر في `/blog` وفي الصفحة الرئيسية.
- **الحد:** يتحكم فيه `max_articles_per_month` في الباقة.

### 10.2 الإعلانات (Advertisements)

- **الإنشاء:** Employer ينشئ إعلان في `/dashboard/ads`.
- **النوع:** صورة (`image`) أو فيديو (`video`).
- **المراجعة:** Admin يوافق/يرفض في `/admin/ads`.
- **العرض:** الإعلانات المعتمدة تظهر في الصفحة الرئيسية عبر `AdsCarousel`.
- **الإلغاء:** Employer يطلب إلغاء (`cancellation_requested`) و Admin يوافق.

---

## 11. الأكواد والملفات الضرورية وغير الضرورية

### 11.1 الملفات الضرورية (Core Files)

```
next.config.ts              ← إعدادات Next.js والـ Security Headers
src/app/layout.tsx          ← Root layout مع SEO meta tags
src/app/page.tsx            ← الصفحة الرئيسية
src/app/LayoutBody.tsx      ← Navbar, Footer, Notifications, PWA prompts
src/lib/supabase.ts         ← Browser Client
src/lib/supabase-server.ts  ← Server Client (SSR)
src/lib/supabase-admin.ts   ← Admin Client (Service Role)
src/lib/admin-auth.ts       ← نظام صلاحيات الإدارة
src/lib/file-security.ts    ← التحقق من الملفات
src/lib/rate-limit.ts       ← حماية الطلبات
src/hooks/useAuth.ts        ← إدارة الجلسة والدخول
src/hooks/useSubscription.ts ← إدارة الاشتراكات
supabase/schema.sql         ← كامل تعريف قاعدة البيانات + RLS + Triggers
supabase/seed.sql           ← البيانات الابتدائية
public/manifest.json        ← PWA manifest
public/sw.js                ← Service Worker
```

### 11.2 ملفات مهمة ولكنها إضافية

```
src/app/actions/*.ts        ← Server Actions (jobs, applications, profile, ...)
src/app/api/admin/**/*.ts   ← API routes للإدارة
src/components/AvatarUpload.tsx
src/components/ImageUpload.tsx
src/components/SearchBox.tsx
src/components/ApplicantModal.tsx
src/components/NotificationsDropdown.tsx
src/app/admin/(panel)/AdminLayoutClient.tsx
src/app/dashboard/page.tsx  ← لوحة التحكم الرئيسية
```

### 11.3 ملفات قد تكون غير ضرورية أو تحتاج تنظيف

| الملف/المجلد | السبب |
|-------------|-------|
| `supabase/cleanup-jobs.sql` | سكربت تنظيف لمرة واحدة - يمكن أرشفته |
| `supabase/migration_add_interview_fields.sql` | Migration قديمة - تم دمجها في schema.sql |
| `supabase/.temp/` | ملفات مؤقتة - يمكن حذفها |
| `src/test/setup.ts` | إعداد Vitest فارغ تقريباً |
| `staffps_fix_guide.md` | ملف مساعدة خارجي - يمكن نقله لـ docs/ |
| `.playwright-mcp/` | سجلات Playwright - يمكن إضافتها لـ .gitignore |
| `.next/` | build output - يجب أن يكون في .gitignore |

### 11.4 اقتراحات لتحسين البنية

1. **نقل migrations** إلى `supabase/migrations/` بدلاً من root.
2. **إنشاء `docs/`** لوضع `staffps_fix_guide.md` وغيره.
3. **تنظيف `.playwright-mcp/`** من Git.
4. **إضافة Edge Function** لـ Cron Job لفحص انتهاء الاشتراكات تلقائياً.

---

## 12. ملخص النقاط الحرجة والتوصيات

### ✅ نقاط القوة
- أمان شامل: CSP, HSTS, Turnstile, File Validation, RLS.
- نظام صلاحيات RBAC متكامل للإدارة.
- Real-time messaging مع protection للـ seekers.
- CV Builder مدمج مع preview وتصدير PDF.
- Pipeline واضح لإدارة التوظيف.
- PWA كامل مع Service Worker و Push Notifications.
- Audit Logging لكل عمليات الإدارة.

### ⚠️ نقاط تحتاج اهتمام
1. **انتهاء الاشتراكات تلقائياً:** لا يوجد mechanism واضح للتحقق من `ends_at` وتحديث status إلى `expired`.
2. **إدارة الملفات الزائدة:** بعض الملفات (مثل `.playwright-mcp/`) غير مغطاة بـ `.gitignore`.
3. **Zod Validation:** مستورد ولكن الاستخدام محدود جداً في Server Actions (تعتمد على manual validation).
4. **Error Handling:** بعض الأماكن تستخدم `alert()` بدلاً من toast notifications.
5. **Database Cleanup:** لا يوجد Cron job لتنظيف الإشعارات القديمة أو الاشتراكات المنتهية.

### 🔧 توصيات تقنية
- إضافة **Edge Function** أو **pg_cron** للتحقق اليومي من انتهاء الاشتراكات.
- استخدام **Zod schemas** بشكل أوسع في Server Actions.
- استبدال `alert()` بـ **Toast Notification System** موحد.
- إضافة **Soft Delete** للوظائف بدلاً من `DELETE` المباشر (حالياً deleteJob يحذف نهائياً).

---

**نهاية التقرير**
