begin;

-- Configure exactly one environment per database; test events can never grant production access.
create table if not exists public.payment_settings (
  singleton boolean primary key default true check (singleton),
  environment text not null check (environment in ('test','production'))
);
alter table public.payment_settings enable row level security;
revoke all on public.payment_settings from anon, authenticated;
grant all on public.payment_settings to service_role;

-- One row per independently configured Hotmart offer. No legacy rows are changed.
create table if not exists public.payment_offers (
  id uuid primary key default gen_random_uuid(),
  product_code text not null default 'decoquote-lifetime' check (product_code = 'decoquote-lifetime'),
  provider_product_id text not null,
  provider_offer_code text not null,
  environment text not null check (environment in ('test','production')),
  price_cents integer not null default 1299 check (price_cents = 1299),
  currency text not null default 'USD' check (currency = 'USD'),
  terms_version text not null default '2026-09-07-lifetime',
  rights jsonb not null default '{"license":"lifetime","support":"lifetime","updates":"lifetime","usage":"unlimited"}',
  enabled boolean not null default false,
  revoke_on_refund boolean not null default false,
  unique (environment, provider_product_id, provider_offer_code)
);
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.payment_offers(id),
  provider text not null default 'hotmart',
  environment text not null check (environment in ('test','production')),
  transaction_id text not null,
  user_id uuid references public.profiles(id),
  buyer_email text not null,
  status text not null check (status in ('pending','approved','cancelled','refunded','chargeback','review')),
  amount numeric(18,2) not null check (amount >= 0),
  currency text not null,
  approved_at timestamptz,
  last_event_at timestamptz not null,
  terms_version text not null,
  rights jsonb not null,
  created_at timestamptz not null default now(),
  unique (provider, environment, transaction_id)
);
create table if not exists public.access_entitlements (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null unique references public.purchases(id),
  product_code text not null default 'decoquote-lifetime',
  status text not null check (status in ('active','revoked')),
  activated_at timestamptz not null,
  revoked_at timestamptz,
  revocation_reason text,
  -- No monthly period or expiration: lifetime license confirmed by the owner.
  created_at timestamptz not null default now()
);
create table if not exists public.payment_admin_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id),
  action text not null,
  target_id uuid not null,
  reason text not null check (length(trim(reason)) >= 10),
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.webhook_events
  add column if not exists purchase_id uuid references public.purchases(id),
  add column if not exists payment_environment text,
  add column if not exists attempts integer not null default 0;
create index if not exists purchases_unlinked_email_idx on public.purchases(lower(buyer_email)) where user_id is null;
create index if not exists purchases_user_idx on public.purchases(user_id);

alter table public.payment_offers enable row level security;
alter table public.purchases enable row level security;
alter table public.access_entitlements enable row level security;
alter table public.payment_admin_audit enable row level security;
create policy payment_offers_admin on public.payment_offers for select to authenticated using (public.is_admin());
create policy purchases_owner on public.purchases for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy entitlements_owner on public.access_entitlements for select to authenticated using (
  exists (select 1 from public.purchases p where p.id = purchase_id and (p.user_id = auth.uid() or public.is_admin()))
);
create policy payment_audit_admin on public.payment_admin_audit for select to authenticated using (public.is_admin());
revoke all on public.payment_offers, public.purchases, public.access_entitlements, public.payment_admin_audit from anon, authenticated;
grant select on public.payment_offers, public.purchases, public.access_entitlements, public.payment_admin_audit to authenticated;
grant all on public.payment_offers, public.purchases, public.access_entitlements, public.payment_admin_audit to service_role;

