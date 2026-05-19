-- Migration: Add automated subscription expiry with cron and notifications
-- Date: 2026-05-19

-- 1. Enable pg_cron extension (if not already enabled)
create extension if not exists pg_cron;

-- 2. Update the expiration function to also send notifications
create or replace function public.expire_old_subscriptions()
returns integer
language plpgsql
security definer
as $$
declare
  expired_count integer;
begin
  with expired_subs as (
    update public.user_subscriptions
    set status = 'expired'
    where status in ('active', 'free')
      and ends_at is not null
      and ends_at < now()
    returning user_id
  ),
  inserted_notifs as (
    insert into public.notifications (user_id, title, message, type)
    select 
      user_id, 
      'انتهاء الباقة', 
      'لقد انتهت صلاحية باقتك الحالية. يرجى تجديد الاشتراك للاستمرار في استقبال المتقدمين ونشر وظائف جديدة.', 
      'system_alert'
    from expired_subs
    returning id
  )
  select count(*) into expired_count from expired_subs;
  
  return expired_count;
end;
$$;

-- 3. Grant execute to authenticated users (so it can be tested manually)
grant execute on function public.expire_old_subscriptions() to authenticated;

-- 4. Schedule the cron job to run daily at midnight (0 0 * * *)
-- Using a do block to handle the scheduling safely
do $$
begin
  -- Try to unschedule if it exists to avoid errors, we ignore the error if it doesn't
  perform cron.unschedule('expire-subscriptions-daily');
exception when others then
  -- Do nothing if the job doesn't exist yet
end $$;

select cron.schedule('expire-subscriptions-daily', '0 0 * * *', 'select public.expire_old_subscriptions()');
