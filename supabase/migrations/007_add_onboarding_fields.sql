-- Onboarding and LINE config fields for users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS store_name VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS industry VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS line_channel_secret VARCHAR(200);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS line_channel_access_token TEXT;
