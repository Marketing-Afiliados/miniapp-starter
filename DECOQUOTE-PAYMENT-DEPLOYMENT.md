# Pago único de Magics DecoQuote: implementación y publicación

## Configuración aportada por el propietario

- Checkout real: https://pay.hotmart.com/Y107492007M?off=ij6szo4g, guardado en HOTMART_CHECKOUT_URL local y en .env.example. Debe copiarse a Vercel; no se modificaron variables remotas.
- Código de oferta: ij6szo4g (parámetro off del enlace).
- El propietario confirma que habilitó en Hotmart el webhook https://decoquote.magicsglobes.com/api/webhooks/hotmart/one-time. Esto no acredita todavía recepción/procesamiento en el backend desplegado.
- Falta confirmar el ID/ucode del producto enviado por Hotmart. Y107492007M es el identificador del enlace de pago; no se utiliza como product.id/ucode sin evidencia.
- Pendientes de verificar: migración aplicada, despliegue de esta rama, Hottok/service role en Vercel, ambiente production, mapeo de oferta en Supabase y URL de condiciones publicadas. No compartir secretos en mensajes.
- El propietario solicitó habilitar el checkout: ahora está activo por defecto en el código, con el enlace real centralizado. HOTMART_ONE_TIME_ENABLED=false permite desactivarlo explícitamente. La URL separada de condiciones es opcional para el botón; no se inventa una URL. No se realizó una compra real.
- Diagnóstico posterior: el Supabase configurado localmente respondió 404/PGRST205 a una lectura de purchases (sin datos personales), mientras /login público respondió 200. Falta exponer/aplicar la migración en ese proyecto. El login ahora conserva sesión y acceso histórico/administrativo si el sistema de compras no está disponible; para nuevos compradores muestra estado de verificación temporalmente no disponible, sin inventar acceso.
- Antes de desplegar esta activación de ventas al sitio público, completar la migración/mapeo y las variables de servidor. El código habilitado en esta rama no certifica que producción pueda procesar compras.

## Oferta confirmada

USD 12.99, un único pago, todas las funcionalidades sin cuotas de uso, licencia de por vida y soporte/actualizaciones gratis de por vida. No hay renovaciones ni trial para nuevos compradores. Se mantienen validaciones técnicas (tamaño del logo, formatos, autenticación, etc.). Las suscripciones históricas conservan sus condiciones y datos.

## Arquitectura anterior y nueva

Antes: landing → checkout de Emprende/Pro → webhook → subscriptions → acceso por período mensual. Auditoría detallada: DECOQUOTE-PAYMENT-AUDIT.md; sus decisiones comerciales pendientes fueron resueltas posteriormente por el propietario respecto a licencia, soporte, actualizaciones y cuotas.

Ahora: landing → checkout real centralizado → POST /api/webhooks/hotmart/one-time → validación Hottok y contrato 2.0 → RPC transaccional → purchases/access_entitlements → identidad Auth confirmada → acceso servidor y RLS. El endpoint histórico /api/webhooks/hotmart sigue disponible exclusivamente para ofertas anteriores. No enviar la oferta nueva a ambos endpoints.

No se modificaron Hotmart, Vercel, Supabase remoto, DNS ni la landing externa. Esta implementación modifica la landing de este repositorio, en `/`; aún debe verificarse quién sirve magicsglobes.com/decoquote. No se realizaron compras reales, migraciones remotas, cancelaciones ni revocaciones.

## Archivos

- Oferta/UI: lib/decoquote/product.ts, constants.ts, app/page.tsx, dashboard/plan/page.tsx, dashboard/page.tsx, register/page.tsx, support/page.tsx y navegación/StatusBadge.
- Acceso: lib/decoquote/access.ts, lib/billing/access.ts, lib/auth/profile.ts; páginas y acciones de negocio/cotizaciones, API PDF. Sin bypass DECOQUOTE_DEV_ACCESS.
- Pagos: lib/hotmart/one-time.ts, request.ts, services/one-time-payment.ts y app/api/webhooks/hotmart/one-time/route.ts. El servicio histórico solo añade comprobación de identidad Auth confirmada al vincular; no modifica filas existentes durante despliegue.
- Admin: app/admin/purchases/page.tsx y actions.ts; consulta por correo/transacción exactos, acceso y errores; reprocesamiento con motivo obligatorio y auditoría SQL.
- Contrato DB: types/database.ts y supabase/migrations/202609070001_one_time_access.sql.
- Pruebas: tests/one-time-database.test.ts, tests/one-time-route.test.ts, lib/hotmart/one-time.test.ts y vitest.config.mts. PGlite añadido únicamente como dependencia de desarrollo.
- Entorno/documentación: .env.example, README.md, este documento y auditoría. git diff --stat permite revisar el inventario exacto.

