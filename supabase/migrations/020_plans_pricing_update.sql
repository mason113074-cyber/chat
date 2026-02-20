-- Update plans to new pricing: Free 0, Starter 799, Pro 1899, Business 5299
-- Limits: conversations per month, knowledge base entries (aligned with lib/plans.ts)

-- Free: 100 conv, 50 kb
UPDATE public.plans SET
  price_monthly = 0,
  price_yearly = 0,
  limits = '{"max_bots": 1, "max_replies_monthly": 100, "max_contacts": 50, "knowledge_entries": 50}'::jsonb,
  name = '免費方案'
WHERE slug = 'free';

-- Basic (Starter tier): 799/mo, 1000 conv, 200 kb
UPDATE public.plans SET
  price_monthly = 799,
  price_yearly = 7990,
  limits = '{"max_bots": 1, "max_replies_monthly": 1000, "max_contacts": 500, "knowledge_entries": 200}'::jsonb,
  name = '入門方案'
WHERE slug = 'basic';

-- Pro: 1899/mo, 5000 conv, 1000 kb
UPDATE public.plans SET
  price_monthly = 1899,
  price_yearly = 18990,
  limits = '{"max_bots": 3, "max_replies_monthly": 5000, "max_contacts": 2000, "knowledge_entries": 1000}'::jsonb,
  name = '專業方案'
WHERE slug = 'pro';

-- Enterprise (Business tier): 5299/mo, 20000 conv, 5000 kb
UPDATE public.plans SET
  price_monthly = 5299,
  price_yearly = 52990,
  limits = '{"max_bots": -1, "max_replies_monthly": 20000, "max_contacts": -1, "knowledge_entries": 5000}'::jsonb,
  name = '企業方案'
WHERE slug = 'enterprise';
