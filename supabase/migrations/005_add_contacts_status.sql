-- Add status to contacts for batch resolve/unresolve (conversation = contact thread)
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'resolved'));