## SQL e impacto

La migración nueva crea payment_settings (ambiente único por BD), payment_offers (mapeo y derechos), purchases (pagos, incluyendo no vinculados), access_entitlements (un derecho por compra) y payment_admin_audit. Reutiliza webhook_events con columnas nuevas. No inserta IDs de ofertas inventados ni activa venta alguna.

Funciones nuevas: process_one_time_purchase (solo service_role), claim_one_time_purchases (identidad Auth derivada de la sesión), retry_one_time_event y reconcile_purchase_access (solo administrador activo), has_decoquote_access.

La compra y su derecho se procesan atómicamente con bloqueos por evento/transacción. Reintentos fallidos conservan el evento y aumentan attempts. Mismo ID con contenido diferente es rechazado. Se conserva solo información normalizada necesaria; no se persiste el payload bruto con dirección/teléfono. El importe real de purchase.price puede diferir de 12.99 por conversión/impuestos: la autorización depende del mapeo exacto de producto/oferta, no de datos frontend ni del retorno del checkout.

RLS añade políticas **restrictivas** a tablas de negocio y catálogo: se combinan con las existentes por AND. Se mantiene propiedad y acceso histórico activo/vigente; ahora una cuenta sin compra/suscripción tampoco puede operar directamente mediante Supabase. Cuenta, Mi acceso y soporte permanecen disponibles. Revisar antes del despliegue las cohortes que hoy usan la app sin compra o por DECOQUOTE_DEV_ACCESS; no convertir esos casos en derechos permanentes sin autorización. Los datos permanecen aunque no exista acceso.

La migración está versionada y transaccional, prevista para ejecutarse una vez mediante el registro de migraciones. No reaplicarla manualmente: las políticas con nombre fijo no son reentrantes. No reejecutar seeds históricos para configurar la nueva oferta.

## Activación y casos de compra

- Usuario existente: se busca email confirmado en auth.users, no un perfil/email aportado por cliente.
- Compra anterior al registro: queda sin user_id; después de confirmar correo y entrar se vincula por RPC.
- Webhook posterior al login: vincula automáticamente al usuario confirmado; al navegar nuevamente se consulta acceso actual.
- Email distinto: no se vincula automáticamente. Soporte debe comprobar compra y ambas identidades antes de conciliación administrativa.
- Pendiente, cancelación o expiración de intento: no crean acceso ni desactivan otra compra.
- Múltiples compras: cada transacción conserva su derecho. Una devolución no afecta otros pagos ni suscripciones anteriores.
- Reembolso/contracargo confirmado es terminal para la transacción; una aprobación atrasada no reactiva. Si llega antes de aprobación, no se otorga acceso.
- Protesta/disputa: REVIEW_REQUIRED sin revocación automática.

## Política de reembolsos pendiente de publicación

Por defecto payment_offers.revoke_on_refund=false: reembolso/contracargo de compra ya activada se registra con REVIEW_REQUIRED y mantiene su derecho hasta resolución autorizada. Esto evita aplicar una política no confirmada. Antes de abrir ventas, publicar condiciones coherentes con Hotmart y decidir si habilitar revocación automática específica por transacción.

Con revoke_on_refund=true, un evento confirmado de reembolso total/contracargo revoca únicamente su entitlement y registra fecha/motivo. No borra datos. No se revoca por retraso, cancelación de intento, expiración ni evento ambiguo. Los reembolsos parciales no están automatizados: deben revisarse con evidencia de proveedor. No se aplica una revocación retroactiva cambiando el flag; los casos anteriores requieren conciliación autorizada.

## Variables por ambiente

| Variable | Local/Preview | Production |
| --- | --- | --- |
| NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Proyecto aislado | Proyecto real |
| SUPABASE_SERVICE_ROLE_KEY | Clave servidor del proyecto aislado | Clave servidor real; nunca NEXT_PUBLIC |
| NEXT_PUBLIC_SITE_URL | Local/Preview según configuración existente | https://decoquote.magicsglobes.com |
| HOTMART_HOTTOK | Token autorizado para prueba | Token de la cuenta productiva |
| HOTMART_ENVIRONMENT | test | production |
| HOTMART_CHECKOUT_URL | Vacío hasta contar con enlace verificado | URL real del checkout de pago único |
| DECOQUOTE_TERMS_URL | URL de condiciones revisables | Condiciones publicadas de la oferta confirmada |
| HOTMART_ONE_TIME_ENABLED | false hasta prueba completa | false hasta backend/entrega comprobados, luego true |
| HOTMART_DEFAULT_PLAN_CODE | Solo si integración histórica lo necesita | Conservar configuración histórica existente |

