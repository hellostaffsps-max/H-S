-- Migration: Add soft delete to applications
-- Date: 2026-05-19

-- 1. Add deleted_at to applications
alter table public.applications
  add column if not exists deleted_at timestamp with time zone;

create index if not exists idx_applications_deleted_at on public.applications(deleted_at);

-- 2. Update RLS policies for applications
drop policy if exists "Employers can see applications to their jobs" on public.applications;
create policy "Employers can see applications to their jobs" 
  on public.applications for select using (
    deleted_at is null and (
      exists (select 1 from public.jobs where jobs.id = job_id and jobs.employer_id = auth.uid())
      or auth.uid() = seeker_id
    )
  );

drop policy if exists "Employers can update applications to their jobs" on public.applications;
create policy "Employers can update applications to their jobs" 
  on public.applications for update using (
    deleted_at is null and
    exists (select 1 from public.jobs where jobs.id = job_id and jobs.employer_id = auth.uid())
  ) with check (
    exists (select 1 from public.jobs where jobs.id = job_id and jobs.employer_id = auth.uid())
  );

-- Replace the hard delete policy with a soft delete policy for seekers
drop policy if exists "Seekers can delete own applications." on public.applications;
create policy "Seekers can delete own applications (Soft Delete)" 
  on public.applications for update 
  using (auth.uid() = seeker_id);

-- Wait, the seeker also needs to be able to see their own applications, which is handled by the first policy.
