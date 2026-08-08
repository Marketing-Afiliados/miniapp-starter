import { DataTable, tableCellClass, tableHeadClass } from "@/components/dashboard/data-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAdmin } from "@/lib/auth/guards";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function AdminWebhooksPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("webhook_events").select("id,provider,event_id,event_type,processed,processed_at,error,created_at").order("created_at", { ascending: false }).limit(100);
  const events = data ?? [];

  return (
    <div>
      <PageHeader title="Webhooks" description="Audita el procesamiento sin exponer el contenido sensible de los eventos." />
      <DataTable empty={events.length === 0} colSpan={7}>
        <thead className={tableHeadClass}><tr><th className="px-6 py-4">Proveedor</th><th className="px-6 py-4">ID evento</th><th className="px-6 py-4">Tipo</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4">Procesado</th><th className="px-6 py-4">Error</th><th className="px-6 py-4">Creado</th></tr></thead>
        {events.length > 0 ? <tbody>{events.map((event) => <tr key={event.id} className="hover:bg-slate-50/70"><td className={`${tableCellClass} capitalize`}>{event.provider}</td><td className={tableCellClass}><span className="font-mono text-xs">{event.event_id}</span></td><td className={tableCellClass}><code className="text-xs">{event.event_type}</code></td><td className={tableCellClass}><StatusBadge status={event.processed ? "processed" : "pending"} /></td><td className={tableCellClass}>{formatDate(event.processed_at)}</td><td className={tableCellClass}><span className="block max-w-xs truncate text-rose-600" title={event.error ?? undefined}>{event.error ?? "—"}</span></td><td className={tableCellClass}>{formatDate(event.created_at)}</td></tr>)}</tbody> : null}
      </DataTable>
    </div>
  );
}
