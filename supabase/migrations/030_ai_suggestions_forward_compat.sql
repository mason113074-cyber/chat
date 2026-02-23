-- 030: ai_suggestions forward-compat migration
-- Upgrades old schema (draft_text/pending/approved) to multibot schema
-- (suggested_reply/bot_id/event_id/...) without dropping legacy columns.
-- Safe to run on both old and new schema databases.

-- 1. Add suggested_reply if missing, copy from draft_text
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_suggestions' AND column_name = 'suggested_reply'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN suggested_reply text;
    UPDATE public.ai_suggestions SET suggested_reply = draft_text WHERE suggested_reply IS NULL AND draft_text IS NOT NULL;
    ALTER TABLE public.ai_suggestions ALTER COLUMN suggested_reply SET DEFAULT '';
  END IF;
END $$;

-- 2. Add bot_id if missing (nullable for backward compat)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_suggestions' AND column_name = 'bot_id'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN bot_id uuid REFERENCES public.line_bots(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Add event_id if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_suggestions' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN event_id text NOT NULL DEFAULT '';
  END IF;
END $$;

-- 4. Add user_message if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_suggestions' AND column_name = 'user_message'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN user_message text NOT NULL DEFAULT '';
  END IF;
END $$;

-- 5. Add sources_count if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_suggestions' AND column_name = 'sources_count'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN sources_count int NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 6. Add confidence_score if missing (old schema uses confidence numeric(4,3))
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_suggestions' AND column_name = 'confidence_score'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN confidence_score float NOT NULL DEFAULT 0;
    -- copy from old confidence column if present
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ai_suggestions' AND column_name = 'confidence'
    ) THEN
      UPDATE public.ai_suggestions SET confidence_score = confidence::float WHERE confidence_score = 0 AND confidence IS NOT NULL;
    END IF;
  END IF;
END $$;

-- 7. Add risk_category if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_suggestions' AND column_name = 'risk_category'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN risk_category text NOT NULL DEFAULT 'low';
  END IF;
END $$;

-- 8. Add expires_at if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_suggestions' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours');
  END IF;
END $$;

-- 9. Add sent_at if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_suggestions' AND column_name = 'sent_at'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN sent_at timestamptz;
  END IF;
END $$;

-- 10. Add sent_by if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_suggestions' AND column_name = 'sent_by'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD COLUMN sent_by uuid REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 11. Migrate status values: pending/approved → draft, sent → sent
-- First add the new allowed values by relaxing constraint if needed, then update data
DO $$
DECLARE
  constraint_name text;
BEGIN
  -- Find existing status check constraint
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.ai_suggestions'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%status%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.ai_suggestions DROP CONSTRAINT %I', constraint_name);
  END IF;

  -- Map old statuses to new
  UPDATE public.ai_suggestions SET status = 'draft'
    WHERE status IN ('pending', 'approved');
  UPDATE public.ai_suggestions SET status = 'sent'
    WHERE status = 'sent';

  -- Add new constraint
  ALTER TABLE public.ai_suggestions
    ADD CONSTRAINT ai_suggestions_status_check
    CHECK (status IN ('draft', 'sent', 'expired', 'rejected'));
END $$;

-- 12. Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_contact ON public.ai_suggestions(contact_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_status ON public.ai_suggestions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_event_id ON public.ai_suggestions(event_id);

-- 13. Ensure RLS policy matches multibot schema (idempotent via DROP IF EXISTS + CREATE)
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own ai_suggestions" ON public.ai_suggestions;
DROP POLICY IF EXISTS "Users insert own ai_suggestions" ON public.ai_suggestions;
DROP POLICY IF EXISTS "Users update own ai_suggestions" ON public.ai_suggestions;
DROP POLICY IF EXISTS "Users delete own ai_suggestions" ON public.ai_suggestions;
DROP POLICY IF EXISTS "Users manage own ai_suggestions via contact" ON public.ai_suggestions;

CREATE POLICY "Users manage own ai_suggestions via contact" ON public.ai_suggestions
  FOR ALL USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND c.user_id = auth.uid())
  );
