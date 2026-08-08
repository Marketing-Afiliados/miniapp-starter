# MiniApp Starter

Starter reutilizable para lanzar Mini Apps y Micro-SaaS por suscripción sin reconstruir autenticación, perfiles, planes, seguridad y operaciones en cada proyecto.

## Stack

- Next.js 16 con App Router, Server Components, Server Actions y Route Handlers
- React 19 y TypeScript en modo estricto
- Tailwind CSS 4
- Supabase Auth, PostgreSQL, SSR y Row Level Security
- Hotmart Webhook 2.0 para estados de suscripción
- pnpm
- Vercel

## Funcionalidad incluida

- Landing responsive y genérica
- Registro con nombre, correo y contraseña
- Confirmación de correo y callback PKCE
- Login, logout, recuperación y cambio de contraseña
- Sesión SSR actualizada mediante `proxy.ts`
- Dashboard, cuenta y plan protegidos
- Helpers `requireUser()` y `requireAdmin()`
- Panel admin para usuarios, suscripciones, uso y webhooks
- Acceso Premium centralizado con `hasActiveSubscription()`
- Límites reutilizables con `canUseFeature()`
- Webhook Hotmart autenticado, idempotente y con auditoría
- Compras anteriores al registro conservadas y vinculadas tras confirmar el correo
- Migraciones de esquema, trigger de perfiles y RLS

## Requisitos

- Node.js 24.x
- pnpm 11.x
- Un proyecto Supabase
- Una cuenta Vercel para producción
- Una cuenta/producto Hotmart cuando se habilite el cobro

## Instalación

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

