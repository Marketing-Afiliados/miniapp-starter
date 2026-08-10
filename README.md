# Magics DecoQuote

DecoQuote es una Mini App SaaS para decoradoras de eventos. Permite registrar clientes, reutilizar servicios y materiales, calcular el costo real de un montaje, aplicar margen, conocer la ganancia estimada y generar una propuesta PDF profesional.

> “Cotiza tus decoraciones con confianza y conoce cuánto realmente ganas.”

## Stack y arquitectura

- Next.js 16, React 19, TypeScript estricto y App Router.
- Tailwind CSS 4, diseño responsive y mobile-first.
- Supabase Auth, PostgreSQL, SSR y Row Level Security.
- Hotmart Webhook 2.0 para suscripciones.
- Vercel y pnpm.
- Monolito modular: UI, Server Actions, dominio y persistencia en una sola aplicación.

La autenticación, billing, planes, usage, webhooks y panel admin del Starter se conservan.

## Módulos

- Dashboard con cotizaciones del mes, valor cotizado, ganancia, clientes y actividad reciente.
- Perfil del negocio y onboarding inicial.
- Logo del negocio en Supabase Storage, visible en las propuestas PDF.
- Clientes con búsqueda, edición y archivado lógico.
- Servicios y materiales reutilizables.
- Creador de cotizaciones con líneas dinámicas y conceptos personalizados.
- Historial, filtros, detalle, edición, cambio de estado y duplicado.
- PDF comercial sin costo interno, margen ni ganancia.
- Rentabilidad estimada por mes, últimos 30 días o año.
- Plan DecoQuote Pro y consumo mensual.
- Admin existente con métricas DecoQuote adicionales.

## Motor de cálculo

La lógica vive en `lib/decoquote/calculations.ts`; no se duplica en componentes.

Todo el dinero específico de DecoQuote se guarda como **centavos enteros**:

```text
$10.50 = 1050 cents
```

El margen porcentual se interpreta como **markup sobre el costo**:

```text
costo total:       30000
markup:               40%
margen:            12000
precio recomendado: 42000
```

Con margen fijo, el valor es dinero en centavos. Si existe precio final manual:

```text
ganancia estimada = precio final - costo total
```

## Modelo de datos

Tablas existentes preservadas:

- `profiles`
- `plans`
- `subscriptions`
- `usage`
- `webhook_events`

Tablas DecoQuote:

- `business_profiles`
- `customers`
- `services`
- `materials`
- `quotes`
- `quote_items`
- `quote_counters` (contador anual interno)

`quotes` y `quote_items` guardan importes con sufijo `_cents`. `customers.deleted_at` implementa archivado lógico. El número se genera en PostgreSQL con formato `DQ-YYYY-000001`.

## Seguridad y RLS

La migración activa RLS en todas las tablas nuevas.

- El propietario se valida con `auth.uid() = user_id`.
- `quote_items` también exige que la cotización pertenezca al mismo usuario.
- Un admin activo puede consultar datos desde el backend administrativo.
- Guardar/editar cotización y líneas ocurre dentro de `save_decoquote_quote()`, una función transaccional con RLS.
- Cada Server Action vuelve a validar autenticación, propiedad y entrada.
- Zod valida email, cantidades, costos, precios y margen en servidor.

## Desarrollo

Requisitos: Node.js 24 y pnpm 11.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Verificaciones:

```bash
pnpm lint
pnpm test
pnpm build
```

Los tests obligatorios cubren markup del 40%, margen fijo, pérdida y cantidad por costo unitario.

## Variables de entorno

| Variable | Tipo | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Pública | URL del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Pública | Publishable key de Supabase. |
| `NEXT_PUBLIC_SITE_URL` | Pública | URL canónica de producción. |
| `SUPABASE_SERVICE_ROLE_KEY` | Secreta | Webhook y conciliación confiable. |
| `HOTMART_HOTTOK` | Secreta | Autenticación de Webhook 2.0. |
| `HOTMART_DEFAULT_PLAN_CODE` | Privada/opcional | Fallback; recomendado `decoquote-pro`. |
| `DECOQUOTE_DEV_ACCESS` | Privada/opcional | Bypass temporal para QA sin suscripción. |