DECOQUOTE_DEV_ACCESS deja de habilitar acceso. Para QA usar fixtures/compra de prueba y derechos válidos, no bypass en producción. Los administradores activos conservan acceso administrativo.

El flag de venta solo controla el CTA (activo por defecto por solicitud del propietario): deshabilitar ventas no interrumpe recepción de eventos ni derechos de compradores. La URL de checkout se acepta exclusivamente HTTPS en pay.hotmart.com, sin credenciales embebidas. El checkout real figura en la configuración local; falta confirmar su configuración en Vercel. Los destinos se leen centralmente en el servidor.

No se añaden Edge Functions ni secretos en Supabase Edge. En Supabase se configura Auth (confirmación email, Site URL y callbacks), esquema, ambiente y ofertas. Hottok/service role residen en Vercel, no en variables públicas ni logs.

## Configuración Hotmart manual

1. Revisar si el producto actual admite oferta independiente sin recurrencia. Si no, crear producto de pago único. No convertir ni eliminar las ofertas Emprende/Pro que tienen compradores históricos.
2. Configurar 12.99 USD y comprobar que no existe renovación automática. Diferenciar pagos fraccionados por el procesador de una suscripción; no prometer condiciones de financiación no verificadas.
3. Obtener ucode/ID de producto y código de oferta, y copiar el enlace REAL del checkout. No copiar las ofertas antiguas r5jsptik/lyyel4u7.
4. Publicar condiciones que incluyan licencia, soporte y actualizaciones gratis de por vida; definir reembolsos/revocaciones antes de activar la oferta.
5. Preparar PDF de inicio rápido e instrucciones con https://decoquote.magicsglobes.com/login. Confirmar bonos: calculadora/catálogo existen en la app, pero no se certifican entregables descargables. Pack de invitaciones y PDF de inicio rápido siguen pendientes de verificar/publicar. No se muestran como bonos disponibles en la landing.
6. Configurar webhook 2.0 hacia https://decoquote.magicsglobes.com/api/webhooks/hotmart/one-time, seleccionando solo producto/oferta nueva. Mantener endpoint/configuración históricos.
7. Probar eventos oficiales con BD aislada; verificar producto/oferta exactos, campos de compra, reintentos, email confirmado y entrega. Hotmart no documenta aquí un indicador universal sandbox; se usan ambientes/BD separados. No dirigir pruebas hacia Production.
8. Configurar acceso externo y retorno si el producto los admite. El retorno nunca activa acceso.

Fuentes oficiales consultadas: https://developers.hotmart.com/docs/en/2.0.0/webhook/purchase-webhook/ y https://help.hotmart.com/en/article/360001491352/how-do-i-set-up-my-product-s-api-using-the-webhook-postback-/ . Los tests usan fixtures sintéticos del contrato documentado; verificar ejemplos reales de esta cuenta antes de habilitar producción.

## SQL de configuración: plantilla para revisar

Después de aplicar la migración, reemplazar los marcadores con datos verificados. Este bloque NO se ejecutó. La oferta ij6szo4g corresponde al enlace real aportado. Para pruebas sustituirla por la oferta oficial de prueba cuando corresponda. Emplear test solo en base aislada; production y la oferta real solo después de autorización de despliegue.

```sql
begin;
insert into public.payment_settings(singleton, environment)
values (true, 'test');
insert into public.payment_offers (
  provider_product_id, provider_offer_code, environment, enabled, revoke_on_refund
) values (
  'REEMPLAZAR_CON_UCODE_REAL', 'ij6szo4g', 'test', true, false
);
commit;
```

No mezclar ofertas de prueba/producción en una misma BD. No cambiar payment_settings en un proyecto que ya tiene compras; crear base separada para pruebas. enabled permite procesar webhooks y debe seguir true aunque se retire el CTA o deje de venderse esa oferta, para poder recibir devoluciones.

## Conciliación mínima y trazabilidad

En /admin/purchases se consulta correo/transacción exactos y eventos fallidos o REVIEW_REQUIRED. Reprocesar usa el contenido autenticado almacenado, exige admin activo y motivo, y genera payment_admin_audit. No subir JSON del navegador para simular aprobación.

