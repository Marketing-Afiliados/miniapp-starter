import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth/guards";
import { displayName, formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

interface DashboardPageProps {
  searchParams: Promise<{ message?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { user, profile } = await requireUser();
  const { message } = await searchParams;
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
      <PageHeader
        eyebrow="Resumen"
        title={`Hola, ${displayName(profile?.full_name, user.email ?? "usuario")}`}
        description="Aquí tienes una vista rápida del estado de tu cuenta."
      />
      {message ? <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">{message}</div> : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Estado de cuenta</p>
          <div className="mt-4"><StatusBadge status={profile?.status ?? "active"} /></div>
          <p className="mt-5 text-sm leading-6 text-slate-500">Tu perfil está disponible y protegido por las políticas de seguridad.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Plan actual</p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">{plan?.name ?? "Sin plan"}</p>
          <Link className="mt-5 inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-700" href="/dashboard/plan">Ver detalles →</Link>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:col-span-2 xl:col-span-1">
          <p className="text-sm font-medium text-slate-500">Suscripción</p>
          <div className="mt-4"><StatusBadge status={subscription?.status ?? "pending"} /></div>
          <p className="mt-5 text-sm text-slate-500">Próxima renovación: <span className="font-medium text-slate-700">{formatDate(subscription?.current_period_end)}</span></p>
        </article>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Tu espacio de trabajo</h2>
            <p className="mt-1 text-sm text-slate-500">Módulos preparados para las funciones de cada nueva Mini App.</p>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Próximamente</span>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Función principal", "El módulo que aporta el valor central de tu producto."],
            ["Historial", "Actividad reciente y resultados guardados por el usuario."],
            ["Reportes", "Indicadores y exportaciones cuando el producto los necesite."],
          ].map(([title, description]) => (
            <div key={title} className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5">
              <span className="mb-5 block size-9 rounded-xl bg-white shadow-sm" />
              <h3 className="font-semibold text-slate-800">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