No subas `.env.local`. Para una prueba temporal en Vercel Production puedes usar `DECOQUOTE_DEV_ACCESS=true`, desplegar y retirarla al terminar. Nunca la dejes habilitada cuando entren usuarios normales.

## Supabase

### Aplicar migraciones

En un proyecto ya configurado, aplica las migraciones DecoQuote en orden:

```text
supabase/migrations/202608090004_decoquote.sql
supabase/migrations/202608100001_business_logo_storage.sql
```

Con Supabase CLI:

```bash
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

O copia el contenido completo en Supabase Dashboard → SQL Editor → New query → Run.

Las migraciones son incrementales: no contienen `DROP TABLE`, no borran Auth ni las tablas del Starter. La segunda crea el bucket público `business-logos`, limita archivos a PNG/JPG de 2 MB y protege escritura/eliminación por propietario mediante RLS. La primera también crea o actualiza el plan:

```text
code: decoquote-pro
price: 9.99 USD / month
limits:
  quotes_per_month: 50
  pdf_generations_per_month: 50
  customers: -1
```

Después de aplicarla, usa Table Editor para revisar las seis tablas de producto.

### Auth

En Authentication → URL Configuration:

- Site URL: URL Production de Vercel.
- Redirect URL local: `http://localhost:3000/auth/callback`.
- Redirect URL Production: `https://TU-DOMINIO/auth/callback`.

## Hotmart

La infraestructura existente sigue usando:

```text
POST /api/webhooks/hotmart
```

Cuando el producto exista:

1. Crea el producto/suscripción DecoQuote Pro en Hotmart.
2. Copia el identificador real del producto a `plans.provider_product_id` para el plan `decoquote-pro`.
3. Configura el Webhook 2.0 con la URL Production.
4. Configura `HOTMART_HOTTOK` en Vercel.
5. Activa eventos de compra aprobada/completa, retrasada, cancelada, expirada, reembolso y chargeback.
6. Ejecuta una compra de prueba y comprueba `/admin/webhooks` y `/admin/subscriptions`.

Flujo:

```text
Hotmart → webhook autenticado → subscription active → acceso DecoQuote Pro
```

El acceso se consulta centralmente en `lib/decoquote/access.ts` y reutiliza `lib/billing/access.ts`.

## PDF

`GET /api/quotes/[id]/pdf` valida sesión, propiedad y plan. `pdf-lib` genera la propuesta en servidor.

Incluye negocio, cliente, evento, conceptos, cantidad, precio, total y condiciones. No incluye costos, margen ni rentabilidad.

## Vercel

1. Sube todos los cambios y la migración a GitHub.
2. Importa o reutiliza el proyecto Vercel.
3. Framework Preset: Next.js.
4. Build Command: `pnpm build`.
5. Install Command: automático o `pnpm install`.
6. Output Directory: **sin Override**; debe mostrar `Next.js default`.
7. Configura las variables anteriores para Production y las públicas necesarias para Preview.
8. Para QA sin Hotmart, configura temporalmente `DECOQUOTE_DEV_ACCESS=true`, vuelve a desplegar y prueba cotizaciones/PDF.
9. Retira `DECOQUOTE_DEV_ACCESS` y vuelve a desplegar antes de abrir el producto a usuarios.
10. Actualiza Site URL/Redirect URLs en Supabase si cambia el dominio.

## Rutas principales

```text
/
/dashboard
/dashboard/onboarding
/dashboard/customers
/dashboard/services
/dashboard/materials
/dashboard/quotes
/dashboard/quotes/new
/dashboard/quotes/[id]
/dashboard/quotes/[id]/edit
/dashboard/profitability
/dashboard/plan
/dashboard/account/business
/api/quotes/[id]/pdf
```

## Fuera del MVP

No se implementan agenda completa, inventario avanzado, contabilidad, facturación fiscal, WhatsApp API, IA generativa, CRM complejo, contratos, multi-equipo, multi-sucursal ni marketplace.
