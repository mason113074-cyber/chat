-- Crisp CRM upgrade + 3 MVP tables
-- customer_events, customer_segments, customer_health_scores, message_sentiments, sentiment_alerts, campaigns, campaign_logs

-- Add source and lifecycle_stage to contacts
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'line' CHECK (source IN ('line', 'widget', 'import')),
  ADD COLUMN IF NOT EXISTS lifecycle_stage text DEFAULT 'new_customer' CHECK (lifecycle_stage IN ('new_customer', 'engaging', 'active', 'vip', 'churn_risk'));

-- customer_events: lifecycle event tracking
CREATE TABLE IF NOT EXISTS public.customer_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_name text NOT NULL,
  metadata jsonb,
  source text NOT NULL DEFAULT 'system' CHECK (source IN ('system', 'manual', 'api', 'automation')),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customer_events_contact_id_idx ON public.customer_events(contact_id);
CREATE INDEX IF NOT EXISTS customer_events_user_id_idx ON public.customer_events(user_id);
ALTER TABLE public.customer_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own customer_events" ON public.customer_events FOR ALL
  USING (auth.uid() = user_id);

-- customer_segments: saved filter groups
CREATE TABLE IF NOT EXISTS public.customer_segments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  filter_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customer_segments_user_id_idx ON public.customer_segments(user_id);
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own segments" ON public.customer_segments FOR ALL
  USING (auth.uid() = user_id);

-- customer_health_scores
CREATE TABLE IF NOT EXISTS public.customer_health_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  overall_score int NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  engagement_score int NOT NULL CHECK (engagement_score >= 0 AND engagement_score <= 100),
  sentiment_score int NOT NULL CHECK (sentiment_score >= 0 AND sentiment_score <= 100),
  response_score int NOT NULL CHECK (response_score >= 0 AND response_score <= 100),
  recency_score int NOT NULL CHECK (recency_score >= 0 AND recency_score <= 100),
  risk_level text NOT NULL CHECK (risk_level IN ('healthy', 'warning', 'at_risk', 'churned')),
  factors jsonb,
  calculated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customer_health_scores_contact_id_idx ON public.customer_health_scores(contact_id);
CREATE INDEX IF NOT EXISTS customer_health_scores_user_id_risk_idx ON public.customer_health_scores(user_id, risk_level);
ALTER TABLE public.customer_health_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own health_scores" ON public.customer_health_scores FOR ALL
  USING (auth.uid() = user_id);

-- message_sentiments (conversation row = one message; id = message id)
CREATE TABLE IF NOT EXISTS public.message_sentiments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sentiment text NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative', 'urgent')),
  score float NOT NULL,
  confidence float NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  keywords jsonb,
  suggested_tone text,
  alert_triggered boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id)
);
CREATE INDEX IF NOT EXISTS message_sentiments_contact_id_idx ON public.message_sentiments(contact_id);
CREATE INDEX IF NOT EXISTS message_sentiments_user_id_sentiment_idx ON public.message_sentiments(user_id, sentiment);
ALTER TABLE public.message_sentiments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own message_sentiments" ON public.message_sentiments FOR ALL
  USING (auth.uid() = user_id);

-- sentiment_alerts
CREATE TABLE IF NOT EXISTS public.sentiment_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  alert_level text NOT NULL CHECK (alert_level IN ('warning', 'critical')),
  reason text NOT NULL,
  is_read boolean DEFAULT false,
  is_resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sentiment_alerts_user_id_read_idx ON public.sentiment_alerts(user_id, is_read);
ALTER TABLE public.sentiment_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sentiment_alerts" ON public.sentiment_alerts FOR ALL
  USING (auth.uid() = user_id);

-- campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused')),
  segment_filter jsonb NOT NULL DEFAULT '{}',
  target_count int DEFAULT 0,
  sent_count int DEFAULT 0,
  delivered_count int DEFAULT 0,
  read_count int DEFAULT 0,
  click_count int DEFAULT 0,
  channel text DEFAULT 'line' CHECK (channel IN ('line', 'email', 'widget')),
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'flex', 'image', 'template')),
  message_content jsonb NOT NULL DEFAULT '{}',
  scheduled_at timestamptz,
  sent_at timestamptz,
  completed_at timestamptz,
  ab_test_enabled boolean DEFAULT false,
  ab_variants jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS campaigns_user_id_idx ON public.campaigns(user_id);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own campaigns" ON public.campaigns FOR ALL
  USING (auth.uid() = user_id);

-- campaign_logs
CREATE TABLE IF NOT EXISTS public.campaign_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('sent', 'delivered', 'read', 'clicked', 'failed')),
  variant text,
  sent_at timestamptz DEFAULT now(),
  metadata jsonb
);
CREATE INDEX IF NOT EXISTS campaign_logs_campaign_id_idx ON public.campaign_logs(campaign_id);
CREATE INDEX IF NOT EXISTS campaign_logs_contact_id_idx ON public.campaign_logs(contact_id);
ALTER TABLE public.campaign_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view campaign_logs via campaigns" ON public.campaign_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_logs.campaign_id AND c.user_id = auth.uid()));
CREATE POLICY "Users insert campaign_logs via campaigns" ON public.campaign_logs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_logs.campaign_id AND c.user_id = auth.uid()));

-- api_keys for integrations (REST API, webhooks)
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON public.api_keys(user_id);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own api_keys" ON public.api_keys FOR ALL
  USING (auth.uid() = user_id);
