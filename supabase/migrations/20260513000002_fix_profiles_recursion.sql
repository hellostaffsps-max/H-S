-- Migration: fix_profiles_recursion
-- Date: 2026-05-13
-- Description: إصلاح infinite recursion في profiles_select_policy

-- ============================================================
-- 1. إصلاح public_profiles ليكون عاماً بدون RLS
-- ============================================================
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  location,
  role,
  created_at
FROM public.profiles;

-- جعل الـ View يعمل بصلاحيات postgres (بدون RLS)
ALTER VIEW public.public_profiles OWNER TO postgres;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- ============================================================
-- 2. إنشاء دالة SECURITY DEFINER للتحقق من Admin
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- إلغاء صلاحية anon من استخدام الدالة
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================================
-- 2. إعادة إنشاء profiles_select_policy بدون recursion
-- ============================================================
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT
USING (
  auth.uid() = id
  OR public.is_admin()
);

-- ============================================================
-- 3. إعادة إنشاء user_subscriptions_insert_policy بدون recursion
-- ============================================================
DROP POLICY IF EXISTS "user_subscriptions_insert_policy" ON public.user_subscriptions;

CREATE POLICY "user_subscriptions_insert_policy" ON public.user_subscriptions FOR INSERT
WITH CHECK (
  (
    auth.uid() = user_id
    AND status IN ('pending', 'free')
  )
  OR public.is_admin()
);
