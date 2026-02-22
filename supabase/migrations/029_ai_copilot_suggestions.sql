-- AI Copilot suggestion audit table
-- Stores non-auto drafts for human approval and one-click send tracking.

CREATE TABLE IF NOT EXISTS public.ai_suggestions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  source_message_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  draft_text text NOT NULL,
  action text NOT NULL CHECK (action IN ('AUTO', 'SUGGEST', 'ASK', 'HANDOFF')),
  category text NOT NULL,
  confidence numeric(4,3) NOT NULL DEFAULT 0,
  reason text,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'sent')),
  approved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_contact_created
  ON public.ai_suggestions(user_id, contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_status
  ON public.ai_suggestions(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_source_message
  ON public.ai_suggestions(source_message_id);

ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own ai_suggestions" ON public.ai_suggestions;
CREATE POLICY "Users read own ai_suggestions" ON public.ai_suggestions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own ai_suggestions" ON public.ai_suggestions;
CREATE POLICY "Users insert own ai_suggestions" ON public.ai_suggestions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own ai_suggestions" ON public.ai_suggestions;
CREATE POLICY "Users update own ai_suggestions" ON public.ai_suggestions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own ai_suggestions" ON public.ai_suggestions;
CREATE POLICY "Users delete own ai_suggestions" ON public.ai_suggestions
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE public.ai_suggestions IS 'AI copilot drafts requiring human review and audit trail';