Para vinculación por otro correo, concesión o revocación manual existe RPC reconcile_purchase_access(p_purchase_id, p_action, p_user_id, p_reason), invocable únicamente con sesión administrativa autenticada:

- link: requiere destino con correo Auth confirmado; antes verificar la compra y ambas identidades por soporte. Registrar transacción/evidencia en el motivo, sin secretos.
- grant: exige compra con estado approved; no crea compras ni habilita pendientes/reembolsadas.
- revoke: revoca solo esa compra, sin afectar otras; requiere autorización y motivo.

No se expone formulario de edición de pagos a usuarias normales. No se ejecutaron operaciones administrativas reales. Los casos de reversión de devolución y fraude requieren conciliación específica contra evidencia del proveedor antes de correcciones; no inventar un pago aprobado.

## Secuencia exacta de publicación

1. Revisar diff y SQL; exportar esquema/políticas reales, migraciones aplicadas y conteos de derechos históricos. Confirmar usuarios sin suscripción que dependían del bypass.
2. Backup consistente de DB/Auth y recursos Storage; ensayar restauración en proyecto separado y guardar punto de recuperación.
3. Aplicar migración nueva en base aislada; configurar test y oferta de prueba. Ejecutar pnpm test, pnpm exec tsc --noEmit, pnpm lint y pnpm build.
4. Validar registro con email confirmado, compra antes/después del registro, acceso, PDF, catálogo, rentabilidad, duplicados, fallos y devolución; cotejar entrega de Hotmart. PGlite no sustituye E2E de Supabase Auth/HTTP ni concurrencia multiconexión real.
5. Obtener autorización de publicación y configuración real. Aplicar migración compatible a Production, configurar payment_settings/offer y variables; no ejecutar SQL destructivo.
6. Desplegar backend/cliente con HOTMART_ONE_TIME_ENABLED=false. Configurar webhook nuevo después de migración/backend y preservar histórico. Verificar recepción y registros.
7. Confirmar checkout real, condiciones y PDF/bonos entregables. Configurar URL/condiciones y habilitar CTA al final mediante redeploy. Verificar también la landing externa si se administra fuera del repositorio.
8. Solo con autorización explícita realizar compra real de validación; comprobar transacción, compra, entitlement, correo/entrega, login y uso. No se ha realizado esa compra en esta sesión.
9. Revisar diariamente eventos no procesados/REVIEW_REQUIRED al inicio; comparar ventas aprobadas del proveedor con purchases y entitlements, registrar conciliación.

## Rollback

Deshabilitar HOTMART_ONE_TIME_ENABLED y redeploy para cerrar nuevas ventas, conservando webhook y compras existentes. No deshabilitar payment_offers si se necesitan procesar devoluciones/reintentos. Después de vender, no volver a una versión que solo entienda subscriptions: dejar backend/RLS compatible con derechos adquiridos y corregir con migración incremental. No borrar tablas de pago ni datos de negocio. Restauración completa solo ante incidente autorizado y conciliando pagos posteriores al backup. Las suscripciones antiguas no se cancelaron ni convirtieron.

## Validación y límites actuales

Pruebas unitarias y PostgreSQL embebido cubren compra aprobada/pendiente, cancelada, duplicados, retry, errores de mapeo/ambiente, compra antes/después del registro, correo no verificado/diferente, devoluciones, contracargo, desorden de eventos, persistencia, RLS, cotización, cálculo/rentabilidad y PDF. Incluyen autenticación HTTP y cuerpo malformado/excesivo. Resultado actualizado: 18 archivos y 92 tests aprobados. Incluye regresiones de sesión, cookies, contraseñas y esquema de compras no disponible. TypeScript y ESLint aprobados; diff sin errores de espacios.

pnpm build está bloqueado en este entorno por Turbopack al abrir un puerto. El intento alternativo con Webpack también encontró un problema del entorno: el subprocess TypeScript --showConfig devuelve stdout vacío. No se deshabilitaron comprobaciones ni se alteró Next para ocultarlo. El build debe verificarse en CI/Preview antes de publicar.

Las carpetas locales _decoquote_original_* son copias preservadas por la restricción de propietario de algunos directorios; están excluidas de Git, TypeScript, ESLint, Vitest y del router de Next (prefijo privado). No forman parte del cambio publicable. Los archivos ajenos codex_patch_probe.tmp y decoquote-testimonials.patch permanecen intactos.
