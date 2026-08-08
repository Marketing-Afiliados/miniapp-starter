"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const userItems = [
  { href: "/dashboard", label: "Dashboard", icon: "⌂" },
  { href: "/dashboard/account", label: "Mi cuenta", icon: "○" },
  { href: "/dashboard/plan", label: "Plan", icon: "◇" },
];

const adminItems = [
  { href: "/admin", label: "Resumen", icon: "⌂" },
  { href: "/admin/users", label: "Usuarios", icon: "○" },
  { href: "/admin/subscriptions", label: "Suscripciones", icon: "◇" },
  { href: "/admin/usage", label: "Uso", icon: "▥" },
  { href: "/admin/webhooks", label: "Webhooks", icon: "↯" },
];

export function DashboardNavigation({
  admin = false,
  showAdminLink = false,
}: {
  admin?: boolean;
  showAdminLink?: boolean;
}) {
  const pathname = usePathname();
  const items = admin ? adminItems : userItems;

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label={admin ? "Administración" : "Cuenta"}>
      {items.map((item) => {
        const active = item.href === pathname;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}
          >
            <span className="grid size-6 place-items-center text-base" aria-hidden="true">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
      {showAdminLink && !admin ? (
        <Link className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950" href="/admin">
          <span className="grid size-6 place-items-center" aria-hidden="true">⚙</span>
          Administración
        </Link>
      ) : null}
      {admin ? (
        <Link className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950" href="/dashboard">
          <span className="grid size-6 place-items-center" aria-hidden="true">←</span>
          Volver a mi cuenta
        </Link>
      ) : null}
    </nav>
  );
}
