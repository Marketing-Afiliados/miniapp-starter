begin;

create table if not exists public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  business_name text not null,
  owner_name text not null,
  email text,
  phone text,
  whatsapp text,
  instagram text,
  logo_url text,
  address text,
  currency text not null default 'USD',
  default_margin_percentage numeric(7,2) not null default 40,
  default_terms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_profiles_currency_check check (currency ~ '^[A-Z]{3}$'),
  constraint business_profiles_margin_check check (default_margin_percentage >= 0)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  whatsapp text,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  default_price_cents bigint not null default 0,
  default_cost_cents bigint not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_default_price_check check (default_price_cents >= 0),
  constraint services_default_cost_check check (default_cost_cents >= 0)
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  unit text not null default 'unidad',
  unit_cost_cents bigint not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint materials_unit_cost_check check (unit_cost_cents >= 0)
);

create table if not exists public.quote_counters (
  user_id uuid not null references public.profiles(id) on delete cascade,
  quote_year integer not null,
  current_value bigint not null default 0,
  primary key (user_id, quote_year),
  constraint quote_counters_year_check check (quote_year between 2020 and 9999),
  constraint quote_counters_value_check check (current_value >= 0)
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid not null references public.customers(id),
  quote_number text not null,
  quote_sequence bigint not null,
  event_name text not null,
  event_type text not null,
  event_date date not null,
  event_location text not null,
  valid_until date,
  status text not null default 'draft',
  currency text not null default 'USD',
  items_cost_cents bigint not null default 0,
  items_price_cents bigint not null default 0,
  labor_cost_cents bigint not null default 0,
  transport_cost_cents bigint not null default 0,
  other_cost_cents bigint not null default 0,
  total_cost_cents bigint not null default 0,
  margin_type text not null default 'percentage',
  margin_percentage numeric(7,2),
  fixed_margin_cents bigint,
  margin_amount_cents bigint not null default 0,
  recommended_price_cents bigint not null default 0,
  final_price_cents bigint not null default 0,
  estimated_profit_cents bigint not null default 0,
  notes text,
  terms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotes_status_check check (
    status in ('draft', 'sent', 'approved', 'rejected', 'expired', 'completed')
  ),
  constraint quotes_margin_type_check check (margin_type in ('percentage', 'fixed')),
  constraint quotes_currency_check check (currency ~ '^[A-Z]{3}$'),
  constraint quotes_nonnegative_money_check check (
    items_cost_cents >= 0
    and items_price_cents >= 0
    and labor_cost_cents >= 0
    and transport_cost_cents >= 0
    and other_cost_cents >= 0
    and total_cost_cents >= 0
    and coalesce(fixed_margin_cents, 0) >= 0
    and margin_amount_cents >= 0
    and recommended_price_cents >= 0
    and final_price_cents >= 0
  ),
  constraint quotes_margin_percentage_check check (
    margin_percentage is null or margin_percentage >= 0
  ),
  constraint quotes_margin_shape_check check (
    (margin_type = 'percentage' and margin_percentage is not null and fixed_margin_cents is null)
    or
    (margin_type = 'fixed' and fixed_margin_cents is not null and margin_percentage is null)
  ),
  unique (user_id, quote_number)
);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null,
  reference_id uuid,
  name text not null,
  description text,
  quantity numeric(12,3) not null default 1,
  unit text not null default 'unidad',
  unit_cost_cents bigint not null default 0,
  unit_price_cents bigint not null default 0,
  total_cost_cents bigint not null default 0,
  total_price_cents bigint not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quote_items_type_check check (item_type in ('service', 'material', 'custom')),
  constraint quote_items_quantity_check check (quantity >= 0),
  constraint quote_items_money_check check (
    unit_cost_cents >= 0
    and unit_price_cents >= 0
    and total_cost_cents >= 0
    and total_price_cents >= 0
  )
);

create index if not exists business_profiles_user_id_idx on public.business_profiles (user_id);
create index if not exists customers_user_id_idx on public.customers (user_id);
create index if not exists customers_user_name_idx on public.customers (user_id, lower(full_name));
create index if not exists services_user_id_idx on public.services (user_id);
create index if not exists materials_user_id_idx on public.materials (user_id);
create index if not exists quotes_user_id_idx on public.quotes (user_id);
create index if not exists quotes_customer_id_idx on public.quotes (customer_id);
create index if not exists quotes_status_idx on public.quotes (user_id, status);
create index if not exists quotes_event_date_idx on public.quotes (user_id, event_date);
create index if not exists quote_items_quote_id_idx on public.quote_items (quote_id);
create index if not exists quote_items_user_id_idx on public.quote_items (user_id);

