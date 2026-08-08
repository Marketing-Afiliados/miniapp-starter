import type { User } from "@supabase/supabase-js";
import type { ReactNode } from "react";

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
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between px-5">
          <Brand href={admin ? "/admin" : "/dashboard"} />
          <form action="/auth/logout" method="post">
            <button className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100" type="submit">Salir</button>
          </form>
        </div>
        <div className="border-t border-slate-100 px-3 py-2">
          <DashboardNavigation admin={admin} showAdminLink={profile?.role === "admin"} />
        </div>
      </header>

      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white p-5 lg:flex lg:flex-col">
        <div className="px-2 py-2"><Brand href={admin ? "/admin" : "/dashboard"} /></div>
        <div className="mt-9 flex-1">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{admin ? "Administración" : "Mi espacio"}</p>
          <DashboardNavigation admin={admin} showAdminLink={profile?.role === "admin"} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-900 text-sm font-semibold text-white">{initials}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <form action="/auth/logout" method="post">
            <button className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950" type="submit">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <main className="min-h-screen lg:pl-72">
        <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