-- Called only after the HTTP handler has verified Hotmart authentication.
-- Store sanitized provider fields; no address, card, phone or raw payload.
create or replace function public.process_one_time_purchase(p_event jsonb, p_environment text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_event public.webhook_events%rowtype;
  v_offer public.payment_offers%rowtype;
  v_purchase public.purchases%rowtype;
  v_user uuid;
  v_duplicate boolean := false;
  v_next text;
  v_error text;
begin
  if not exists (select 1 from public.payment_settings where environment = p_environment) or p_environment not in ('test','production') or p_environment is null
     or coalesce(p_event->>'id','') = '' or coalesce(p_event->>'transaction','') = '' then
    return jsonb_build_object('ok',false);
  end if;
  perform pg_advisory_xact_lock(hashtextextended('event:' || p_environment || ':' || (p_event->>'id'), 0));
  select * into v_event from public.webhook_events
    where provider = 'hotmart-one-time-' || p_environment and event_id = p_event->>'id' for update;
  if found then
    v_duplicate := true;
    -- Same identifier cannot replace its authenticated original content.
    if v_event.payload <> p_event then return jsonb_build_object('ok',false); end if;
    if v_event.processed then return jsonb_build_object('ok',true,'duplicate',true); end if;
    update public.webhook_events set attempts = attempts + 1 where id = v_event.id;
  else
    insert into public.webhook_events(provider,event_id,event_type,payload,buyer_email,provider_transaction_id,payment_environment,attempts)
    values ('hotmart-one-time-' || p_environment,p_event->>'id',p_event->>'type',p_event,p_event->>'buyer_email',p_event->>'transaction',p_environment,1)
    returning * into v_event;
  end if;
  -- Exception subtransaction rolls back purchase/access writes, but preserves the inbox and safe error code.
  begin
    select * into strict v_offer from public.payment_offers
      where environment = p_environment and enabled
        and provider_product_id in (select jsonb_array_elements_text(p_event->'product_ids'))
        and provider_offer_code = p_event->>'offer_code';
    if p_event->>'status' not in ('pending','approved','cancelled','refunded','chargeback','review')
       or coalesce(p_event->>'buyer_email','') = '' then raise exception 'INVALID_PURCHASE'; end if;
    perform pg_advisory_xact_lock(hashtextextended('purchase:' || p_environment || ':' || (p_event->>'transaction'), 0));
    select * into v_purchase from public.purchases where provider = 'hotmart'
      and environment = p_environment and transaction_id = p_event->>'transaction' for update;
    if found and (v_purchase.offer_id <> v_offer.id or v_purchase.buyer_email <> p_event->>'buyer_email') then
      raise exception 'PURCHASE_IDENTITY_CONFLICT';
    end if;
    select u.id into v_user from auth.users u join public.profiles p on p.id = u.id
      where lower(u.email) = lower(p_event->>'buyer_email') and u.email_confirmed_at is not null;
    if v_purchase.id is null then
      insert into public.purchases(offer_id,environment,transaction_id,user_id,buyer_email,status,amount,currency,approved_at,last_event_at,terms_version,rights)
      values(v_offer.id,p_environment,p_event->>'transaction',v_user,lower(p_event->>'buyer_email'),p_event->>'status',
        (p_event->>'amount')::numeric,p_event->>'currency',(p_event->>'approved_at')::timestamptz,
        (p_event->>'occurred_at')::timestamptz,v_offer.terms_version,v_offer.rights) returning * into v_purchase;
    else
      -- Refund/chargeback are terminal, including when delivered before approval.
      -- Pending/cancelled attempts never undo confirmed approval.
      v_next := case
        when p_event->>'status' in ('refunded','chargeback') then p_event->>'status'
        when v_purchase.status in ('refunded','chargeback') then v_purchase.status
        when p_event->>'status' = 'approved' then 'approved'
        when v_purchase.status = 'approved' then 'approved'
        when (p_event->>'occurred_at')::timestamptz >= v_purchase.last_event_at then p_event->>'status'
        else v_purchase.status end;
      update public.purchases set status = v_next, user_id = coalesce(user_id,v_user),
        approved_at = coalesce(approved_at,(p_event->>'approved_at')::timestamptz),
        amount = case when p_event->>'status' = 'approved' then (p_event->>'amount')::numeric else amount end,
        currency = case when p_event->>'status' = 'approved' then p_event->>'currency' else currency end,
        last_event_at = greatest(last_event_at,(p_event->>'occurred_at')::timestamptz)
        where id = v_purchase.id returning * into v_purchase;
    end if;
    if v_purchase.status = 'approved' then
      insert into public.access_entitlements(purchase_id,status,activated_at)
        values(v_purchase.id,'active',v_purchase.approved_at) on conflict (purchase_id) do nothing;
    elsif v_purchase.status in ('refunded','chargeback') and v_offer.revoke_on_refund then
      update public.access_entitlements set status = 'revoked',
        revoked_at = coalesce(revoked_at,(p_event->>'occurred_at')::timestamptz),
        revocation_reason = coalesce(revocation_reason,v_purchase.status)
        where purchase_id = v_purchase.id;
    end if;
    update public.webhook_events set purchase_id = v_purchase.id, processed = true, processed_at = now(),
      error = case when p_event->>'status' = 'review' or (v_purchase.status in ('refunded','chargeback') and not v_offer.revoke_on_refund)
        then 'REVIEW_REQUIRED' else null end where id = v_event.id;
    return jsonb_build_object('ok',true,'duplicate',v_duplicate);
  exception when others then
    v_error := case when sqlstate = 'P0002' then 'OFFER_NOT_CONFIGURED'
      when sqlstate = 'P0003' then 'OFFER_AMBIGUOUS'
      when sqlerrm = 'PURCHASE_IDENTITY_CONFLICT' then 'PURCHASE_IDENTITY_CONFLICT'
      else 'PROCESSING_FAILED' end;
    update public.webhook_events set error = v_error where id = v_event.id;
    return jsonb_build_object('ok',false,'duplicate',v_duplicate,'error',v_error);
  end;
end;
$$;
revoke all on function public.process_one_time_purchase(jsonb,text) from public, anon, authenticated;
grant execute on function public.process_one_time_purchase(jsonb,text) to service_role;

-- Derive identity from Auth itself, never an email submitted by the client.
create or replace function public.claim_one_time_purchases()
returns integer language plpgsql security definer set search_path = '' as $$
declare v_email text; v_count integer;
begin
  select lower(email) into v_email from auth.users where id = auth.uid() and email_confirmed_at is not null;
  if v_email is null then return 0; end if;
  update public.purchases set user_id = auth.uid() where user_id is null and lower(buyer_email) = v_email and environment = (select environment from public.payment_settings);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.claim_one_time_purchases() from public, anon;
grant execute on function public.claim_one_time_purchases() to authenticated;

create or replace function public.retry_one_time_event(p_event_id uuid, p_reason text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_event public.webhook_events%rowtype; v_result jsonb;
begin
  if not public.is_admin() then raise exception 'Admin required'; end if;
  if length(trim(coalesce(p_reason,''))) < 10 then raise exception 'Reason required'; end if;
  select * into strict v_event from public.webhook_events where id = p_event_id and provider like 'hotmart-one-time-%';
  insert into public.payment_admin_audit(actor_id,action,target_id,reason) values(auth.uid(),'retry_event',p_event_id,p_reason);
  v_result := public.process_one_time_purchase(v_event.payload,v_event.payment_environment);
  return v_result;
end;
$$;
revoke all on function public.retry_one_time_event(uuid,text) from public, anon;
grant execute on function public.retry_one_time_event(uuid,text) to authenticated;

-- Minimal administrative reconciliation, invoked with an authenticated admin session.
-- Operators must verify provider evidence and both identities before linking a different email.
create or replace function public.reconcile_purchase_access(p_purchase_id uuid, p_action text, p_user_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_purchase public.purchases%rowtype;
begin
  if not public.is_admin() then raise exception 'Admin required'; end if;
  if length(trim(coalesce(p_reason,''))) < 10 or length(p_reason) > 1000 then raise exception 'Reason required'; end if;
  select * into strict v_purchase from public.purchases where id = p_purchase_id for update;
  if p_action = 'link' then
    if not exists (select 1 from auth.users u join public.profiles p on p.id = u.id where u.id = p_user_id and u.email_confirmed_at is not null) then
      raise exception 'Verified target required';
    end if;
    update public.purchases set user_id = p_user_id where id = p_purchase_id;
  elsif p_action = 'grant' then
    if v_purchase.status <> 'approved' then raise exception 'Approved purchase required'; end if;
    insert into public.access_entitlements(purchase_id,status,activated_at) values(p_purchase_id,'active',v_purchase.approved_at)
      on conflict (purchase_id) do update set status='active',revoked_at=null,revocation_reason=null;
  elsif p_action = 'revoke' then
    update public.access_entitlements set status='revoked',revoked_at=now(),revocation_reason=p_reason where purchase_id=p_purchase_id;
  else raise exception 'Invalid action';
  end if;
  insert into public.payment_admin_audit(actor_id,action,target_id,reason,details)
    values(auth.uid(),p_action,p_purchase_id,p_reason,jsonb_build_object('previous_user_id',v_purchase.user_id,'target_user_id',p_user_id,'purchase_status',v_purchase.status));
end;
$$;
revoke all on function public.reconcile_purchase_access(uuid,text,uuid,text) from public,anon;
grant execute on function public.reconcile_purchase_access(uuid,text,uuid,text) to authenticated;

create or replace function public.has_decoquote_access()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_admin() or exists (
    select 1 from public.purchases p join public.access_entitlements e on e.purchase_id = p.id
    where p.user_id = auth.uid() and p.environment = (select environment from public.payment_settings) and e.status = 'active' and e.product_code = 'decoquote-lifetime'
  ) or exists (
    select 1 from public.subscriptions s join public.plans p on p.id = s.plan_id
    where s.user_id = auth.uid() and s.status = 'active' and p.active
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;
revoke all on function public.has_decoquote_access() from public, anon;
grant execute on function public.has_decoquote_access() to authenticated;

-- Restrictive policies combine with existing owner policies using AND, not OR.
-- No rows or legacy rights are removed. Account/support remain available.
do $$
declare t text;
begin
  foreach t in array array['business_profiles','customers','services','materials','quotes','quote_items',
    'catalog_categories','catalog_subcategories','catalog_items','catalog_item_categories','business_catalog_categories','catalog_item_overrides'] loop
    execute format('create policy decoquote_access_required on public.%I as restrictive for all to authenticated using (public.has_decoquote_access()) with check (public.has_decoquote_access())',t);
  end loop;
end;
$$;
commit;
