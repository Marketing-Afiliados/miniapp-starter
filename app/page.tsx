import Link from "next/link";

import { Brand } from "@/components/ui/brand";

export default function Home() {
  return (
    <main className="overflow-hidden bg-white">
      <header className="relative z-20 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Brand />
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex" aria-label="Navegación principal">
            <a className="transition hover:text-slate-950" href="#como-funciona">Cómo funciona</a>
            <a className="transition hover:text-slate-950" href="#precio">Precio</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:block" href="/login">
              Iniciar sesión
            </Link>
            <Link className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700" href="/register">
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      <section className="relative isolate">
        <div className="absolute inset-x-0 top-0 -z-10 h-[720px] bg-[radial-gradient(circle_at_72%_18%,#e0e7ff_0,transparent_34%),radial-gradient(circle_at_18%_8%,#ecfeff_0,transparent_27%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.05fr_.95fr] lg:py-32">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-700">
              <span className="size-1.5 rounded-full bg-indigo-500" />
              De idea a SaaS, sin reconstruir lo básico
            </span>
            <h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl">
              Tu próxima Mini App empieza más adelante.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              Una base profesional para lanzar productos por suscripción con usuarios, planes, seguridad y operaciones listas desde el primer día.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex h-13 items-center justify-center rounded-xl bg-indigo-600 px-6 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700" href="/register">
                Crear mi cuenta
              </Link>
              <Link className="inline-flex h-13 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50" href="/login">
                Ya tengo una cuenta
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-600">
              {["Autenticación segura", "Control de acceso", "Billing preparado"].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <span className="grid size-5 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">✓</span>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-indigo-100/70 to-cyan-50 blur-2xl" />
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/50">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div className="flex gap-1.5"><span className="size-2.5 rounded-full bg-rose-300" /><span className="size-2.5 rounded-full bg-amber-300" /><span className="size-2.5 rounded-full bg-emerald-300" /></div>
                <span className="text-xs font-medium text-slate-400">Panel de producto</span>
              </div>
              <div className="grid min-h-[420px] grid-cols-[112px_1fr] sm:grid-cols-[150px_1fr]">
                <div className="border-r border-slate-100 bg-slate-50 p-4">
                  <div className="mb-7 h-7 w-7 rounded-lg bg-indigo-600" />
                  <div className="space-y-3">
                    <div className="h-8 rounded-lg bg-indigo-100" />
                    <div className="h-8 rounded-lg bg-white" />
                    <div className="h-8 rounded-lg bg-white" />
                  </div>
                </div>
                <div className="p-5 sm:p-7">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Resumen</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">Buenos días, Andrea</h2>
                  <div className="mt-7 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs text-slate-500">Plan actual</p><p className="mt-2 font-semibold text-slate-900">Pro</p></div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs text-slate-500">Estado</p><p className="mt-2 font-semibold text-emerald-600">Activo</p></div>
                  </div>
                  <div className="mt-5 rounded-2xl bg-slate-950 p-5 text-white">
                    <p className="text-xs text-slate-400">Uso del período</p>
                    <div className="mt-3 flex items-end justify-between"><span className="text-2xl font-semibold">14 / 20</span><span className="text-xs text-slate-400">70%</span></div>
                    <div className="mt-4 h-2 rounded-full bg-white/10"><div className="h-2 w-[70%] rounded-full bg-indigo-400" /></div>
                  </div>
                  <div className="mt-5 space-y-3">{[72, 86, 56].map((width) => <div key={width} className="h-3 rounded-full bg-slate-100" style={{ width: `${width}%` }} />)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="border-y border-slate-100 bg-slate-50 py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-indigo-600">Cómo funciona</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Del clon al primer cliente en tres pasos.</h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              ["01", "Adapta tu producto", "Cambia la marca, define tu función principal y conserva una arquitectura que ya está ordenada."],
              ["02", "Configura tu negocio", "Conecta Supabase, crea tus planes y asigna la oferta de Hotmart correspondiente."],
              ["03", "Publica y aprende", "Despliega en Vercel, incorpora usuarios reales y evoluciona con una base preparada para crecer."],
            ].map(([number, title, copy]) => (
              <article key={number} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <span className="text-sm font-bold text-indigo-600">{number}</span>
                <h3 className="mt-8 text-xl font-semibold text-slate-950">{title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="precio" className="py-24 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="rounded-[2rem] bg-slate-950 px-6 py-12 text-white sm:px-12 lg:flex lg:items-center lg:justify-between lg:px-16">
            <div className="max-w-2xl">
              <span className="text-sm font-semibold text-indigo-300">Un plan simple para empezar</span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Todo lo esencial para validar tu Mini App.</h2>
              <p className="mt-4 leading-7 text-slate-300">El precio y los límites finales se configuran para cada producto. La arquitectura admite varios planes cuando los necesites.</p>
            </div>
            <div className="mt-8 lg:ml-12 lg:mt-0 lg:text-right">
              <p className="text-sm text-slate-400">Precio de lanzamiento</p>
              <p className="mt-1 text-4xl font-semibold">Próximamente</p>
              <Link className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 font-semibold text-slate-950 transition hover:bg-indigo-50" href="/register">Crear cuenta</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Brand />
          <p>Una base reutilizable para productos pequeños con ambición.</p>
        </div>
      </footer>
    </main>
  );
}
