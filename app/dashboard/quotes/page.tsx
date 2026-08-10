import Link from "next/link";
import { duplicateQuoteAction } from "@/app/dashboard/quotes/actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireUser } from "@/lib/auth/guards";
import { QUOTE_STATUS_LABEL } from "@/lib/decoquote/constants";
import { formatCurrency } from "@/lib/decoquote/money";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { QuoteStatus } from "@/types/database";

export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; customer?: string }> }) {
  const { user } = await requireUser();
  const filters = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("quotes").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  const validStatuses = Object.keys(QUOTE_STATUS_LABEL) as QuoteStatus[];
  if (filters.status && validStatuses.includes(filters.status as QuoteStatus)) {
    query = query.eq("status", filters.status as QuoteStatus);
  }
  if (filters.customer) query = query.eq("customer_id", filters.customer);
  const [{ data: quoteRows }, { data: customers }] = await Promise.all([
    query,
    supabase.from("customers").select("*").eq("user_id", user.id).is("deleted_at", null).order("full_name"),
  ]);
  const customerMap = new Map((customers ?? []).map((customer) => [customer.id, customer.full_name]));
  const q = (filters.q ?? "").toLowerCase().trim();
  const quotes = (quoteRows ?? []).filter((quote) => !q || quote.quote_number.toLowerCase().includes(q) || quote.event_name.toLowerCase().includes(q) || (customerMap.get(quote.customer_id) ?? "").toLowerCase().includes(q));
  return (
    <div>
      <PageHeader eyebrow="Historial" title="Cotizaciones" description="Consulta, filtra, duplica y descarga tus propuestas." action={<Link className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white" href="/dashboard/quotes/new">+ Nueva cotización</Link>} />
      <form className="mt-7 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <input className="min-h-11 rounded-xl border border-slate-200 px-3" defaultValue={filters.q} name="q" placeholder="Número, cliente o evento" />
        <select className="min-h-11 rounded-xl border border-slate-200 px-3" defaultValue={filters.status} name="status"><option value="">Todos los estados</option>{Object.entries(QUOTE_STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select className="min-h-11 rounded-xl border border-slate-200 px-3" defaultValue={filters.customer} name="customer"><option value="">Todos los clientes</option>{(customers ?? []).map((customer) => <option key={customer.id} value={customer.id}>{customer.full_name}</option>)}</select>
        <button className="min-h-11 rounded-xl border border-violet-200 font-semibold text-violet-700 sm:col-span-3">Aplicar filtros</button>
      </form>
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {quotes.length ? <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{["Número","Cliente","Evento","Fecha","Total","Ganancia","Estado","Acciones"].map((head) => <th className="px-4 py-3" key={head}>{head}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{quotes.map((quote) => <tr key={quote.id}><td className="px-4 py-4 font-semibold text-violet-700"><Link href={`/dashboard/quotes/${quote.id}`}>{quote.quote_number}</Link></td><td className="px-4 py-4">{customerMap.get(quote.customer_id)}</td><td className="px-4 py-4">{quote.event_name}</td><td className="px-4 py-4">{formatDate(quote.event_date)}</td><td className="px-4 py-4 font-semibold">{formatCurrency(quote.final_price_cents, quote.currency)}</td><td className={`px-4 py-4 ${quote.estimated_profit_cents < 0 ? "text-rose-600" : "text-emerald-700"}`}>{formatCurrency(quote.estimated_profit_cents, quote.currency)}</td><td className="px-4 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{QUOTE_STATUS_LABEL[quote.status as QuoteStatus]}</span></td><td className="px-4 py-4"><div className="flex gap-3"><Link className="font-semibold text-violet-600" href={`/dashboard/quotes/${quote.id}`}>Ver</Link><Link className="font-semibold text-slate-600" href={`/dashboard/quotes/${quote.id}/edit`}>Editar</Link><form action={duplicateQuoteAction}><input name="id" type="hidden" value={quote.id} /><button className="font-semibold text-slate-600">Duplicar</button></form><a className="font-semibold text-slate-600" href={`/api/quotes/${quote.id}/pdf`}>PDF</a></div></td></tr>)}</tbody></table></div> : <div className="p-12 text-center"><h2 className="font-semibold text-slate-950">No tienes cotizaciones todavía.</h2><p className="mt-2 text-sm text-slate-600">Crea la primera en pocos minutos.</p><Link className="mt-5 inline-flex rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white" href="/dashboard/quotes/new">Crear mi primera cotización</Link></div>}
      </div>
    </div>
  );
}
