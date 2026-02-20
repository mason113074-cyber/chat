-- Allow users to read cron health check logs (for history dashboard)
drop policy if exists "Users can read own health check logs" on public.health_check_logs;

create policy "Users can read own and cron health check logs"
  on public.health_check_logs
  for select
  using (auth.uid() = user_id or triggered_by = 'cron');
