import Link from "next/link";
import { toggleServiceAction } from "@/app/dashboard/decoquote-actions";
import { CatalogBrowser } from "@/components/decoquote/catalog-browser";
import { PersonalizedCatalogCard } from "@/components/decoquote/personalized-catalog-card";
import { ServiceForm } from "@/components/decoquote/service-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireUser } from "@/lib/auth/guards";
import { filterPersonalizedCatalogItems } from "@/lib/decoquote/catalog";
import { loadCatalogForUser } from "@/lib/decoquote/catalog-server";
import { formatCurrency } from "@/lib/decoquote/money";
import { createClient } from "@/lib/supabase/server";

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ q?: string; scope?: string }> }) {
  const { user } = await requireUser();
  const { q = "", scope = "mine" } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("services").select("*").eq("user_id", user.id).order("active", { ascending: false }).order("name");
  if (q.trim()) query = query.ilike("name", `%${q.trim()}%`);
  const { data } = await query;
  const services = data ?? [];
  const [{ data: business }, catalog] = await Promise.all([
    supabase.from("business_profiles").select("currency").eq("user_id", user.id).maybeSingle(),
    loadCatalogForUser(supabase, user.id),
  ]);
  const currency = business?.currency ?? "USD";
  const personalizedServices = filterPersonalizedCatalogItems(catalog.catalogItems, {
    query: q,
    itemTypes: ["service", "product", "labor", "equipment", "transport", "other"],
  });
  return (
    <div>
      <PageHeader eyebrow="Catálogo" title="Servicios" description="Crea servicios reutilizables con su costo interno y precio comercial." action={<Link className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white" href="#nuevo">+ Agregar servicio</Link>} />
      <nav className="mt-7 flex gap-2" aria-label="Tipo de catálogo">
        <Link className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${scope !== "base" ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600"}`} href="/dashboard/services">Mi catálogo</Link>
        <Link className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${scope === "base" ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600"}`} href="/dashboard/services?scope=base">Catálogo base</Link>
      </nav>
      {scope === "base" ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-6">
          <div className="mb-5"><h2 className="text-lg font-semibold">Catálogo base de DecoQuote</h2><p className="mt-1 text-sm text-slate-500">Configura tus costos y precios sin modificar la plantilla global.</p></div>
          <CatalogBrowser categories={catalog.categories} currency={currency} emptyLabel="No encontramos conceptos para estos filtros." itemTypes={["service", "product", "labor", "equipment", "transport", "other"]} items={catalog.catalogItems} preferredCategoryIds={catalog.preferredCategoryIds} />
        </section>
      ) : (
      <>
      <form className="mt-6 flex max-w-xl gap-2"><input className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4" defaultValue={q} name="q" placeholder="Buscar en mi catálogo…" /><button className="rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold">Buscar</button></form>
      <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,.6fr)]">
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((service) => (
            <article className={`rounded-2xl border bg-white p-5 shadow-sm ${service.active ? "border-slate-200" : "border-slate-100 opacity-70"}`} key={service.id}>
              <div className="mb-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">Elemento propio</span></div>
              <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-950">{service.name}</h2><p className="mt-1 text-xs font-medium text-slate-400">{service.active ? "Activo" : "Inactivo"}</p></div><span className="text-sm font-semibold text-violet-700">{formatCurrency(service.default_price_cents, currency)}</span></div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-500">{service.description || "Sin descripción"}</p><p className="mt-3 text-xs text-slate-500">Costo: {formatCurrency(service.default_cost_cents, currency)}</p>
              <details className="mt-4"><summary className="cursor-pointer list-none text-sm font-semibold text-violet-600">Editar</summary><div className="mt-4 border-t pt-4"><ServiceForm categories={catalog.categories} currency={currency} service={service} subcategories={catalog.subcategories} /></div></details>
              <form action={toggleServiceAction} className="mt-3"><input name="id" type="hidden" value={service.id} /><input name="active" type="hidden" value={String(!service.active)} /><button className="text-xs font-semibold text-slate-500">{service.active ? "Desactivar" : "Activar"}</button></form>
            </article>
          ))}
          {personalizedServices.map((item) => <PersonalizedCatalogCard currency={currency} item={item} key={item.id} />)}
          {!services.length && !personalizedServices.length ? <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 p-10 text-center sm:col-span-2"><h2 className="font-semibold">Aún no tienes servicios.</h2><p className="mt-2 text-sm text-slate-600">Personaliza un elemento del catálogo base o crea un concepto propio.</p></div> : null}
        </div>
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-8" id="nuevo"><h2 className="text-lg font-semibold">Nuevo concepto propio</h2><div className="mt-5"><ServiceForm categories={catalog.categories} currency={currency} subcategories={catalog.subcategories} /></div></aside>
      </section>
      </>
      )}
    </div>
  );
}
