-- Add system_prompt to users for AI configuration
alter table public.users
  add column if not exists system_prompt text;
