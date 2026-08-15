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
    { label: "Cotizaciones este mes", value: String(quotes.length), icon: "✦", accent: "from-violet-100 to-fuchsia-50 text-violet-700" },
    { label: "Valor total cotizado", value: formatCurrency(quoted, business.currency), icon: "$", accent: "from-amber-100 to-orange-50 text-amber-700" },
    { label: "Ganancia estimada", value: formatCurrency(profit, business.currency), icon: "↗", accent: "from-emerald-100 to-teal-50 text-emerald-700" },
    { label: "Clientes", value: String(customerCount ?? 0), icon: "♡", accent: "from-rose-100 to-pink-50 text-rose-700" },
  ];
  return (
    <div>
      <PageHeader eyebrow="Tu estudio hoy" title={`Hola, ${displayName(profile?.full_name, user.email ?? "decoradora")}`} description="Aquí tienes el pulso de tus cotizaciones, clientes y rentabilidad." action={<Link className="pastel-primary deco-sheen inline-flex rounded-2xl px-5 py-3 text-sm font-bold" href="/dashboard/quotes/new">＋ Nueva cotización</Link>} />
      {message ? <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50/80 px-4 py-3 text-sm text-violet-900 shadow-sm">{message}</div> : null}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon, accent }, index) => <article className="app-card-soft group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgb(79_52_94_/_0.11)]" key={label}><span className={`absolute -right-5 -top-5 size-20 rounded-full bg-gradient-to-br opacity-55 ${accent}`} /><div className="relative flex items-center justify-between"><p className="text-sm font-semibold text-[#74667d]">{label}</p><span className={`grid size-10 place-items-center rounded-[14px] bg-gradient-to-br text-base font-bold transition group-hover:rotate-6 ${accent}`}>{icon}</span></div><p className="relative mt-5 text-2xl font-bold tracking-[-0.035em] text-[#352b3d]">{value}</p><span className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${index === 0 ? "from-violet-300 to-fuchsia-200" : index === 1 ? "from-amber-300 to-orange-200" : index === 2 ? "from-emerald-300 to-teal-200" : "from-rose-300 to-pink-200"}`} /></article>)}
      </section>
      <section className="mt-6 grid gap-5 xl:grid-cols-[1fr_320px]">
        <article className="app-card overflow-hidden"><div className="flex items-center justify-between border-b border-violet-100 p-5 sm:p-6"><div><h2 className="font-bold text-[#403448]">Cotizaciones recientes</h2><p className="mt-1 text-sm text-[#8b7d93]">Tus últimos eventos cotizados.</p></div><Link className="rounded-xl bg-violet-50 px-3 py-2 text-sm font-bold text-violet-700 transition hover:bg-violet-100" href="/dashboard/quotes">Ver todas</Link></div>{(recent ?? []).length ? <div className="divide-y divide-violet-100/70">{(recent ?? []).map((quote) => <Link className="group flex items-center justify-between gap-4 p-5 transition hover:bg-violet-50/45 sm:px-6" href={`/dashboard/quotes/${quote.id}`} key={quote.id}><div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-rose-100 text-rose-700 transition group-hover:rotate-3">✦</span><div><p className="font-semibold text-[#403448]">{quote.event_name}</p><p className="mt-1 text-xs text-[#93869b]">{quote.quote_number} · {formatDate(quote.event_date)}</p></div></div><div className="text-right"><p className="font-bold text-[#403448]">{formatCurrency(quote.final_price_cents, quote.currency)}</p><p className="mt-1 text-xs font-medium text-violet-600">{QUOTE_STATUS_LABEL[quote.status]}</p></div></Link>)}</div> : <div className="p-10 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-violet-100 text-violet-700">✦</span><p className="mt-3 text-sm text-[#74667d]">No tienes cotizaciones todavía.</p></div>}</article>
        <aside className="deco-sheen relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#4c3565] via-[#6d45a2] to-[#a05fc1] p-6 text-white shadow-xl shadow-violet-200/60"><span className="absolute -right-9 -top-9 size-28 rounded-full bg-rose-300/25" /><span className="absolute -bottom-10 -left-8 size-24 rounded-full bg-sky-200/20" /><p className="relative text-xs font-bold uppercase tracking-[0.18em] text-violet-100">Estado del plan</p><h2 className="relative mt-3 text-xl font-bold">{plan?.name ?? "Acceso de desarrollo"}</h2><p className="relative mt-2 text-sm leading-6 text-violet-100">{subscription?.status === "active" ? "Tu suscripción está activa. Sigue creando con tranquilidad." : "Puedes probar DecoQuote mientras configuras tu producto de Hotmart."}</p><Link className="relative mt-6 inline-flex rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25" href="/dashboard/plan">Ver mi plan →</Link></aside>
      </section>
    </div>
  );
}
