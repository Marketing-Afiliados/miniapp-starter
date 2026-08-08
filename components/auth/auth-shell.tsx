import Link from "next/link";
import type { ReactNode } from "react";

import { Brand } from "@/components/ui/brand";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  message?: string;
}

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
  message,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Brand />
        <Link className="text-sm font-medium text-slate-600 transition hover:text-slate-950" href="/">
          Volver al inicio
        </Link>
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-7rem)] w-full max-w-6xl items-center py-12 lg:grid-cols-[1fr_480px] lg:gap-20">
        <section className="hidden lg:block">
          <span className="mb-7 inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
            Base lista para crecer
          </span>
          <h2 className="max-w-xl text-5xl font-semibold leading-[1.08] tracking-[-0.04em] text-slate-950">
            Convierte una idea pequeña en un producto serio.
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
            Autenticación, suscripciones y una arquitectura mantenible para que puedas concentrarte en la función que hace única a tu Mini App.
          </p>
          <div className="mt-10 grid max-w-lg grid-cols-3 gap-4">
            {["Seguro por defecto", "Listo para Supabase", "Preparado para cobrar"].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 shadow-sm">
                <span className="mb-3 block size-2 rounded-full bg-emerald-500" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-9">
          <p className="text-sm font-semibold text-indigo-600">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-3 leading-7 text-slate-600">{description}</p>
          {message ? (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
              {message}
            </div>
          ) : null}
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-7 border-t border-slate-100 pt-6 text-center text-sm text-slate-600">{footer}</div> : null}
        </section>
      </div>
    </main>
  );
}
