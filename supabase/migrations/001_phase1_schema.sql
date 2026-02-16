-- Phase 1 MVP Schema for CustomerAIPro
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- Users: app users (link to auth.users for Supabase Auth)
-- id matches auth.users(id) so we can sync on first login
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  plan text not null default 'starter' check (plan in ('starter', 'growth', 'business')),
  line_channel_id text,
  created_at timestamptz not null default now()
);

-- Contacts: LINE (or other) contacts per user
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  line_user_id text not null,
  name text,
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  unique(user_id, line_user_id)
);

create index contacts_user_id_idx on public.contacts(user_id);
create index contacts_line_user_id_idx on public.contacts(line_user_id);

-- Conversations: per-message rows (contact_id, message, role)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  message text not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  created_at timestamptz not null default now()
);

create index conversations_contact_id_idx on public.conversations(contact_id);
create index conversations_created_at_idx on public.conversations(created_at desc);

-- Orders: simple order tracking per contact
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  order_number text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create index orders_contact_id_idx on public.orders(contact_id);

-- Subscriptions: plan and billing per user
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan text not null,
  status text not null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions(user_id);

-- RLS: enable on all tables
alter table public.users enable row level security;
alter table public.contacts enable row level security;
alter table public.conversations enable row level security;
alter table public.orders enable row level security;
alter table public.subscriptions enable row level security;

-- Users: users can read/update own row only
create policy "Users can read own row" on public.users
  for select using (auth.uid() = id);
create policy "Users can update own row" on public.users
  for update using (auth.uid() = id);
create policy "Users can insert own row" on public.users
  for insert with check (auth.uid() = id);

-- Contacts: users see only their contacts
create policy "Users can manage own contacts" on public.contacts
  for all using (auth.uid() = user_id);

-- Conversations: via contact ownership
create policy "Users can view conversations of own contacts" on public.conversations
  for select using (
    exists (select 1 from public.contacts c where c.id = contact_id and c.user_id = auth.uid())
  );
create policy "Users can insert conversations for own contacts" on public.conversations
  for insert with check (
    exists (select 1 from public.contacts c where c.id = contact_id and c.user_id = auth.uid())
  );

-- Orders: via contact ownership
create policy "Users can view orders of own contacts" on public.orders
  for select using (
    exists (select 1 from public.contacts c where c.id = contact_id and c.user_id = auth.uid())
  );

-- Subscriptions: users see only their subscriptions
create policy "Users can manage own subscriptions" on public.subscriptions
  for all using (auth.uid() = user_id);

-- Service role bypass: API/webhook uses service role key so it can insert contacts and conversations
-- without being a specific user. No extra policy needed for that.

-- Trigger: create public.users row on first auth signup (optional, or do in app)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, plan)
  values (new.id, new.email, 'starter')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
