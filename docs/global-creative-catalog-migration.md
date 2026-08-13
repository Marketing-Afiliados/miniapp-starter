# Migración del catálogo creativo global

Archivo: `supabase/migrations/202608120001_global_creative_catalog.sql`

## Qué modifica

- Crea seis tablas: `catalog_categories`, `catalog_subcategories`,
  `catalog_items`, `catalog_item_categories`,
  `business_catalog_categories` y `catalog_item_overrides`.
- Añade clasificación opcional a `services` y `materials`.
- Añade tipo/unidad a `services` y descripción/precio a `materials`.
- Amplía `quote_items.item_type` con product, labor, equipment, transport y other.
- Conserva IDs, nombres, costos, precios y estado de todas las filas existentes.
- Carga 10 categorías, 27 subcategorías, 237 ítems únicos y 34 relaciones
  adicionales que reutilizan ítems en más de un rubro.
- Crea RLS de lectura para catálogo global y RLS por propietario para selección
  de rubros y overrides.

No contiene `DROP TABLE` ni `TRUNCATE`. Los `DROP` de la migración se limitan
a reemplazar de manera controlada una restricción, políticas y triggers por nombre.

## Aplicación manual

1. Realiza un backup del esquema y datos en Supabase.
2. Abre SQL Editor en el proyecto correcto.
3. Copia el archivo completo y ejecútalo una sola vez.
4. Verifica que termine con `Success. No rows returned`.
5. Ejecuta las comprobaciones de abajo.
6. Despliega el código únicamente después de aplicar la migración.

Ejecuta siempre el archivo completo, no solamente los bloques de `INSERT`. La
tabla temporal `catalog_seed` se conserva durante la sesión del SQL Editor para
ser compatible con ejecuciones que confirman bloques individuales.

```sql
select count(*) from public.catalog_categories where active;
select count(*) from public.catalog_subcategories where active;
select item_type, count(*) from public.catalog_items
where active group by item_type order by item_type;
select count(*) from public.catalog_item_categories;

select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename like 'catalog_%'
order by tablename, policyname;
```

## Pruebas RLS recomendadas

Con dos usuarios de prueba:

1. Ambos pueden leer `catalog_items` activos.
2. Un cliente autenticado no puede insertar/actualizar `catalog_items`.
3. El usuario A puede crear su override.
4. El usuario B no puede verlo ni modificarlo.
5. Ambos siguen administrando solamente sus filas en `services` y `materials`.

## Rollback manual

No ejecutar si ya existen personalizaciones que deban conservarse. Exporta primero
`business_catalog_categories` y `catalog_item_overrides`. Despliega antes la
versión anterior de la aplicación.

```sql
begin;
alter table public.quote_items drop constraint if exists quote_items_type_check;
alter table public.quote_items add constraint quote_items_type_check
  check (item_type in ('service', 'material', 'custom')) not valid;

alter table public.services drop constraint if exists services_catalog_subcategory_fk;
alter table public.services drop constraint if exists services_item_type_check;
alter table public.services drop constraint if exists services_unit_check;
alter table public.materials drop constraint if exists materials_catalog_subcategory_fk;
alter table public.materials drop constraint if exists materials_default_price_check;

drop function if exists public.set_business_catalog_categories(uuid[]);
drop table if exists public.catalog_item_overrides;
drop table if exists public.business_catalog_categories;
drop table if exists public.catalog_item_categories;

alter table public.services
  drop column if exists subcategory_id,
  drop column if exists category_id,
  drop column if exists item_type,
  drop column if exists unit;
alter table public.materials
  drop column if exists subcategory_id,
  drop column if exists category_id,
  drop column if exists description,
  drop column if exists default_price_cents;

drop table if exists public.catalog_items;
drop table if exists public.catalog_subcategories;
drop table if exists public.catalog_categories;
commit;
```

La restricción antigua queda `NOT VALID` para no bloquear el rollback si ya
existen cotizaciones con tipos nuevos. Puede validarse después de revisar esos datos.
