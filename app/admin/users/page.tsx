import { DataTable, tableCellClass, tableHeadClass } from "@/components/dashboard/data-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAdmin } from "@/lib/auth/guards";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

interface UsersPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  await requireAdmin();
  const { q = "" } = await searchParams;
  const search = q.trim().slice(0, 120);
  const supabase = await createClient();
  let query = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
  if (search) query = query.ilike("email", `%${search.replace(/[%_,]/g, "")}%`);
  const { data } = await query;
  const users = data ?? [];

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Consulta perfiles y encuentra rápidamente una cuenta por correo."
        action={
          <form className="flex w-full gap-2 sm:w-auto" action="/admin/users">
            <input className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 sm:w-72" defaultValue={search} name="q" placeholder="Buscar por correo…" type="search" />
            <button className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800" type="submit">Buscar</button>
          </form>
        }
      />
      <DataTable empty={users.length === 0} colSpan={5}>
        <thead className={tableHeadClass}><tr><th className="px-6 py-4">Nombre</th><th className="px-6 py-4">Correo</th><th className="px-6 py-4">Rol</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4">Creado</th></tr></thead>
        {users.length > 0 ? <tbody>{users.map((user) => <tr key={user.id} className="hover:bg-slate-50/70"><td className={tableCellClass}><span className="font-medium text-slate-900">{user.full_name || "Sin nombre"}</span></td><td className={tableCellClass}>{user.email}</td><td className={tableCellClass}><StatusBadge status={user.role} /></td><td className={tableCellClass}><StatusBadge status={user.status} /></td><td className={tableCellClass}>{formatDate(user.created_at)}</td></tr>)}</tbody> : null}
      </DataTable>
    </div>
  );
}
