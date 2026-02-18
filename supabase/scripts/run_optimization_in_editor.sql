-- =====================================================
-- 在 Supabase Dashboard → SQL Editor 貼上並執行此檔
-- Step 1: openai_usage 表 + Step 2: 索引優化
-- =====================================================

-- ---------- Step 1: 建立 openai_usage 資料表 ----------
CREATE TABLE IF NOT EXISTS public.openai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  cost_usd DECIMAL(10, 6) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_openai_usage_user_date ON public.openai_usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_openai_usage_created_at ON public.openai_usage(created_at DESC);

ALTER TABLE public.openai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own usage" ON public.openai_usage;
CREATE POLICY "Users can view own usage"
  ON public.openai_usage FOR SELECT
  USING (auth.uid() = user_id);

-- ---------- Step 2: 索引優化 ----------
CREATE INDEX IF NOT EXISTS idx_conversations_contact_created
  ON public.conversations(contact_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_contact_status
  ON public.conversations(contact_id, status);

CREATE INDEX IF NOT EXISTS idx_conversations_contact_created_status
  ON public.conversations(contact_id, created_at DESC, status);

CREATE INDEX IF NOT EXISTS idx_contacts_user_created
  ON public.contacts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contacts_user_status
  ON public.contacts(user_id, status);

CREATE INDEX IF NOT EXISTS idx_knowledge_user_created
  ON public.knowledge_base(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_tags_user_id
  ON public.contact_tags(user_id);

CREATE INDEX IF NOT EXISTS idx_contact_tag_assignments_contact_id
  ON public.contact_tag_assignments(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_tag_assignments_tag_id
  ON public.contact_tag_assignments(tag_id);

COMMENT ON INDEX idx_conversations_contact_created IS 'Optimize message list per contact (conversation detail)';
COMMENT ON INDEX idx_conversations_contact_status IS 'Filter conversations by status per contact';
COMMENT ON INDEX idx_contacts_user_created IS 'User contact list with created_at sort';
COMMENT ON INDEX idx_knowledge_user_created IS 'Knowledge base list by user and time';
