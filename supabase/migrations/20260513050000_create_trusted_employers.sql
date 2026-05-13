-- Migration: create trusted_employers table for homepage carousel
-- Date: 2026-05-13

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.trusted_employers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.trusted_employers ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DROP POLICY IF EXISTS "trusted_employers_select_policy" ON public.trusted_employers;
CREATE POLICY "trusted_employers_select_policy"
  ON public.trusted_employers FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "trusted_employers_admin_policy" ON public.trusted_employers;
CREATE POLICY "trusted_employers_admin_policy"
  ON public.trusted_employers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_trusted_employers_active ON public.trusted_employers(is_active);
CREATE INDEX IF NOT EXISTS idx_trusted_employers_order ON public.trusted_employers(display_order);
