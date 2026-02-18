-- ============================================================
-- CustomerAIPro Supabase 修復與優化（單次執行）
-- 請在 Supabase Dashboard → SQL Editor → 貼上並執行
-- 用途：補齊設定頁所需欄位、對話/聯絡人欄位、知識庫/標籤表、Dashboard RPC、索引
-- ============================================================

-- 1. users 表：設定頁與 onboarding 所需欄位
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS system_prompt text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ai_model varchar(50) DEFAULT 'gpt-4o-mini';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS store_name varchar(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS industry varchar(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS line_channel_secret varchar(200);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS line_channel_access_token text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS quick_replies jsonb DEFAULT '[]'::jsonb;

UPDATE public.users
SET quick_replies = '[
  {"id": "1", "text": "📦 查詢訂單狀態", "enabled": true},
  {"id": "2", "text": "💰 運費怎麼計算？", "enabled": true},
  {"id": "3", "text": "🔄 如何退換貨？", "enabled": true}
]'::jsonb
WHERE quick_replies IS NULL OR quick_replies = '[]'::jsonb;

-- 2. conversations：狀態欄位（Analytics / 對話狀態篩選）
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'ai_handled';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS resolved_by varchar(20) DEFAULT 'ai';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS is_resolved boolean DEFAULT true;
UPDATE public.conversations SET status = 'ai_handled', is_resolved = true, resolved_by = 'ai' WHERE status IS NULL;

-- 3. contacts：狀態欄位（若 migration 005 已執行則已有 CHECK）
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- 4. 知識庫表（若不存在）
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title varchar(200) NOT NULL,
  content text NOT NULL,
  category varchar(50) DEFAULT 'general',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own knowledge" ON public.knowledge_base;
CREATE POLICY "Users can manage own knowledge" ON public.knowledge_base FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_user_id ON public.knowledge_base(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_user_active ON public.knowledge_base(user_id, is_active) WHERE is_active = true;

-- 5. 聯絡人標籤表（若不存在）
CREATE TABLE IF NOT EXISTS public.contact_tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name varchar(50) NOT NULL,
  color varchar(20) DEFAULT 'gray',
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.contact_tag_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.contact_tags(id) ON DELETE CASCADE,
  assigned_by varchar(20) DEFAULT 'manual',
  created_at timestamptz DEFAULT now(),
  UNIQUE(contact_id, tag_id)
);
ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_tag_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own tags" ON public.contact_tags;
CREATE POLICY "Users can manage own tags" ON public.contact_tags FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own tag assignments" ON public.contact_tag_assignments;
CREATE POLICY "Users can manage own tag assignments" ON public.contact_tag_assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_tag_assignments.contact_id AND c.user_id = auth.uid())
);
CREATE INDEX IF NOT EXISTS idx_contact_tags_user_id ON public.contact_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_tag_assignments_contact_id ON public.contact_tag_assignments(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_tag_assignments_tag_id ON public.contact_tag_assignments(tag_id);

-- 6. Dashboard 統計 RPC（並行查詢優化用）
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_user_id uuid)
RETURNS TABLE (
  total_contacts bigint,
  total_conversations bigint,
  today_conversations bigint,
  weekly_new_contacts bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT count(*)::bigint FROM public.contacts WHERE user_id = p_user_id),
    (SELECT count(*)::bigint FROM public.conversations c
     JOIN public.contacts ct ON c.contact_id = ct.id
     WHERE ct.user_id = p_user_id),
    (SELECT count(*)::bigint FROM public.conversations c
     JOIN public.contacts ct ON c.contact_id = ct.id
     WHERE ct.user_id = p_user_id AND c.created_at >= current_date),
    (SELECT count(*)::bigint FROM public.contacts
     WHERE user_id = p_user_id
     AND created_at >= current_date - interval '7 days');
END;
$$;
COMMENT ON FUNCTION public.get_dashboard_stats(uuid) IS 'Dashboard stats: total_contacts, total_conversations, today_conversations, weekly_new_contacts';

-- 7. 效能索引
CREATE INDEX IF NOT EXISTS idx_conversations_contact_created ON public.conversations(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_contact_status ON public.conversations(contact_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_contact_created_status ON public.conversations(contact_id, created_at DESC, status);
CREATE INDEX IF NOT EXISTS idx_contacts_user_created ON public.contacts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_user_status ON public.contacts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_knowledge_user_created ON public.knowledge_base(user_id, created_at DESC);

-- 完成
SELECT 'Supabase 修復與優化執行完成' AS result;
