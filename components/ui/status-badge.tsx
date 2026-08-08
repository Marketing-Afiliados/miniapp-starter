const styles: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  processed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  admin: "border-indigo-200 bg-indigo-50 text-indigo-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  past_due: "border-amber-200 bg-amber-50 text-amber-700",
  cancelled: "border-slate-200 bg-slate-100 text-slate-600",
  expired: "border-slate-200 bg-slate-100 text-slate-600",
  refunded: "border-rose-200 bg-rose-50 text-rose-700",
  inactive: "border-slate-200 bg-slate-100 text-slate-600",
  suspended: "border-rose-200 bg-rose-50 text-rose-700",
};

const labels: Record<string, string> = {
  active: "Activo",
  processed: "Procesado",
  admin: "Admin",
  user: "Usuario",
  pending: "Pendiente",
  past_due: "Pago atrasado",
  cancelled: "Cancelado",
  expired: "Expirado",
  refunded: "Reembolsado",
  inactive: "Inactivo",
  suspended: "Suspendido",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status] || "border-slate-200 bg-white text-slate-600"}`}>
      {labels[status] || status}
    </span>
  );
}
