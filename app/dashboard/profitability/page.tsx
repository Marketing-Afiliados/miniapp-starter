import { PageHeader } from "@/components/dashboard/page-header";
import { requireUser } from "@/lib/auth/guards";
import { formatCurrency } from "@/lib/decoquote/money";
import { createClient } from "@/lib/supabase/server";

function periodStart(period: string): Date {
  const now = new Date();
  if (period === "30d") return new Date(now.getTime() - 30 * 86400000);
  if (period === "year") return new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export default async function ProfitabilityPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { user } = await requireUser();
  const { period = "month" } = await searchParams;
  const supabase = await createClient();
  const [{ data: quotes }, { data: business }] = await Promise.all([
    supabase.from("quotes").select("*").eq("user_id", user.id).gte("created_at", periodStart(period).toISOString()).order("created_at", { ascending: false }),
    supabase.from("business_profiles").select("currency").eq("user_id", user.id).maybeSingle(),
  ]);
  const rows = quotes ?? [];
  const revenue = rows.reduce((sum, quote) => sum + quote.final_price_cents, 0);
  const costs = rows.reduce((sum, quote) => sum + quote.total_cost_cents, 0);
  const profit = rows.reduce((sum, quote) => sum + quote.estimated_profit_cents, 0);
  const currency = business?.currency ?? "USD";
  return (
    <div>
      <PageHeader eyebrow="Análisis" title="Rentabilidad" description="Una vista práctica basada en tus cotizaciones; no sustituye un sistema contable." />
      <form className="mt-7"><select className="min-h-11 rounded-xl border border-slate-200 bg-white px-4" defaultValue={period} name="period"><option value="month">Este mes</option><option value="30d">Últimos 30 días</option><option value="year">Este año</option></select><button className="ml-2 min-h-11 rounded-xl border border-violet-200 px-4 text-sm font-semibold text-violet-700">Aplicar</button></form>
      <section className="mt-6 grid gap-4 md:grid-cols-3">{[["Ingresos estimados", revenue, "text-violet-700"],["Costos estimados", costs, "text-slate-950"],["Ganancia estimada", profit, profit < 0 ? "text-rose-600" : "text-emerald-700"]].map(([label, value, color]) => <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" key={String(label)}><p className="text-sm font-medium text-slate-500">{String(label)}</p><p className={`mt-4 text-3xl font-semibold ${color}`}>{formatCurrency(value as number, currency)}</p></article>)}</section>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-semibold">Cómo se calcula</h2><p className="mt-2 text-sm leading-6 text-slate-600">Ingresos = suma de precios finales. Costos = materiales, servicios, mano de obra, transporte y otros gastos. Ganancia = precio final menos costo total.</p><p className="mt-4 text-sm font-medium text-slate-700">{rows.length} cotizaciones incluidas en el período.</p></section>
    </div>
  );
}
