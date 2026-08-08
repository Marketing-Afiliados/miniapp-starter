begin;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
revoke all on function public.handle_new_user() from public;
revoke all on function public.set_updated_at() from public;

alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage enable row level security;
alter table public.webhook_events enable row level security;

-- These tables belong to this starter. Replace all prior policies so an
-- unknown permissive policy cannot silently expose another user's rows.
do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'plans', 'subscriptions', 'usage', 'webhook_events')
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      existing_policy.policyname,
      existing_policy.tablename
    );
  end loop;
end;
$$;

create policy profiles_select_self_or_admin
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy profiles_insert_self
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  and role = 'user'
  and status = 'active'
  and email = coalesce(auth.jwt() ->> 'email', email)
);

create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = auth.uid() and status = 'active')
with check (id = auth.uid() and status = 'active');

create policy plans_select_active_or_admin
on public.plans
for select
to anon, authenticated
using (active = true or public.is_admin());

create policy subscriptions_select_self_or_admin
on public.subscriptions
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy usage_select_self_or_admin
on public.usage
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy webhook_events_select_admin
on public.webhook_events
for select
to authenticated
using (public.is_admin());

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.plans from anon, authenticated;
revoke all on table public.subscriptions from anon, authenticated;
revoke all on table public.usage from anon, authenticated;
revoke all on table public.webhook_events from anon, authenticated;

grant select on table public.profiles to authenticated;
grant insert (id, email, full_name, avatar_url) on table public.profiles to authenticated;
grant update (full_name, avatar_url) on table public.profiles to authenticated;
grant select on table public.plans to anon, authenticated;
grant select on table public.subscriptions to authenticated;
grant select on table public.usage to authenticated;
grant select on table public.webhook_events to authenticated;

commit;
