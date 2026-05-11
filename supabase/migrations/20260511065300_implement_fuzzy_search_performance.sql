-- Migration: implement_fuzzy_search_performance
-- Date: 2026-05-11
-- Description: Enable pg_trgm and add GIN indexes for high-performance job search

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes for fast ILIKE searches
CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm ON public.jobs USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_jobs_description_trgm ON public.jobs USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_jobs_location_trgm ON public.jobs USING gin (location gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_jobs_category_trgm ON public.jobs USING gin (category gin_trgm_ops);

-- Performance index for filtered queries
CREATE INDEX IF NOT EXISTS idx_jobs_filters ON public.jobs (status, expires_at, created_at DESC);
