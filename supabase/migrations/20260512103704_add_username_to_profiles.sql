-- Add username column to profiles for admin login without email
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text;

-- Add unique constraint
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_username_unique;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- Add index for fast lookup
DROP INDEX IF EXISTS idx_profiles_username;
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Update RLS policy to allow username-based lookups during login
-- (already covered by existing SELECT policies since auth.uid() is not needed for login flow)
