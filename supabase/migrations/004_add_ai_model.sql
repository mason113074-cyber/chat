-- Add ai_model to users for OpenAI model selection
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS ai_model varchar(50) DEFAULT 'gpt-4o-mini';
