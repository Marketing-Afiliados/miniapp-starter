begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'user',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  description text,
  price numeric(12,2) not null default 0,
  currency text not null default 'USD',
  billing_interval text not null default 'month',
  limits jsonb not null default '{}'::jsonb,
  provider_product_id text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  provider text not null default 'hotmart',
  provider_subscription_id text,
  provider_transaction_id text,
  status text not null default 'pending',
  started_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  feature text not null,
  quantity integer not null default 0,
  period_start timestamptz not null,
  period_end timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'hotmart',
  event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processed boolean not null default false,
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

-- Bring pre-existing starter tables up to the contract without dropping data.
alter table public.profiles
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists avatar_url text,
  add column if not exists role text default 'user',
  add column if not exists status text default 'active',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.plans
  add column if not exists name text,
  add column if not exists code text,
  add column if not exists description text,
  add column if not exists price numeric(12,2) default 0,
  add column if not exists currency text default 'USD',
  add column if not exists billing_interval text default 'month',
  add column if not exists limits jsonb default '{}'::jsonb,
  add column if not exists provider_product_id text,
  add column if not exists active boolean default true,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.subscriptions
  add column if not exists user_id uuid,
  add column if not exists plan_id uuid,
  add column if not exists provider text default 'hotmart',
  add column if not exists provider_subscription_id text,
  add column if not exists provider_transaction_id text,
  add column if not exists status text default 'pending',
  add column if not exists started_at timestamptz,
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.usage
  add column if not exists user_id uuid,
  add column if not exists feature text,
  add column if not exists quantity integer default 0,
  add column if not exists period_start timestamptz,
  add column if not exists period_end timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.webhook_events
  add column if not exists provider text default 'hotmart',
  add column if not exists event_id text,
  add column if not exists event_type text,
  add column if not exists payload jsonb default '{}'::jsonb,
  add column if not exists processed boolean default false,
  add column if not exists processed_at timestamptz,
  add column if not exists error text,
  add column if not exists created_at timestamptz default now();

update public.profiles set role = 'user' where role is null;
update public.profiles set status = 'active' where status is null;
update public.plans set limits = '{}'::jsonb where limits is null;
update public.usage set quantity = 0 where quantity is null;
update public.webhook_events set processed = false where processed is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where contype = 'p' and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles add constraint profiles_pkey primary key (id);
  end if;
  if not exists (
    select 1 from pg_constraint
    where contype = 'p' and conrelid = 'public.plans'::regclass
  ) then
    alter table public.plans add constraint plans_pkey primary key (id);
  end if;
  if not exists (
    select 1 from pg_constraint
    where contype = 'p' and conrelid = 'public.subscriptions'::regclass
  ) then
    alter table public.subscriptions add constraint subscriptions_pkey primary key (id);
  end if;
  if not exists (
    select 1 from pg_constraint
    where contype = 'p' and conrelid = 'public.usage'::regclass
  ) then
    alter table public.usage add constraint usage_pkey primary key (id);
  end if;
  if not exists (
    select 1 from pg_constraint
    where contype = 'p' and conrelid = 'public.webhook_events'::regclass
  ) then
    alter table public.webhook_events add constraint webhook_events_pkey primary key (id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where contype = 'f'
      and conrelid = 'public.profiles'::regclass
      and confrelid = 'auth.users'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;
  end if;
  if not exists (
    select 1 from pg_constraint
    where contype = 'f'
      and conrelid = 'public.subscriptions'::regclass
      and confrelid = 'public.profiles'::regclass
  ) then
    alter table public.subscriptions
      add constraint subscriptions_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
  end if;
  if not exists (
    select 1 from pg_constraint
    where contype = 'f'
      and conrelid = 'public.subscriptions'::regclass
      and confrelid = 'public.plans'::regclass
  ) then
    alter table public.subscriptions
      add constraint subscriptions_plan_id_fkey foreign key (plan_id) references public.plans(id);
  end if;
  if not exists (
    select 1 from pg_constraint
    where contype = 'f'
      and conrelid = 'public.usage'::regclass
      and confrelid = 'public.profiles'::regclass
  ) then
    alter table public.usage
      add constraint usage_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_role_check') then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('user', 'admin'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_status_check') then
    alter table public.profiles
      add constraint profiles_status_check check (status in ('active', 'inactive', 'suspended'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'subscriptions_status_check') then
    alter table public.subscriptions
      add constraint subscriptions_status_check
      check (status in ('pending', 'active', 'past_due', 'cancelled', 'expired', 'refunded'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'usage_quantity_check') then
    alter table public.usage
      add constraint usage_quantity_check check (quantity >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'usage_period_check') then
    alter table public.usage
      add constraint usage_period_check check (period_end > period_start);
  end if;
end;
$$;

create unique index if not exists plans_code_key on public.plans (code);
create unique index if not exists plans_provider_product_id_key
  on public.plans (provider_product_id)
  where provider_product_id is not null;
create unique index if not exists subscriptions_provider_reference_key
  on public.subscriptions (provider, provider_subscription_id);
create unique index if not exists webhook_events_provider_event_key
  on public.webhook_events (provider, event_id);
create unique index if not exists usage_user_feature_period_key
  on public.usage (user_id, feature, period_start, period_end);
create index if not exists subscriptions_user_status_idx
  on public.subscriptions (user_id, status);
create index if not exists usage_user_feature_idx
  on public.usage (user_id, feature);
create index if not exists webhook_events_created_at_idx
  on public.webhook_events (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists plans_set_updated_at on public.plans;
create trigger plans_set_updated_at before update on public.plans
for each row execute function public.set_updated_at();
drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at before update on public.subscriptions
for each row execute function public.set_updated_at();
drop trigger if exists usage_set_updated_at on public.usage;
create trigger usage_set_updated_at before update on public.usage
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        updated_at = now();
  return new;
end;
$$;

insert into public.profiles (id, email, full_name)
select
  users.id,
  coalesce(users.email, ''),
  nullif(trim(users.raw_user_meta_data ->> 'full_name'), '')
from auth.users as users
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_trigger as trigger
    join pg_proc as procedure on procedure.oid = trigger.tgfoid
    where trigger.tgrelid = 'auth.users'::regclass
      and not trigger.tgisinternal
      and (
        trigger.tgname = 'on_auth_user_created'
        or procedure.proname = 'handle_new_user'
      )
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end;
$$;

commit;
