-- Billing Phase 1: plans, subscriptions, payments
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name varchar(50) NOT NULL,
  slug varchar(50) UNIQUE NOT NULL,
  description text,
  price_monthly int NOT NULL DEFAULT 0,
  price_yearly int NOT NULL DEFAULT 0,
  features jsonb DEFAULT '[]',
  limits jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

DROP TABLE IF EXISTS public.subscriptions CASCADE;

CREATE TABLE public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES public.plans(id) NOT NULL,
  status varchar(20) DEFAULT 'active',
  billing_cycle varchar(10) DEFAULT 'monthly',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  payment_provider varchar(50),
  provider_subscription_id varchar(100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX subscriptions_plan_id_idx ON public.subscriptions(plan_id);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id),
  amount int NOT NULL,
  currency varchar(3) DEFAULT 'TWD',
  status varchar(20) DEFAULT 'pending',
  payment_method varchar(50),
  provider varchar(50),
  provider_payment_id varchar(100),
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX payments_user_id_idx ON public.payments(user_id);

INSERT INTO public.plans (name, slug, description, price_monthly, price_yearly, features, limits, sort_order) VALUES
('免費試用', 'free', '體驗 CustomerAIPro 基本功能', 0, 0,
  '["1 個 LINE Bot", "每月 100 則 AI 回覆", "基本對話紀錄"]'::jsonb,
  '{"max_bots": 1, "max_replies_monthly": 100, "max_contacts": 50}'::jsonb, 1),
('基礎版', 'basic', '適合小型商家', 799, 7990,
  '["1 個 LINE Bot", "每月 1,000 則 AI 回覆", "完整對話紀錄", "客戶管理", "自訂 AI 語氣"]'::jsonb,
  '{"max_bots": 1, "max_replies_monthly": 1000, "max_contacts": 500}'::jsonb, 2),
('專業版', 'pro', '適合成長中的企業', 1999, 19990,
  '["3 個 LINE Bot", "每月 5,000 則 AI 回覆", "完整對話紀錄", "客戶管理", "自訂 AI 語氣", "數據分析", "知識庫上傳", "優先客服"]'::jsonb,
  '{"max_bots": 3, "max_replies_monthly": 5000, "max_contacts": 2000}'::jsonb, 3),
('企業版', 'enterprise', '大型企業客製化方案', 4999, 49990,
  '["無限 LINE Bot", "無限 AI 回覆", "完整對話紀錄", "客戶管理", "自訂 AI 語氣", "數據分析", "知識庫上傳", "專屬客服經理", "SLA 保證", "API 存取"]'::jsonb,
  '{"max_bots": -1, "max_replies_monthly": -1, "max_contacts": -1}'::jsonb, 4)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
