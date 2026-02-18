-- ============================================================
-- Advisor 建議修復：Security + Performance
-- 1. plans 啟用 RLS（僅開放讀取）
-- 2. handle_new_user 設定 search_path
-- 3. payments.subscription_id 外鍵索引
-- ============================================================

-- 1. plans：啟用 RLS，方案表僅需公開讀取（定價頁／API 用）
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Plans are readable by everyone" ON public.plans;
CREATE POLICY "Plans are readable by everyone" ON public.plans FOR SELECT USING (true);

-- 2. handle_new_user：固定 search_path 避免 search_path 變動風險
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, plan)
  VALUES (new.id, new.email, 'starter')
  ON CONFLICT (id) DO UPDATE SET email = excluded.email;
  RETURN new;
END;
$$;

-- 3. payments：外鍵 subscription_id 索引（Advisor: unindexed_foreign_keys）
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON public.payments(subscription_id);

SELECT 'Advisor 修復執行完成' AS result;
