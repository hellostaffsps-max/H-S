-- Migration: implement_rbac_schema
-- Date: 2026-05-11
-- Description: Core tables and functions for Granular Admin RBAC

-- 1. Create Permissions Table
CREATE TABLE IF NOT EXISTS public.admin_permissions (
    id text PRIMARY KEY,
    name_ar text NOT NULL,
    category text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 2. Create Admin Roles Table
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
);

-- 3. Create Role-Permissions Link Table
CREATE TABLE IF NOT EXISTS public.admin_role_permissions (
    role_id uuid REFERENCES public.admin_roles(id) ON DELETE CASCADE,
    permission_id text REFERENCES public.admin_permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 4. Add admin_role_id to profiles
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='profiles' AND COLUMN_NAME='admin_role_id') THEN
        ALTER TABLE public.profiles ADD COLUMN admin_role_id uuid REFERENCES public.admin_roles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 5. Permission Check Function
CREATE OR REPLACE FUNCTION public.has_permission(required_perm text)
RETURNS boolean AS $$
DECLARE
    user_role text;
    user_admin_role_id uuid;
BEGIN
    SELECT role, admin_role_id INTO user_role, user_admin_role_id 
    FROM public.profiles 
    WHERE id = (select auth.uid());

    IF user_role = 'admin' AND user_admin_role_id IS NULL THEN
        RETURN true;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.admin_role_permissions
        WHERE role_id = user_admin_role_id
        AND permission_id = required_perm
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Insert Default Permissions
INSERT INTO public.admin_permissions (id, name_ar, category) VALUES
('users:view', 'عرض المستخدمين', 'المستخدمين'),
('users:manage', 'إدارة المستخدمين', 'المستخدمين'),
('jobs:manage', 'إدارة الوظائف والموافقة عليها', 'الوظائف'),
('articles:manage', 'إدارة المقالات والمدونة', 'المحتوى'),
('ads:manage', 'إدارة الإعلانات والبانرات', 'الإعلانات'),
('support:manage', 'إدارة تذاكر الدعم والدردشة', 'الدعم'),
('payments:view', 'عرض الاشتراكات والمدفوعات', 'المالية'),
('broadcast:send', 'إرسال الإشعارات الجماعية', 'التواصل'),
('roles:manage', 'إدارة الأدوار والصلاحيات', 'النظام')
ON CONFLICT (id) DO UPDATE SET name_ar = EXCLUDED.name_ar, category = EXCLUDED.category;

-- 7. Enable RLS
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_role_permissions ENABLE ROW LEVEL SECURITY;

-- 8. Policies
CREATE POLICY "Admins can view permissions" ON public.admin_permissions FOR SELECT TO authenticated USING (public.has_permission('roles:manage'));
CREATE POLICY "Admins can view roles" ON public.admin_roles FOR SELECT TO authenticated USING (public.has_permission('roles:manage'));
CREATE POLICY "Admins can manage roles" ON public.admin_roles FOR ALL TO authenticated USING (public.has_permission('roles:manage'));
CREATE POLICY "Admins can view role_perms" ON public.admin_role_permissions FOR SELECT TO authenticated USING (public.has_permission('roles:manage'));
CREATE POLICY "Admins can manage role_perms" ON public.admin_role_permissions FOR ALL TO authenticated USING (public.has_permission('roles:manage'));
