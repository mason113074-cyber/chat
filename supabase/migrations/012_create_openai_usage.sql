-- OpenAI Token 用量追蹤表
CREATE TABLE IF NOT EXISTS public.openai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_tokens integer NOT NULL,
  completion_tokens integer NOT NULL,
  total_tokens integer NOT NULL,
  cost_usd decimal(10, 6) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 索引優化
CREATE INDEX IF NOT EXISTS idx_openai_usage_user_date ON public.openai_usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_openai_usage_created_at ON public.openai_usage(created_at DESC);

-- RLS 政策
ALTER TABLE public.openai_usage ENABLE ROW LEVEL SECURITY;

-- 使用者只能看自己的用量
CREATE POLICY "Users can view own usage"
  ON public.openai_usage
  FOR SELECT
  USING (auth.uid() = user_id);
