-- Migration: fix_profiles_data_leak
-- Date: 2026-05-13
-- Description: إصلاح تسريب بيانات المستخدمين في جدول profiles

-- ============================================================
-- 1. تعديل سياسة profiles_select_policy
-- ============================================================
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

-- المستخدم يقرأ ملفه الشخصي فقط، المشرف يقرأ كل شيء
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT
USING (
  (select auth.uid()) = id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

-- ============================================================
-- 2. إنشاء view للبيانات العامة
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

-- منح صلاحية القراءة للجميع على الـ View
GRANT SELECT ON public.public_profiles TO anon, authenticated;
