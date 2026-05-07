-- Migration: Add interview fields to applications table
-- Run this in Supabase SQL Editor

-- 1. Add interview columns
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS interview_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS interview_location text,
  ADD COLUMN IF NOT EXISTS interview_notes text;

-- 2. Update status check constraint to include all workflow stages
ALTER TABLE public.applications 
  DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE public.applications 
  ADD CONSTRAINT applications_status_check 
  CHECK (status IN ('قيد المراجعة', 'مراجعة', 'قائمة مختصرة', 'مقابلة', 'تجربة عمل', 'مقبول', 'مرفوض'));
