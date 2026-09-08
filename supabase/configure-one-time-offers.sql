-- Configuración solicitada: ij6szo4g y wzs2qd3h.
-- Ejecutar después de 202609070001_one_time_access.sql.
-- Producto Hotmart proporcionado por el propietario: 8466415.
-- Este archivo no se ejecuta automáticamente como migración.
begin;
do $$
declare
  first_product text := '8466415';
  second_product text := '8466415';
  item record;
begin
  if first_product like 'REEMPLAZAR_%' or second_product like 'REEMPLAZAR_%'
     or coalesce(trim(first_product),'') = '' or coalesce(trim(second_product),'') = '' then
    raise exception 'Completa los identificadores reales de producto antes de registrar las ofertas.';
  end if;

  -- No convertir una base de pruebas a producción.
  insert into public.payment_settings(singleton,environment)
    values(true,'production') on conflict(singleton) do nothing;
  if not exists(select 1 from public.payment_settings where environment='production') then
    raise exception 'Esta base pertenece a otro ambiente. Usa la base de producción correcta.';
  end if;

  for item in select * from (values
    (trim(first_product),'ij6szo4g'),
    (trim(second_product),'wzs2qd3h')
  ) as offers(product_id,offer_code) loop
    if exists(select 1 from public.payment_offers
      where environment='production' and provider_offer_code=item.offer_code
        and provider_product_id<>item.product_id) then
      raise exception 'La oferta % ya está asociada a otro producto; revisa el mapeo.',item.offer_code;
    end if;
    insert into public.payment_offers(
      provider_product_id,provider_offer_code,environment,enabled,revoke_on_refund
    ) values(item.product_id,item.offer_code,'production',true,false)
    on conflict(environment,provider_product_id,provider_offer_code) do nothing;
    if not exists(select 1 from public.payment_offers
      where environment='production' and provider_product_id=item.product_id
        and provider_offer_code=item.offer_code and enabled) then
      raise exception 'La oferta % existe pero está deshabilitada; revisar antes de reactivarla.',item.offer_code;
    end if;
  end loop;
end;
$$;
commit;

select provider_product_id,provider_offer_code,environment,enabled
from public.payment_offers
where environment='production' and provider_offer_code in ('ij6szo4g','wzs2qd3h');
