import type { ReactNode } from "react";

export function DataTable({
  children,
  empty,
  colSpan,
}: {
  children: ReactNode;
  empty?: boolean;
  colSpan: number;
}) {
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          {children}
          {empty ? (
            <tbody>
              <tr><td className="px-6 py-14 text-center text-slate-500" colSpan={colSpan}>No hay registros para mostrar.</td></tr>
            </tbody>
          ) : null}
        </table>
      </div>
    </div>
  );
}

export const tableHeadClass = "bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500";
export const tableCellClass = "border-t border-slate-100 px-6 py-4 align-middle text-slate-600";
