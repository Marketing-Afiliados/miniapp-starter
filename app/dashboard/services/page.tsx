import Link from "next/link";
import { toggleServiceAction } from "@/app/dashboard/decoquote-actions";
import { ServiceForm } from "@/components/decoquote/service-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireUser } from "@/lib/auth/guards";
import { formatCurrency } from "@/lib/decoquote/money";
import { createClient } from "@/lib/supabase/server";

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { user } = await requireUser();
  const { q = "" } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("services").select("*").eq("user_id", user.id).order("active", { ascending: false }).order("name");
  if (q.trim()) query = query.ilike("name", `%${q.trim()}%`);
  const { data } = await query;
  const services = data ?? [];
  return (
    <div>
      <PageHeader eyebrow="Catálogo" title="Servicios" description="Crea servicios reutilizables con su costo interno y precio comercial." action={<Link className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white" href="#nuevo">+ Agregar servicio</Link>} />
      <form className="mt-7 flex max-w-xl gap-2"><input className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4" defaultValue={q} name="q" placeholder="Buscar servicio…" /><button className="rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold">Buscar</button></form>
      <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,.6fr)]">
        <div className="grid gap-3 sm:grid-cols-2">
          {services.length ? services.map((service) => (
            <article className={`rounded-2xl border bg-white p-5 shadow-sm ${service.active ? "border-slate-200" : "border-slate-100 opacity-70"}`} key={service.id}>
              <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-950">{service.name}</h2><p className="mt-1 text-xs font-medium text-slate-400">{service.active ? "Activo" : "Inactivo"}</p></div><span className="text-sm font-semibold text-violet-700">{formatCurrency(service.default_price_cents)}</span></div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-500">{service.description || "Sin descripción"}</p><p className="mt-3 text-xs text-slate-500">Costo: {formatCurrency(service.default_cost_cents)}</p>
              <details className="mt-4"><summary className="cursor-pointer list-none text-sm font-semibold text-violet-600">Editar</summary><div className="mt-4 border-t pt-4"><ServiceForm service={service} /></div></details>
              <form action={toggleServiceAction} className="mt-3"><input name="id" type="hidden" value={service.id} /><input name="active" type="hidden" value={String(!service.active)} /><button className="text-xs font-semibold text-slate-500">{service.active ? "Desactivar" : "Activar"}</button></form>
            </article>
          )) : <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 p-10 text-center sm:col-span-2"><h2 className="font-semibold">Aún no tienes servicios.</h2><p className="mt-2 text-sm text-slate-600">Puedes crearlos ahora o usar conceptos personalizados al cotizar.</p></div>}
        </div>
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-8" id="nuevo"><h2 className="text-lg font-semibold">Nuevo servicio</h2><div className="mt-5"><ServiceForm /></div></aside>
      </section>
    </div>
  );
}
