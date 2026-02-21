-- Sprint 5-12: Guidance, Confidence, Business Hours, Feedback, Memory, Welcome, A/B Test

-- Sprint 5: ai_guidance_rules
CREATE TABLE IF NOT EXISTS public.ai_guidance_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rule_title text NOT NULL,
  rule_content text NOT NULL,
  is_enabled boolean DEFAULT true,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_guidance_rules_user ON public.ai_guidance_rules(user_id);
ALTER TABLE public.ai_guidance_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own guidance rules" ON public.ai_guidance_rules;
CREATE POLICY "Users can manage own guidance rules" ON public.ai_guidance_rules
  FOR ALL USING (auth.uid() = user_id);

-- Sprint 6: confidence + handoff (users)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS confidence_threshold NUMERIC(3,2) DEFAULT 0.6,
  ADD COLUMN IF NOT EXISTS low_confidence_action TEXT DEFAULT 'handoff',
  ADD COLUMN IF NOT EXISTS handoff_message TEXT DEFAULT '這個問題需要專人為您處理，請稍候。';

-- Sprint 6: confidence_score on conversations
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(3,2);

-- Sprint 7: business hours (users)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS business_hours_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{"timezone":"Asia/Taipei","schedule":{"mon":{"enabled":true,"start":"09:00","end":"18:00"},"tue":{"enabled":true,"start":"09:00","end":"18:00"},"wed":{"enabled":true,"start":"09:00","end":"18:00"},"thu":{"enabled":true,"start":"09:00","end":"18:00"},"fri":{"enabled":true,"start":"09:00","end":"18:00"},"sat":{"enabled":false,"start":"09:00","end":"18:00"},"sun":{"enabled":false,"start":"09:00","end":"18:00"}}}'::jsonb,
  ADD COLUMN IF NOT EXISTS outside_hours_mode TEXT DEFAULT 'auto_reply',
  ADD COLUMN IF NOT EXISTS outside_hours_message TEXT DEFAULT '感謝您的訊息！目前為非營業時間，我們將在營業時間盡快回覆您。';

-- Sprint 8: feedback (users + ai_feedback)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS feedback_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS feedback_message TEXT DEFAULT '這個回覆有幫助嗎？';

CREATE TABLE IF NOT EXISTS public.ai_feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  rating text CHECK (rating IN ('positive', 'negative')),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user ON public.ai_feedback(user_id);
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own feedback" ON public.ai_feedback;
CREATE POLICY "Users can view own feedback" ON public.ai_feedback
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role insert feedback" ON public.ai_feedback;
CREATE POLICY "Service role insert feedback" ON public.ai_feedback
  FOR INSERT WITH CHECK (true);

-- Sprint 9: conversation memory (users)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS conversation_memory_count INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS conversation_memory_mode TEXT DEFAULT 'recent';

-- Sprint 10: welcome message (users)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS welcome_message_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS welcome_message TEXT DEFAULT '歡迎！我是 AI 客服助手，有什麼可以幫您的嗎？😊';

-- Sprint 12: A/B test
CREATE TABLE IF NOT EXISTS public.ab_tests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  variant_a_prompt text NOT NULL,
  variant_b_prompt text NOT NULL,
  traffic_split integer DEFAULT 50,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed')),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ab_test_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ab_test_id uuid NOT NULL REFERENCES public.ab_tests(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  variant text NOT NULL CHECK (variant IN ('A', 'B')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(ab_test_id, contact_id)
);
CREATE INDEX IF NOT EXISTS idx_ab_tests_user ON public.ab_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_test ON public.ab_test_assignments(ab_test_id);

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS ab_test_id uuid REFERENCES public.ab_tests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ab_variant text;

ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own ab_tests" ON public.ab_tests;
CREATE POLICY "Users manage own ab_tests" ON public.ab_tests FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own ab_assignments via test" ON public.ab_test_assignments;
CREATE POLICY "Users manage own ab_assignments via test" ON public.ab_test_assignments
  FOR ALL USING (EXISTS (SELECT 1 FROM public.ab_tests t WHERE t.id = ab_test_id AND t.user_id = auth.uid()));