create or replace function public.assign_decoquote_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  generated_year integer;
  generated_sequence bigint;
begin
  generated_year := extract(year from coalesce(new.created_at, now()))::integer;

  insert into public.quote_counters (user_id, quote_year, current_value)
  values (new.user_id, generated_year, 1)
  on conflict (user_id, quote_year)
  do update set current_value = public.quote_counters.current_value + 1
  returning current_value into generated_sequence;

  new.quote_sequence := generated_sequence;
  new.quote_number := 'DQ-' || generated_year::text || '-' || lpad(generated_sequence::text, 6, '0');
  return new;
end;
$$;

drop trigger if exists quotes_assign_number on public.quotes;
create trigger quotes_assign_number
before insert on public.quotes
for each row execute function public.assign_decoquote_number();

drop trigger if exists business_profiles_set_updated_at on public.business_profiles;
create trigger business_profiles_set_updated_at before update on public.business_profiles
for each row execute function public.set_updated_at();
drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at before update on public.customers
for each row execute function public.set_updated_at();
drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at before update on public.services
for each row execute function public.set_updated_at();
drop trigger if exists materials_set_updated_at on public.materials;
create trigger materials_set_updated_at before update on public.materials
for each row execute function public.set_updated_at();
drop trigger if exists quotes_set_updated_at on public.quotes;
create trigger quotes_set_updated_at before update on public.quotes
for each row execute function public.set_updated_at();
drop trigger if exists quote_items_set_updated_at on public.quote_items;
create trigger quote_items_set_updated_at before update on public.quote_items
for each row execute function public.set_updated_at();

