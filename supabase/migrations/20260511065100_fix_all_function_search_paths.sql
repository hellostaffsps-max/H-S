-- Migration: fix_all_function_search_paths
-- Date: 2026-05-11
-- Description: Fix search_path for all remaining functions to prevent search_path mutable vulnerabilities

ALTER FUNCTION public.handle_application_update() SET search_path = public, extensions;
ALTER FUNCTION public.on_subscription_approval() SET search_path = public, extensions;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, extensions;
ALTER FUNCTION public.sync_user_email() SET search_path = public, extensions;
ALTER FUNCTION public.handle_new_application() SET search_path = public, extensions;
ALTER FUNCTION public.handle_new_job_approved() SET search_path = public, extensions;
ALTER FUNCTION public.handle_expired_subscriptions() SET search_path = public, extensions;
ALTER FUNCTION public.is_user_subscribed(uuid, text) SET search_path = public, extensions;
ALTER FUNCTION public.handle_seeker_employment_status() SET search_path = public, extensions;
ALTER FUNCTION public.custom_access_token_hook(jsonb) SET search_path = public, extensions;
