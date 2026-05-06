-- Supabase Schema for Hello Staff Recruitment
-- SECURITY HARDENED VERSION

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create Users (Profiles) Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text check (role in ('employer', 'seeker', 'admin')) not null default 'seeker',
  full_name text,
  avatar_url text,
  phone text,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Employers Detail Table
create table if not exists public.employers (
  profile_id uuid references public.profiles on delete cascade primary key,
  company_name text not null,
  description text,
  logo_url text
);

-- 3. Create Seekers Detail Table
create table if not exists public.seekers (
  profile_id uuid references public.profiles on delete cascade primary key,
  job_title text,
  bio text,
  experience_years integer,
  is_available boolean default true,
  skills text[],
  cv_url text,
  resume_data jsonb default '{}'::jsonb
);

-- 4. Create Jobs Table
create table if not exists public.jobs (
  id uuid default uuid_generate_v4() primary key,
  employer_id uuid references public.employers on delete cascade not null,
  title text not null,
  category text not null,
  type text not null,
  location text not null,
  company_name text not null,
  experience_level text,
  description text not null,
  currency text default 'ILS',
  salary_min integer,
  salary_max integer,
  whatsapp_number text,
  status text check (status in ('pending', 'approved', 'rejected', 'closed')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Create Applications Table
create table if not exists public.applications (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references public.jobs on delete cascade not null,
  seeker_id uuid references public.seekers on delete cascade not null,
  status text check (status in ('Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©', 'Ù…Ù‚Ø§Ø¨Ù„Ø©', 'Ù…Ù‚Ø¨ÙˆÙ„', 'Ù…Ø±ÙÙˆØ¶')) default 'Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©',
  message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (job_id, seeker_id)
);

-- 6. Create Notifications Table
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  title text not null,
  message text not null,
  type text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Create Articles Table (for blog/admin)
create table if not exists public.articles (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  slug text unique not null,
  content text not null,
  excerpt text,
  cover_image text,
  author_id uuid references public.profiles on delete set null,
  status text check (status in ('draft', 'pending_approval', 'published')) default 'draft',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Create Subscriptions Table
create table if not exists public.user_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  plan_name text not null,
  status text check (status in ('active', 'canceled', 'expired')) default 'active',
  starts_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ends_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index if not exists idx_jobs_employer_id on public.jobs(employer_id);
create index if not exists idx_jobs_status on public.jobs(status);
create index if not exists idx_jobs_category on public.jobs(category);
create index if not exists idx_jobs_location on public.jobs(location);
create index if not exists idx_applications_job_id on public.applications(job_id);
create index if not exists idx_applications_seeker_id on public.applications(seeker_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_articles_slug on public.articles(slug);
create index if not exists idx_articles_status on public.articles(status);
create index if not exists idx_subscriptions_user_id on public.user_subscriptions(user_id);
create index if not exists idx_subscriptions_status on public.user_subscriptions(status);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.employers enable row level security;
alter table public.seekers enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.notifications enable row level security;
alter table public.articles enable row level security;
alter table public.user_subscriptions enable row level security;

-- ==========================================
-- PROFILES POLICIES
-- ==========================================
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone." 
  on public.profiles for select using (true);

drop policy if exists "Users can insert their own profile." on public.profiles;
create policy "Users can insert their own profile." 
  on public.profiles for insert 
  with check (auth.uid() = id and role in ('seeker', 'employer'));

drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can update own profile." 
  on public.profiles for update 
  using (auth.uid() = id) 
  with check (auth.uid() = id);

drop policy if exists "Users can delete own profile." on public.profiles;
create policy "Users can delete own profile." 
  on public.profiles for delete 
  using (auth.uid() = id);

-- ==========================================
-- EMPLOYERS POLICIES
-- ==========================================
drop policy if exists "Public employers viewable by everyone." on public.employers;
create policy "Public employers viewable by everyone." 
  on public.employers for select using (true);

drop policy if exists "Employer insert" on public.employers;
create policy "Employer insert" 
  on public.employers for insert 
  with check (auth.uid() = profile_id and 
    exists (select 1 from public.profiles where id = auth.uid() and role = 'employer')
  );

drop policy if exists "Employer update" on public.employers;
create policy "Employer update" 
  on public.employers for update 
  using (auth.uid() = profile_id) 
  with check (auth.uid() = profile_id);

-- ==========================================
-- SEEKERS POLICIES
-- ==========================================
drop policy if exists "Public seekers viewable by everyone." on public.seekers;
create policy "Public seekers viewable by everyone." 
  on public.seekers for select using (true);

drop policy if exists "Seeker insert" on public.seekers;
create policy "Seeker insert" 
  on public.seekers for insert 
  with check (auth.uid() = profile_id and 
    exists (select 1 from public.profiles where id = auth.uid() and role = 'seeker')
  );

drop policy if exists "Seeker update" on public.seekers;
create policy "Seeker update" 
  on public.seekers for update 
  using (auth.uid() = profile_id) 
  with check (auth.uid() = profile_id);

-- ==========================================
-- JOBS POLICIES
-- ==========================================
drop policy if exists "Approved jobs viewable by everyone." on public.jobs;
create policy "Approved jobs viewable by everyone." 
  on public.jobs for select using (status = 'approved');

drop policy if exists "Employers can view own jobs." on public.jobs;
create policy "Employers can view own jobs." 
  on public.jobs for select 
  using (auth.uid() = employer_id);

drop policy if exists "Admins can view all jobs." on public.jobs;
create policy "Admins can view all jobs." 
  on public.jobs for select 
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Employers can insert jobs." on public.jobs;
create policy "Employers can insert jobs." 
  on public.jobs for insert 
  with check (
    auth.uid() = employer_id and 
    exists (select 1 from public.profiles where id = auth.uid() and role = 'employer')
  );

drop policy if exists "Employers can update own jobs." on public.jobs;
create policy "Employers can update own jobs." 
  on public.jobs for update 
  using (auth.uid() = employer_id) 
  with check (auth.uid() = employer_id);

drop policy if exists "Admins can update any job." on public.jobs;
create policy "Admins can update any job." 
  on public.jobs for update 
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ==========================================
-- APPLICATIONS POLICIES
-- ==========================================
drop policy if exists "Employers can see applications to their jobs" on public.applications;
create policy "Employers can see applications to their jobs" 
  on public.applications for select using (
    exists (select 1 from public.jobs where jobs.id = job_id and jobs.employer_id = auth.uid())
    or auth.uid() = seeker_id
  );

drop policy if exists "Seekers can apply" on public.applications;
create policy "Seekers can apply" 
  on public.applications for insert 
  with check (
    auth.uid() = seeker_id and 
    exists (select 1 from public.profiles where id = auth.uid() and role = 'seeker')
  );

drop policy if exists "Employers can update applications to their jobs" on public.applications;
create policy "Employers can update applications to their jobs" 
  on public.applications for update using (
    exists (select 1 from public.jobs where jobs.id = job_id and jobs.employer_id = auth.uid())
  ) with check (
    exists (select 1 from public.jobs where jobs.id = job_id and jobs.employer_id = auth.uid())
  );

drop policy if exists "Seekers can delete own applications." on public.applications;
create policy "Seekers can delete own applications." 
  on public.applications for delete 
  using (auth.uid() = seeker_id);

-- ==========================================
-- NOTIFICATIONS POLICIES
-- ==========================================
drop policy if exists "Users can see own notifications" on public.notifications;
create policy "Users can see own notifications" 
  on public.notifications for select using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications" 
  on public.notifications for update 
  using (auth.uid() = user_id) 
  with check (auth.uid() = user_id);

drop policy if exists "System can insert notifications" on public.notifications;
create policy "System can insert notifications"
  on public.notifications for insert
  with check (true);

drop policy if exists "Users can delete own notifications" on public.notifications;
create policy "Users can delete own notifications" 
  on public.notifications for delete 
  using (auth.uid() = user_id);

-- ==========================================
-- ARTICLES POLICIES
-- ==========================================
drop policy if exists "Public can view published articles." on public.articles;
create policy "Public can view published articles." 
  on public.articles for select using (status = 'published');

drop policy if exists "Admins can view all articles." on public.articles;
create policy "Admins can view all articles." 
  on public.articles for select 
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Admins can insert articles." on public.articles;
create policy "Admins can insert articles." 
  on public.articles for insert 
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Admins can update articles." on public.articles;
create policy "Admins can update articles." 
  on public.articles for update 
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Admins can delete articles." on public.articles;
create policy "Admins can delete articles." 
  on public.articles for delete 
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ==========================================
-- SUBSCRIPTIONS POLICIES
-- ==========================================
drop policy if exists "Users can view own subscriptions." on public.user_subscriptions;
create policy "Users can view own subscriptions." 
  on public.user_subscriptions for select using (auth.uid() = user_id);

drop policy if exists "Admins can view all subscriptions." on public.user_subscriptions;
create policy "Admins can view all subscriptions." 
  on public.user_subscriptions for select 
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Admins can manage subscriptions." on public.user_subscriptions;
create policy "Admins can manage subscriptions." 
  on public.user_subscriptions for all 
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ==========================================
-- TRIGGERS FOR AUTOMATED NOTIFICATIONS
-- ==========================================
create or replace function public.handle_new_application()
returns trigger as $$
declare
  job_employer_id uuid;
  job_title_text text;
  seeker_name_text text;
begin
  select employer_id, title into job_employer_id, job_title_text from public.jobs where id = new.job_id;
  select full_name into seeker_name_text from public.profiles where id = new.seeker_id;
  
  insert into public.notifications (user_id, title, message, type)
  values (
    job_employer_id,
    'Ø·Ù„Ø¨ ØªÙˆØ¸ÙŠÙ Ø¬Ø¯ÙŠØ¯',
    'Ù‚Ø¯Ù… ' || coalesce(seeker_name_text, 'Ù…Ø³ØªØ®Ø¯Ù…') || ' Ø·Ù„Ø¨Ø§Ù‹ Ù„ÙˆØ¸ÙŠÙØ©: ' || job_title_text,
    'application_received'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_application_created on public.applications;
create trigger on_application_created
  after insert on public.applications
  for each row execute procedure public.handle_new_application();

create or replace function public.handle_application_update()
returns trigger as $$
declare
  job_title_text text;
begin
  if old.status is distinct from new.status then
    select title into job_title_text from public.jobs where id = new.job_id;
    
    insert into public.notifications (user_id, title, message, type)
    values (
      new.seeker_id,
      'ØªØ­Ø¯ÙŠØ« Ø­Ø§Ù„Ø© Ø§Ù„Ø·Ù„Ø¨',
      'ØªÙ… ØªØºÙŠÙŠØ± Ø­Ø§Ù„Ø© Ø·Ù„Ø¨Ùƒ Ù„ÙˆØ¸ÙŠÙØ© ' || job_title_text || ' Ø¥Ù„Ù‰: ' || new.status,
      'status_update'
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_application_updated on public.applications;
create trigger on_application_updated
  after update on public.applications
  for each row execute procedure public.handle_application_update();

-- ==========================================
-- STORAGE BUCKET CONFIGURATION
-- ==========================================
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;

drop policy if exists "Avatars Public Access" on storage.objects;
drop policy if exists "Authenticated Users can upload avatars" on storage.objects;
drop policy if exists "Users can update their own avatars" on storage.objects;
drop policy if exists "Users can delete their own avatars" on storage.objects;
drop policy if exists "Avatar insert" on storage.objects;
drop policy if exists "Avatar update" on storage.objects;
drop policy if exists "Avatar delete" on storage.objects;
create policy "Avatars Public Access" on storage.objects for select using (bucket_id = 'avatars');

drop policy if exists "Avatar insert own" on storage.objects;
create policy "Avatar insert own" on storage.objects for insert to authenticated 
  with check (
    bucket_id = 'avatars' and 
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Avatar update own" on storage.objects;
create policy "Avatar update own" on storage.objects for update to authenticated 
  using (
    bucket_id = 'avatars' and 
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Avatar delete own" on storage.objects;
create policy "Avatar delete own" on storage.objects for delete to authenticated 
  using (
    bucket_id = 'avatars' and 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ==========================================
-- SUBSCRIPTION PLANS TABLE
-- ==========================================
create table if not exists public.subscription_plans (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  price integer not null default 0,
  features text[] default '{}',
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.subscription_plans enable row level security;

drop policy if exists "Public can view active plans." on public.subscription_plans;
create policy "Public can view active plans." 
  on public.subscription_plans for select using (is_active = true);

drop policy if exists "Admins can manage plans." on public.subscription_plans;
create policy "Admins can manage plans." 
  on public.subscription_plans for all 
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ==========================================
-- PLATFORM SETTINGS TABLE
-- ==========================================
create table if not exists public.platform_settings (
  id uuid default uuid_generate_v4() primary key,
  wallet_qr_url text,
  bank_details text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.platform_settings enable row level security;

drop policy if exists "Public can view settings." on public.platform_settings;
create policy "Public can view settings." 
  on public.platform_settings for select using (true);

drop policy if exists "Admins can manage settings." on public.platform_settings;
create policy "Admins can manage settings." 
  on public.platform_settings for all 
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ==========================================
-- UPDATE USER_SUBSCRIPTIONS TABLE
-- ==========================================
alter table public.user_subscriptions 
  add column if not exists plan_id uuid references public.subscription_plans on delete set null,
  add column if not exists payment_receipt_url text;

-- ==========================================
-- PAYMENT RECEIPTS STORAGE
-- ==========================================
insert into storage.buckets (id, name, public) values ('payment_receipts', 'payment_receipts', true) on conflict (id) do nothing;

drop policy if exists "Payment receipts public access" on storage.objects;
create policy "Payment receipts public access" on storage.objects for select using (bucket_id = 'payment_receipts');

drop policy if exists "Payment receipt insert own" on storage.objects;
create policy "Payment receipt insert own" on storage.objects for insert to authenticated 
  with check (
    bucket_id = 'payment_receipts' and 
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Payment receipt update own" on storage.objects;
create policy "Payment receipt update own" on storage.objects for update to authenticated 
  using (
    bucket_id = 'payment_receipts' and 
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Payment receipt delete own" on storage.objects;
create policy "Payment receipt delete own" on storage.objects for delete to authenticated 
  using (
    bucket_id = 'payment_receipts' and 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ==========================================
-- DEFAULT DATA
-- ==========================================
insert into public.platform_settings (wallet_qr_url, bank_details)
select '', 'Ù„Ù… ÙŠØªÙ… ØªØ­Ø¯ÙŠØ¯ ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ø¨Ù†Ùƒ Ø¨Ø¹Ø¯.'
where not exists (select 1 from public.platform_settings);

insert into public.subscription_plans (name, price, features, is_active)
select * from (values
  ('Ø§Ù„Ø¨Ø§Ù‚Ø© Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ©', 29, ARRAY['Ù†Ø´Ø± Ø­ØªÙ‰ 3 ÙˆØ¸Ø§Ø¦Ù Ø´Ù‡Ø±ÙŠØ§Ù‹', 'Ø¸Ù‡ÙˆØ± ÙÙŠ Ù†ØªØ§Ø¦Ø¬ Ø§Ù„Ø¨Ø­Ø«', 'Ø¯Ø¹Ù… Ø¹Ø¨Ø± Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ'], true),
  ('Ø§Ù„Ø¨Ø§Ù‚Ø© Ø§Ù„Ø§Ø­ØªØ±Ø§ÙÙŠØ©', 79, ARRAY['Ù†Ø´Ø± ÙˆØ¸Ø§Ø¦Ù ØºÙŠØ± Ù…Ø­Ø¯ÙˆØ¯', 'Ø¸Ù‡ÙˆØ± Ù…Ù…ÙŠØ² ÙÙŠ Ù†ØªØ§Ø¦Ø¬ Ø§Ù„Ø¨Ø­Ø«', 'Ø£ÙˆÙ„ÙˆÙŠØ© ÙÙŠ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø§Øª', 'ØªÙ‚Ø§Ø±ÙŠØ± ÙˆØ¥Ø­ØµØ§Ø¦ÙŠØ§Øª', 'Ø¯Ø¹Ù… Ù…Ø¨Ø§Ø´Ø± Ø¹Ø¨Ø± ÙˆØ§ØªØ³Ø§Ø¨'], true),
  ('Ø§Ù„Ø¨Ø§Ù‚Ø© Ø§Ù„Ù…ØªÙ‚Ø¯Ù…Ø©', 149, ARRAY['ÙƒÙ„ Ù…Ù…ÙŠØ²Ø§Øª Ø§Ù„Ø¨Ø§Ù‚Ø© Ø§Ù„Ø§Ø­ØªØ±Ø§ÙÙŠØ©', 'Ø¥Ø¹Ù„Ø§Ù†Ø§Øª Ù…Ù…ÙŠØ²Ø© Ø¹Ù„Ù‰ Ø§Ù„ØµÙØ­Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©', 'ÙˆØµÙˆÙ„ Ù„Ù‚Ø§Ø¹Ø¯Ø© Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø³ÙŠØ± Ø§Ù„Ø°Ø§ØªÙŠØ©', 'Ù…Ø¯ÙŠØ± Ø­Ø³Ø§Ø¨ Ù…Ø®ØµØµ'], true)
) as v(name, price, features, is_active)
where not exists (select 1 from public.subscription_plans);

-- ==========================================
-- MESSAGES TABLE (for admin broadcasts)
-- ==========================================
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles on delete set null,
  receiver_id uuid references public.profiles on delete set null,
  title text,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;

drop policy if exists "Admins can manage messages." on public.messages;
create policy "Admins can manage messages."
  on public.messages for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Users can insert messages." on public.messages;
create policy "Users can insert messages."
  on public.messages for insert
  with check (auth.uid() = sender_id);

drop policy if exists "Users can view own messages." on public.messages;
create policy "Users can view own messages."
  on public.messages for select
  using (auth.uid() = receiver_id or auth.uid() = sender_id);

-- ==========================================
-- FIX MISSING COLUMNS
-- ==========================================

-- subscription_plans missing columns
alter table public.subscription_plans
  add column if not exists max_articles_per_month integer default 0,
  add column if not exists duration_days integer default 30;

-- articles missing published_at
alter table public.articles
  add column if not exists published_at timestamp with time zone;

-- platform_settings missing columns
alter table public.platform_settings
  add column if not exists site_name text default 'Hello Staff',
  add column if not exists logo_url text,
  add column if not exists maintenance_mode boolean default false;

-- ==========================================
-- ADDITIONAL STORAGE BUCKETS
-- ==========================================
insert into storage.buckets (id, name, public) values ('platform_assets', 'platform_assets', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('article_images', 'article_images', true) on conflict (id) do nothing;

drop policy if exists "Platform assets public access" on storage.objects;
create policy "Platform assets public access" on storage.objects for select using (bucket_id = 'platform_assets');

drop policy if exists "Platform assets insert admin" on storage.objects;
create policy "Platform assets insert admin" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'platform_assets' and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Article images public access" on storage.objects;
create policy "Article images public access" on storage.objects for select using (bucket_id = 'article_images');

drop policy if exists "Article images insert own" on storage.objects;
create policy "Article images insert own" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'article_images' and
    (storage.foldername(name))[1] = auth.uid()::text
  );


-- ==========================================
-- JOB ALERTS TABLE
-- ==========================================
create table if not exists public.job_alerts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  keyword text,
  category text,
  location text,
  type text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.job_alerts enable row level security;

drop policy if exists "Users can manage own job alerts" on public.job_alerts;
create policy "Users can manage own job alerts"
  on public.job_alerts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger to send notifications when new job is approved
create or replace function public.handle_new_job_approved()
returns trigger as $$
declare
  alert_record record;
begin
  if new.status = 'approved' then
    for alert_record in
      select user_id from public.job_alerts
      where is_active = true
      and (
        (keyword is null or new.title ilike '%' || keyword || '%' or new.description ilike '%' || keyword || '%')
        and (category is null or new.category = category)
        and (location is null or new.location = location)
        and (type is null or new.type = type)
      )
    loop
      insert into public.notifications (user_id, title, message, type)
      values (
        alert_record.user_id,
        'وظيفة جديدة تناسبك!',
        'تم نشر وظيفة جديدة: ' || new.title || ' في ' || new.company_name,
        'job_alert'
      );
    end loop;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_job_approved_alert on public.jobs;
create trigger on_job_approved_alert
  after insert or update on public.jobs
  for each row execute procedure public.handle_new_job_approved();
