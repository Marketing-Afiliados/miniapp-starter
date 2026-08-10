import Link from "next/link";
import { notFound } from "next/navigation";
import { duplicateQuoteAction, updateQuoteStatusAction } from "@/app/dashboard/quotes/actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireUser } from "@/lib/auth/guards";
import { QUOTE_STATUS_LABEL } from "@/lib/decoquote/constants";
import { formatCurrency } from "@/lib/decoquote/money";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function QuoteDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { user } = await requireUser();
  const { id } = await params;
  const { saved } = await searchParams;
  const supabase = await createClient();
  const [{ data: quote }, { data: items }] = await Promise.all([
    supabase.from("quotes").select("*").eq("id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("quote_items").select("*").eq("quote_id", id).eq("user_id", user.id).order("sort_order"),
  ]);
  if (!quote) notFound();
  const { data: customer } = await supabase.from("customers").select("*").eq("id", quote.customer_id).eq("user_id", user.id).maybeSingle();
  return (
    <div>
      <PageHeader eyebrow={quote.quote_number} title={quote.event_name} description={`${customer?.full_name ?? "Cliente"} · ${formatDate(quote.event_date)}`} action={<div className="flex flex-wrap gap-2"><Link className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold" href={`/dashboard/quotes/${id}/edit`}>Editar</Link><a className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white" href={`/api/quotes/${id}/pdf`}>Descargar PDF</a></div>} />
      {saved ? <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">Cotización guardada correctamente.</p> : null}
      <section className="mt-7 grid gap-5 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase text-slate-400">Cliente</p><h2 className="mt-2 font-semibold">{customer?.full_name}</h2><p className="mt-1 text-sm text-slate-500">{customer?.email || customer?.whatsapp || customer?.phone}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase text-slate-400">Evento</p><h2 className="mt-2 font-semibold">{quote.event_type}</h2><p className="mt-1 text-sm text-slate-500">{quote.event_location}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase text-slate-400">Estado</p><form action={updateQuoteStatusAction} className="mt-2 flex gap-2"><input name="id" type="hidden" value={id} /><select className="min-h-10 flex-1 rounded-lg border border-slate-200 px-2" defaultValue={quote.status} name="status">{Object.entries(QUOTE_STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button className="rounded-lg border border-violet-200 px-3 text-sm font-semibold text-violet-700">Guardar</button></form></article>
      </section>
      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><h2 className="text-lg font-semibold">Detalle</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Concepto</th><th>Cantidad</th><th>Precio</th><th>Total</th></tr></thead><tbody className="divide-y divide-slate-100">{(items ?? []).map((item) => <tr key={item.id}><td className="px-5 py-4"><p className="font-medium">{item.name}</p><p className="text-xs text-slate-500">{item.description}</p></td><td>{item.quantity} {item.unit}</td><td>{formatCurrency(item.unit_price_cents, quote.currency)}</td><td className="font-semibold">{formatCurrency(item.total_price_cents, quote.currency)}</td></tr>)}</tbody></table></div></section>
      <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]"><article className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Notas y condiciones</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{quote.notes || "Sin notas internas."}</p><p className="mt-4 whitespace-pre-wrap border-t pt-4 text-sm leading-6 text-slate-600">{quote.terms || "Sin condiciones."}</p></article><article className="rounded-2xl bg-slate-950 p-5 text-white"><dl className="space-y-3 text-sm"><div className="flex justify-between"><dt className="text-slate-300">Costo total</dt><dd>{formatCurrency(quote.total_cost_cents, quote.currency)}</dd></div><div className="flex justify-between"><dt className="text-slate-300">Margen</dt><dd>{formatCurrency(quote.margin_amount_cents, quote.currency)}</dd></div><div className="flex justify-between border-t border-slate-700 pt-3"><dt>Precio final</dt><dd className="text-xl font-semibold">{formatCurrency(quote.final_price_cents, quote.currency)}</dd></div><div className="flex justify-between"><dt className="text-slate-300">Ganancia estimada</dt><dd className={quote.estimated_profit_cents < 0 ? "text-rose-300" : "text-emerald-300"}>{formatCurrency(quote.estimated_profit_cents, quote.currency)}</dd></div></dl><form action={duplicateQuoteAction} className="mt-5"><input name="id" type="hidden" value={id} /><button className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950">Duplicar cotización</button></form></article></section>
    </div>
  );
}
