-- Dashboard stats in one RPC to reduce round-trips and improve load time
-- Usage: select * from get_dashboard_stats('user-uuid-here');

create or replace function public.get_dashboard_stats(p_user_id uuid)
returns table (
  total_contacts bigint,
  total_conversations bigint,
  today_conversations bigint,
  weekly_new_contacts bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    (select count(*)::bigint from public.contacts where user_id = p_user_id),
    (select count(*)::bigint from public.conversations c
     join public.contacts ct on c.contact_id = ct.id
     where ct.user_id = p_user_id),
    (select count(*)::bigint from public.conversations c
     join public.contacts ct on c.contact_id = ct.id
     where ct.user_id = p_user_id and c.created_at >= current_date),
    (select count(*)::bigint from public.contacts
     where user_id = p_user_id
     and created_at >= current_date - interval '7 days');
end;
$$;

comment on function public.get_dashboard_stats(uuid) is 'Returns dashboard stats for a user: total_contacts, total_conversations, today_conversations, weekly_new_contacts';
