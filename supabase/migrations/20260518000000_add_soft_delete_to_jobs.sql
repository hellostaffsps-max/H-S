-- Migration: Add soft delete support to jobs table
-- Date: 2026-05-18

-- 1. Add deleted_at column
alter table public.jobs
  add column if not exists deleted_at timestamp with time zone;

-- 2. Create index for performance
create index if not exists idx_jobs_deleted_at on public.jobs(deleted_at);

-- 3. Update existing policies to exclude soft-deleted jobs
-- Policy: Approved jobs viewable by everyone (exclude deleted)
drop policy if exists "Approved jobs viewable by everyone." on public.jobs;
create policy "Approved jobs viewable by everyone."
  on public.jobs for select
  using (status = 'approved' and deleted_at is null);

-- Policy: Employers can view own jobs (exclude deleted)
drop policy if exists "Employers can view own jobs." on public.jobs;
create policy "Employers can view own jobs."
  on public.jobs for select
  using (auth.uid() = employer_id and deleted_at is null);

-- Policy: Admins can view all jobs (they see deleted too for moderation)
drop policy if exists "Admins can view all jobs." on public.jobs;
create policy "Admins can view all jobs."
  on public.jobs for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 4. Policy for soft delete: employers can only soft-delete their own jobs
drop policy if exists "Employers can update own jobs." on public.jobs;
create policy "Employers can update own jobs."
  on public.jobs for update
  using (auth.uid() = employer_id and deleted_at is null)
  with check (auth.uid() = employer_id);

-- 5. Admin can update any job (including soft-deleted for restoration)
drop policy if exists "Admins can update any job." on public.jobs;
create policy "Admins can update any job."
  on public.jobs for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 6. Admin can delete any job (hard delete)
drop policy if exists "Admins can delete any job." on public.jobs;
create policy "Admins can delete any job."
  on public.jobs for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