La aplicación queda disponible en [http://localhost:3000](http://localhost:3000).

## Variables de entorno

| Variable | Producción | Preview | Development | Tipo | Origen |
| --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Requerida | Requerida | Requerida | Pública | Supabase → Project Settings → API. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Requerida | Requerida | Requerida | Pública | Supabase → Project Settings → API Keys. |
| `NEXT_PUBLIC_SITE_URL` | URL `*.vercel.app` real | Dejar vacía | Dejar vacía | Pública | URL del deployment Production. |
| `SUPABASE_SERVICE_ROLE_KEY` | Requerida | Solo previews confiables | Solo si se prueba billing local | Secreta | Supabase → Project Settings → API Keys. |
| `HOTMART_HOTTOK` | Requerida para webhook | No | Solo si se prueba webhook local | Secreta | Configuración Webhook de Hotmart. |
| `HOTMART_DEFAULT_PLAN_CODE` | Opcional | No | Opcional | Privada | `plans.code` del plan de respaldo. |

Vercel proporciona `VERCEL_URL` automáticamente. El código la usa para Preview cuando `NEXT_PUBLIC_SITE_URL` no está definida; en local usa un único fallback centralizado a `http://localhost:3000`.

`HOTMART_CLIENT_ID` y `HOTMART_CLIENT_SECRET` no se usan: el webhook 2.0 actual se autentica con HOTTOK. No copies secretos al repositorio. `.env.local` está ignorado y `.env.example` solo contiene nombres y comentarios.

## Supabase

### 1. Aplicar las migraciones

Los archivos están ordenados en:

```text
supabase/migrations/
├── 202608080001_core_schema.sql
├── 202608080002_rls.sql
└── 202608080003_pending_billing_links.sql
```

En un proyecto existente, revisa y ejecuta ambos archivos en ese orden desde SQL Editor. Si el proyecto está enlazado con Supabase CLI, también puedes aplicar el historial con:

```bash
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

La primera migración conserva tablas existentes, completa las columnas del contrato, crea índices, rellena perfiles faltantes y solo instala el trigger `on_auth_user_created` cuando no existe otro trigger equivalente.

La segunda migración reemplaza las políticas de las cinco tablas del Starter. Esto evita que una política permisiva anterior deje datos expuestos. Si esas tablas son compartidas con otra aplicación, revisa esa migración antes de ejecutarla.

La tercera migración solo agrega columnas e índices para conservar una compra cuyo comprador todavía no tiene cuenta. No elimina ni trunca datos.

### 2. Configurar Auth

En **Authentication → URL Configuration** configura:

- **Site URL:** la URL Production real de Vercel, por ejemplo `https://proyecto-real.vercel.app`.
- **Redirect URLs:**
  - `http://localhost:3000/auth/callback`
  - `https://proyecto-real.vercel.app/auth/callback`
  - para Preview, un patrón permitido por Supabase que cubra únicamente los deployments Vercel de este proyecto.

Registro, confirmación y recuperación regresan por `/auth/callback`; el callback redirige internamente al dashboard o a `/update-password`. Activa o desactiva la confirmación de correo según el flujo comercial. El código soporta ambos modos.

### 3. Crear el primer admin

Registra primero el usuario desde la interfaz. Luego ejecuta una sola vez:

```sql
update public.profiles
set role = 'admin'
where email = 'tu-correo@dominio.com';
```

El rol y el estado no se pueden modificar desde el cliente.

### 4. Crear un plan

```sql
insert into public.plans (
  name,
  code,
  description,
  price,
  currency,
  billing_interval,
  limits,
  provider_product_id
)
values (
  'Basic',
  'basic',
  'Plan inicial',
  0,
  'USD',
  'month',
  '{
    "quotes_per_month": 20,
    "ai_generations_per_month": 20,
    "pdf_enabled": true
  }'::jsonb,
  null
);
```

Antes de activar Hotmart, reemplaza el precio de ejemplo y asigna en `provider_product_id` el `ucode` o ID real del producto. Como alternativa, configura `HOTMART_DEFAULT_PLAN_CODE=basic`.

## Modelo de datos

```text
auth.users
    └── profiles
        ├── subscriptions ── plans
        └── usage

webhook_events  (auditoría e idempotencia de Hotmart)
```

- `profiles`: información extendida, rol y estado.
- `plans`: precio, intervalo, límites JSONB y mapeo de producto.
- `subscriptions`: estado comercial y período vigente.
- `usage`: consumo por función y período.
- `webhook_events`: registro único por `provider + event_id`; el panel nunca muestra el payload.

## Seguridad y RLS

- Un usuario autenticado solo puede leer su perfil, suscripción y uso.
- Solo puede actualizar `full_name` y `avatar_url` de su propio perfil.
- `role`, `status`, plan y estado de suscripción no tienen permisos de escritura desde el cliente.
- Un admin activo puede consultar las tablas operativas.
- El webhook usa la service role exclusivamente en el servidor.
- Las rutas admin vuelven a validar el rol en el servidor; ocultar enlaces no es el control de acceso.
- `X-HOTMART-HOTTOK` se compara en tiempo constante antes de leer el payload.
- Las respuestas incluyen cabeceras de endurecimiento básicas.

## Auth

El navegador y el servidor usan `@supabase/ssr`. `proxy.ts` actualiza cookies y hace redirecciones optimistas; `requireUser()` y `requireAdmin()` realizan la autorización definitiva cerca de los datos.

El callback intercambia el código por sesión, comprueba el usuario y crea el perfil como respaldo si el trigger aún no se aplicó.

## Billing y límites

`lib/billing/access.ts` expone:

- `getActiveSubscription(userId)`
- `hasActiveSubscription(userId)`
- `canUseFeature(userId, feature)`

`canUseFeature` combina `plans.limits` con `usage`. Admite límites numéricos como `quotes_per_month` y flags como `pdf_enabled`.

Las futuras funciones Premium deben llamar estos helpers desde código de servidor antes de ejecutar o consumir recursos.

## Hotmart

Endpoint:

```text
POST /api/webhooks/hotmart
```

Configura en Hotmart Webhook 2.0:

1. Busca **Tools → Webhook (API and notifications)** o la herramienta equivalente llamada Webhook/Postback.
2. Nombre sugerido: `MiniApp Starter - Production`.
3. Selecciona el producto real que corresponde al plan.
4. Versión: `2.0.0`.
5. URL: `https://URL-REAL.vercel.app/api/webhooks/hotmart`.
6. Selecciona estos eventos reales:
   - `PURCHASE_APPROVED`
   - `PURCHASE_COMPLETE`
   - `PURCHASE_CANCELED`
   - `PURCHASE_DELAYED`
   - `PURCHASE_EXPIRED`
   - `PURCHASE_REFUNDED`
   - `PURCHASE_CHARGEBACK`

El endpoint valida el header oficial `X-HOTMART-HOTTOK`, limita el tamaño, registra primero el evento con una clave única y actualiza la suscripción. Los eventos repetidos reciben respuesta exitosa sin volver a procesarse.

### Mapping de estados

| Evento Hotmart | Estado interno |
| --- | --- |
| `PURCHASE_APPROVED`, `PURCHASE_COMPLETE` | `active` |
| `PURCHASE_DELAYED` | `past_due` |
| `PURCHASE_CANCELED`, `SUBSCRIPTION_CANCELLATION` | `cancelled` |
| `PURCHASE_EXPIRED`, `SUBSCRIPTION_EXPIRED` | `expired` |
| `PURCHASE_REFUNDED`, `PURCHASE_CHARGEBACK` | `refunded` |

### Matching comprador–usuario

Hotmart no crea usuarios Supabase. El matching requiere:

1. correo normalizado del comprador;
2. `subscriber.code` de Hotmart, o la transacción como respaldo;
3. producto Hotmart mapeado a un plan activo.

Si la compra llega antes del registro, `webhook_events` conserva correo, identificadores, plan, estado y período con `processed=false`. Cuando una cuenta con ese mismo correo queda confirmada, el servidor vincula los eventos pendientes en orden y hace upsert de una única suscripción. La conciliación exige correo confirmado y service role; nunca confía en datos enviados por el navegador.

### Prueba y diagnóstico

Usa el envío de prueba disponible en la configuración Webhook 2.0 o una compra de prueba del producto. Debes obtener HTTP 200 y ver un registro en `/admin/webhooks`. Reenvía el mismo evento: el mismo `provider + event_id` debe seguir apareciendo una sola vez.

El historial se revisa en la herramienta Webhook/Postback de Hotmart y en `/admin/webhooks`; el payload completo no se muestra en el panel.

### Desarrollo sin compras reales

No existe bypass Premium en código. Para una prueba local segura crea una suscripción manual en el proyecto de desarrollo y usa fechas acotadas:

```sql
insert into public.subscriptions (
  user_id, plan_id, provider, provider_subscription_id, status,
  started_at, current_period_start, current_period_end
)
values (
  'USER_UUID', 'PLAN_UUID', 'manual-dev', 'dev-USER_UUID', 'active',
  now(), now(), now() + interval '7 days'
)
on conflict (provider, provider_subscription_id)
do update set status = 'active', current_period_end = excluded.current_period_end;
```

No uses esta técnica en producción.

Documentación oficial: [Purchase Webhook 2.0](https://developers.hotmart.com/docs/en/2.0.0/webhook/purchase-webhook/).

## Arquitectura

```text
app/
├── admin/                 # panel protegido por rol
├── api/webhooks/hotmart/  # integración de facturación
├── auth/                  # acciones, callback y logout
├── dashboard/             # cuenta del cliente
├── login/
├── register/
└── forgot-password/
components/
├── auth/
├── dashboard/
└── ui/
lib/
├── auth/
├── billing/
├── hotmart/
└── supabase/
services/
types/
supabase/migrations/
```

Es un monolito modular: las rutas y UI viven en `app/`, la lógica reutilizable en `lib/` y los procesos de integración en `services/`.

## Calidad

```bash
pnpm lint
pnpm build
```

El build incluye compilación de producción y comprobación estricta de TypeScript.

## Deployment en Vercel

La conexión esperada es GitHub → Vercel, con `main` como única Production Branch.

### Importar el repositorio

En Vercel abre **Add New → Project → Import Git Repository** y selecciona `miniapp-starter`:

| Campo | Valor |
| --- | --- |
| Framework Preset | Next.js |
| Root Directory | `./` (raíz del repositorio) |
| Build Command | Default (`pnpm build`) |
| Install Command | `pnpm install` |
| Output Directory | Default de Next.js |
| Production Branch | `main` |

No se necesita `vercel.json`: el proyecto usa las convenciones estándar de Next.js y Vercel.

En **Project Settings → Environment Variables** agrega las variables de la tabla anterior. Para el primer deploy puedes dejar `NEXT_PUBLIC_SITE_URL` vacía; Vercel proporciona `VERCEL_URL`. Cuando aparezca la URL Production real, guarda esa URL en `NEXT_PUBLIC_SITE_URL` para Production y vuelve a desplegar.

### Preview y Production

```text
feature branch → push → Vercel Preview → QA → merge main → Vercel Production
```

- Solo `main` es Production.
- Preview reutiliza las claves públicas de Supabase.
- No expongas service role ni HOTTOK a previews de ramas no confiables.
- Hotmart debe apuntar exclusivamente al deployment Production, salvo una integración de prueba separada y explícita.

Para redirects de Preview, agrega en Supabase un patrón que limite el acceso a los dominios Preview de este proyecto. No conviertas una URL Preview en Site URL.

### Después del primer deployment

1. Copia la URL marcada como **Production** en Vercel.
2. Configúrala como `NEXT_PUBLIC_SITE_URL` en el ambiente Production.
3. En Supabase, úsala como Site URL y agrega `/auth/callback` a Redirect URLs.
4. Redeploya Production.
5. Configura Hotmart con `https://URL-PRODUCTION/api/webhooks/hotmart`.

### Dominio personalizado futuro

Cuando se agregue `app.midominio.com`, actualiza:

- Vercel → Settings → Domains;
- `NEXT_PUBLIC_SITE_URL`;
- Supabase Site URL y Redirect URLs;
- URL del webhook Hotmart;
- cualquier callback externo.

Mantén temporalmente el dominio `*.vercel.app` autorizado hasta comprobar el cambio.

## Logs y troubleshooting

| Problema | Dónde revisar |
| --- | --- |
| Build o función server falla | Vercel → Project → Deployments → deployment → Build Logs / Runtime Logs. |
| Login o callback falla | Supabase → Authentication → Logs; Vercel Runtime Logs; URL Configuration. |
| Usuario no obtiene perfil | Supabase → Table Editor → `profiles`; Database → Triggers; logs de Postgres. |
| Webhook falla | Hotmart → Webhook/Postback → historial; Vercel Runtime Logs; `/admin/webhooks`. |
| Suscripción no se activa | `webhook_events.error`, mapping `plans.provider_product_id`, correo del comprador y `subscriptions`. |
| Acceso incorrecto o RLS | Supabase → Table Editor / SQL Editor → políticas y grants de la migración RLS. |

Los logs de aplicación no imprimen HOTTOK, service role ni el payload del webhook.

## Checklist del primer deployment

- [x] `pnpm install` OK
- [x] `pnpm lint` OK
- [x] `pnpm build` OK
- [ ] Migraciones Supabase aplicadas
- [ ] GitHub actualizado
- [ ] Vercel conectado al repositorio
- [ ] Production Branch = `main`
- [ ] Environment Variables Production
- [ ] Production deployment OK
- [ ] `NEXT_PUBLIC_SITE_URL` con URL real
- [ ] Supabase Site URL
- [ ] Supabase Redirect URLs
- [ ] Registro y confirmación OK en producción
- [ ] Login, logout y reset password OK
- [ ] Usuario normal bloqueado en `/admin`
- [ ] Admin permitido en `/admin`
- [ ] Lectura de plan y suscripción OK
- [ ] Webhook URL pública
- [ ] Hotmart Webhook 2.0 configurado
- [ ] Validación HOTTOK OK
- [ ] Evento duplicado no reprocesado
- [ ] Actualización de suscripción OK
- [ ] Compra previa al registro reconciliada
- [ ] RLS comprobado
- [x] Secretos fuera de Git

## Crear una nueva Mini App

1. Clona este repositorio con un nombre nuevo.
2. Cambia metadata, marca y textos de landing.
3. Crea o enlaza un proyecto Supabase y aplica las migraciones.
4. Define el plan y sus límites.
5. Implementa la función principal dentro de un módulo propio.
6. Protege la función con `requireUser()`, `hasActiveSubscription()` y `canUseFeature()`.
7. Configura Hotmart y Vercel cuando el flujo esté listo para cobrar.

No dupliques la lógica de acceso dentro de componentes: mantén autenticación, billing y límites en los helpers de servidor.
