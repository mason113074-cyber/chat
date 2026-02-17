-- Add tags to conversations (optional per-message tags; thread-level tags use contacts.tags)
alter table public.conversations
  add column if not exists tags text[] default '{}';
