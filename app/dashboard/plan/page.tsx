import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth/guards";
import { formatCurrency, formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function PlanPage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: plan } = subscription
    ? await supabase.from("plans").select("*").eq("id", subscription.plan_id).maybeSingle()
    : { data: null };

  return (
    <div>
      <PageHeader title="Plan" description="Consulta tu plan, estado comercial y límites disponibles." />
      <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_.8fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Plan actual</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">{plan?.name ?? "Sin plan asignado"}</h2>
              <p className="mt-3 max-w-xl leading-7 text-slate-600">{plan?.description ?? "Tu cuenta aún no tiene una suscripción vinculada."}</p>
            </div>
            <StatusBadge status={subscription?.status ?? "pending"} />
          </div>
          {plan ? (
            <div className="mt-8 rounded-2xl bg-slate-950 p-6 text-white">
              <p className="text-sm text-slate-400">Precio</p>
              <p className="mt-2 text-3xl font-semibold">{formatCurrency(plan.price, plan.currency)} <span className="text-base font-normal text-slate-400">/ {plan.billing_interval}</span></p>
            </div>
          ) : null}
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-slate-950">Ciclo actual</h3>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-4"><dt className="text-slate-500">Inicio</dt><dd className="font-medium text-slate-800">{formatDate(subscription?.current_period_start)}</dd></div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-4"><dt className="text-slate-500">Fin</dt><dd className="font-medium text-slate-800">{formatDate(subscription?.current_period_end)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-500">Proveedor</dt><dd className="font-medium capitalize text-slate-800">{subscription?.provider ?? "—"}</dd></div>
          </dl>
        </article>
      </section>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-slate-950">Límites del plan</h2>
        <pre className="mt-5 overflow-x-auto rounded-xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">{JSON.stringify(plan?.limits ?? {}, null, 2)}</pre>
      </section>
    </div>
  );
}
