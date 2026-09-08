# Auditoría de migración a pago único

Fecha: 2026-09-07. Este documento conserva la auditoría previa. Posteriormente el propietario confirmó USD 12.99 sin cuotas y licencia, soporte y actualizaciones gratis de por vida. La implementación y los pendientes de publicación están en DECOQUOTE-PAYMENT-DEPLOYMENT.md.

## Repositorio y alcance

Rama inicial main, sin cambios rastreados. Se creó feat/decoquote-one-time-payment. Se conservaron sin aplicar los archivos ajenos codex_patch_probe.tmp y decoquote-testimonials.patch. Solo se añade este informe. La carpeta docs pertenece a otro usuario y no permite escritura; el informe queda en la raíz.

Stack instalado: Next.js 16.3.0, React/React DOM 19.2.8, TypeScript 5.9.3, Supabase SSR 0.12.4, supabase-js 2.112.2, Tailwind 4.3.3, Vitest 4.1.10. Node 24.19.0; pnpm 11.20.0. Monolito App Router con Server Components, Server Actions, Route Handlers, Supabase Auth/PostgreSQL/Storage y pdf-lib. Vercel está documentado, pero no se inspeccionó su configuración real.

## Arquitectura observada

| Área | Evidencia | Situación |
| --- | --- | --- |
| Landing y precios | app/page.tsx, sección precio | Dos planes; no ruta /decoquote ni página de precios separada |
| Configuración | lib/decoquote/constants.ts | Emprende USD 9.99/mes, Pro USD 19.99/mes; enlaces estáticos centralizados |
| Mapeo Hotmart | 202608110002_decoquote_plans.sql | Producto 8284042; ofertas r5jsptik y lyyel4u7, planes recurrentes distintos |
| Checkout antiguo | lib/decoquote/constants.ts | Producto público A107093913L con las dos ofertas anteriores; no hay enlace nuevo verificado |
| Webhook | app/api/webhooks/hotmart/route.ts, services/hotmart-webhook.ts | Hottok, registro de eventos, actualización de suscripción |
| Auth | app/auth/actions.ts, callback, lib/auth/profile.ts | Email/contraseña, confirmación, recuperación y conciliación al login/callback |
| Proxy/guards | proxy.ts, lib/auth/guards.ts | Sesión para dashboard; rol y estado activo para admin |
| Acceso | lib/billing/access.ts, lib/decoquote/access.ts | Suscripción activa, plan activo y current_period_end vigente |
| Límites | constants.ts y lib/billing/limits.ts | Emprende: 50 cotizaciones/PDF mensuales; Pro ilimitado; clientes ilimitados |
| Mi plan/dashboard | app/dashboard/plan/page.tsx, page.tsx | Modalidad mensual, renovación y uso; Mi plan muestra fallback sin compra |
| Admin | app/admin/* | Consulta usuarios, suscripciones, uso y eventos; sin reprocesamiento administrativo |

Tablas: profiles, plans, subscriptions, usage, webhook_events; business_profiles, customers, services, materials, quote_counters, quotes, quote_items; catalog_categories, catalog_subcategories, catalog_items, catalog_item_categories, business_catalog_categories, catalog_item_overrides. No hay tablas específicas de compras/derechos adquiridos.

Funciones SQL: handle_new_user, is_admin, set_updated_at, assign_decoquote_number, save_decoquote_quote, record_decoquote_usage, set_business_catalog_categories. RLS protege propiedad/admin. Storage configura logos del negocio.

No se encontraron Edge Functions, cron, jobs, proveedor propio de correo, prueba gratuita de tres días ni tests E2E. La renovación depende de eventos Hotmart y fechas de suscripción, no de un job local. No confundir vencimiento de cotizaciones con licencia.

La calculadora y el catálogo existen dentro de la app. No se encontró sección de bonos entregables, pack de invitaciones ni PDF de inicio rápido entre los assets rastreados. Su entrega externa sigue sin verificar. El patch de testimonios no se aplicó.

Las consultas a https://magicsglobes.com/decoquote y https://decoquote.magicsglobes.com/login devolvieron error en el navegador disponible. No está verificado que la landing externa corresponda a app/page.tsx ni cuál sea su CMS. next.config.ts no contiene un rewrite /decoquote.

## Hallazgos críticos

1. RLS verifica propiedad pero no compra. Varias acciones de clientes/materiales/servicios solo requieren sesión; la edición de cotizaciones no verifica suscripción. save_decoquote_quote exige Auth y RLS, sin derecho comercial: la API directa de Supabase puede evitar el bloqueo de creación en la Server Action.
2. Un evento duplicado devuelve resultado sin reprocesar, incluso si el primer intento falló. La conciliación solo busca PROFILE_NOT_FOUND; otros fallos pueden quedar atascados.
3. El upsert de suscripción no compara fecha de proveedor ni bloquea por transacción. Eventos atrasados/concurrentes pueden sobrescribir un reembolso. Registro, aplicación y confirmación no son atómicos.
4. Vinculación inmediata por profiles.email sin verificar confirmación Auth. La conciliación posterior sí exige email_confirmed_at. El correo del perfil puede quedar desactualizado.
5. Mapeo histórico permite producto sin oferta configurada y fallback sin referencias. No reutilizar ese criterio para pago único.
6. No hay validación explícita de ambiente/versión. Hottok de cuenta no separa prueba y producción.
7. DECOQUOTE_DEV_ACCESS=true habilita bypass en producción; fuera de producción se omite pago automáticamente. No usar ese bypass en tests de autorización.
8. Se consulta únicamente la suscripción activa más reciente antes de evaluar expiración: puede ocultar otra vigente. El permiso especial de admin tampoco se propaga a toda la evaluación de funcionalidades.
9. Payload completo contiene datos personales: revisar retención y acceso. El límite de cuerpo depende de Content-Length, que puede faltar.
10. Uso y guardado no son atómicos: cuotas actuales no están garantizadas bajo concurrencia.

## Propuesta de migración, no ejecutada

Conservar planes, suscripciones, uso, eventos y todos los datos de negocio. No reescribir ni reaplicar seeds históricos para implementar pago único.

- Migración 1: access_products con código, precio 1299 centavos USD, derechos y versión de condiciones; payment_offers con proveedor/producto externo/oferta/ambiente; purchases con transacción única por proveedor/ambiente, usuario nullable, correo comprador, producto/oferta, estado, importe/moneda reales y aprobación; access_entitlements con compra origen única, usuario, producto, estado, activación, eventual vencimiento/revocación y motivo.
- Migración 2: extender webhook_events con ambiente, fecha de proveedor, versión, intentos y compra. RPC exclusiva service_role para registrar/procesar atómicamente, bloquear por transacción, validar mapeo y mantener precedencia de revocación. Auditoría administrativa con actor, motivo y referencia. Revisar índice único existente antes de añadir ambiente.
- Migración 3: autorización SQL coherente con servidor y revisión de RLS/RPC de negocio/catálogos. Mantener propiedad; evitar añadir políticas permisivas que dejen el bypass previo. Cuenta, soporte y comprobante deben seguir accesibles. Contrastar derechos históricos antes de activar restricciones.

Flujo nuevo: checkout verificado → webhook auténtico → producto/oferta/ambiente válidos → compra persistida → derecho adquirido → identidad Auth confirmada → acceso. La página de retorno no prueba pago.

Compra previa al registro queda sin usuario; reclamar al login/callback confirmado. Usuario existente se vincula solo con identidad verificada. Correo diferente exige conciliación autorizada y evidencia de ambas identidades/compra; no transferir por formulario. No generar ni enviar contraseñas.

Cada compra mantiene su derecho: reembolso de una no cancela otra compra válida ni una suscripción histórica válida. Pendiente no activa. Proponer revocación solo por reembolso total/contracargo confirmado de esa transacción, sujeta a condiciones aprobadas. Cancelación/expiración de intento pendiente no elimina otro acceso. Reembolso parcial, protesta y fraude ambiguo requieren revisión. Una aprobación antigua no reactiva una revocación.

Pago único no usa período mensual. Licencia con vencimiento nullable no implica prometer acceso/soporte/actualizaciones de por vida. Las condiciones deben quedar versionadas antes de habilitar ventas.

## Qué conservar y qué cambiar

Conservar diseño blanco/lavanda/violeta/morado, responsive, SEO, cálculo, catálogos, clientes, materiales, servicios, cotizaciones, PDF, rentabilidad y Auth. Preservar cobros y derechos históricos hasta decisión expresa.

Cambiar oferta pública a Magics DecoQuote — Pago único de USD 12.99, sin prueba ni renovación. Incorporar la promesa y complemento solicitados, «Cotiza mejor. Gana con claridad.» y CTA ADQUIERE TU APP. No enlazar precio nuevo al checkout antiguo ni prometer bonos sin entrega verificada. Mi acceso debe mostrar compra/modalidad real; históricos deben conservar su representación correcta.

## Hotmart y configuración pendiente

Documentación oficial consultada:

- https://developers.hotmart.com/docs/en/2.0.0/webhook/purchase-webhook/
- https://help.hotmart.com/en/article/360001491352/how-do-i-set-up-my-product-s-api-using-the-webhook-postback-/

Hotmart documenta X-HOTMART-HOTTOK, id, creation_date, version, producto y transacción, así como aprobada, completa, cancelada, boleto generado, retrasada, expirada, protesta, reembolso y contracargo. No asumir un campo universal sandbox. Verificar esquema por evento y aislar endpoint/BD/mapeo de pruebas cuando no exista identificador de ambiente fiable.

Manual en Hotmart: verificar tipo de producto; crear oferta independiente sin recurrencia o producto nuevo si no se puede separar del recurrente de forma segura. No convertir ofertas históricas. Configurar USD 12.99, obtener ID/ucode, código y enlace real. Verificar impuestos, cuotas y conversión antes de comparar importe del evento con precio base. Publicar condiciones, bonos y PDF de inicio rápido. Configurar acceso externo /login e instrucciones con correo de compra. Activar webhook 2.0 después del backend/SQL probado y preservar el histórico. Usar pruebas oficiales y reenvíos; compra real solo autorizada.

No hay herramientas conectadas Hotmart/Supabase/Vercel en esta sesión. No se consultaron usuarios, pagos ni variables remotas. .env.local solo declara URL y clave pública Supabase; no se imprimieron valores.

Variables existentes: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SITE_URL, SUPABASE_SERVICE_ROLE_KEY, HOTMART_HOTTOK, HOTMART_DEFAULT_PLAN_CODE y DECOQUOTE_DEV_ACCESS.

Variables propuestas: HOTMART_CHECKOUT_URL, HOTMART_ONE_TIME_PRODUCT_UCODE, HOTMART_ONE_TIME_OFFER_CODE, HOTMART_ONE_TIME_ENABLED, HOTMART_ENVIRONMENT, DECOQUOTE_TERMS_URL. Configuración de servidor validada y coherente con DB; ejemplos vacíos en .env.example. Local/Preview aislados de producción. Secretos solo servidor; Supabase no necesita Edge secrets si webhook permanece en Next.

**Checkout nuevo configurado: ninguno. SQL creado/aplicado: ninguno. Política nueva activada: ninguna.**

## Decisiones comerciales por confirmar

- Si USD 12.99 incluye todas las funciones sin cuotas de cotizaciones/PDF; propuesta: conjunto único de derechos conservando límites técnicos de archivos/validación.
- Duración de licencia, soporte, actualizaciones y URL de condiciones.
- Política de reembolsos totales/parciales, contracargos y correcciones; no hay autorización para revocar accesos reales.
- Transición de históricos: por defecto conservar; no convertir ni cancelar.
- Ubicación editable de landing externa, identificadores/checkout nuevo y entrega real de bonos/PDF.

## Secuencia de implementación y producción

1. Obtener esquema desplegado, migraciones aplicadas, políticas/grants y conteos de cohortes históricas mediante acceso autorizado. No volcar datos personales.
2. Backup consistente y ensayo de recuperación en proyecto separado, considerando Auth/Storage.
3. Preparar SQL incremental y pruebas PostgreSQL/RLS en base aislada; comparar datos/derechos antes/después.
4. Backend nuevo inicialmente deshabilitado, webhook transaccional, vinculación y conciliación; mantener procesamiento histórico.
5. Autorización SQL/servidor, Mi acceso, dashboard, soporte, login y mensajes.
6. Landing con precio único y CTA deshabilitado hasta configuración verificada.
7. Configurar Hotmart, entrega, variables Local/Preview/Production y callbacks Supabase con autorización para cambios reales.
8. Pruebas integrales y E2E; presentar diff, SQL, resultados y rollback antes de producción.
9. Desplegar migraciones compatibles/backend, validar activación, habilitar venta y publicar landing al final. Compra real solo autorizada.
10. Monitorear fallos, pendientes, latencia y discrepancias; conciliación mínima sobre admin existente antes de introducir cron.

Rollback: deshabilitar nuevas ventas y preservar recepción de eventos/compras. Revertir a versión compatible con derechos nuevos, no al código exclusivamente mensual después de vender. No borrar tablas ni restaurar backup sobre pagos posteriores; preferir migración correctiva. Restauración completa requiere autorización y conciliación del intervalo perdido.

## Validación inicial y pruebas pendientes

- pnpm test: 10 archivos, 39 tests aprobados.
- pnpm lint: aprobado.
- pnpm exec tsc --noEmit: aprobado; no existe script typecheck.
- pnpm build: bloqueado dos veces por Turbopack al abrir puerto de procesamiento: Operation not permitted, incluso al reintentar con permisos ampliados. Build no validado.
- Cobertura actual: normalización/mapeo Hotmart, límites, cálculos, dinero, catálogo, logo, constantes, líneas comerciales y PDF. No acredita persistencia, RLS ni E2E de compra.

Añadir: aprobada/pendiente, autenticidad/payload inválidos, producto/oferta/ambiente erróneos, duplicados concurrentes, reintento fallido, desorden de eventos, recompra, usuarios nuevos/existentes/no confirmados/correo distinto, compra antes/después del registro, reembolso/contracargo, acceso sin compra/con compra/histórico y combinación de derechos. Integración de persistencia, RLS directo/RPC, cotizaciones, PDF, catálogos, calculadora y rentabilidad.

Esta auditoría no declara completada la migración. Falta implementación por fases, verificación de configuración externa y aprobación de cambios reales de producción.
