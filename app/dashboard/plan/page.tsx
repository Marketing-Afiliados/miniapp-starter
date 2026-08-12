import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth/guards";
import { getFeaturePlanLimit } from "@/lib/billing/limits";
import { DECOQUOTE_CONFIG } from "@/lib/decoquote/constants";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function PlanPage() {
  const fallbackPlan =
    DECOQUOTE_CONFIG.plans.find(
      (candidate) => candidate.code === DECOQUOTE_CONFIG.defaultPlanCode,
    ) ?? DECOQUOTE_CONFIG.plans[0];
  const { user } = await requireUser();
  const supabase = await createClient();
  const [{ data: subscription }, { data: usage }] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("usage").select("*").eq("user_id", user.id).order("period_start", { ascending: false }),
  ]);
  const { data: plan } = subscription
    ? await supabase.from("plans").select("*").eq("id", subscription.plan_id).maybeSingle()
    : await supabase.from("plans").select("*").eq("code", fallbackPlan.code).maybeSingle();
  const monthStart = new Date();
  monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
  const currentUsage = (usage ?? []).filter((record) => new Date(record.period_start) >= monthStart);
  const used = (feature: string) => currentUsage.filter((record) => record.feature === feature).reduce((sum, record) => sum + record.quantity, 0);
  const limits = plan?.limits ?? fallbackPlan.limits;
  const usageRows = [
    { label: "Cotizaciones", value: used("quotes"), policy: getFeaturePlanLimit(limits, "quotes") },
    { label: "PDF generados", value: used("pdf_generations"), policy: getFeaturePlanLimit(limits, "pdf_generations") },
  ];
  return (
    <div>
      <PageHeader eyebrow="Suscripción" title="Mi plan" description="Consulta tu acceso, renovación y uso mensual de DecoQuote." />
      <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
        <article className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold text-violet-600">Plan actual</p><h2 className="mt-2 text-3xl font-semibold">{plan?.name ?? fallbackPlan.name}</h2><p className="mt-2 text-slate-600">{plan?.description ?? fallbackPlan.description}</p></div><StatusBadge status={subscription?.status ?? "pending"} /></div>
          <p className="mt-8 text-4xl font-semibold">${Number(plan?.price ?? fallbackPlan.price).toFixed(2)} <span className="text-base font-normal text-slate-500">/ mes</span></p>
          <p className="mt-5 text-sm text-slate-600">Próxima renovación: <strong>{formatDate(subscription?.current_period_end)}</strong></p>
          {!subscription ? <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">El producto aún no está vinculado a una compra de Hotmart. Los administradores y el entorno de desarrollo mantienen acceso de prueba.</p> : null}
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-semibold">Uso de este mes</h2><div className="mt-5 space-y-5">{usageRows.map(({ label, value, policy }) => <div key={label}><div className="flex justify-between text-sm"><span className="text-slate-600">{label}</span><strong>{value} / {policy.kind === "unlimited" ? "Ilimitado" : policy.limit ?? "—"}</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: policy.kind === "limited" ? `${Math.min((value / policy.limit) * 100, 100)}%` : value > 0 ? "100%" : "0%" }} /></div></div>)}</div><p className="mt-6 text-xs leading-5 text-slate-500">Clientes ilimitados. Los límites comerciales se configuran centralmente en el plan.</p></article>
      </section>
    </div>
  );
}
