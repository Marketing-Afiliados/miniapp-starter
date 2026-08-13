begin;

-- Incremental global catalog. Existing user services, materials and prices are
-- preserved. Global prices remain zero until each user configures an override.
create table if not exists public.catalog_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_categories_code_check check (code ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.catalog_subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.catalog_categories(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_subcategories_code_check check (code ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  unique (category_id, code),
  unique (id, category_id)
);

create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  item_type text not null,
  unit text not null default 'unidad',
  default_cost_cents bigint not null default 0,
  default_price_cents bigint not null default 0,
  search_keywords text not null default '',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_items_code_check check (code ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint catalog_items_type_check check (
    item_type in ('material', 'service', 'product', 'labor', 'equipment', 'transport', 'other')
  ),
  constraint catalog_items_money_check check (default_cost_cents >= 0 and default_price_cents >= 0)
);

create table if not exists public.catalog_item_categories (
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  category_id uuid not null references public.catalog_categories(id) on delete cascade,
  subcategory_id uuid not null,
  sort_order integer not null default 0,
  primary key (item_id, category_id, subcategory_id),
  constraint catalog_item_categories_subcategory_fk
    foreign key (subcategory_id, category_id)
    references public.catalog_subcategories(id, category_id) on delete cascade
);

create table if not exists public.business_catalog_categories (
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.catalog_categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, category_id)
);

create table if not exists public.catalog_item_overrides (
  user_id uuid not null references public.profiles(id) on delete cascade,
  catalog_item_id uuid not null references public.catalog_items(id) on delete cascade,
  unit text,
  default_cost_cents bigint,
  default_price_cents bigint,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, catalog_item_id),
  constraint catalog_item_overrides_cost_check check (default_cost_cents is null or default_cost_cents >= 0),
  constraint catalog_item_overrides_price_check check (default_price_cents is null or default_price_cents >= 0),
  constraint catalog_item_overrides_unit_check check (unit is null or length(btrim(unit)) > 0)
);

alter table public.services
  add column if not exists category_id uuid references public.catalog_categories(id) on delete set null,
  add column if not exists subcategory_id uuid references public.catalog_subcategories(id) on delete set null,
  add column if not exists item_type text not null default 'service',
  add column if not exists unit text not null default 'servicio';
