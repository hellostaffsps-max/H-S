-- Migration: add_missing_indexes
-- Date: 2026-05-11
-- Description: Add missing index for foreign key to improve query performance

CREATE INDEX IF NOT EXISTS idx_advertisements_created_by ON public.advertisements(created_by);
