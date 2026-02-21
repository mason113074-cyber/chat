-- Crisp P1/P2 schema: private notes, ticketing, api_keys, routing_rules, white-label

-- 1. Internal notes (private): per-contact thread, team-only
CREATE TABLE IF NOT EXISTS public.conversation_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conversation_notes_contact ON public.conversation_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversation_notes_user ON public.conversation_notes(user_id);
ALTER TABLE public.conversation_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage notes for own contacts" ON public.conversation_notes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND c.user_id = auth.uid()));

-- 2. Ticketing: per-contact ticket fields (one active ticket per contact in MVP)
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS ticket_number text,
  ADD COLUMN IF NOT EXISTS ticket_priority text DEFAULT 'medium' CHECK (ticket_priority IN ('low', 'medium', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS assigned_to_id uuid REFERENCES public.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_assigned_to ON public.contacts(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_contacts_ticket_number ON public.contacts(user_id, ticket_number) WHERE ticket_number IS NOT NULL;

-- 3. API Keys (for webhook / Zapier / REST API)
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON public.api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON public.api_keys(user_id);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own api_keys" ON public.api_keys FOR ALL USING (auth.uid() = user_id);

-- 4. Routing rules: condition -> assign to user or tag
CREATE TABLE IF NOT EXISTS public.routing_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  priority int NOT NULL DEFAULT 0,
  condition_json jsonb NOT NULL DEFAULT '{}',
  assign_to_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  add_tag_id uuid REFERENCES public.contact_tags(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_routing_rules_user ON public.routing_rules(user_id);
ALTER TABLE public.routing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own routing_rules" ON public.routing_rules FOR ALL USING (auth.uid() = user_id);

-- 5. White-label (users table extension)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS branding_logo_url text,
  ADD COLUMN IF NOT EXISTS branding_primary_color text DEFAULT '#4F46E5',
  ADD COLUMN IF NOT EXISTS branding_hide_powered_by boolean DEFAULT false;

-- 6. AI quality: allow marking conversation as "wrong answer" for KB iteration (extend ai_feedback usage)
ALTER TABLE public.ai_feedback
  ADD COLUMN IF NOT EXISTS suggested_kb_title text,
  ADD COLUMN IF NOT EXISTS suggested_kb_content text;

COMMENT ON TABLE public.conversation_notes IS 'Private notes per contact thread (team-only, not sent to customer)';
COMMENT ON TABLE public.api_keys IS 'API keys for REST/Webhook (key_hash stores hashed key, key_prefix for lookup)';
COMMENT ON TABLE public.routing_rules IS 'Routing rules: condition_json -> assign_to_user_id or add_tag_id';
