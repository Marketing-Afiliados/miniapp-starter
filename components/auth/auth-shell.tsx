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
    <main className="relative min-h-screen overflow-hidden bg-[#fffafd] px-5 py-7 sm:px-8">
      <div className="absolute -left-20 top-24 size-64 rounded-full bg-rose-100/60 blur-2xl" />
      <div className="absolute -right-20 bottom-10 size-72 rounded-full bg-sky-100/70 blur-2xl" />
      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between">
        <Brand />
        <Link className="pastel-secondary rounded-xl px-4 py-2 text-sm font-semibold" href="/">
          Volver al inicio
        </Link>
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-6rem)] w-full max-w-6xl items-center py-10 lg:grid-cols-[1fr_480px] lg:gap-20">
        <section className="hidden lg:block">
          <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-700 shadow-sm">
            <span className="size-2 rounded-full bg-rose-300" /> Tu estudio, mejor organizado
          </span>
          <h2 className="max-w-xl text-5xl font-bold leading-[1.06] tracking-[-0.05em] text-[#352b3d]">
            Cada montaje merece un precio tan bien pensado como su diseño.
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-8 text-[#74667d]">
            Reúne clientes, materiales, costos y propuestas en un espacio creado para decoradoras y negocios creativos.
          </p>
          <div className="mt-10 grid max-w-lg grid-cols-3 gap-4">
            {[
              ["bg-rose-100", "Cotiza sin adivinar"],
              ["bg-amber-100", "Protege tu margen"],
              ["bg-emerald-100", "Presenta con estilo"],
            ].map(([accent, item]) => (
              <div key={item} className="app-card-soft p-4 text-sm font-semibold text-[#5f5167]">
                <span className={`mb-3 block size-8 rounded-xl ${accent}`} />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="app-card relative overflow-hidden p-6 sm:p-9">
          <span className="absolute -right-8 -top-8 size-24 rounded-full bg-violet-100/70" />
          <p className="relative text-xs font-bold uppercase tracking-[0.18em] text-violet-600">{eyebrow}</p>
          <h1 className="relative mt-2 text-3xl font-bold tracking-[-0.035em] text-[#352b3d]">{title}</h1>
          <p className="relative mt-3 leading-7 text-[#74667d]">{description}</p>
          {message ? (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
              {message}
            </div>
          ) : null}
          <div className="relative mt-8">{children}</div>
          {footer ? <div className="relative mt-7 border-t border-violet-100 pt-6 text-center text-sm text-[#74667d]">{footer}</div> : null}
        </section>
      </div>
    </main>
  );
}
