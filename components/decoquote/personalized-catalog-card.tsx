import { CatalogOverrideForm } from "@/components/decoquote/catalog-override-form";
import { CATALOG_ITEM_TYPE_LABELS } from "@/lib/decoquote/catalog";
import { formatCurrency } from "@/lib/decoquote/money";
import type { CatalogItemView } from "@/types/decoquote";

export function PersonalizedCatalogCard({
  item,
  currency,
}: {
  item: CatalogItemView;
  currency: string;
}) {
  return (
    <article className={`rounded-2xl border bg-gradient-to-br from-violet-50/70 via-white to-rose-50/50 p-5 shadow-sm ${item.hidden ? "border-slate-100 opacity-70" : "border-violet-200"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-violet-700">Catálogo base personalizado</span>
        {item.hidden ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">Oculto</span> : null}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{CATALOG_ITEM_TYPE_LABELS[item.itemType]}</p>
          <h2 className="mt-1 font-semibold text-slate-950">{item.name}</h2>
        </div>
        <span className="shrink-0 text-sm font-semibold text-violet-700">{formatCurrency(item.defaultPriceCents, currency)}</span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-slate-500">{item.description || "Sin descripción"}</p>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Costo: {formatCurrency(item.defaultCostCents, currency)} · por {item.unit}
        {item.categoryNames.length ? ` · ${item.categoryNames.join(" · ")}` : ""}
      </p>
      <details className="mt-4">
        <summary className="cursor-pointer list-none text-sm font-semibold text-violet-600">Editar personalización</summary>
        <div className="mt-4 border-t border-violet-100 pt-4">
          <CatalogOverrideForm currency={currency} item={item} />
        </div>
      </details>
    </article>
  );
}
