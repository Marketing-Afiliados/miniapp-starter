import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth/guards";
import { getOneTimeAccess } from "@/lib/decoquote/access";
import { DECOQUOTE_PRODUCT, getCheckoutConfiguration } from "@/lib/decoquote/product";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function AccessPage() {
  const { user, profile } = await requireUser();
  const access = await getOneTimeAccess(user.id);
  const { termsUrl } = getCheckoutConfiguration(process.env);
  const supabase = await createClient();
  const { data: subscriptions, error } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) throw new Error("No se pudo consultar tu historial de acceso.");
  return <div>
    <PageHeader eyebrow="Tu producto" title="Mi acceso" description="Consulta tus compras y el estado real de tu acceso a Magics DecoQuote." />
    <section className="mt-8 space-y-5">
      {access.purchases.map(purchase => {
        const entitlement = access.entitlements.find(e => e.purchase_id === purchase.id);
        return <article key={purchase.id} className="app-card-soft p-6 sm:p-8">
          <div className="flex flex-wrap justify-between gap-4"><h2 className="text-2xl font-bold">{DECOQUOTE_PRODUCT.name}</h2><StatusBadge status={entitlement?.status ?? "pending"} /></div>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div><dt className="text-sm text-slate-500">Tipo de adquisición</dt><dd className="font-semibold">Pago único</dd></div>
            <div><dt className="text-sm text-slate-500">Fecha de compra aprobada</dt><dd>{formatDate(purchase.approved_at)}</dd></div>
            <div><dt className="text-sm text-slate-500">Estado de compra</dt><dd>{({ approved: "Aprobada", pending: "Pendiente", cancelled: "Cancelada", refunded: "Reembolsada", chargeback: "Contracargo", review: "En revisión" } as Record<string, string>)[purchase.status] ?? purchase.status}</dd></div>
            <div><dt className="text-sm text-slate-500">Transacción</dt><dd className="break-all">{purchase.transaction_id}</dd></div>
          </dl>
          <p className="mt-5">Licencia de por vida, todas las funcionalidades sin cuotas de uso, soporte y actualizaciones gratis de por vida.</p>
          {entitlement?.status === "revoked" ? <p className="mt-4 text-rose-700">Acceso revocado el {formatDate(entitlement.revoked_at)}. Contacta a soporte para revisar tu compra.</p> : null}
          {!entitlement ? <p className="mt-4 text-amber-800">Esta compra todavía no tiene un acceso activo. Si tu pago ya fue confirmado, contacta a soporte con el número de transacción.</p> : null}
        </article>;
      })}
      {!access.purchases.length ? <article className="app-card-soft p-6"><h2 className="text-xl font-bold">Sin compra de pago único vinculada</h2><p className="mt-3">Si ya compraste, confirma tu correo e ingresa con la misma dirección utilizada en Hotmart. La activación depende de la confirmación del pago.</p><p className="mt-3">Si compraste con otro correo, contacta a soporte para verificar y vincular la compra de forma segura.</p><Link className="mt-5 inline-block font-bold text-violet-700" href="/#precio">Conocer la oferta</Link></article> : null}
      {profile?.role === "admin" && profile.status === "active" ? <p className="rounded-2xl bg-violet-50 p-5">Tienes acceso administrativo. Esto no representa una compra.</p> : null}
      {(subscriptions ?? []).map(subscription => <article key={subscription.id} className="app-card-soft p-6"><h2 className="text-xl font-bold">Suscripción histórica</h2><p className="mt-3">Esta adquisición conserva su modalidad y condiciones anteriores. La nueva oferta no cancela ni convierte automáticamente tu suscripción.</p><div className="mt-4"><StatusBadge status={subscription.status} /></div><p className="mt-3">Período registrado hasta: {formatDate(subscription.current_period_end)}</p><p className="mt-2 text-sm text-slate-600">Identificador: {subscription.provider_subscription_id ?? "No disponible"}</p></article>)}
      <p><Link className="font-bold text-violet-700" href="/dashboard/support">Contactar a soporte</Link>{termsUrl ? <> · <a className="underline" href={termsUrl}>Condiciones comerciales</a></> : null}</p>
    </section>
  </div>;
}
