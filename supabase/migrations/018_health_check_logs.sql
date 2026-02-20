-- Health check run history for monitoring and LemonSqueezy/audit
create table if not exists public.health_check_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  triggered_by text not null check (triggered_by in ('user', 'cron')),
  user_id uuid references public.users(id) on delete set null,
  summary jsonb not null,
  details jsonb not null
);

create index health_check_logs_created_at_idx on public.health_check_logs(created_at desc);
create index health_check_logs_triggered_by_idx on public.health_check_logs(triggered_by);
create index health_check_logs_user_id_idx on public.health_check_logs(user_id);

alter table public.health_check_logs enable row level security;

-- Only service role can insert (cron has no user; dashboard uses admin client)
-- Users can read their own rows for history in dashboard (optional)
create policy "Service role can manage health_check_logs"
  on public.health_check_logs
  for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

create policy "Users can read own health check logs"
  on public.health_check_logs
  for select
  using (auth.uid() = user_id);
