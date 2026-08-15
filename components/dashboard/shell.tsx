import type { User } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import Link from "next/link";

import { DashboardNavigation } from "@/components/dashboard/navigation";
import { Brand } from "@/components/ui/brand";
import { displayName } from "@/lib/format";
import type { Profile } from "@/types/database";

interface DashboardShellProps {
  children: ReactNode;
  user: User;
  profile: Profile | null;
  admin?: boolean;
}

export function DashboardShell({ children, user, profile, admin = false }: DashboardShellProps) {
  const name = displayName(profile?.full_name, user.email ?? "usuario");
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="dashboard-canvas min-h-screen">
      <header className="sticky top-0 z-30 border-b border-violet-100 bg-white/88 backdrop-blur-xl lg:hidden">
        <div className="flex h-[68px] items-center justify-between gap-3 px-4 sm:px-5">
          <Brand href={admin ? "/admin" : "/dashboard"} />
          <div className="flex items-center gap-2">
            {!admin ? <Link className="pastel-primary inline-flex min-h-10 items-center rounded-xl px-3 text-xs font-bold sm:text-sm" href="/dashboard/quotes/new"><span className="mr-1 text-base">＋</span><span className="hidden min-[390px]:inline">Nueva cotización</span></Link> : null}
            <form action="/auth/logout" method="post">
              <button aria-label="Cerrar sesión" className="grid size-10 place-items-center rounded-xl border border-violet-100 bg-white text-sm font-bold text-[#74667d]" type="submit">{initials}</button>
            </form>
          </div>
        </div>
        <div className="border-t border-violet-100/70 px-3 py-2">
          <DashboardNavigation admin={admin} showAdminLink={profile?.role === "admin"} />
        </div>
      </header>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 overflow-hidden border-r border-violet-100 bg-gradient-to-b from-[#fffafd] via-[#fbf8ff] to-[#f8fbff] p-5 lg:flex lg:flex-col">
        <span className="deco-float absolute -right-8 top-16 size-24 rounded-full bg-rose-100/70" />
        <span className="deco-float-delayed absolute -left-10 bottom-40 size-24 rounded-full bg-sky-100/70" />
        <div className="relative px-2 py-2"><Brand href={admin ? "/admin" : "/dashboard"} /></div>
        <div className="relative mt-8 flex-1">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#a092a9]">{admin ? "Administración" : "Mi estudio creativo"}</p>
          <DashboardNavigation admin={admin} showAdminLink={profile?.role === "admin"} />
          {!admin ? (
            <Link className="pastel-primary deco-sheen mt-5 flex min-h-12 items-center justify-center rounded-2xl px-4 text-sm font-bold" href="/dashboard/quotes/new">
              <span className="mr-1.5 text-lg">＋</span> Nueva cotización
            </Link>
          ) : null}
        </div>
        <div className="relative rounded-[22px] border border-white/80 bg-white/75 p-3 shadow-[0_14px_35px_rgb(80_56_94_/_0.08)] backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-[15px] bg-gradient-to-br from-violet-500 to-fuchsia-400 text-sm font-bold text-white shadow-md shadow-violet-200">{initials}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#403448]">{name}</p>
              <p className="truncate text-xs text-[#8b7d93]">{user.email}</p>
            </div>
          </div>
          <form action="/auth/logout" method="post">
            <button className="pastel-secondary mt-3 w-full rounded-xl px-3 py-2 text-sm font-semibold" type="submit">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <main className="dashboard-content min-h-screen lg:pl-72">
        <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-8 sm:py-10 lg:px-10 lg:py-11">{children}</div>
      </main>
    </div>
  );
}
