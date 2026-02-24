-- B1: Event landing → immediate 200 → background process. Per-event webhook_events, line_bots/contacts bot dimension, ai_suggestions fields.

-- 1. line_bots: add channel_id, encryption_version; align column names to enc_* (keep encrypted_* for backward compat via views/columns)
ALTER TABLE public.line_bots ADD COLUMN IF NOT EXISTS channel_id text;
ALTER TABLE public.line_bots ADD COLUMN IF NOT EXISTS encryption_version int NOT NULL DEFAULT 1;
ALTER TABLE public.line_bots ADD COLUMN IF NOT EXISTS bot_name text;
UPDATE public.line_bots SET bot_name = name WHERE bot_name IS NULL AND name IS NOT NULL;
COMMENT ON COLUMN public.line_bots.encryption_version IS 'Key version for envelope decryption (ENCRYPTION_MASTER_KEY)';

-- 2. webhook_events: one row per event (drop old, create new)
DROP TABLE IF EXISTS public.webhook_events CASCADE;
CREATE TABLE public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid NOT NULL REFERENCES public.line_bots(id) ON DELETE CASCADE,
  event_id text NOT NULL,
  event_type text NOT NULL DEFAULT 'message',
  raw_event jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
CREATE UNIQUE INDEX idx_webhook_events_bot_event ON public.webhook_events(bot_id, event_id);
CREATE INDEX idx_webhook_events_status_created ON public.webhook_events(status, created_at);
CREATE INDEX idx_webhook_events_bot_id ON public.webhook_events(bot_id);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny all webhook_events" ON public.webhook_events FOR ALL USING (false) WITH CHECK (false);

COMMENT ON TABLE public.webhook_events IS 'B1: one row per LINE event; process via internal/process or drain';

-- 3. ai_suggestions: add category, sources (jsonb)
ALTER TABLE public.ai_suggestions ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';
ALTER TABLE public.ai_suggestions ADD COLUMN IF NOT EXISTS sources jsonb DEFAULT '[]';
ALTER TABLE public.ai_suggestions ADD COLUMN IF NOT EXISTS dismissed_at timestamptz;
-- status: draft|sent|dismissed (keep expired/rejected for backward compat)
ALTER TABLE public.ai_suggestions DROP CONSTRAINT IF EXISTS ai_suggestions_status_check;
ALTER TABLE public.ai_suggestions ADD CONSTRAINT ai_suggestions_status_check
  CHECK (status IN ('draft', 'sent', 'expired', 'rejected', 'dismissed'));

-- 4. contacts: bot dimension (bot_id nullable for legacy)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS bot_id uuid REFERENCES public.line_bots(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX idx_contacts_bot_line_user ON public.contacts(bot_id, line_user_id) WHERE bot_id IS NOT NULL;
CREATE INDEX idx_contacts_bot_id ON public.contacts(bot_id) WHERE bot_id IS NOT NULL;

COMMENT ON COLUMN public.contacts.bot_id IS 'When set, contact is scoped to this bot (bot_id, line_user_id unique)';
