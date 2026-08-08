begin;

alter table public.webhook_events
  add column if not exists buyer_email text,
  add column if not exists provider_subscription_id text,
  add column if not exists provider_transaction_id text,
  add column if not exists plan_id uuid,
  add column if not exists subscription_status text,
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where contype = 'f'
      and conrelid = 'public.webhook_events'::regclass
      and confrelid = 'public.plans'::regclass
  ) then
    alter table public.webhook_events
      add constraint webhook_events_plan_id_fkey
      foreign key (plan_id) references public.plans(id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'webhook_events_subscription_status_check'
      and conrelid = 'public.webhook_events'::regclass
  ) then
    alter table public.webhook_events
      add constraint webhook_events_subscription_status_check
      check (
        subscription_status is null
        or subscription_status in (
          'pending',
          'active',
          'past_due',
          'cancelled',
          'expired',
          'refunded'
        )
      );
  end if;
end;
$$;

create index if not exists webhook_events_pending_buyer_idx
  on public.webhook_events (lower(buyer_email), created_at)
  where processed = false and buyer_email is not null;

commit;
