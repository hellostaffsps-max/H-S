-- Fix: Add 'free' to subscription status check constraint
-- Some parts of the app use 'free' status for free-tier subscriptions

alter table public.user_subscriptions drop constraint if exists user_subscriptions_status_check;
alter table public.user_subscriptions add constraint user_subscriptions_status_check
  check (status in ('active', 'canceled', 'expired', 'pending', 'free'));
