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

| Variable | Alcance | Descripción |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Pública | URL del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Pública | Publishable key de Supabase. |
| `NEXT_PUBLIC_APP_URL` | Pública | URL canónica, sin barra final. En local: `http://localhost:3000`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Privada | Clave de servidor para procesar webhooks. Nunca usar en Client Components. |
| `HOTMART_HOTTOK` | Privada | Token que Hotmart envía en `X-HOTMART-HOTTOK`. |
| `HOTMART_DEFAULT_PLAN_CODE` | Privada/opcional | Plan de respaldo si el producto Hotmart no está mapeado en `provider_product_id`. |

No copies secretos al repositorio. `.env.local` está ignorado y `.env.example` solo contiene nombres y valores de desarrollo no sensibles.

## Supabase

### 1. Aplicar las migraciones

Los archivos están ordenados en:

```text
supabase/migrations/
├── 202608080001_core_schema.sql
└── 202608080002_rls.sql
```

En un proyecto existente, revisa y ejecuta ambos archivos en ese orden desde SQL Editor. Si el proyecto está enlazado con Supabase CLI, también puedes aplicar el historial con:

```bash
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

La primera migración conserva tablas existentes, completa las columnas del contrato, crea índices, rellena perfiles faltantes y solo instala el trigger `on_auth_user_created` cuando no existe otro trigger equivalente.

La segunda migración reemplaza las políticas de las cinco tablas del Starter. Esto evita que una política permisiva anterior deje datos expuestos. Si esas tablas son compartidas con otra aplicación, revisa esa migración antes de ejecutarla.

### 2. Configurar Auth

En **Authentication → URL Configuration** configura:

- Site URL local: `http://localhost:3000`
- Redirect URL local: `http://localhost:3000/auth/callback`
- Site URL de producción: el dominio de Vercel
- Redirect URL de producción: `https://tu-dominio.com/auth/callback`

Activa o desactiva la confirmación de correo según el flujo comercial. El código soporta ambos modos.

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

1. URL: `https://tu-dominio.com/api/webhooks/hotmart`
2. Token HOTTOK igual al valor privado desplegado.
3. Eventos recomendados: compra aprobada, completa, atrasada, cancelada, expirada, reembolsada y chargeback.

El endpoint valida el header oficial `X-HOTMART-HOTTOK`, limita el tamaño, registra primero el evento con una clave única y actualiza la suscripción. Los eventos repetidos reciben respuesta exitosa sin volver a procesarse.

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

1. Publica el repositorio en GitHub e impórtalo en Vercel.
2. Mantén pnpm como package manager.
3. Carga todas las variables de `.env.example` en Vercel; usa valores reales y privados donde corresponda.
4. Establece `NEXT_PUBLIC_APP_URL` con el dominio definitivo.
5. Actualiza Site URL y Redirect URLs en Supabase.
6. Despliega y registra la URL del webhook en Hotmart.
7. Envía un evento de prueba desde Hotmart y comprueba su estado en `/admin/webhooks`.

## Crear una nueva Mini App

1. Clona este repositorio con un nombre nuevo.
2. Cambia metadata, marca y textos de landing.
3. Crea o enlaza un proyecto Supabase y aplica las migraciones.
4. Define el plan y sus límites.
5. Implementa la función principal dentro de un módulo propio.
6. Protege la función con `requireUser()`, `hasActiveSubscription()` y `canUseFeature()`.
7. Configura Hotmart y Vercel cuando el flujo esté listo para cobrar.

No dupliques la lógica de acceso dentro de componentes: mantén autenticación, billing y límites en los helpers de servidor.
