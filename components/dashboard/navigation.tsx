"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type IconName = "home" | "quote" | "customers" | "services" | "materials" | "profit" | "plan" | "account" | "usage" | "webhook" | "back";

const userItems: { href: string; label: string; icon: IconName; accent: string }[] = [
  { href: "/dashboard", label: "Dashboard", icon: "home", accent: "bg-violet-100 text-violet-700" },
  { href: "/dashboard/quotes", label: "Cotizaciones", icon: "quote", accent: "bg-rose-100 text-rose-700" },
  { href: "/dashboard/customers", label: "Clientes", icon: "customers", accent: "bg-sky-100 text-sky-700" },
  { href: "/dashboard/services", label: "Servicios", icon: "services", accent: "bg-amber-100 text-amber-700" },
  { href: "/dashboard/materials", label: "Materiales", icon: "materials", accent: "bg-emerald-100 text-emerald-700" },
  { href: "/dashboard/profitability", label: "Rentabilidad", icon: "profit", accent: "bg-fuchsia-100 text-fuchsia-700" },
  { href: "/dashboard/plan", label: "Mi plan", icon: "plan", accent: "bg-orange-100 text-orange-700" },
  { href: "/dashboard/account", label: "Mi cuenta", icon: "account", accent: "bg-indigo-100 text-indigo-700" },
];

const adminItems: { href: string; label: string; icon: IconName; accent: string }[] = [
  { href: "/admin", label: "Resumen", icon: "home", accent: "bg-violet-100 text-violet-700" },
  { href: "/admin/users", label: "Usuarios", icon: "customers", accent: "bg-sky-100 text-sky-700" },
  { href: "/admin/subscriptions", label: "Suscripciones", icon: "plan", accent: "bg-amber-100 text-amber-700" },
  { href: "/admin/usage", label: "Uso", icon: "usage", accent: "bg-emerald-100 text-emerald-700" },
  { href: "/admin/webhooks", label: "Webhooks", icon: "webhook", accent: "bg-rose-100 text-rose-700" },
];

function NavIcon({ name }: { name: IconName }) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.8 };
  return (
    <svg aria-hidden="true" className="size-[18px]" viewBox="0 0 24 24">
      {name === "home" ? <><path {...common} d="m3 11 9-8 9 8" /><path {...common} d="M5 10v10h14V10M9 20v-6h6v6" /></> : null}
      {name === "quote" ? <><path {...common} d="M6 3h9l3 3v15H6z" /><path {...common} d="M9 10h6M9 14h6M9 18h4" /></> : null}
      {name === "customers" ? <><circle {...common} cx="9" cy="8" r="3" /><path {...common} d="M3.5 19c.5-4 2.5-6 5.5-6s5 2 5.5 6M16 6.5a3 3 0 0 1 0 5.8M16 14c2.5.4 4 2.1 4.5 5" /></> : null}
      {name === "services" ? <><path {...common} d="m12 3 1.6 4.2L18 9l-4.4 1.8L12 15l-1.6-4.2L6 9l4.4-1.8z" /><path {...common} d="m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" /></> : null}
      {name === "materials" ? <><path {...common} d="m12 3 8 4-8 4-8-4zM4 12l8 4 8-4M4 17l8 4 8-4" /></> : null}
      {name === "profit" ? <><path {...common} d="M4 19V9M10 19V5M16 19v-7M3 19h18" /><path {...common} d="m14 6 3-3 3 3" /></> : null}
      {name === "plan" ? <><path {...common} d="m12 3 2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9z" /></> : null}
      {name === "account" ? <><circle {...common} cx="12" cy="8" r="4" /><path {...common} d="M4.5 21c.6-5 3.1-7 7.5-7s6.9 2 7.5 7" /></> : null}
      {name === "usage" ? <><path {...common} d="M5 20V10M12 20V4M19 20v-7" /></> : null}
      {name === "webhook" ? <><path {...common} d="M8 7a4 4 0 1 1 7.6 1.7L19 14" /><path {...common} d="M16 14h3v-3M16 17a4 4 0 1 1-7.6-1.7L5 10" /><path {...common} d="M8 10H5v3" /></> : null}
      {name === "back" ? <><path {...common} d="m15 18-6-6 6-6" /></> : null}
    </svg>
  );
}

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
    <nav className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0" aria-label={admin ? "Administración" : "Cuenta"}>
      {items.map((item) => {
        const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            key={item.href}
            href={item.href}
            className={`group flex min-h-11 shrink-0 items-center gap-3 rounded-2xl px-2.5 py-2 text-sm font-semibold transition-all duration-200 lg:px-3 ${active ? "bg-white text-[#4d3d57] shadow-[0_8px_24px_rgb(85_59_99_/_0.09)] ring-1 ring-violet-100" : "text-[#74667d] hover:bg-white/70 hover:text-[#352b3d]"}`}
          >
            <span className={`grid size-8 shrink-0 place-items-center rounded-xl transition duration-200 group-hover:rotate-3 group-hover:scale-105 ${item.accent}`}>
              <NavIcon name={item.icon} />
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
      {showAdminLink && !admin ? (
        <Link className="flex min-h-11 shrink-0 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold text-[#74667d] transition hover:bg-white/70 hover:text-[#352b3d]" href="/admin">
          <span className="grid size-8 place-items-center rounded-xl bg-slate-100 text-slate-700"><NavIcon name="usage" /></span>
          Administración
        </Link>
      ) : null}
      {admin ? (
        <Link className="flex min-h-11 shrink-0 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold text-[#74667d] transition hover:bg-white/70 hover:text-[#352b3d]" href="/dashboard">
          <span className="grid size-8 place-items-center rounded-xl bg-violet-100 text-violet-700"><NavIcon name="back" /></span>
          Volver a mi cuenta
        </Link>
      ) : null}
    </nav>
  );
}
