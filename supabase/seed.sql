-- ==========================================
-- SEED DATA FOR HELLO STAFF PLATFORM
-- Run this AFTER applying schema.sql
-- ==========================================

-- ==========================================
-- PLATFORM SETTINGS
-- ==========================================
insert into public.platform_settings (id, site_name, logo_url, primary_color, maintenance_mode)
values (
  uuid_generate_v4(),
  'Hello Staff',
  null,
  '#0f766e',
  false
)
on conflict (id) do update set
  site_name = excluded.site_name,
  maintenance_mode = excluded.maintenance_mode;

-- ==========================================
-- SUBSCRIPTION PLANS
-- ==========================================
insert into public.subscription_plans (name, description, price, job_limit, duration_days, max_articles_per_month)
values
  ('باقة مجانية', 'باقة البداية للباحثين عن عمل وأصحاب العمل الصغار', 0, 1, 30, 0),
  ('باقة أساسية', 'باقة مثالية لأصحاب العمل المتوسطة', 49, 5, 30, 2),
  ('باقة احترافية', 'باقة شاملة لأصحاب العمل الكبار', 149, 20, 30, 5),
  ('باقة مؤسسات', 'باقة مخصصة للمؤسسات والسلاسل الكبرى', 399, 999, 30, 10)
on conflict (id) do nothing;

-- ==========================================
-- ARTICLES
-- ==========================================
insert into public.articles (title, slug, excerpt, content, status, published_at)
values
  (
    'كيف تكتب سيرة ذاتية مثالية لقطاع الضيافة',
    'how-to-write-perfect-hospitality-cv',
    'دليل شامل لكتابة سيرة ذاتية تجذب أصحاب العمل في المطاعم والفنادق.',
    '<h2>مقدمة</h2><p>السيرة الذاتية هي أول انطباع يتكون عنك لدى صاحب العمل. في قطاع الضيافة، يجب أن تبرز مهاراتك التفاعلية وخبرتك العملية.</p><h2>العناصر الأساسية</h2><ul><li>معلومات التواصل الواضحة</li><li>ملخص مهني قصير</li><li>الخبرات العملية مع إنجازات كمية</li><li>المهارات التقنية والشخصية</li><li>الشهادات والدورات التدريبية</li></ul>',
    'published',
    now()
  ),
  (
    'نصائح للنجاح في مقابلة عمل المطعم',
    'restaurant-interview-tips',
    'استعد لمقابلة العمل في المطعم باحترافية مع هذه النصائح العملية.',
    '<h2>قبل المقابلة</h2><p>ابحث عن المطعم، قائمة الطعام، وثقافته. ارتدِ ملابس نظيفة ومهنية حتى لو كان المطعم غير رسمي.</p><h2>أثناء المقابلة</h2><ul><li>كن ودوداً وابتسم</li><li>أظهر حماسك للعمل</li><li>جهز أمثلة عن تعاملك مع المواقف الصعبة</li></ul>',
    'published',
    now()
  ),
  (
    'الفرق بين النادل المحترف والنادل العادي',
    'professional-waiter-vs-average',
    'تعرف على الصفات التي تميز النادل المحترف في قطاع الضيافة.',
    '<h2>النادل المحترف</h2><p>يتميز النادل المحترف بقدرته على قراءة الزبائن، معرفة قائمة الطعام بالتفصيل، والتعامل مع الضغوط بروية.</p>',
    'published',
    now()
  )
on conflict (slug) do nothing;

-- ==========================================
-- SAMPLE JOBS (Requires an employer user first)
-- Since we cannot create auth.users from SQL easily,
-- these are commented out. Uncomment after creating
-- an employer account via the UI.
-- ==========================================

-- To seed jobs, first create an employer account, then:
-- insert into public.jobs (employer_id, title, description, category, type, location, salary_min, salary_max, status)
-- values
--   ('EMPLOYER_UUID_HERE', 'طاهي/ة مطبخ فرنسي', 'مطلوب طاهي/ة خبرة في المطبخ الفرنسي للعمل في مطعم راقٍ برام الله.', 'طاهي/ة', 'دوام كامل', 'رام الله', 3500, 5000, 'approved'),
--   ('EMPLOYER_UUID_HERE', 'نادل/ة', 'مطلوب نادل/ة ذو خبرة في خدمة العملاء.', 'نادل/ة', 'دوام كامل', 'نابلس', 2500, 3000, 'approved'),
--   ('EMPLOYER_UUID_HERE', 'باريستا', 'مطلوب باريستا خبرة في تحضير القهوة المختصة.', 'باريستا', 'دوام جزئي', 'الخليل', 2000, 2500, 'approved'),
--   ('EMPLOYER_UUID_HERE', 'مدير مطعم', 'مطلوب مدير مطعم ذو خبرة لا تقل عن 3 سنوات.', 'مدير', 'دوام كامل', 'بيت لحم', 5000, 7000, 'approved'),
--   ('EMPLOYER_UUID_HERE', 'كاشير', 'مطلوب كاشير للعمل في كافيه بقلقيلية.', 'كاشير', 'دوام جزئي', 'قلقيلية', 2000, 2200, 'approved');
