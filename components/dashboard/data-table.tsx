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
    <div className="app-card mt-8 overflow-hidden">
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

export const tableHeadClass = "bg-gradient-to-r from-violet-50/90 via-rose-50/60 to-amber-50/60 text-xs font-bold uppercase tracking-wider text-[#74667d]";
export const tableCellClass = "border-t border-[#eee7f1] px-6 py-4 align-middle text-[#65586d]";
