-- Supabase Schema for Hello Staff Recruitment
-- SECURITY HARDENED VERSION

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 0. Create Admin RBAC Tables (must exist before profiles for admin_role_id FK)
create table if not exists public.admin_permissions (
  id text primary key,
  name_ar text not null,
  category text not null,
  created_at timestamptz default now()
);

create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.admin_role_permissions (
  role_id uuid references public.admin_roles(id) on delete cascade,
  permission_id text references public.admin_permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

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
  resume_data jsonb default '{}'::jsonb,
  current_employer text
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
  status text check (status in ('pending', 'approved', 'rejected', 'closed', 'expired')) default 'pending',
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Create Applications Table
create table if not exists public.applications (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references public.jobs on delete cascade not null,
  seeker_id uuid references public.seekers on delete cascade not null,
  status text check (status in ('Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©', 'Ù…Ù‚Ø§Ø¨Ù„Ø©', 'Ù…Ù‚Ø¨ÙˆÙ„', 'Ù…Ø±ÙÙˆØ¶')) default 'Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©',
  message text,
  cover_letter text,
  interview_date timestamp with time zone,
  interview_location text,
  interview_notes text,
  rejection_reason text,
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
  link text,
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
    'طلب توظيف جديد',
    'قدم ' || coalesce(seeker_name_text, 'مستخدم') || ' طلباً لوظيفة: ' || job_title_text,
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
      'تحديث حالة الطلب',
      'تم تغيير حالة طلبك لوظيفة ' || job_title_text || ' إلى: ' || new.status,
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
  description text,
  job_limit integer default 0,
  extra_job_price integer default 0,
  duration_days integer default 30,
  max_articles_per_month integer default 0,
  allow_articles boolean default false,
  featured_listings boolean default false,
  allow_ads boolean default false,
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
select '', 'لم يتم تحديد تفاصيل البنك بعد.'
where not exists (select 1 from public.platform_settings);

insert into public.subscription_plans (name, price, features, is_active)
select v.* from (values 
  ('الباقة الأساسية', 29, ARRAY['نشر حتى 3 وظائف شهرياً', 'ظهور في نتائج البحث', 'دعم عبر البريد الإلكتروني'], true),
  ('الباقة الاحترافية', 79, ARRAY['نشر وظائف غير محدود', 'ظهور مميز في نتائج البحث', 'أولوية في المراجعات', 'تقارير وإحصائيات', 'دعم مباشر عبر واتساب'], true),
  ('الباقة المتقدمة', 149, ARRAY['كل مميزات الباقة الاحترافية', 'إعلانات مميزة على الصفحة الرئيسية', 'وصول لقاعدة بيانات السير الذاتية', 'مدير حساب مخصص'], true)
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
-- SUPPORT TICKETS TABLE
-- ==========================================
create table if not exists public.support_tickets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete set null,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text check (status in ('open', 'in_progress', 'closed')) default 'open',
  conversation_open boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.support_tickets enable row level security;

drop policy if exists "support_tickets_select_policy" on public.support_tickets;
create policy "support_tickets_select_policy"
  on public.support_tickets for select
  using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "support_tickets_insert_policy" on public.support_tickets;
create policy "support_tickets_insert_policy"
  on public.support_tickets for insert
  with check (
    auth.uid() = user_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "support_tickets_update_policy" on public.support_tickets;
create policy "support_tickets_update_policy"
  on public.support_tickets for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "support_tickets_delete_policy" on public.support_tickets;
create policy "support_tickets_delete_policy"
  on public.support_tickets for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ==========================================
-- TICKET REPLIES TABLE
-- ==========================================
create table if not exists public.ticket_replies (
  id uuid default uuid_generate_v4() primary key,
  ticket_id uuid references public.support_tickets on delete cascade not null,
  sender_role text check (sender_role in ('user', 'admin')) default 'user',
  sender_name text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.ticket_replies enable row level security;

drop policy if exists "ticket_replies_select_policy" on public.ticket_replies;
create policy "ticket_replies_select_policy"
  on public.ticket_replies for select
  using (
    exists (
      select 1 from public.support_tickets st
      where st.id = ticket_id
        and (
          st.user_id = auth.uid()
          or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
        )
    )
  );

drop policy if exists "ticket_replies_insert_policy" on public.ticket_replies;
create policy "ticket_replies_insert_policy"
  on public.ticket_replies for insert
  with check (
    exists (
      select 1 from public.support_tickets st
      where st.id = ticket_id
        and (
          st.user_id = auth.uid()
          or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
        )
    )
  );

drop policy if exists "ticket_replies_admin_policy" on public.ticket_replies;
create policy "ticket_replies_admin_policy"
  on public.ticket_replies for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ==========================================
-- ADVERTISEMENTS TABLE
-- ==========================================
create table if not exists public.advertisements (
  id uuid default uuid_generate_v4() primary key,
  created_by uuid references public.profiles on delete set null,
  title text not null,
  media_url text,
  media_type text check (media_type in ('image', 'video')),
  link_url text,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  is_active boolean default true,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  rejection_reason text,
  cancellation_requested boolean default false,
  order_index integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.advertisements enable row level security;

drop policy if exists "ads_select_policy" on public.advertisements;
create policy "ads_select_policy"
  on public.advertisements for select
  using (
    status = 'approved' and is_active = true
    or (select auth.uid()) = created_by
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "ads_insert_policy" on public.advertisements;
create policy "ads_insert_policy"
  on public.advertisements for insert
  with check (
    (select auth.uid()) = created_by
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "ads_update_policy" on public.advertisements;
create policy "ads_update_policy"
  on public.advertisements for update
  using (
    (select auth.uid()) = created_by
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "ads_delete_policy" on public.advertisements;
create policy "ads_delete_policy"
  on public.advertisements for delete
  using (
    (select auth.uid()) = created_by
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
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

-- ==========================================
-- BACKEND FIXES — Applied 2026-05-06
-- ==========================================

-- 1. Add email column to profiles (synced from auth.users)
alter table public.profiles
  add column if not exists email text;

-- 1b. Add admin_role_id to profiles (for RBAC)
alter table public.profiles
  add column if not exists admin_role_id uuid references public.admin_roles(id) on delete set null;

-- Trigger to sync email from auth.users to profiles
-- This ensures profiles.email stays in sync with auth.users.email
create or replace function public.sync_user_email()
returns trigger as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute procedure public.sync_user_email();

-- Also sync on insert via the existing profile creation flow
-- (profiles are created client-side in useAuth.ts; this trigger
-- catches cases where auth.users email changes later)

-- Backfill existing profiles with email from auth.users
update public.profiles
set email = auth.users.email
from auth.users
where public.profiles.id = auth.users.id
  and public.profiles.email is null;

-- 2. Fix applications.status check constraint
-- The dashboard uses: قيد المراجعة, مراجعة, قائمة مختصرة, تجربة عمل, مقابلة, مقبول, مرفوض
alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications add constraint applications_status_check
  check (status in ('قيد المراجعة', 'مراجعة', 'قائمة مختصرة', 'تجربة عمل', 'مقابلة', 'مقبول', 'مرفوض'));

-- 3. Fix articles.status check constraint — add 'rejected'
alter table public.articles drop constraint if exists articles_status_check;
alter table public.articles add constraint articles_status_check
  check (status in ('draft', 'pending_approval', 'published', 'rejected'));

-- 4. Fix user_subscriptions.status check constraint — add 'pending'
alter table public.user_subscriptions drop constraint if exists user_subscriptions_status_check;
alter table public.user_subscriptions add constraint user_subscriptions_status_check
  check (status in ('active', 'canceled', 'expired', 'pending'));

-- 5. Missing RLS policies for messages

-- Allow receivers to mark messages as read (update is_read)
drop policy if exists "Users can update received messages" on public.messages;
create policy "Users can update received messages"
  on public.messages for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

-- Allow anonymous contact form submissions (both sender_id and receiver_id are null)
drop policy if exists "Anonymous contact form inserts" on public.messages;
create policy "Anonymous contact form inserts"
  on public.messages for insert
  with check (sender_id is null and receiver_id is null);

-- 6. Missing RLS policies for articles (author/employer can manage own articles)
drop policy if exists "Authors can view own articles" on public.articles;
create policy "Authors can view own articles"
  on public.articles for select
  using (auth.uid() = author_id);

drop policy if exists "Authors can insert own articles" on public.articles;
create policy "Authors can insert own articles"
  on public.articles for insert
  with check (auth.uid() = author_id);

drop policy if exists "Authors can update own articles" on public.articles;
create policy "Authors can update own articles"
  on public.articles for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "Authors can delete own articles" on public.articles;
create policy "Authors can delete own articles"
  on public.articles for delete
  using (auth.uid() = author_id);

-- 7. Missing RLS policy for user_subscriptions (users can insert own pending subscriptions)
drop policy if exists "Users can insert own subscriptions" on public.user_subscriptions;
create policy "Users can insert own subscriptions"
  on public.user_subscriptions for insert
  with check (auth.uid() = user_id);

-- 8. Missing indexes for performance
create index if not exists idx_job_alerts_user_id on public.job_alerts(user_id);
create index if not exists idx_messages_sender_id on public.messages(sender_id);
create index if not exists idx_messages_receiver_id on public.messages(receiver_id);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_articles_author_id on public.articles(author_id);
create index if not exists idx_user_subscriptions_plan_id on public.user_subscriptions(plan_id);

-- 9. Auto-update updated_at for articles and platform_settings
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_articles_updated on public.articles;
create trigger on_articles_updated
  before update on public.articles
  for each row execute procedure public.update_updated_at_column();

drop trigger if exists on_platform_settings_updated on public.platform_settings;
create trigger on_platform_settings_updated
  before update on public.platform_settings
  for each row execute procedure public.update_updated_at_column();

-- ==========================================
-- STORAGE POLICIES for new buckets
-- Run this in Supabase SQL Editor if you want dedicated buckets
-- (Currently using 'avatars' bucket with subfolders as workaround)
-- ==========================================

-- Policies for company-logos bucket
-- drop policy if exists "Anyone can view company logos" on storage.objects;
-- create policy "Anyone can view company logos"
--   on storage.objects for select
--   to anon, authenticated
--   using (bucket_id = 'company-logos');

-- drop policy if exists "Authenticated users can upload company logos" on storage.objects;
-- create policy "Authenticated users can upload company logos"
--   on storage.objects for insert
--   to authenticated
--   with check (bucket_id = 'company-logos');

-- drop policy if exists "Users can update own company logos" on storage.objects;
-- create policy "Users can update own company logos"
--   on storage.objects for update
--   to authenticated
--   using (bucket_id = 'company-logos' and auth.uid()::text = (storage.foldername(name))[1]);

-- drop policy if exists "Users can delete own company logos" on storage.objects;
-- create policy "Users can delete own company logos"
--   on storage.objects for delete
--   to authenticated
--   using (bucket_id = 'company-logos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Policies for company-covers bucket
-- drop policy if exists "Anyone can view company covers" on storage.objects;
-- create policy "Anyone can view company covers"
--   on storage.objects for select
--   to anon, authenticated
--   using (bucket_id = 'company-covers');

-- drop policy if exists "Authenticated users can upload company covers" on storage.objects;
-- create policy "Authenticated users can upload company covers"
--   on storage.objects for insert
--   to authenticated
--   with check (bucket_id = 'company-covers');

-- drop policy if exists "Users can update own company covers" on storage.objects;
-- create policy "Users can update own company covers"
--   on storage.objects for update
--   to authenticated
--   using (bucket_id = 'company-covers' and auth.uid()::text = (storage.foldername(name))[1]);

-- drop policy if exists "Users can delete own company covers" on storage.objects;
-- create policy "Users can delete own company covers"
--   on storage.objects for delete
--   to authenticated
--   using (bucket_id = 'company-covers' and auth.uid()::text = (storage.foldername(name))[1]);

-- ==========================================
-- EMPLOYER PROFILE EXPANSION — Applied 2026-05-07
-- ==========================================

-- Expand employers table with company profile fields
alter table public.employers
  add column if not exists business_type text,
  add column if not exists city text,
  add column if not exists area text,
  add column if not exists whatsapp_number text,
  add column if not exists business_email text,
  add column if not exists number_of_branches integer,
  add column if not exists number_of_employees text,
  add column if not exists opening_hours text,
  add column if not exists cover_image_url text,
  add column if not exists verification_status text default 'pending',
  add column if not exists application_preference text default 'platform_only',
  add column if not exists show_whatsapp_to_candidates boolean default false;

-- Add check constraints for new enum-like columns
alter table public.employers drop constraint if exists employers_verification_status_check;
alter table public.employers add constraint employers_verification_status_check
  check (verification_status in ('pending', 'verified', 'rejected'));

alter table public.employers drop constraint if exists employers_application_preference_check;
alter table public.employers add constraint employers_application_preference_check
  check (application_preference in ('platform_only', 'whatsapp_only', 'both'));
