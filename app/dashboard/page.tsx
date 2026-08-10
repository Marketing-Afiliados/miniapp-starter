import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireUser } from "@/lib/auth/guards";
import { QUOTE_STATUS_LABEL } from "@/lib/decoquote/constants";
import { formatCurrency } from "@/lib/decoquote/money";
import { displayName, formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { user, profile } = await requireUser();
  const { message } = await searchParams;
  const supabase = await createClient();
  const { data: business } = await supabase.from("business_profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (!business) redirect("/dashboard/onboarding");
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const [{ data: monthQuotes }, { count: customerCount }, { data: recent }, { data: subscription }] = await Promise.all([
    supabase.from("quotes").select("*").eq("user_id", user.id).gte("created_at", monthStart),
    supabase.from("customers").select("*", { count: "exact", head: true }).eq("user_id", user.id).is("deleted_at", null),
    supabase.from("quotes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const quotes = monthQuotes ?? [];
  const quoted = quotes.reduce((sum, quote) => sum + quote.final_price_cents, 0);
  const profit = quotes.reduce((sum, quote) => sum + quote.estimated_profit_cents, 0);
  const { data: plan } = subscription ? await supabase.from("plans").select("*").eq("id", subscription.plan_id).maybeSingle() : { data: null };
  const cards = [
    ["Cotizaciones este mes", String(quotes.length), "▤"],
    ["Valor total cotizado", formatCurrency(quoted, business.currency), "$"],
    ["Ganancia estimada", formatCurrency(profit, business.currency), "↗"],
    ["Clientes", String(customerCount ?? 0), "○"],
  ];
  return (
    <div>
      <PageHeader eyebrow="Resumen" title={`Hola, ${displayName(profile?.full_name, user.email ?? "decoradora")}`} description="Aquí tienes el pulso de tus cotizaciones y rentabilidad." action={<Link className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm" href="/dashboard/quotes/new">+ Nueva cotización</Link>} />
      {message ? <div className="mt-6 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">{message}</div> : null}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, icon]) => <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={label}><div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500">{label}</p><span className="grid size-9 place-items-center rounded-xl bg-violet-50 font-semibold text-violet-600">{icon}</span></div><p className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">{value}</p></article>)}
      </section>
      <section className="mt-6 grid gap-5 xl:grid-cols-[1fr_320px]">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-semibold">Cotizaciones recientes</h2><p className="mt-1 text-sm text-slate-500">Tus últimos eventos cotizados.</p></div><Link className="text-sm font-semibold text-violet-600" href="/dashboard/quotes">Ver todas</Link></div>{(recent ?? []).length ? <div className="divide-y divide-slate-100">{(recent ?? []).map((quote) => <Link className="flex items-center justify-between gap-4 p-5 transition hover:bg-slate-50" href={`/dashboard/quotes/${quote.id}`} key={quote.id}><div><p className="font-medium text-slate-950">{quote.event_name}</p><p className="mt-1 text-xs text-slate-500">{quote.quote_number} · {formatDate(quote.event_date)}</p></div><div className="text-right"><p className="font-semibold">{formatCurrency(quote.final_price_cents, quote.currency)}</p><p className="mt-1 text-xs text-slate-500">{QUOTE_STATUS_LABEL[quote.status]}</p></div></Link>)}</div> : <div className="p-10 text-center text-sm text-slate-500">No tienes cotizaciones todavía.</div>}</article>
        <aside className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-6 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-violet-600">Estado del plan</p><h2 className="mt-3 text-xl font-semibold">{plan?.name ?? "Acceso de desarrollo"}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{subscription?.status === "active" ? "Tu suscripción está activa." : "Puedes probar DecoQuote mientras configuras tu producto de Hotmart."}</p><Link className="mt-6 inline-flex text-sm font-semibold text-violet-700" href="/dashboard/plan">Ver mi plan →</Link></aside>
      </section>
    </div>
  );
}
