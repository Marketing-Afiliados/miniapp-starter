# Magics DecoQuote

DecoQuote es una mini app de pago único para decoradoras de eventos. Permite registrar clientes, reutilizar servicios y materiales, calcular el costo real de un montaje, aplicar margen, conocer la ganancia estimada y generar una propuesta PDF profesional.

> “Cotiza tus decoraciones con confianza y conoce cuánto realmente ganas.”

## Stack y arquitectura

- Next.js 16, React 19, TypeScript estricto y App Router.
- Tailwind CSS 4, diseño responsive y mobile-first.
- Supabase Auth, PostgreSQL, SSR y Row Level Security.
- Hotmart Webhook 2.0 para pago único, conservando integración histórica.
- Vercel y pnpm.
- Monolito modular: UI, Server Actions, dominio y persistencia en una sola aplicación.

La autenticación, billing, planes, usage, webhooks y panel admin del Starter se conservan.

## Módulos

- Dashboard con cotizaciones del mes, valor cotizado, ganancia, clientes y actividad reciente.
- Perfil del negocio y onboarding inicial.
- Logo del negocio en Supabase Storage, visible en las propuestas PDF.
- País y moneda de trabajo: USD/EUR siempre disponibles y moneda local para Argentina, México, Chile y Colombia.
- Clientes con búsqueda, edición y archivado lógico.
- Catálogo personal de servicios y materiales reutilizables.
- Catálogo base multi-nicho con costos y precios personalizados por usuaria.
- Creador de cotizaciones con líneas dinámicas y conceptos personalizados.
- Historial, filtros, detalle, edición, cambio de estado y duplicado.
- PDF comercial sin costo interno, margen ni ganancia.
- Rentabilidad estimada por mes, últimos 30 días o año.
- Licencia, soporte y actualizaciones gratis de por vida por USD 12.99, sin cuotas de uso.
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

El PDF usa un desglose **comercial reconciliado**. Conserva los precios de venta de los conceptos y distribuye cualquier diferencia hasta el precio final entre montaje/coordinación, logística/transporte y servicios adicionales, según los costos internos asociados. La suma de las líneas siempre coincide exactamente con el precio final; costo, margen y ganancia nunca se exponen al cliente.

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

Catálogo creativo global:

- `catalog_categories` y `catalog_subcategories`: taxonomía extensible.
- `catalog_items`: elementos base sin propietario.
- `catalog_item_categories`: relación many-to-many sin duplicar conceptos.
- `business_catalog_categories`: múltiples rubros elegidos por usuaria.
- `catalog_item_overrides`: costo, precio, unidad y visibilidad privados.

Las tablas personales `services` y `materials` continúan siendo la fuente de
los elementos propios. La migración no altera sus filas ni importes existentes.

`quotes` y `quote_items` guardan importes con sufijo `_cents`. `customers.deleted_at` implementa archivado lógico. El número se genera en PostgreSQL con formato `DQ-YYYY-000001`.

`business_profiles.country_code` determina las monedas disponibles en el perfil. La selección es explícita para evitar errores de geolocalización por VPN, viajes o configuración del navegador.

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

## Pago único y publicación

La oferta actual es **Magics DecoQuote — pago único de USD 12.99**: licencia de por vida, todas las funcionalidades sin cuotas de uso y soporte/actualizaciones gratis de por vida. No hay suscripción ni renovación para nuevos compradores.

Lee [la guía de migración y publicación](DECOQUOTE-PAYMENT-DEPLOYMENT.md) antes de configurar Hotmart, aplicar SQL o desplegar. Incluye variables, acceso, usuarios históricos, pruebas, pasos de producción y rollback. Los precios/mapeos de migraciones anteriores son historial: no reaplicar sus seeds ni utilizarlos para ventas nuevas.

Nueva migración: `supabase/migrations/202609070001_one_time_access.sql`. Debe aplicarse y configurarse primero en una base aislada. Requiere todas las migraciones anteriores; no borra datos. Configura `payment_settings` y `payment_offers` con datos reales según la guía. Después de migrar, los usuarios sin compra/suscripción no pueden utilizar funciones del producto; cuenta, soporte y Mi acceso continúan disponibles.

`.env.example` contiene los nombres necesarios sin credenciales. `HOTMART_ONE_TIME_ENABLED=false` mantiene la compra deshabilitada hasta verificar webhook, checkout real, condiciones y entrega. El checkout real está indicado en `.env.example`; debe configurarse también en Vercel y validarse con el mapeo de producto/oferta.

La autenticación usa confirmación de email Supabase. Configurar Site URL y `/auth/callback` en Local/Preview/Production. No hay bypass de acceso mediante `DECOQUOTE_DEV_ACCESS`.

## PDF

`GET /api/quotes/[id]/pdf` valida sesión, propiedad y acceso (incluidas condiciones históricas cuando corresponda). `pdf-lib` genera la propuesta en servidor.

Incluye negocio, cliente, evento, conceptos, cantidad, importes comerciales reconciliados, subtotal, total y condiciones. Montaje, logística y servicios adicionales aparecen como rubros comerciales cuando corresponden. No incluye costos internos, margen ni rentabilidad.

## Vercel

Usar pnpm y el preset Next.js, sin override del directorio de salida. Seguir la secuencia de [publicación](DECOQUOTE-PAYMENT-DEPLOYMENT.md): migraciones compatibles, backend, webhook, verificación y landing al final. Preview debe utilizar Supabase aislado. No desplegar a Production ni configurar proveedores sin autorización.

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
/dashboard/plan (Mi acceso)
/admin/purchases
/api/webhooks/hotmart/one-time
/dashboard/account/business
/api/quotes/[id]/pdf
```

## Fuera del MVP

No se implementan agenda completa, inventario avanzado, contabilidad, facturación fiscal, WhatsApp API, IA generativa, CRM complejo, contratos, multi-equipo, multi-sucursal ni marketplace.
