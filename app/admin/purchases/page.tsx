import { PageHeader } from "@/components/dashboard/page-header";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { retryPaymentEvent } from "./actions";
export default async function PurchasesPage({ searchParams }: { searchParams: Promise<{ q?: string; result?: string }> }) {
  await requireAdmin();
  const { q = "", result } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("purchases").select("*").order("created_at", { ascending: false }).limit(100);
  if (q.trim()) query = q.includes("@") ? query.eq("buyer_email", q.trim().toLowerCase()) : query.eq("transaction_id", q.trim());
  const [{ data: purchases, error }, { data: events, error: eventsError }] = await Promise.all([
    query,
    supabase.from("webhook_events").select("*").like("provider", "hotmart-one-time-%").or("processed.eq.false,error.eq.REVIEW_REQUIRED").order("created_at", { ascending: false }).limit(100),
  ]);
  if (error || eventsError) throw new Error("No se pudieron consultar las compras y eventos.");
  const { data: entitlements, error: entitlementError } = purchases?.length ? await supabase.from("access_entitlements").select("*").in("purchase_id", purchases.map(p => p.id)) : { data: [], error: null };
  if (entitlementError) throw new Error("No se pudieron consultar los accesos.");
  return <div>
    <PageHeader eyebrow="Administración" title="Compras y accesos" description="Pago único. Hasta 100 resultados recientes; busca por correo o transacción exactos." />
    <form className="mt-6 flex gap-3"><input className="min-w-0 flex-1 rounded-xl border p-3" name="q" defaultValue={q} placeholder="Correo o transacción exactos" aria-label="Correo o transacción" /><button className="pastel-primary rounded-xl px-5">Buscar</button></form>
    {result ? <p className="mt-4" role="status">{result === "processed" ? "Evento procesado; la acción quedó auditada." : "No se pudo reprocesar. Revisa la configuración y el motivo."}</p> : null}
    <div className="mt-6 space-y-4">{purchases?.map(p => <article className="app-card-soft p-5" key={p.id}><p className="font-bold">{p.buyer_email}</p><p className="break-all">{p.transaction_id} · {p.environment}</p><p>Compra: {p.status} · Acceso: {entitlements?.find(e => e.purchase_id === p.id)?.status ?? "sin activar"}</p><p>Usuario: {p.user_id ?? "pendiente de correo confirmado"}</p><p>Aprobación: {formatDate(p.approved_at)}</p><p>Importe registrado: {p.amount} {p.currency}</p></article>)}</div>
    <h2 className="mt-10 text-xl font-bold">Eventos pendientes o que requieren revisión</h2>
    <div className="mt-5 space-y-4">{events?.map(e => <article className="app-card-soft p-5" key={e.id}><p className="font-bold">{e.event_type}</p><p className="break-all">{e.event_id} · {e.provider_transaction_id}</p><p>{e.error ?? "Pendiente"}</p>{!e.processed ? <form action={retryPaymentEvent} className="mt-4 flex flex-wrap gap-3"><input type="hidden" name="eventId" value={e.id} /><input className="min-w-0 flex-1 rounded-xl border p-3" name="reason" minLength={10} maxLength={1000} required placeholder="Motivo del reprocesamiento" aria-label="Motivo del reprocesamiento" /><button className="pastel-primary rounded-xl px-4">Reprocesar</button></form> : <p className="mt-3 text-sm">Revisar las condiciones y la transacción en Hotmart. No se aplican cambios de acceso desde esta pantalla.</p>}</article>)}</div>
  </div>;
}
