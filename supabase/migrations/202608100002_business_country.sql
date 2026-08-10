begin;

alter table public.business_profiles
  add column if not exists country_code text not null default 'OTHER';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'business_profiles_country_code_check'
      and conrelid = 'public.business_profiles'::regclass
  ) then
    alter table public.business_profiles
      add constraint business_profiles_country_code_check
      check (country_code = 'OTHER' or country_code ~ '^[A-Z]{2}$');
  end if;
end;
$$;

commit;
