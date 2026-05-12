-- Add verification_status column to seekers table (same pattern as employers)
ALTER TABLE public.seekers
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending';

-- Add check constraint
ALTER TABLE public.seekers
  DROP CONSTRAINT IF EXISTS seekers_verification_status_check;

ALTER TABLE public.seekers
  ADD CONSTRAINT seekers_verification_status_check
  CHECK (verification_status IN ('pending', 'verified', 'rejected'));

-- Set default for existing rows
UPDATE public.seekers
  SET verification_status = 'pending'
  WHERE verification_status IS NULL;
