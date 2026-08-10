import Link from "next/link";
import { toggleMaterialAction } from "@/app/dashboard/decoquote-actions";
import { MaterialForm } from "@/components/decoquote/material-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireUser } from "@/lib/auth/guards";
import { formatCurrency } from "@/lib/decoquote/money";
import { createClient } from "@/lib/supabase/server";

export default async function MaterialsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { user } = await requireUser();
  const { q = "" } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("materials").select("*").eq("user_id", user.id).order("active", { ascending: false }).order("name");
  if (q.trim()) query = query.ilike("name", `%${q.trim()}%`);
  const { data } = await query;
  const materials = data ?? [];
  const { data: business } = await supabase.from("business_profiles").select("currency").eq("user_id", user.id).maybeSingle();
  const currency = business?.currency ?? "USD";
  return (
    <div>
      <PageHeader eyebrow="Catálogo" title="Materiales" description="Registra costos unitarios para calcular el costo real de cada montaje." action={<Link className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white" href="#nuevo">+ Agregar material</Link>} />
      <form className="mt-7 flex max-w-xl gap-2"><input className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4" defaultValue={q} name="q" placeholder="Buscar material…" /><button className="rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold">Buscar</button></form>
      <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,.6fr)]">
        <div className="grid gap-3 sm:grid-cols-2">
          {materials.length ? materials.map((material) => (
            <article className={`rounded-2xl border bg-white p-5 shadow-sm ${material.active ? "border-slate-200" : "border-slate-100 opacity-70"}`} key={material.id}>
              <div className="flex justify-between gap-3"><div><h2 className="font-semibold">{material.name}</h2><p className="mt-1 text-xs text-slate-400">{material.active ? "Activo" : "Inactivo"} · por {material.unit}</p></div><span className="text-sm font-semibold text-violet-700">{formatCurrency(material.unit_cost_cents, currency)}</span></div>
              <details className="mt-4"><summary className="cursor-pointer list-none text-sm font-semibold text-violet-600">Editar</summary><div className="mt-4 border-t pt-4"><MaterialForm currency={currency} material={material} /></div></details>
              <form action={toggleMaterialAction} className="mt-3"><input name="id" type="hidden" value={material.id} /><input name="active" type="hidden" value={String(!material.active)} /><button className="text-xs font-semibold text-slate-500">{material.active ? "Desactivar" : "Activar"}</button></form>
            </article>
          )) : <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 p-10 text-center sm:col-span-2"><h2 className="font-semibold">Aún no tienes materiales.</h2><p className="mt-2 text-sm text-slate-600">Agrega los frecuentes o crea líneas personalizadas en la cotización.</p></div>}
        </div>
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-8" id="nuevo"><h2 className="text-lg font-semibold">Nuevo material</h2><div className="mt-5"><MaterialForm currency={currency} /></div></aside>
      </section>
    </div>
  );
}
