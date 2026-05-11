-- Migration: fix_naked_auth_uid_in_rls
-- Date: 2026-05-11
-- Description: توحيد سياسات RLS المتبقية وتغليف auth.uid() داخل SELECT
--              لتحسين أداء استعلامات PostgreSQL

-- ============================================================
-- 1. جدول profiles
-- ============================================================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT
WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE
USING ((select auth.uid()) = id);

-- ============================================================
-- 2. جدول seekers
-- ============================================================
DROP POLICY IF EXISTS "Public seekers viewable by everyone." ON public.seekers;
DROP POLICY IF EXISTS "Seekers can insert their own data." ON public.seekers;
DROP POLICY IF EXISTS "Seekers can update own data." ON public.seekers;
DROP POLICY IF EXISTS "seekers_select_policy" ON public.seekers;
DROP POLICY IF EXISTS "seekers_insert_policy" ON public.seekers;
DROP POLICY IF EXISTS "seekers_update_policy" ON public.seekers;

CREATE POLICY "seekers_select_policy" ON public.seekers FOR SELECT
USING (true);

CREATE POLICY "seekers_insert_policy" ON public.seekers FOR INSERT
WITH CHECK ((select auth.uid()) = profile_id);

CREATE POLICY "seekers_update_policy" ON public.seekers FOR UPDATE
USING ((select auth.uid()) = profile_id);

-- ============================================================
-- 3. جدول employers
-- ============================================================
DROP POLICY IF EXISTS "Public employers viewable by everyone." ON public.employers;
DROP POLICY IF EXISTS "Employers can insert their own data." ON public.employers;
DROP POLICY IF EXISTS "Employers can update own data." ON public.employers;
DROP POLICY IF EXISTS "employers_select_policy" ON public.employers;
DROP POLICY IF EXISTS "employers_insert_policy" ON public.employers;
DROP POLICY IF EXISTS "employers_update_policy" ON public.employers;

CREATE POLICY "employers_select_policy" ON public.employers FOR SELECT
USING (true);

CREATE POLICY "employers_insert_policy" ON public.employers FOR INSERT
WITH CHECK ((select auth.uid()) = profile_id);

CREATE POLICY "employers_update_policy" ON public.employers FOR UPDATE
USING ((select auth.uid()) = profile_id);

-- ============================================================
-- 4. جدول applications
-- ============================================================
DROP POLICY IF EXISTS "Seekers can view own applications." ON public.applications;
DROP POLICY IF EXISTS "Employers can view applications for their jobs." ON public.applications;
DROP POLICY IF EXISTS "Admins can view all applications." ON public.applications;
DROP POLICY IF EXISTS "Seekers can insert applications." ON public.applications;
DROP POLICY IF EXISTS "Employers can update application status." ON public.applications;
DROP POLICY IF EXISTS "Admins can update applications." ON public.applications;
DROP POLICY IF EXISTS "applications_select_policy" ON public.applications;
DROP POLICY IF EXISTS "applications_insert_policy" ON public.applications;
DROP POLICY IF EXISTS "applications_update_policy" ON public.applications;

CREATE POLICY "applications_select_policy" ON public.applications FOR SELECT
USING (
  (select auth.uid()) = seeker_id
  OR EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = job_id AND j.employer_id = (select auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "applications_insert_policy" ON public.applications FOR INSERT
WITH CHECK (
  (select auth.uid()) = seeker_id
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'seeker'
  )
);

CREATE POLICY "applications_update_policy" ON public.applications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = job_id AND j.employer_id = (select auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

-- ============================================================
-- 5. جدول notifications
-- ============================================================
DROP POLICY IF EXISTS "Users can view own notifications." ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications." ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications." ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications." ON public.notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON public.notifications;

CREATE POLICY "notifications_select_policy" ON public.notifications FOR SELECT
USING (
  (select auth.uid()) = user_id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "notifications_insert_policy" ON public.notifications FOR INSERT
WITH CHECK (
  (select auth.uid()) = user_id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "notifications_update_policy" ON public.notifications FOR UPDATE
USING (
  (select auth.uid()) = user_id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "notifications_delete_policy" ON public.notifications FOR DELETE
USING (
  (select auth.uid()) = user_id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

-- ============================================================
-- 6. جدول job_alerts
-- ============================================================
DROP POLICY IF EXISTS "Users can view own job alerts." ON public.job_alerts;
DROP POLICY IF EXISTS "Users can insert own job alerts." ON public.job_alerts;
DROP POLICY IF EXISTS "Users can update own job alerts." ON public.job_alerts;
DROP POLICY IF EXISTS "Users can delete own job alerts." ON public.job_alerts;
DROP POLICY IF EXISTS "job_alerts_select_policy" ON public.job_alerts;
DROP POLICY IF EXISTS "job_alerts_insert_policy" ON public.job_alerts;
DROP POLICY IF EXISTS "job_alerts_update_policy" ON public.job_alerts;
DROP POLICY IF EXISTS "job_alerts_delete_policy" ON public.job_alerts;

CREATE POLICY "job_alerts_select_policy" ON public.job_alerts FOR SELECT
USING ((select auth.uid()) = user_id);

CREATE POLICY "job_alerts_insert_policy" ON public.job_alerts FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "job_alerts_update_policy" ON public.job_alerts FOR UPDATE
USING ((select auth.uid()) = user_id);

CREATE POLICY "job_alerts_delete_policy" ON public.job_alerts FOR DELETE
USING ((select auth.uid()) = user_id);
