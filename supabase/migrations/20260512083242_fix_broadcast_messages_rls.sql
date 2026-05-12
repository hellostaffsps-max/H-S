-- Fix: Allow authenticated users to view broadcast messages (receiver_id IS NULL)
-- Broadcast messages are sent by admins with receiver_id = null
-- Previously, RLS policy "Users can view own messages" only allowed:
--   auth.uid() = receiver_id OR auth.uid() = sender_id
-- This excluded broadcast messages because receiver_id is NULL and sender is admin.

-- Add policy so all authenticated users can view broadcast messages
DROP POLICY IF EXISTS "Users can view broadcast messages" ON public.messages;
CREATE POLICY "Users can view broadcast messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (receiver_id IS NULL AND sender_id IS NOT NULL);
