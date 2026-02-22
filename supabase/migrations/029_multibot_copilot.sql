-- P0: Multi-bot + AI copilot SUGGEST
-- Tables: line_bots, webhook_events, ai_suggestions (with RLS)

-- 1. line_bots: per-tenant LINE channel credentials (encrypted)
CREATE TABLE IF NOT EXISTS public.line_bots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  webhook_key_hash text NOT NULL,
  encrypted_channel_secret text NOT NULL,
  encrypted_channel_access_token text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_line_bots_user_id ON public.line_bots(user_id);
CREATE UNIQUE INDEX idx_line_bots_webhook_key_hash ON public.line_bots(webhook_key_hash) WHERE is_active = true;

ALTER TABLE public.line_bots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own line_bots" ON public.line_bots
  FOR ALL USING (auth.uid() = user_id);

-- 2. webhook_events: persist raw webhook payload before processing (durability)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid NOT NULL REFERENCES public.line_bots(id) ON DELETE CASCADE,
  raw_body text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  error_message text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_webhook_events_bot_id ON public.webhook_events(bot_id);
CREATE INDEX idx_webhook_events_status_created ON public.webhook_events(status, created_at);

-- RLS: service role only (webhook route uses getSupabaseAdmin); no policy for auth users
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
-- No SELECT/INSERT for auth.uid(); API uses service role to write/update
CREATE POLICY "Service role only webhook_events" ON public.webhook_events
  FOR ALL USING (false) WITH CHECK (false);
-- Allow service role to bypass: RLS is enabled but policy denies all; service role bypasses RLS by default in Supabase
-- So we need a policy that allows no one from JWT; actually in Supabase, when using service_role key, RLS is bypassed.
-- To restrict to service role only we use a policy that no normal user can satisfy. So USING (false) means no row
-- is visible to anon/authenticated. Service role still sees all. Good.

-- 3. ai_suggestions: draft AI replies for SUGGEST (human approves before send)
CREATE TABLE IF NOT EXISTS public.ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id uuid NOT NULL REFERENCES public.line_bots(id) ON DELETE CASCADE,
  event_id text NOT NULL,
  user_message text NOT NULL,
  suggested_reply text NOT NULL,
  sources_count int NOT NULL DEFAULT 0,
  confidence_score float NOT NULL DEFAULT 0,
  risk_category text NOT NULL DEFAULT 'low' CHECK (risk_category IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'expired', 'rejected')),
  sent_at timestamptz,
  sent_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);
CREATE INDEX idx_ai_suggestions_contact ON public.ai_suggestions(contact_id);
CREATE INDEX idx_ai_suggestions_user_status ON public.ai_suggestions(user_id, status);
CREATE INDEX idx_ai_suggestions_event_id ON public.ai_suggestions(event_id);

ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ai_suggestions via contact" ON public.ai_suggestions
  FOR ALL USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND c.user_id = auth.uid())
  );

COMMENT ON TABLE public.line_bots IS 'LINE channel per tenant; webhook_key_hash for URL lookup; secrets encrypted';
COMMENT ON TABLE public.webhook_events IS 'Raw webhook payload persisted before processing; service role only';
COMMENT ON TABLE public.ai_suggestions IS 'Draft AI replies (SUGGEST); sent_by/sent_at for audit when status=sent';