create or replace function public.save_decoquote_quote(p_quote_id uuid, p_payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare saved_id uuid; item jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_quote_id is null then
    insert into public.quotes (
      user_id, customer_id, quote_number, quote_sequence, event_name, event_type,
      event_date, event_location, valid_until, status, currency, items_cost_cents,
      items_price_cents, labor_cost_cents, transport_cost_cents, other_cost_cents,
      total_cost_cents, margin_type, margin_percentage, fixed_margin_cents,
      margin_amount_cents, recommended_price_cents, final_price_cents,
      estimated_profit_cents, notes, terms
    ) values (
      auth.uid(), (p_payload->>'customer_id')::uuid, '', 0,
      p_payload->>'event_name', p_payload->>'event_type', (p_payload->>'event_date')::date,
      p_payload->>'event_location', nullif(p_payload->>'valid_until','')::date,
      coalesce(p_payload->>'status','draft'), p_payload->>'currency',
      (p_payload->>'items_cost_cents')::bigint, (p_payload->>'items_price_cents')::bigint,
      (p_payload->>'labor_cost_cents')::bigint, (p_payload->>'transport_cost_cents')::bigint,
      (p_payload->>'other_cost_cents')::bigint, (p_payload->>'total_cost_cents')::bigint,
      p_payload->>'margin_type', nullif(p_payload->>'margin_percentage','')::numeric,
      nullif(p_payload->>'fixed_margin_cents','')::bigint,
      (p_payload->>'margin_amount_cents')::bigint, (p_payload->>'recommended_price_cents')::bigint,
      (p_payload->>'final_price_cents')::bigint, (p_payload->>'estimated_profit_cents')::bigint,
      nullif(p_payload->>'notes',''), nullif(p_payload->>'terms','')
    ) returning id into saved_id;
  else
    update public.quotes set
      customer_id = (p_payload->>'customer_id')::uuid,
      event_name = p_payload->>'event_name', event_type = p_payload->>'event_type',
      event_date = (p_payload->>'event_date')::date, event_location = p_payload->>'event_location',
      valid_until = nullif(p_payload->>'valid_until','')::date,
      currency = p_payload->>'currency', items_cost_cents = (p_payload->>'items_cost_cents')::bigint,
      items_price_cents = (p_payload->>'items_price_cents')::bigint,
      labor_cost_cents = (p_payload->>'labor_cost_cents')::bigint,
      transport_cost_cents = (p_payload->>'transport_cost_cents')::bigint,
      other_cost_cents = (p_payload->>'other_cost_cents')::bigint,
      total_cost_cents = (p_payload->>'total_cost_cents')::bigint,
      margin_type = p_payload->>'margin_type',
      margin_percentage = nullif(p_payload->>'margin_percentage','')::numeric,
      fixed_margin_cents = nullif(p_payload->>'fixed_margin_cents','')::bigint,
      margin_amount_cents = (p_payload->>'margin_amount_cents')::bigint,
      recommended_price_cents = (p_payload->>'recommended_price_cents')::bigint,
      final_price_cents = (p_payload->>'final_price_cents')::bigint,
      estimated_profit_cents = (p_payload->>'estimated_profit_cents')::bigint,
      notes = nullif(p_payload->>'notes',''), terms = nullif(p_payload->>'terms','')
    where id = p_quote_id and user_id = auth.uid() returning id into saved_id;
    if saved_id is null then raise exception 'Quote not found'; end if;
    delete from public.quote_items where quote_id = saved_id and user_id = auth.uid();
  end if;
  for item in select value from jsonb_array_elements(p_payload->'items') loop
    insert into public.quote_items (
      quote_id, user_id, item_type, reference_id, name, description, quantity, unit,
      unit_cost_cents, unit_price_cents, total_cost_cents, total_price_cents, sort_order
    ) values (
      saved_id, auth.uid(), item->>'item_type', nullif(item->>'reference_id','')::uuid,
      item->>'name', nullif(item->>'description',''), (item->>'quantity')::numeric,
      item->>'unit', (item->>'unit_cost_cents')::bigint, (item->>'unit_price_cents')::bigint,
      (item->>'total_cost_cents')::bigint, (item->>'total_price_cents')::bigint,
      (item->>'sort_order')::integer
    );
  end loop;
  return saved_id;
end;
$$;

create or replace function public.record_decoquote_usage(p_feature text, p_quantity integer default 1)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  period_start_value timestamptz := date_trunc('month', now());
  period_end_value timestamptz := date_trunc('month', now()) + interval '1 month';
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_quantity < 1 then raise exception 'Quantity must be positive'; end if;
  insert into public.usage (user_id, feature, quantity, period_start, period_end)
  values (auth.uid(), p_feature, p_quantity, period_start_value, period_end_value)
  on conflict (user_id, feature, period_start, period_end)
  do update set quantity = public.usage.quantity + excluded.quantity, updated_at = now();
end;
$$;

alter table public.business_profiles enable row level security;
alter table public.customers enable row level security;
alter table public.services enable row level security;
alter table public.materials enable row level security;
alter table public.quote_counters enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;

create policy business_profiles_owner_or_admin on public.business_profiles
for all to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy customers_owner_or_admin on public.customers
for all to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy services_owner_or_admin on public.services
for all to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy materials_owner_or_admin on public.materials
for all to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy quotes_owner_or_admin on public.quotes
for all to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (
  (user_id = auth.uid() or public.is_admin())
  and exists (
    select 1 from public.customers
    where customers.id = customer_id
      and (customers.user_id = user_id or public.is_admin())
  )
);

create policy quote_items_owner_or_admin on public.quote_items
for all to authenticated
using (
  (user_id = auth.uid() or public.is_admin())
  and exists (
    select 1 from public.quotes
    where quotes.id = quote_id
      and quotes.user_id = user_id
  )
)
with check (
  (user_id = auth.uid() or public.is_admin())
  and exists (
    select 1 from public.quotes
    where quotes.id = quote_id
      and quotes.user_id = user_id
  )
);

revoke all on table public.business_profiles from anon, authenticated;
revoke all on table public.customers from anon, authenticated;
revoke all on table public.services from anon, authenticated;
revoke all on table public.materials from anon, authenticated;
revoke all on table public.quote_counters from anon, authenticated;
revoke all on table public.quotes from anon, authenticated;
revoke all on table public.quote_items from anon, authenticated;

grant select, insert, update, delete on table public.business_profiles to authenticated;
grant select, insert, update, delete on table public.customers to authenticated;
grant select, insert, update, delete on table public.services to authenticated;
grant select, insert, update, delete on table public.materials to authenticated;
grant select, insert, update, delete on table public.quotes to authenticated;
grant select, insert, update, delete on table public.quote_items to authenticated;

revoke all on function public.assign_decoquote_number() from public;
revoke all on function public.save_decoquote_quote(uuid, jsonb) from public;
grant execute on function public.save_decoquote_quote(uuid, jsonb) to authenticated;
revoke all on function public.record_decoquote_usage(text, integer) from public;
grant execute on function public.record_decoquote_usage(text, integer) to authenticated;

insert into public.plans (
  name, code, description, price, currency, billing_interval, limits, active
)
values (
  'DecoQuote Pro',
  'decoquote-pro',
  'Cotizaciones profesionales y control de rentabilidad para decoradoras.',
  9.99,
  'USD',
  'monthly',
  '{"quotes_per_month": 50, "pdf_generations_per_month": 50, "customers": -1}'::jsonb,
  true
)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  currency = excluded.currency,
  billing_interval = excluded.billing_interval,
  limits = excluded.limits,
  active = true,
  updated_at = now();

commit;
