import { DataTable, tableCellClass, tableHeadClass } from "@/components/dashboard/data-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAdmin } from "@/lib/auth/guards";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function AdminSubscriptionsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("subscriptions").select("*").order("created_at", { ascending: false }).limit(100);
  const subscriptions = data ?? [];
  const userIds = [...new Set(subscriptions.map((item) => item.user_id))];
  const planIds = [...new Set(subscriptions.map((item) => item.plan_id))];
  const [{ data: profileData }, { data: planData }] = await Promise.all([
    userIds.length ? supabase.from("profiles").select("*").in("id", userIds) : Promise.resolve({ data: [] }),
    planIds.length ? supabase.from("plans").select("*").in("id", planIds) : Promise.resolve({ data: [] }),
  ]);
  const profiles = new Map((profileData ?? []).map((profile) => [profile.id, profile]));
  const plans = new Map((planData ?? []).map((plan) => [plan.id, plan]));

  return (
    <div>
      <PageHeader title="Suscripciones" description="Estado comercial y períodos de acceso de cada usuario." />
      <DataTable empty={subscriptions.length === 0} colSpan={7}>
        <thead className={tableHeadClass}><tr><th className="px-6 py-4">Usuario</th><th className="px-6 py-4">Plan</th><th className="px-6 py-4">Proveedor</th><th className="px-6 py-4">ID proveedor</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4">Inicio</th><th className="px-6 py-4">Fin período</th></tr></thead>
        {subscriptions.length > 0 ? <tbody>{subscriptions.map((subscription) => {
          const profile = profiles.get(subscription.user_id);
          const plan = plans.get(subscription.plan_id);
          return <tr key={subscription.id} className="hover:bg-slate-50/70"><td className={tableCellClass}><p className="font-medium text-slate-900">{profile?.full_name || "Sin nombre"}</p><p className="mt-1 text-xs text-slate-500">{profile?.email}</p></td><td className={tableCellClass}>{plan?.name ?? "—"}</td><td className={`${tableCellClass} capitalize`}>{subscription.provider}</td><td className={tableCellClass}><span className="font-mono text-xs">{subscription.provider_subscription_id ?? "—"}</span></td><td className={tableCellClass}><StatusBadge status={subscription.status} /></td><td className={tableCellClass}>{formatDate(subscription.started_at)}</td><td className={tableCellClass}>{formatDate(subscription.current_period_end)}</td></tr>;
        })}</tbody> : null}
      </DataTable>
    </div>
  );
}
