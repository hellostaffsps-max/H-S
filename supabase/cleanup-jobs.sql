-- ==========================================
-- CLEANUP: Delete fake / non-hospitality jobs
-- Run this FIRST in Supabase SQL Editor
-- ==========================================

-- Delete jobs with clearly non-hospitancy categories
DELETE FROM public.jobs 
WHERE category IN (
  'Driving', 'Maintenance', 'Accounting', 'Home Care', 
  'Security', 'Cleaning', 'Sales', 'Marketing', 'IT', 
  'Engineering', 'Teaching', 'Medical', 'Other',
  'محاسبة', 'صيانة', 'تكييف', 'سائق', 'سكرتارية',
  'مربية', 'تدريس', 'طب', 'تمريض', 'أمن', 'نظافة',
  'مبيعات', 'تسويق', 'هندسة', 'تقنية معلومات'
);

-- Delete jobs with non-hospitality keywords in title
DELETE FROM public.jobs 
WHERE title ILIKE '%سائق%'
   OR title ILIKE '%محاسب%'
   OR title ILIKE '%مربية%'
   OR title ILIKE '%فني%'
   OR title ILIKE '%تكييف%'
   OR title ILIKE '%صيانة%'
   OR title ILIKE '%سكرتير%'
   OR title ILIKE '%محامي%'
   OR title ILIKE '%مهندس%'
   OR title ILIKE '%معلم%'
   OR title ILIKE '%طبيب%'
   OR title ILIKE '%ممرض%'
   OR title ILIKE '%أمن%'
   OR title ILIKE '%نظافة%'
   OR title ILIKE '%مبيعات%'
   OR title ILIKE '%تسويق%'
   OR title ILIKE '%IT%'
   OR title ILIKE '%مهندس%'
   OR title ILIKE '%محامي%'
   OR title ILIKE '%سكرتيرة%'
   OR title ILIKE '%HR%'
   OR title ILIKE '%موارد بشرية%';

-- Delete jobs posted for private families / villas (not restaurants/cafes/hotels)
DELETE FROM public.jobs 
WHERE company_name ILIKE '%عائلة%'
   OR company_name ILIKE '%فيلا%'
   OR company_name ILIKE '%منزل%'
   OR company_name ILIKE '%بيت%'
   OR company_name ILIKE '%خاص%'
   OR company_name ILIKE '%شركة الأندلس%'
   OR company_name ILIKE '%مكتب استشارات%'
   OR company_name ILIKE '%شركة صيانة%'
   OR company_name ILIKE '%شركة نظافة%'
   OR company_name ILIKE '%شركة أمن%'
   OR company_name ILIKE '%مؤسسة%'
   OR company_name ILIKE '%مصنع%'
   OR company_name ILIKE '%مستشفى%'
   OR company_name ILIKE '%عيادة%'
   OR company_name ILIKE '%مدرسة%'
   OR company_name ILIKE '%جامعة%';

-- Delete remaining jobs that don't have a clear hospitality category
DELETE FROM public.jobs 
WHERE category NOT IN (
  'طاهي/ة', 'نادل/ة', 'باريستا', 'كاشير', 
  'مدير', 'توصيل', 'مضيف/ة', 'أخرى',
  'chef', 'waiter', 'barista', 'cashier', 
  'manager', 'delivery', 'host', 'kitchen_helper',
  'restaurant_manager', 'other_hospitality',
  'مساعد مطبخ', 'مدير مطعم'
);

-- Also delete by English title keywords that slipped through
DELETE FROM public.jobs 
WHERE title ILIKE '%driver%'
   OR title ILIKE '%accountant%'
   OR title ILIKE '%nanny%'
   OR title ILIKE '%technician%'
   OR title ILIKE '%maintenance%'
   OR title ILIKE '%secretary%'
   OR title ILIKE '%lawyer%'
   OR title ILIKE '%engineer%'
   OR title ILIKE '%teacher%'
   OR title ILIKE '%doctor%'
   OR title ILIKE '%nurse%'
   OR title ILIKE '%security%'
   OR title ILIKE '%cleaner%'
   OR title ILIKE '%sales%'
   OR title ILIKE '%marketing%'
   OR title ILIKE '%private%'
   OR title ILIKE '%villa%'
   OR title ILIKE '%family%';

-- Clean up orphaned notifications about deleted jobs
DELETE FROM public.notifications 
WHERE message ILIKE '%سائق%'
   OR message ILIKE '%محاسب%'
   OR message ILIKE '%مربية%'
   OR message ILIKE '%فني تكييف%'
   OR message ILIKE '%صيانة%'
   OR message ILIKE '%عائلة%'
   OR message ILIKE '%فيلا%'
   OR message ILIKE '%شركة الأندلس%';
