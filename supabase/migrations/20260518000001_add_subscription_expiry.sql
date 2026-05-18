-- Migration: Add subscription auto-expiry support
-- Date: 2026-05-18

-- 1. Function to expire old subscriptions
-- Returns the number of subscriptions that were expired

create or replace function public.expire_old_subscriptions()
returns integer
language plpgsql
security definer
as $$
declare
  expired_count integer;
begin
  update public.user_subscriptions
  set status = 'expired'
  where status in ('active', 'free')
    and ends_at is not null
    and ends_at < now();

  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$;

-- 2. Grant execute to authenticated users (for server actions)
grant execute on function public.expire_old_subscriptions() to authenticated;

-- 3. Optional: Create a cron job to run daily at midnight (if pg_cron is enabled)
-- This will be scheduled via Supabase Dashboard or CLI if pg_cron is available.
-- Uncomment below if pg_cron extension is enabled:
-- select cron.schedule('expire-subscriptions-daily', '0 0 * * *', 'select public.expire_old_subscriptions()');
