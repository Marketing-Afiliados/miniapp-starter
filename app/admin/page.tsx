import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [users, subscriptions, usage, webhooks, businesses, quotes] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }),
    supabase.from("usage").select("*", { count: "exact", head: true }),
    supabase.from("webhook_events").select("*", { count: "exact", head: true }),
    supabase.from("business_profiles").select("*", { count: "exact", head: true }),
    supabase.from("quotes").select("*", { count: "exact", head: true }),
  ]);

  const cards = [
    { label: "Usuarios", value: users.count ?? 0, href: "/admin/users", accent: "bg-indigo-500" },
    { label: "Suscripciones", value: subscriptions.count ?? 0, href: "/admin/subscriptions", accent: "bg-emerald-500" },
    { label: "Registros de uso", value: usage.count ?? 0, href: "/admin/usage", accent: "bg-amber-500" },
    { label: "Webhooks", value: webhooks.count ?? 0, href: "/admin/webhooks", accent: "bg-cyan-500" },
    { label: "Negocios DecoQuote", value: businesses.count ?? 0, href: "/admin", accent: "bg-violet-500" },
    { label: "Cotizaciones", value: quotes.count ?? 0, href: "/admin", accent: "bg-fuchsia-500" },
  ];

  return (
    <div>
      <PageHeader eyebrow="Administración" title="Resumen operativo" description="Supervisa usuarios, suscripciones, consumo y eventos de facturación." />
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
            <span className={`block size-2.5 rounded-full ${card.accent}`} />
            <p className="mt-7 text-3xl font-semibold tracking-tight text-slate-950">{card.value}</p>
            <div className="mt-2 flex items-center justify-between text-sm text-slate-500"><span>{card.label}</span><span className="transition group-hover:translate-x-0.5">→</span></div>
          </Link>
        ))}
      </section>
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-slate-950">Controles de seguridad activos</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Acceso por rol", "Cada ruta administrativa valida el rol en el servidor."],
            ["Datos aislados", "Las políticas RLS limitan las filas visibles para cada usuario."],
            ["Eventos idempotentes", "Un evento de Hotmart solo puede registrarse una vez."],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-xl bg-slate-50 p-5"><span className="mb-4 grid size-7 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">✓</span><h3 className="font-semibold text-slate-800">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{copy}</p></div>
          ))}
        </div>
      </section>
    </div>
  );
}
