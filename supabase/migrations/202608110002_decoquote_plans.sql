begin;

insert into public.plans (
  name,
  code,
  description,
  price,
  currency,
  billing_interval,
  limits,
  provider_product_id,
  provider_offer_code,
  provider_plan_id,
  active
)
values
  (
    'DecoQuote Emprende',
    'decoquote-emprende',
    'Plan para iniciar con cotizaciones profesionales y control de rentabilidad.',
    9.99,
    'USD',
    'monthly',
    '{"quotes_per_month": 50, "pdf_generations_per_month": 50, "customers": -1}'::jsonb,
    '8284042',
    'r5jsptik',
    '91c9cea2-34f0-403f-91e5-605ed5219b4e',
    true
  ),
  (
    'DecoQuote Pro',
    'decoquote-pro',
    'Plan sin límites mensuales de cotizaciones ni propuestas PDF.',
    19.99,
    'USD',
    'monthly',
    '{"quotes_per_month": -1, "pdf_generations_per_month": -1, "customers": -1}'::jsonb,
    '8284042',
    'lyyel4u7',
    '5d3b9de4-4239-4705-b1be-1d369ccc0ce5',
    true
  )
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  currency = excluded.currency,
  billing_interval = excluded.billing_interval,
  limits = excluded.limits,
  provider_product_id = excluded.provider_product_id,
  provider_offer_code = excluded.provider_offer_code,
  provider_plan_id = excluded.provider_plan_id,
  active = excluded.active,
  updated_at = now();

commit;
