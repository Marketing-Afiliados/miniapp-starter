import Link from "next/link";
import { archiveCustomerAction } from "@/app/dashboard/decoquote-actions";
import { ConfirmAction } from "@/components/decoquote/confirm-action";
import { CustomerForm } from "@/components/decoquote/customer-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { user } = await requireUser();
  const { q = "" } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("customers").select("*").eq("user_id", user.id).is("deleted_at", null).order("created_at", { ascending: false });
  if (q.trim()) query = query.ilike("full_name", `%${q.trim()}%`);
  const { data } = await query;
  const customers = data ?? [];

  return (
    <div>
      <PageHeader eyebrow="Directorio" title="Clientes" description="Guarda los datos de tus clientes para reutilizarlos en cada cotización." action={<Link className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white" href="#nuevo">+ Agregar cliente</Link>} />
      <form className="mt-7 flex max-w-xl gap-2">
        <input aria-label="Buscar cliente" className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-violet-500" defaultValue={q} name="q" placeholder="Buscar por nombre…" />
        <button className="rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold" type="submit">Buscar</button>
      </form>
      <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,.6fr)]">
        <div className="space-y-3">
          {customers.length ? customers.map((customer) => (
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={customer.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="font-semibold text-slate-950">{customer.full_name}</h2><p className="mt-1 text-sm text-slate-500">{customer.email || customer.whatsapp || customer.phone || "Sin datos de contacto"}</p></div>
                <details><summary className="cursor-pointer list-none text-sm font-semibold text-violet-600">Editar</summary><div className="mt-5 border-t border-slate-100 pt-5"><CustomerForm customer={customer} /></div></details>
              </div>
              <div className="mt-4"><ConfirmAction action={archiveCustomerAction} id={customer.id} label="Archivar" question="¿Archivar este cliente?" /></div>
            </article>
          )) : (
            <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 p-10 text-center">
              <h2 className="font-semibold text-slate-950">Aún no tienes clientes.</h2><p className="mt-2 text-sm text-slate-600">Agrega el primero para crear una cotización.</p>
            </div>
          )}
        </div>
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-8" id="nuevo">
          <h2 className="text-lg font-semibold text-slate-950">Nuevo cliente</h2><div className="mt-5"><CustomerForm /></div>
        </aside>
      </section>
    </div>
  );
}
