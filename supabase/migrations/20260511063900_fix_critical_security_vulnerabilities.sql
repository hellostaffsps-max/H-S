-- ============================================================
-- Migration: fix_critical_security_vulnerabilities
-- Date: 2026-05-11
-- Description: إصلاح الثغرات الأمنية الحرجة المكتشفة في التدقيق الشامل
-- ============================================================

-- ============================================================
-- 1. إلغاء صلاحية anon من تشغيل الدوال الحساسة (SECURITY DEFINER)
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.broadcast_notification(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.broadcast_notification(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.broadcast_notification(text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.expire_old_jobs() FROM anon;
REVOKE EXECUTE ON FUNCTION public.expire_old_jobs() FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.notify_email_on_insert() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_email_on_insert() FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.notify_expiring_jobs() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_expiring_jobs() FROM PUBLIC;

-- ============================================================
-- 2. إصلاح search_path للدوال الحساسة (منع ثغرة search_path mutable)
-- ============================================================
ALTER FUNCTION public.expire_old_jobs() SET search_path = public, extensions;
ALTER FUNCTION public.handle_new_user() SET search_path = public, extensions;
ALTER FUNCTION public.broadcast_notification(text, text) SET search_path = public, extensions;
ALTER FUNCTION public.notify_email_on_insert() SET search_path = public, extensions;
ALTER FUNCTION public.notify_expiring_jobs() SET search_path = public, extensions;
ALTER FUNCTION public.archive_expired_ads() SET search_path = public, extensions;

-- ============================================================
-- 3. إصلاح سياسة resumes bucket — منع سرد الملفات للجمهور
-- ============================================================
DROP POLICY IF EXISTS "Public resumes are viewable by everyone." ON storage.objects;
DROP POLICY IF EXISTS "Owners can view own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Employers can view applicant resumes" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all resumes" ON storage.objects;

CREATE POLICY "Owners can view own resumes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes'
  AND (select auth.uid()) = owner
);

CREATE POLICY "Employers can view applicant resumes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes'
  AND EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE j.employer_id = (select auth.uid())
      AND a.seeker_id = owner
  )
);

CREATE POLICY "Admins can view all resumes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

-- ============================================================
-- 4. إصلاح سياسة ads bucket — منع سرد الملفات للجمهور
-- ============================================================
DROP POLICY IF EXISTS "Ads Media is publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Approved ads media is viewable" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all ads media" ON storage.objects;
DROP POLICY IF EXISTS "Employers can view own ads media" ON storage.objects;

CREATE POLICY "Approved ads media is viewable"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ads'
  AND EXISTS (
    SELECT 1 FROM public.advertisements
    WHERE media_url LIKE '%' || name
      AND status = 'approved'
      AND is_active = true
  )
);

CREATE POLICY "Admins can view all ads media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ads'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "Employers can view own ads media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ads'
  AND (select auth.uid()) = owner
);

-- ============================================================
-- 5. إصلاح أداء RLS في جدول advertisements (توحيد وتحسين policies)
-- ============================================================
DROP POLICY IF EXISTS "Employers can update own ads" ON public.advertisements;
DROP POLICY IF EXISTS "Admins can insert ads" ON public.advertisements;
DROP POLICY IF EXISTS "Admins can update ads" ON public.advertisements;
DROP POLICY IF EXISTS "Admins can delete ads" ON public.advertisements;
DROP POLICY IF EXISTS "Employers can insert own ads" ON public.advertisements;
DROP POLICY IF EXISTS "Employers can view own ads" ON public.advertisements;
DROP POLICY IF EXISTS "Employers can delete own ads" ON public.advertisements;
DROP POLICY IF EXISTS "Ads are viewable by everyone" ON public.advertisements;
DROP POLICY IF EXISTS "Public can view active approved ads" ON public.advertisements;
DROP POLICY IF EXISTS "Owners and admins can view all their ads" ON public.advertisements;
DROP POLICY IF EXISTS "Employers can insert ads" ON public.advertisements;
DROP POLICY IF EXISTS "Admins can insert ads" ON public.advertisements;
DROP POLICY IF EXISTS "Employers can update own ads" ON public.advertisements;
DROP POLICY IF EXISTS "Admins can update any ad" ON public.advertisements;
DROP POLICY IF EXISTS "Owners or admins can delete ads" ON public.advertisements;

CREATE POLICY "Public can view active approved ads"
ON public.advertisements FOR SELECT
USING (status = 'approved' AND is_active = true);

CREATE POLICY "Owners and admins can view all their ads"
ON public.advertisements FOR SELECT
USING (
  (select auth.uid()) = created_by
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "Employers can insert ads"
ON public.advertisements FOR INSERT
WITH CHECK (
  (select auth.uid()) = created_by
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'employer'
  )
);

CREATE POLICY "Admins can insert ads"
ON public.advertisements FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "Employers can update own ads"
ON public.advertisements FOR UPDATE
USING (
  (select auth.uid()) = created_by
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'employer'
  )
);

CREATE POLICY "Admins can update any ad"
ON public.advertisements FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "Owners or admins can delete ads"
ON public.advertisements FOR DELETE
USING (
  (select auth.uid()) = created_by
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);
