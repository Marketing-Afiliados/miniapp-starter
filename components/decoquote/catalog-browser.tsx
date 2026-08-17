"use client";

import { useMemo, useState } from "react";
import { CatalogOverrideForm } from "@/components/decoquote/catalog-override-form";
import { CATALOG_ITEM_TYPE_LABELS, filterCatalogItems } from "@/lib/decoquote/catalog";
import { formatCurrency } from "@/lib/decoquote/money";
import type { CatalogCategory, CatalogItemType } from "@/types/database";
import type { CatalogItemView } from "@/types/decoquote";

export function CatalogBrowser({
  items,
  categories,
  preferredCategoryIds,
  currency,
  itemTypes,
  emptyLabel,
}: {
  items: CatalogItemView[];
  categories: CatalogCategory[];
  preferredCategoryIds: string[];
  currency: string;
  itemTypes: CatalogItemType[];
  emptyLabel: string;
}) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [showAll, setShowAll] = useState(preferredCategoryIds.length === 0);
  const [showHidden, setShowHidden] = useState(false);
  const visible = useMemo(() => filterCatalogItems(items, {
    query,
    categoryId: categoryId || undefined,
    itemTypes,
    preferredCategoryIds,
    showAll,
    includeHidden: showHidden,
  }), [items, query, categoryId, itemTypes, preferredCategoryIds, showAll, showHidden]);

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <input className="min-h-11 rounded-xl border border-slate-200 bg-white px-4" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, categoría o palabra relacionada…" type="search" value={query} />
        <select className="min-h-11 rounded-xl border border-slate-200 bg-white px-4" onChange={(event) => setCategoryId(event.target.value)} value={categoryId}>
          <option value="">Todas las categorías</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
        <label className="flex items-center gap-2"><input checked={showAll} className="size-4 accent-violet-600" onChange={(event) => setShowAll(event.target.checked)} type="checkbox" />Ver todo el catálogo</label>
        <label className="flex items-center gap-2"><input checked={showHidden} className="size-4 accent-violet-600" onChange={(event) => setShowHidden(event.target.checked)} type="checkbox" />Ver ocultos</label>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {visible.map((item) => (
          <article className={`rounded-2xl border bg-white p-5 shadow-sm ${item.hidden ? "border-slate-100 opacity-60" : "border-slate-200"}`} key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">{CATALOG_ITEM_TYPE_LABELS[item.itemType]}</p>
                  {item.personalized ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">Personalizado</span> : null}
                </div>
                <h3 className="mt-1 font-semibold text-slate-950">{item.name}</h3>
              </div>
              <span className="shrink-0 text-sm font-semibold text-violet-700">{formatCurrency(item.defaultPriceCents, currency)}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">{item.categoryNames.join(" · ")}{item.subcategoryNames.length ? ` / ${item.subcategoryNames.join(" · ")}` : ""}</p>
            <p className="mt-2 text-xs text-slate-500">Costo configurado: {formatCurrency(item.defaultCostCents, currency)} · por {item.unit}</p>
            <details className="mt-4">
              <summary className="cursor-pointer list-none text-sm font-semibold text-violet-600">{item.personalized ? "Editar personalización" : "Personalizar para mi negocio"}</summary>
              <div className="mt-4 border-t pt-4"><CatalogOverrideForm currency={currency} item={item} /></div>
            </details>
          </article>
        ))}
        {!visible.length ? <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 p-10 text-center md:col-span-2"><p className="font-semibold">{emptyLabel}</p><p className="mt-2 text-sm text-slate-600">Prueba otra búsqueda o activa “Ver todo el catálogo”.</p></div> : null}
      </div>
    </div>
  );
}