alter table public.materials
  add column if not exists description text,
  add column if not exists category_id uuid references public.catalog_categories(id) on delete set null,
  add column if not exists subcategory_id uuid references public.catalog_subcategories(id) on delete set null,
  add column if not exists default_price_cents bigint not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'services_item_type_check') then
    alter table public.services add constraint services_item_type_check
      check (item_type in ('service', 'product', 'labor', 'equipment', 'transport', 'other'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'services_unit_check') then
    alter table public.services add constraint services_unit_check check (length(btrim(unit)) > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'services_catalog_subcategory_fk') then
    alter table public.services add constraint services_catalog_subcategory_fk
      foreign key (subcategory_id, category_id)
      references public.catalog_subcategories(id, category_id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'materials_default_price_check') then
    alter table public.materials add constraint materials_default_price_check check (default_price_cents >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'materials_catalog_subcategory_fk') then
    alter table public.materials add constraint materials_catalog_subcategory_fk
      foreign key (subcategory_id, category_id)
      references public.catalog_subcategories(id, category_id) on delete set null;
  end if;
end
$$;

alter table public.quote_items drop constraint if exists quote_items_type_check;
alter table public.quote_items add constraint quote_items_type_check check (
  item_type in ('service', 'material', 'product', 'labor', 'equipment', 'transport', 'other', 'custom')
);

create index if not exists catalog_categories_active_sort_idx on public.catalog_categories (active, sort_order);
create index if not exists catalog_subcategories_category_sort_idx on public.catalog_subcategories (category_id, active, sort_order);
create index if not exists catalog_items_type_active_sort_idx on public.catalog_items (item_type, active, sort_order);
create index if not exists catalog_items_name_idx on public.catalog_items (lower(name));
create index if not exists catalog_item_categories_category_idx on public.catalog_item_categories (category_id, subcategory_id, sort_order);
create index if not exists business_catalog_categories_category_idx on public.business_catalog_categories (category_id, user_id);
create index if not exists catalog_item_overrides_item_idx on public.catalog_item_overrides (catalog_item_id, user_id);
create index if not exists services_user_type_active_idx on public.services (user_id, item_type, active);
create index if not exists services_category_idx on public.services (category_id, subcategory_id);
create index if not exists materials_user_active_idx on public.materials (user_id, active);
create index if not exists materials_category_idx on public.materials (category_id, subcategory_id);

drop trigger if exists catalog_categories_set_updated_at on public.catalog_categories;
create trigger catalog_categories_set_updated_at before update on public.catalog_categories
for each row execute function public.set_updated_at();
drop trigger if exists catalog_subcategories_set_updated_at on public.catalog_subcategories;
create trigger catalog_subcategories_set_updated_at before update on public.catalog_subcategories
for each row execute function public.set_updated_at();
drop trigger if exists catalog_items_set_updated_at on public.catalog_items;
create trigger catalog_items_set_updated_at before update on public.catalog_items
for each row execute function public.set_updated_at();
drop trigger if exists catalog_item_overrides_set_updated_at on public.catalog_item_overrides;
create trigger catalog_item_overrides_set_updated_at before update on public.catalog_item_overrides
for each row execute function public.set_updated_at();

insert into public.catalog_categories (code, name, description, sort_order)
values
  ('event-decoration', 'Decoración de eventos', 'Montajes, alquileres y producción de eventos.', 10),
  ('balloons', 'Decoración con globos', 'Servicios, globos y accesorios para decoración.', 20),
  ('creative-stationery', 'Papelería creativa', 'Papelería, cajas, invitaciones y kits de fiesta.', 30),
  ('cake-toppers', 'Cake toppers', 'Toppers y componentes para pastelería creativa.', 40),
  ('cricut-cameo', 'Cricut / Cameo', 'Corte, diseño y producción con plotters de escritorio.', 50),
  ('vinyl-stickers', 'Vinilos y stickers', 'Productos adhesivos, textiles y de rotulación.', 60),
  ('sublimation', 'Sublimación', 'Productos y procesos de personalización por sublimación.', 70),
  ('personalized-products', 'Productos personalizados', 'Productos que combinan técnicas y materiales.', 80),
  ('souvenirs', 'Souvenirs', 'Recuerdos y detalles para eventos.', 90),
  ('other', 'Otro', 'Mano de obra, equipos y gastos generales reutilizables.', 100)
on conflict (code) do update set name=excluded.name, description=excluded.description,
  sort_order=excluded.sort_order, active=true, updated_at=now();

with seed(category_code, code, name, sort_order) as (
  values
    ('event-decoration','event-services','Servicios de evento',10),
    ('event-decoration','rentals','Alquileres',20),
    ('event-decoration','event-logistics','Logística',30),
    ('balloons','balloon-services','Servicios con globos',10),
    ('balloons','balloons','Globos',20),
    ('balloons','balloon-supplies','Accesorios para globos',30),
    ('balloons','structures','Estructuras y ambientación',40),
    ('creative-stationery','stationery-products','Productos de papelería',10),
    ('creative-stationery','papers','Papeles y cartulinas',20),
    ('creative-stationery','adhesives','Adhesivos',30),
    ('creative-stationery','embellishments','Terminaciones y apliques',40),
    ('cake-toppers','topper-products','Productos topper',10),
    ('cake-toppers','topper-materials','Materiales para topper',20),
    ('cricut-cameo','cutting-services','Servicios de corte',10),
    ('cricut-cameo','cutting-materials','Materiales de corte',20),
    ('cricut-cameo','cutting-equipment','Equipos de corte',30),
    ('vinyl-stickers','vinyl-products','Productos y rotulación',10),
    ('vinyl-stickers','vinyl-materials','Vinilos e insumos',20),
    ('sublimation','sublimation-products','Productos sublimados',10),
    ('sublimation','sublimation-materials','Insumos de sublimación',20),
    ('sublimation','production-time','Procesos y tiempos',30),
    ('sublimation','sublimation-equipment','Equipos de sublimación',40),
    ('personalized-products','personalized-products','Productos personalizados',10),
    ('souvenirs','souvenir-products','Recuerdos y detalles',10),
    ('other','labor','Mano de obra',10),
    ('other','equipment','Equipos',20),
    ('other','general-expenses','Gastos generales',30)
)
insert into public.catalog_subcategories (category_id, code, name, sort_order)
select categories.id, seed.code, seed.name, seed.sort_order
from seed join public.catalog_categories categories on categories.code=seed.category_code
on conflict (category_id, code) do update set name=excluded.name, sort_order=excluded.sort_order,
  active=true, updated_at=now();

create temporary table catalog_seed (
  item_code text, item_name text, item_type text, unit text,
  category_code text, subcategory_code text, keywords text, sort_order integer
) on commit drop;

insert into catalog_seed values
  ('organic-balloon-arch','Arco orgánico de globos','service','servicio','balloons','balloon-services','arco guirnalda fiesta',10),
  ('traditional-balloon-arch','Arco tradicional','service','servicio','balloons','balloon-services','arco globos',20),
  ('semicircular-balloon-arch','Arco semicircular','service','servicio','balloons','balloon-services','arco media luna',30),
  ('balloon-garland','Guirnalda de globos','service','metro','balloons','balloon-services','arco cadena globos',40),
  ('balloon-column','Columna de globos','service','unidad','balloons','balloon-services','torre pedestal',50),
  ('balloon-tower','Torre de globos','service','unidad','balloons','balloon-services','columna',60),
  ('balloon-bouquet','Bouquet de globos','product','unidad','balloons','balloon-services','ramo arreglo',70),
  ('custom-balloon-bouquet','Bouquet personalizado','product','unidad','balloons','balloon-services','ramo nombre',80),
  ('helium-decoration','Decoración con helio','service','evento','balloons','balloon-services','globos flotantes',90),
  ('main-table-decoration','Decoración de mesa principal','service','evento','event-decoration','event-services','mesa temática montaje',100),
  ('complete-birthday-decoration','Decoración completa de cumpleaños','service','evento','event-decoration','event-services','fiesta infantil',110),
  ('baby-shower-decoration','Decoración de baby shower','service','evento','event-decoration','event-services','bebé nacimiento',120),
  ('baptism-decoration','Decoración de bautizo','service','evento','event-decoration','event-services','bautismo',130),
  ('first-communion-decoration','Decoración de primera comunión','service','evento','event-decoration','event-services','comunión',140),
  ('wedding-decoration','Decoración de boda','service','evento','event-decoration','event-services','matrimonio',150),
  ('anniversary-decoration','Decoración de aniversario','service','evento','event-decoration','event-services','aniversario',160),
  ('corporate-decoration','Decoración corporativa','service','evento','event-decoration','event-services','empresa marca',170),
  ('themed-decoration','Decoración temática','service','evento','event-decoration','event-services','personalizada tema',180),
  ('backdrop-installation','Instalación de backdrop','labor','servicio','event-decoration','event-services','fondo montaje',190),
  ('panel-installation','Instalación de paneles','labor','servicio','event-decoration','event-services','panel montaje',200),
  ('event-setup','Montaje','labor','hora','event-decoration','event-logistics','instalación armado',210),
  ('event-teardown','Desmontaje','labor','hora','event-decoration','event-logistics','retiro desarmado',220),
  ('event-transport','Transporte','transport','servicio','event-decoration','event-logistics','traslado flete',230),
  ('custom-design','Diseño personalizado','labor','hora','event-decoration','event-services','diseño creatividad',240),
  ('vinyl-personalization','Personalización con vinilo','service','unidad','vinyl-stickers','vinyl-products','nombre rotulación',250),
  ('structure-rental','Alquiler de estructuras','equipment','evento','event-decoration','rentals','renta estructura',260),
  ('panel-rental','Alquiler de paneles','equipment','evento','event-decoration','rentals','renta panel',270),
  ('table-rental','Alquiler de mesas','equipment','evento','event-decoration','rentals','renta mesa',280),
  ('cylinder-rental','Alquiler de cilindros','equipment','evento','event-decoration','rentals','renta cilindro',290),
  ('pedestal-rental','Alquiler de pedestales','equipment','evento','event-decoration','rentals','renta pedestal',300),
  ('latex-balloon-5','Globos látex 5 pulgadas','material','paquete','balloons','balloons','mini globos cinco',310),
  ('latex-balloon-9','Globos látex 9 pulgadas','material','paquete','balloons','balloons','globos nueve',320),
  ('latex-balloon-10','Globos látex 10 pulgadas','material','paquete','balloons','balloons','globos diez',330),
  ('latex-balloon-12','Globos látex 12 pulgadas','material','paquete','balloons','balloons','globos doce',340),
  ('latex-balloon-18','Globos látex 18 pulgadas','material','unidad','balloons','balloons','globos dieciocho',350),
  ('latex-balloon-24','Globos látex 24 pulgadas','material','unidad','balloons','balloons','globos veinticuatro',360),
  ('latex-balloon-36','Globos látex 36 pulgadas','material','unidad','balloons','balloons','globos gigante',370),
  ('chrome-balloons','Globos chrome','material','paquete','balloons','balloons','cromados metálicos',380),
  ('pastel-balloons','Globos pastel','material','paquete','balloons','balloons','mate',390),
  ('metallic-balloons','Globos metálicos','material','paquete','balloons','balloons','metalizado',400);

insert into catalog_seed values
  ('transparent-balloons','Globos transparentes','material','paquete','balloons','balloons','cristal',410),
  ('confetti-balloons','Globos confeti','material','paquete','balloons','balloons','relleno',420),
  ('foil-balloons','Globos foil','material','unidad','balloons','balloons','mylar metálico',430),
  ('number-balloons','Globos número','material','unidad','balloons','balloons','edad numeral',440),
  ('letter-balloons','Globos letra','material','unidad','balloons','balloons','nombre alfabeto',450),
  ('bubble-balloons','Globos burbuja','material','unidad','balloons','balloons','bubble bobo',460),
  ('custom-balloons','Globos personalizados','material','unidad','balloons','balloons','nombre vinilo',470),
  ('helium-balloons','Globos con helio','material','unidad','balloons','balloons','gas flotante',480),
  ('balloon-strip','Cinta para globos','material','rollo','balloons','balloon-supplies','tira arco',490),
  ('double-sided-tape','Cinta doble cara','material','rollo','balloons','balloon-supplies','adhesivo montaje',500),
  ('glue-dots','Glue dots','material','paquete','balloons','balloon-supplies','puntos pegamento',510),
  ('nylon-thread','Nylon','material','metro','balloons','balloon-supplies','hilo transparente',520),
  ('thread','Hilo','material','metro','balloons','balloon-supplies','cordón',530),
  ('glue','Pegamento','material','unidad','creative-stationery','adhesives','adhesivo cola',540),
  ('balloon-bases','Bases para globos','material','unidad','balloons','balloon-supplies','soporte',550),
  ('balloon-sticks','Varillas','material','unidad','balloons','balloon-supplies','palitos soporte',560),
  ('decorative-structures','Estructuras','equipment','unidad','balloons','structures','armazón soporte',570),
  ('decorative-panels','Paneles','equipment','unidad','balloons','structures','pared fondo',580),
  ('backdrops','Backdrops','equipment','unidad','balloons','structures','fondos',590),
  ('decorative-cylinders','Cilindros decorativos','equipment','set','balloons','structures','mesas cilindro',600),
  ('pedestals','Pedestales','equipment','unidad','balloons','structures','base soporte',610),
  ('artificial-flowers','Flores artificiales','material','paquete','balloons','structures','flor decoración',620),
  ('natural-flowers','Flores naturales','material','docena','balloons','structures','flor fresca',630),
  ('decorative-fabrics','Telas decorativas','material','metro','balloons','structures','tela cortina',640),
  ('curtains','Cortinas','material','pieza','balloons','structures','telón fondo',650),
  ('led-lights','Luces LED','equipment','set','balloons','structures','iluminación',660),
  ('electrical-extensions','Extensiones eléctricas','equipment','unidad','balloons','structures','cable electricidad',670),
  ('custom-box','Caja personalizada','product','unidad','creative-stationery','stationery-products','caja regalo',680),
  ('custom-invitation','Invitación personalizada','product','unidad','creative-stationery','stationery-products','tarjeta evento',690),
  ('custom-label','Etiqueta personalizada','product','unidad','creative-stationery','stationery-products','tag producto',700),
  ('custom-sticker','Sticker personalizado','product','unidad','creative-stationery','stationery-products','pegatina etiqueta',710),
  ('custom-notebook','Cuaderno personalizado','product','unidad','creative-stationery','stationery-products','libreta',720),
  ('custom-planner','Agenda personalizada','product','unidad','creative-stationery','stationery-products','planificador',730),
  ('party-kit','Kit de fiesta','product','kit','creative-stationery','stationery-products','papelería cumpleaños',740),
  ('custom-bag','Bolsa personalizada','product','unidad','creative-stationery','stationery-products','empaque bolsa',750),
  ('souvenir','Souvenir personalizado','product','unidad','souvenirs','souvenir-products','recuerdo detalle',760),
  ('centerpiece','Centro de mesa','product','unidad','souvenirs','souvenir-products','decoración mesa',770),
  ('custom-decoration','Decoración personalizada','product','unidad','personalized-products','personalized-products','adorno personalizado',780),
  ('opaline-cardstock','Cartulina opalina','material','hoja','creative-stationery','papers','papel opalina',790),
  ('photo-cardstock','Cartulina fotográfica','material','hoja','creative-stationery','papers','papel foto',800);

insert into catalog_seed values
  ('mirror-cardstock','Cartulina espejo','material','hoja','creative-stationery','papers','papel reflectivo',810),
  ('metallic-cardstock','Cartulina metalizada','material','hoja','creative-stationery','papers','papel metálico',820),
  ('glitter-cardstock','Cartulina glitter','material','hoja','creative-stationery','papers','papel escarcha',830),
  ('textured-cardstock','Cartulina texturizada','material','hoja','creative-stationery','papers','papel textura',840),
  ('colored-cardstock','Cartulina de colores','material','hoja','creative-stationery','papers','papel color',850),
  ('photo-paper','Papel fotográfico','material','hoja','creative-stationery','papers','papel impresión foto',860),
  ('adhesive-paper','Papel adhesivo','material','hoja','creative-stationery','papers','papel pegatina',870),
  ('sticker-paper','Papel sticker','material','hoja','creative-stationery','papers','papel etiqueta',880),
  ('kraft-paper','Papel kraft','material','hoja','creative-stationery','papers','papel marrón',890),
  ('transfer-paper','Papel transfer','material','hoja','creative-stationery','papers','transferencia',900),
  ('sublimation-paper','Papel de sublimación','material','hoja','sublimation','sublimation-materials','papel transfer sublimar',910),
  ('vellum-paper','Papel vegetal','material','hoja','creative-stationery','papers','papel translúcido',920),
  ('acetate','Acetato','material','hoja','creative-stationery','papers','plástico transparente',930),
  ('foam','Foam','material','hoja','creative-stationery','papers','espuma',940),
  ('eva-foam','Foamy','material','hoja','creative-stationery','papers','goma eva',950),
  ('glitter-eva-foam','Foamy glitter','material','hoja','creative-stationery','papers','goma eva escarcha',960),
  ('cardboard','Cartón','material','hoja','creative-stationery','papers','cartonaje',970),
  ('grey-cardboard','Cartón gris','material','hoja','creative-stationery','papers','cartonaje',980),
  ('corrugated-cardboard','Cartón corrugado','material','hoja','creative-stationery','papers','cartonaje ondulado',990),
  ('double-sided-adhesive','Adhesivo doble cara','material','hoja','creative-stationery','adhesives','pegamento cinta',1000),
  ('liquid-silicone','Silicona líquida','material','unidad','creative-stationery','adhesives','pegamento',1010),
  ('hot-glue','Silicona caliente','material','unidad','creative-stationery','adhesives','barra pegamento',1020),
  ('tape','Cinta','material','rollo','creative-stationery','adhesives','adhesivo',1030),
  ('magnets','Imanes','material','paquete','creative-stationery','embellishments','imán',1040),
  ('velcro','Velcro','material','metro','creative-stationery','embellishments','cierre',1050),
  ('elastic','Elástico','material','metro','creative-stationery','embellishments','banda',1060),
  ('decorative-ribbons','Cintas decorativas','material','rollo','creative-stationery','embellishments','cinta adorno',1070),
  ('ribbons','Listones','material','metro','creative-stationery','embellishments','lazo',1080),
  ('appliques','Apliques','material','paquete','creative-stationery','embellishments','adorno',1090),
  ('pearls','Perlas','material','paquete','creative-stationery','embellishments','adorno',1100),
  ('decorative-stones','Piedras decorativas','material','paquete','creative-stationery','embellishments','gemas adorno',1110),
  ('simple-cake-topper','Cake topper sencillo','product','unidad','cake-toppers','topper-products','torta pastel',1120),
  ('custom-cake-topper','Cake topper personalizado','product','unidad','cake-toppers','topper-products','torta nombre',1130),
  ('3d-cake-topper','Cake topper 3D','product','unidad','cake-toppers','topper-products','torta tridimensional',1140),
  ('shaker-cake-topper','Cake topper shaker','product','unidad','cake-toppers','topper-products','torta móvil',1150),
  ('layered-cake-topper','Cake topper multicapa','product','unidad','cake-toppers','topper-products','torta capas',1160),
  ('name-cake-topper','Cake topper con nombre','product','unidad','cake-toppers','topper-products','torta letras',1170),
  ('birthday-cake-topper','Cake topper cumpleaños','product','unidad','cake-toppers','topper-products','torta fiesta',1180),
  ('baby-shower-cake-topper','Cake topper baby shower','product','unidad','cake-toppers','topper-products','torta bebé',1190),
  ('wedding-cake-topper','Cake topper boda','product','unidad','cake-toppers','topper-products','torta matrimonio',1200);

insert into catalog_seed values
  ('themed-cake-topper','Cake topper temático','product','unidad','cake-toppers','topper-products','torta personaje',1210),
  ('cupcake-toppers','Cupcake toppers','product','set','cake-toppers','topper-products','dulces mini topper',1220),
  ('candy-toppers','Toppers para dulces','product','set','cake-toppers','topper-products','golosinas',1230),
  ('adhesive-foam','Foam adhesivo','material','hoja','cake-toppers','topper-materials','espuma doble cara',1240),
  ('topper-sticks','Palitos para topper','material','paquete','cake-toppers','topper-materials','varilla torta',1250),
  ('printing','Impresión','service','impresión','cake-toppers','topper-materials','impreso tinta',1260),
  ('vinyl-cutting','Corte de vinilo','service','metro','cricut-cameo','cutting-services','plotter cricut cameo',1270),
  ('cardstock-cutting','Corte de cartulina','service','hoja','cricut-cameo','cutting-services','plotter papel',1280),
  ('paper-cutting','Corte de papel','service','hoja','cricut-cameo','cutting-services','plotter',1290),
  ('print-and-cut','Print and Cut','service','hoja','cricut-cameo','cutting-services','imprimir cortar',1300),
  ('cricut-design','Diseño para Cricut','labor','hora','cricut-cameo','cutting-services','archivo svg',1310),
  ('cameo-design','Diseño para Cameo','labor','hora','cricut-cameo','cutting-services','silhouette archivo',1320),
  ('personalization','Personalización','labor','unidad','cricut-cameo','cutting-services','nombre diseño',1330),
  ('vinyl-weeding','Depilado de vinilo','labor','hora','cricut-cameo','cutting-services','pelado descarte',1340),
  ('vinyl-application','Aplicación de vinilo','labor','unidad','cricut-cameo','cutting-services','pegado transfer',1350),
  ('cutting-per-sheet','Corte por hoja','service','hoja','cricut-cameo','cutting-services','plotter',1360),
  ('cutting-per-meter','Corte por metro','service','metro','cricut-cameo','cutting-services','plotter',1370),
  ('cutting-mat','Mat de corte','material','unidad','cricut-cameo','cutting-materials','tapete base',1380),
  ('cutting-blades','Cuchillas','material','unidad','cricut-cameo','cutting-materials','navaja repuesto',1390),
  ('adhesive-vinyl','Vinilo adhesivo','material','metro','vinyl-stickers','vinyl-materials','pegable rotulación',1400),
  ('heat-transfer-vinyl','Vinilo textil','material','metro','vinyl-stickers','vinyl-materials','htv ropa',1410),
  ('holographic-vinyl','Vinilo holográfico','material','metro','vinyl-stickers','vinyl-materials','tornasol',1420),
  ('glitter-vinyl','Vinilo glitter','material','metro','vinyl-stickers','vinyl-materials','escarcha',1430),
  ('metallic-vinyl','Vinilo metálico','material','metro','vinyl-stickers','vinyl-materials','metalizado',1440),
  ('printable-vinyl','Vinilo imprimible','material','hoja','vinyl-stickers','vinyl-materials','impresión adhesivo',1450),
  ('transfer-tape','Transfer tape','material','metro','vinyl-stickers','vinyl-materials','cinta transferencia',1460),
  ('die-cut-sticker','Sticker troquelado','product','unidad','vinyl-stickers','vinyl-products','pegatina contorno',1470),
  ('round-sticker','Sticker circular','product','unidad','vinyl-stickers','vinyl-products','pegatina redonda',1480),
  ('rectangular-sticker','Sticker rectangular','product','unidad','vinyl-stickers','vinyl-products','pegatina',1490),
  ('school-labels','Etiquetas escolares','product','set','vinyl-stickers','vinyl-products','nombre colegio',1500),
  ('product-labels','Etiquetas para productos','product','unidad','vinyl-stickers','vinyl-products','marca empaque',1510),
  ('business-labels','Etiquetas para emprendimientos','product','unidad','vinyl-stickers','vinyl-products','marca negocio',1520),
  ('decorative-vinyl','Vinilo decorativo','product','unidad','vinyl-stickers','vinyl-products','rotulación',1530),
  ('cup-vinyl','Vinilo para vasos','product','unidad','vinyl-stickers','vinyl-products','rotulación vaso',1540),
  ('tumbler-vinyl','Vinilo para termos','product','unidad','vinyl-stickers','vinyl-products','rotulación termo',1550),
  ('wall-vinyl','Vinilo para paredes','product','metro cuadrado','vinyl-stickers','vinyl-products','mural decoración',1560),
  ('vehicle-vinyl','Vinilo para vehículos','product','metro cuadrado','vinyl-stickers','vinyl-products','auto rotulación',1570),
  ('custom-decals','Calcomanías personalizadas','product','unidad','vinyl-stickers','vinyl-products','sticker pegatina',1580),
  ('permanent-vinyl','Vinilo permanente','material','metro','vinyl-stickers','vinyl-materials','adhesivo exterior',1590),
  ('removable-vinyl','Vinilo removible','material','metro','vinyl-stickers','vinyl-materials','adhesivo temporal',1600);

insert into catalog_seed values
  ('transparent-vinyl','Vinilo transparente','material','metro','vinyl-stickers','vinyl-materials','adhesivo cristal',1610),
  ('matte-sticker-paper','Papel sticker mate','material','hoja','vinyl-stickers','vinyl-materials','pegatina opaco',1620),
  ('glossy-sticker-paper','Papel sticker brillante','material','hoja','vinyl-stickers','vinyl-materials','pegatina glossy',1630),
  ('transparent-sticker-paper','Papel sticker transparente','material','hoja','vinyl-stickers','vinyl-materials','pegatina cristal',1640),
  ('laminate','Laminado','material','hoja','vinyl-stickers','vinyl-materials','protección mica',1650),
  ('printing-ink','Tinta de impresión','material','ml','vinyl-stickers','vinyl-materials','impresora color',1660),
  ('custom-shirt','Camiseta personalizada','product','unidad','sublimation','sublimation-products','ropa sublimada',1670),
  ('custom-mug','Taza personalizada','product','unidad','sublimation','sublimation-products','jarro sublimado',1680),
  ('custom-cup','Vaso personalizado','product','unidad','sublimation','sublimation-products','vaso sublimado',1690),
  ('custom-tumbler','Termo personalizado','product','unidad','sublimation','sublimation-products','botella sublimada',1700),
  ('custom-cap','Gorra personalizada','product','unidad','sublimation','sublimation-products','gorra sublimada',1710),
  ('custom-cushion','Cojín personalizado','product','unidad','sublimation','sublimation-products','almohada sublimada',1720),
  ('custom-puzzle','Rompecabezas personalizado','product','unidad','sublimation','sublimation-products','puzzle sublimado',1730),
  ('custom-mouse-pad','Mouse pad personalizado','product','unidad','sublimation','sublimation-products','alfombrilla sublimada',1740),
  ('sublimated-keychain','Llavero sublimado','product','unidad','sublimation','sublimation-products','recuerdo',1750),
  ('coaster','Portavasos','product','set','sublimation','sublimation-products','posavasos sublimado',1760),
  ('sublimated-bag','Bolsa sublimada','product','unidad','sublimation','sublimation-products','tote bag',1770),
  ('sublimated-souvenir','Souvenir sublimado','product','unidad','sublimation','sublimation-products','recuerdo personalizado',1780),
  ('sublimation-design','Diseño para sublimación','labor','hora','sublimation','production-time','archivo gráfico',1790),
  ('sublimation-printing','Impresión para sublimación','service','impresión','sublimation','production-time','papel tinta',1800),
  ('heat-press-service','Servicio de planchado','service','unidad','sublimation','production-time','prensa calor',1810),
  ('sublimation-ink','Tinta de sublimación','material','ml','sublimation','sublimation-materials','impresora',1820),
  ('heat-tape','Cinta térmica','material','rollo','sublimation','sublimation-materials','calor',1830),
  ('polyester-shirt','Camiseta poliéster','material','unidad','sublimation','sublimation-materials','blank ropa',1840),
  ('sublimatable-mug','Taza sublimable','material','unidad','sublimation','sublimation-materials','blank jarro',1850),
  ('sublimatable-cup','Vaso sublimable','material','unidad','sublimation','sublimation-materials','blank vaso',1860),
  ('sublimatable-tumbler','Termo sublimable','material','unidad','sublimation','sublimation-materials','blank botella',1870),
  ('sublimatable-cap','Gorra sublimable','material','unidad','sublimation','sublimation-materials','blank gorra',1880),
  ('sublimatable-cushion','Cojín sublimable','material','unidad','sublimation','sublimation-materials','blank almohada',1890),
  ('sublimatable-keychain','Llaveros sublimables','material','unidad','sublimation','sublimation-materials','blank llavero',1900),
  ('sublimatable-bag','Bolsas sublimables','material','unidad','sublimation','sublimation-materials','blank bolsa',1910),
  ('sublimatable-blank','Blank sublimable','material','unidad','sublimation','sublimation-materials','pieza en blanco',1920),
  ('printer-use','Uso de impresora','equipment','impresión','sublimation','sublimation-equipment','equipo desgaste',1930),
  ('heat-press-use','Uso de plancha','equipment','unidad','sublimation','sublimation-equipment','prensa desgaste',1940),
  ('electricity-consumption','Consumo eléctrico','other','hora','sublimation','production-time','energía luz',1950),
  ('design-time','Tiempo de diseño','labor','hora','sublimation','production-time','diseñador',1960),
  ('printing-time','Tiempo de impresión','labor','minuto','sublimation','production-time','impresora',1970),
  ('pressing-time','Tiempo de planchado','labor','minuto','sublimation','production-time','prensa calor',1980),
  ('graphic-design','Diseño gráfico','labor','hora','other','labor','creatividad archivo',1990),
  ('file-preparation','Preparación de archivo','labor','hora','other','labor','preprensa vector',2000);

insert into catalog_seed values
  ('cutting-labor','Corte','labor','hora','other','labor','mano de obra',2010),
  ('assembly','Armado','labor','hora','other','labor','construcción',2020),
  ('product-assembly','Ensamblaje','labor','hora','other','labor','unión piezas',2030),
  ('application-labor','Aplicación','labor','unidad','other','labor','colocación',2040),
  ('sublimation-labor','Sublimación','labor','unidad','other','labor','proceso',2050),
  ('pressing-labor','Planchado','labor','unidad','other','labor','prensa',2060),
  ('packing-labor','Empaque','labor','unidad','other','labor','embalaje',2070),
  ('installation-labor','Instalación','labor','hora','other','labor','montaje',2080),
  ('work-hour','Hora de trabajo','labor','hora','other','labor','mano de obra tiempo',2090),
  ('assistant-labor','Ayudante','labor','hora','other','labor','asistente',2100),
  ('additional-staff','Personal adicional','labor','hora','other','labor','equipo asistente',2110),
  ('cricut-machine','Cricut','equipment','hora','cricut-cameo','cutting-equipment','plotter corte',2120),
  ('silhouette-cameo','Silhouette Cameo','equipment','hora','cricut-cameo','cutting-equipment','plotter corte',2130),
  ('inkjet-printer','Impresora inkjet','equipment','hora','other','equipment','impresión tinta',2140),
  ('sublimation-printer','Impresora de sublimación','equipment','hora','sublimation','sublimation-equipment','impresión tinta',2150),
  ('plotter','Plotter','equipment','hora','other','equipment','corte impresión',2160),
  ('heat-press','Plancha térmica','equipment','hora','sublimation','sublimation-equipment','prensa calor',2170),
  ('mug-press','Prensa para tazas','equipment','hora','sublimation','sublimation-equipment','calor jarros',2180),
  ('hot-glue-gun','Pistola de silicona','equipment','hora','other','equipment','pegamento calor',2190),
  ('balloon-compressor','Compresor de globos','equipment','hora','balloons','balloon-supplies','inflador',2200),
  ('electric-inflator','Inflador eléctrico','equipment','hora','balloons','balloon-supplies','bomba globos',2210),
  ('manual-inflator','Inflador manual','equipment','hora','balloons','balloon-supplies','bomba globos',2220),
  ('computer','Computadora','equipment','hora','other','equipment','diseño equipo',2230),
  ('laminator','Laminadora','equipment','hora','other','equipment','plastificado',2240),
  ('delivery','Delivery','transport','servicio','other','general-expenses','entrega mensajería',2250),
  ('fuel','Combustible','transport','litro','other','general-expenses','gasolina transporte',2260),
  ('tolls','Peajes','transport','unidad','other','general-expenses','carretera',2270),
  ('parking','Estacionamiento','transport','hora','other','general-expenses','parqueo',2280),
  ('electricity','Electricidad','other','hora','other','general-expenses','energía',2290),
  ('packaging','Empaque','other','unidad','other','general-expenses','embalaje',2300),
  ('bags','Bolsas','material','paquete','other','general-expenses','empaque',2310),
  ('boxes','Cajas','material','unidad','other','general-expenses','empaque cartón',2320),
  ('labels','Etiquetas','material','unidad','other','general-expenses','empaque marca',2330),
  ('cards','Tarjetas','material','unidad','other','general-expenses','presentación',2340),
  ('payment-fee','Comisión de pago','other','servicio','other','general-expenses','pasarela tarjeta',2350),
  ('equipment-rental','Alquiler de equipos','equipment','evento','other','general-expenses','renta maquinaria',2360),
  ('other-expenses','Otros gastos','other','servicio','other','general-expenses','adicional varios',2370);

insert into catalog_seed
select source.item_code, source.item_name, source.item_type, source.unit,
  mapping.category_code, mapping.subcategory_code, source.keywords, source.sort_order
from (values
  ('glue','cake-toppers','topper-materials'),
  ('double-sided-tape','cake-toppers','topper-materials'),
  ('mirror-cardstock','cake-toppers','topper-materials'),
  ('glitter-cardstock','cake-toppers','topper-materials'),
  ('opaline-cardstock','cake-toppers','topper-materials'),
  ('metallic-cardstock','cake-toppers','topper-materials'),
  ('acetate','cake-toppers','topper-materials'),
  ('adhesive-vinyl','cake-toppers','topper-materials'),
  ('appliques','cake-toppers','topper-materials'),
  ('adhesive-vinyl','cricut-cameo','cutting-materials'),
  ('heat-transfer-vinyl','cricut-cameo','cutting-materials'),
  ('holographic-vinyl','cricut-cameo','cutting-materials'),
  ('glitter-vinyl','cricut-cameo','cutting-materials'),
  ('metallic-vinyl','cricut-cameo','cutting-materials'),
  ('printable-vinyl','cricut-cameo','cutting-materials'),
  ('transfer-tape','cricut-cameo','cutting-materials'),
  ('adhesive-paper','cricut-cameo','cutting-materials'),
  ('colored-cardstock','cricut-cameo','cutting-materials'),
  ('photo-paper','cricut-cameo','cutting-materials'),
  ('custom-box','personalized-products','personalized-products'),
  ('custom-invitation','personalized-products','personalized-products'),
  ('custom-label','personalized-products','personalized-products'),
  ('custom-sticker','personalized-products','personalized-products'),
  ('custom-notebook','personalized-products','personalized-products'),
  ('custom-planner','personalized-products','personalized-products'),
  ('party-kit','personalized-products','personalized-products'),
  ('custom-bag','personalized-products','personalized-products'),
  ('custom-shirt','personalized-products','personalized-products'),
  ('custom-cup','personalized-products','personalized-products'),
  ('custom-tumbler','personalized-products','personalized-products'),
  ('sublimated-souvenir','souvenirs','souvenir-products'),
  ('centerpiece','personalized-products','personalized-products'),
  ('graphic-design','cake-toppers','topper-materials'),
  ('assembly','cake-toppers','topper-materials')
) mapping(item_code, category_code, subcategory_code)
join catalog_seed source on source.item_code=mapping.item_code;

do $$
begin
  if (select count(distinct item_code) from catalog_seed) <> 237 then
    raise exception 'Catalog seed must contain exactly 237 unique items';
  end if;
end
$$;

insert into public.catalog_items (
  code, name, description, item_type, unit, default_cost_cents,
  default_price_cents, search_keywords, sort_order
)
select distinct on (item_code) item_code, item_name, null, item_type, unit, 0, 0, keywords, sort_order
from catalog_seed order by item_code, sort_order
on conflict (code) do update set
  name=excluded.name, item_type=excluded.item_type, unit=excluded.unit,
  search_keywords=excluded.search_keywords, sort_order=excluded.sort_order,
  active=true, updated_at=now();

insert into public.catalog_item_categories (item_id, category_id, subcategory_id, sort_order)
select items.id, categories.id, subcategories.id, seed.sort_order
from catalog_seed seed
join public.catalog_items items on items.code=seed.item_code
join public.catalog_categories categories on categories.code=seed.category_code
join public.catalog_subcategories subcategories
  on subcategories.category_id=categories.id and subcategories.code=seed.subcategory_code
on conflict (item_id, category_id, subcategory_id) do update set sort_order=excluded.sort_order;

alter table public.catalog_categories enable row level security;
alter table public.catalog_subcategories enable row level security;
alter table public.catalog_items enable row level security;
alter table public.catalog_item_categories enable row level security;
alter table public.business_catalog_categories enable row level security;
alter table public.catalog_item_overrides enable row level security;

create or replace function public.set_business_catalog_categories(p_category_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if exists (
    select 1 from unnest(coalesce(p_category_ids, array[]::uuid[])) requested(id)
    where not exists (
      select 1 from public.catalog_categories
      where catalog_categories.id=requested.id and catalog_categories.active
    )
  ) then
    raise exception 'Invalid catalog category';
  end if;
  delete from public.business_catalog_categories where user_id=auth.uid();
  insert into public.business_catalog_categories (user_id, category_id)
  select auth.uid(), requested.id
  from (select distinct unnest(coalesce(p_category_ids, array[]::uuid[])) as id) requested;
end;
$$;

drop policy if exists catalog_categories_read_active on public.catalog_categories;
create policy catalog_categories_read_active on public.catalog_categories
for select to authenticated using (active or public.is_admin());
drop policy if exists catalog_subcategories_read_active on public.catalog_subcategories;
create policy catalog_subcategories_read_active on public.catalog_subcategories
for select to authenticated using (active or public.is_admin());
drop policy if exists catalog_items_read_active on public.catalog_items;
create policy catalog_items_read_active on public.catalog_items
for select to authenticated using (active or public.is_admin());
drop policy if exists catalog_item_categories_read on public.catalog_item_categories;
create policy catalog_item_categories_read on public.catalog_item_categories
for select to authenticated using (
  public.is_admin() or (
    exists (select 1 from public.catalog_items where catalog_items.id=item_id and catalog_items.active)
    and exists (select 1 from public.catalog_categories where catalog_categories.id=category_id and catalog_categories.active)
  )
);
drop policy if exists business_catalog_categories_owner_or_admin on public.business_catalog_categories;
create policy business_catalog_categories_owner_or_admin on public.business_catalog_categories
for all to authenticated using (user_id=auth.uid() or public.is_admin())
with check (user_id=auth.uid() or public.is_admin());
drop policy if exists catalog_item_overrides_owner_or_admin on public.catalog_item_overrides;
create policy catalog_item_overrides_owner_or_admin on public.catalog_item_overrides
for all to authenticated using (user_id=auth.uid() or public.is_admin())
with check (user_id=auth.uid() or public.is_admin());

revoke all on table public.catalog_categories from anon, authenticated;
revoke all on table public.catalog_subcategories from anon, authenticated;
revoke all on table public.catalog_items from anon, authenticated;
revoke all on table public.catalog_item_categories from anon, authenticated;
revoke all on table public.business_catalog_categories from anon, authenticated;
revoke all on table public.catalog_item_overrides from anon, authenticated;
grant select on table public.catalog_categories to authenticated;
grant select on table public.catalog_subcategories to authenticated;
grant select on table public.catalog_items to authenticated;
grant select on table public.catalog_item_categories to authenticated;
grant select, insert, update, delete on table public.business_catalog_categories to authenticated;
grant select, insert, update, delete on table public.catalog_item_overrides to authenticated;
grant all on table public.catalog_categories to service_role;
grant all on table public.catalog_subcategories to service_role;
grant all on table public.catalog_items to service_role;
grant all on table public.catalog_item_categories to service_role;
grant all on table public.business_catalog_categories to service_role;
grant all on table public.catalog_item_overrides to service_role;
revoke all on function public.set_business_catalog_categories(uuid[]) from public;
grant execute on function public.set_business_catalog_categories(uuid[]) to authenticated;
grant execute on function public.set_business_catalog_categories(uuid[]) to service_role;

comment on table public.catalog_items is
  'Global immutable base catalog. Users customize values through catalog_item_overrides.';
comment on column public.catalog_items.default_cost_cents is
  'Money in integer cents. Seeded as zero when no universal value exists.';
comment on table public.catalog_item_categories is
  'Many-to-many classification; enables cross-niche reuse and future quote templates.';

commit;
