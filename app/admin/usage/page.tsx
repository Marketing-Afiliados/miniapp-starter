import { DataTable, tableCellClass, tableHeadClass } from "@/components/dashboard/data-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireAdmin } from "@/lib/auth/guards";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function AdminUsagePage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("usage").select("*").order("created_at", { ascending: false }).limit(100);
  const records = data ?? [];
  const userIds = [...new Set(records.map((item) => item.user_id))];
  const { data: profileData } = userIds.length
    ? await supabase.from("profiles").select("*").in("id", userIds)
    : { data: [] };
  const profiles = new Map((profileData ?? []).map((profile) => [profile.id, profile]));

  return (
    <div>
      <PageHeader title="Uso" description="Consumo agregado por función y período de cada usuario." />
      <DataTable empty={records.length === 0} colSpan={5}>
        <thead className={tableHeadClass}><tr><th className="px-6 py-4">Usuario</th><th className="px-6 py-4">Función</th><th className="px-6 py-4">Cantidad</th><th className="px-6 py-4">Desde</th><th className="px-6 py-4">Hasta</th></tr></thead>
        {records.length > 0 ? <tbody>{records.map((record) => {
          const profile = profiles.get(record.user_id);
          return <tr key={record.id} className="hover:bg-slate-50/70"><td className={tableCellClass}><p className="font-medium text-slate-900">{profile?.full_name || "Sin nombre"}</p><p className="mt-1 text-xs text-slate-500">{profile?.email}</p></td><td className={tableCellClass}><code className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">{record.feature}</code></td><td className={tableCellClass}><span className="font-semibold text-slate-900">{record.quantity}</span></td><td className={tableCellClass}>{formatDate(record.period_start)}</td><td className={tableCellClass}>{formatDate(record.period_end)}</td></tr>;
        })}</tbody> : null}
      </DataTable>
    </div>
  );
}
