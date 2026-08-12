begin;

-- A single Hotmart subscription product can expose multiple offers/plans.
-- provider_product_id therefore identifies the product, while these columns
-- identify the exact commercial plan purchased by the customer.
alter table public.plans
  add column if not exists provider_offer_code text,
  add column if not exists provider_plan_id text;

drop index if exists public.plans_provider_product_id_key;

create index if not exists plans_provider_product_id_idx
  on public.plans (provider_product_id)
  where provider_product_id is not null;

create unique index if not exists plans_provider_product_offer_key
  on public.plans (provider_product_id, provider_offer_code)
  where provider_product_id is not null
    and provider_offer_code is not null;

create unique index if not exists plans_provider_product_plan_key
  on public.plans (provider_product_id, provider_plan_id)
  where provider_product_id is not null
    and provider_plan_id is not null;

comment on column public.plans.provider_product_id is
  'Hotmart product ucode or numeric product id. It may be shared by several application plans.';
comment on column public.plans.provider_offer_code is
  'Hotmart purchase.offer.code used to distinguish offers belonging to the same product.';
comment on column public.plans.provider_plan_id is
  'Hotmart subscription.plan.id used for renewals, cancellations and plan changes.';

commit;
