-- 030: ai_suggestions forward-compat migration
-- Upgrades old schema (draft_text / status pending/approved/sent) to multibot schema
-- without dropping legacy columns. Safe to run on both old and new schemas.

-- 1. Add suggested_reply if missing, copying from draft_text when available
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_suggestions' AND column_name = 'suggested_reply'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ai_suggestions' AND column_name = 'draft_text'
    ) THEN
      ALTER TABLE public.ai_suggestions ADD COLUMN suggested_reply text;
      UPDATE public.ai_suggestions SET suggested_reply = draft_text;
    ELSE
      ALTER TABLE public.ai_suggestions ADD COLUMN suggested_reply text;
    END IF;
  END IF;
END $$;

-- 2. Add missing multibot columns (nullable or with defaults, safe to re-run)
ALTER TABLE public.ai_suggestions
  ADD COLUMN IF NOT EXISTS bot_id uuid,
  ADD COLUMN IF NOT EXISTS event_id text,
  ADD COLUMN IF NOT EXISTS user_message text,
  ADD COLUMN IF NOT EXISTS sources_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confidence_score float NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS risk_category text NOT NULL DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS sent_by uuid;

-- Add FK for bot_id only if line_bots table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'line_bots'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name = 'ai_suggestions'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'bot_id'
    ) THEN
      ALTER TABLE public.ai_suggestions
        ADD CONSTRAINT ai_suggestions_bot_id_fkey
          FOREIGN KEY (bot_id) REFERENCES public.line_bots(id) ON DELETE CASCADE;
    END IF;
  END IF;

  -- Add FK for sent_by if not already present
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'ai_suggestions'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'sent_by'
  ) THEN
    ALTER TABLE public.ai_suggestions
      ADD CONSTRAINT ai_suggestions_sent_by_fkey
        FOREIGN KEY (sent_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Replace status CHECK constraint and migrate values, then re-add canonical constraint
--    All done in one block: drop old constraint first (old values block 'draft'), update, re-add.
DO $$
DECLARE
  con_name text;
BEGIN
  -- Drop all existing CHECK constraints on status (covers old or new constraint names)
  FOR con_name IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.ai_suggestions'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.ai_suggestions DROP CONSTRAINT %I', con_name);
  END LOOP;

  -- Map old status values to new ones
  UPDATE public.ai_suggestions
    SET status = 'draft'
    WHERE status IN ('pending', 'approved');

  -- Re-add canonical status constraint
  ALTER TABLE public.ai_suggestions
    ADD CONSTRAINT ai_suggestions_status_check
      CHECK (status IN ('draft', 'sent', 'expired', 'rejected'));
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.ai_suggestions'::regclass
      AND contype = 'c'
      AND conname = 'ai_suggestions_risk_category_check'
  ) THEN
    ALTER TABLE public.ai_suggestions
      ADD CONSTRAINT ai_suggestions_risk_category_check
        CHECK (risk_category IN ('low', 'medium', 'high'));
  END IF;
END $$;

-- 5. Add indexes for new columns (idempotent)
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_contact ON public.ai_suggestions(contact_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_status ON public.ai_suggestions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_event_id ON public.ai_suggestions(event_id);

-- 6. Enable RLS and apply multibot policy (idempotent)
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own ai_suggestions via contact" ON public.ai_suggestions;
CREATE POLICY "Users manage own ai_suggestions via contact" ON public.ai_suggestions
  FOR ALL USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND c.user_id = auth.uid())
  );

COMMENT ON TABLE public.ai_suggestions IS 'Draft AI replies (SUGGEST); forward-compat migration applied in 030';
