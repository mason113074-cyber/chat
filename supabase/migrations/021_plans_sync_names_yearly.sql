-- Sync plan names and pricing (canonical: 免費/入門/專業/企業方案, 799/7990, 1899/18990, 5299/52990)
-- Ensures starter/business slugs match if they exist (e.g. from other seeds)

UPDATE public.plans SET
  price_monthly = 799,
  price_yearly = 7990,
  name = '入門方案'
WHERE slug = 'starter';

UPDATE public.plans SET
  price_monthly = 5299,
  price_yearly = 52990,
  name = '企業方案'
WHERE slug = 'business';
