-- Sprint: Contacts CRM enrichment
-- Add optional CRM fields to contacts for dashboard improvements

alter table if exists public.contacts
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists notes text,
  add column if not exists csat_score numeric(3,2),
  add column if not exists top_topic text;

