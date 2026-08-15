"use client";

import { useActionState, useMemo, useState } from "react";
import { saveQuoteAction } from "@/app/dashboard/quotes/actions";
import { FormFeedback } from "@/components/decoquote/form-feedback";
import { SubmitButton } from "@/components/decoquote/submit-button";
import { calculateQuote } from "@/lib/decoquote/calculations";
import { CATALOG_ITEM_TYPE_LABELS, filterCatalogItems } from "@/lib/decoquote/catalog";
import { buildCommercialProposalLines } from "@/lib/decoquote/commercial-lines";
import { centsToInput, formatCurrency, toCents, toDecimal } from "@/lib/decoquote/money";
import { initialActionState } from "@/types/action-state";
import type { CatalogCategory, Customer, Material, Service } from "@/types/database";
import type { CatalogItemView, QuoteEditorItem, QuoteEditorPayload } from "@/types/decoquote";

const input = "mt-1.5 min-h-11 w-full rounded-xl border border-[#e8dfec] bg-white/90 px-3 text-[#403448] outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100";
const card = "app-card p-5 sm:p-6";
const newId = () => typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now() + Math.random());

function emptyItem(): QuoteEditorItem {
  return { id: newId(), itemType: "custom", referenceId: null, name: "", description: "", quantity: 0, unit: "unidad", unitCostCents: 0, unitPriceCents: 0 };
}

export function QuoteEditor({
  currency,
  customers,
  services,
  materials,
  catalogItems,
  catalogCategories,
  preferredCategoryIds,
  defaultMargin,
  defaultTerms,
  quoteId,
  initial,
}: {
  currency: string;
  customers: Customer[];
  services: Service[];
  materials: Material[];
  catalogItems: CatalogItemView[];
  catalogCategories: CatalogCategory[];
  preferredCategoryIds: string[];
  defaultMargin: number;
  defaultTerms: string;
  quoteId?: string;
  initial?: QuoteEditorPayload;
}) {
  const [state, action] = useActionState(saveQuoteAction, initialActionState);
  const [customerId, setCustomerId] = useState(initial?.customerId ?? "");
  const [eventName, setEventName] = useState(initial?.eventName ?? "");
  const [eventType, setEventType] = useState(initial?.eventType ?? "");
  const [eventDate, setEventDate] = useState(initial?.eventDate ?? "");
  const [eventLocation, setEventLocation] = useState(initial?.eventLocation ?? "");
  const [validUntil, setValidUntil] = useState(initial?.validUntil ?? "");
  const [items, setItems] = useState<QuoteEditorItem[]>(initial?.items.length ? initial.items : [emptyItem()]);
  const [laborCostCents, setLabor] = useState(initial?.laborCostCents ?? 0);
  const [transportCostCents, setTransport] = useState(initial?.transportCostCents ?? 0);
  const [otherCostCents, setOther] = useState(initial?.otherCostCents ?? 0);
  const [marginType, setMarginType] = useState<"percentage" | "fixed">(initial?.marginType ?? "percentage");
  const [marginValue, setMarginValue] = useState(initial?.marginValue ?? defaultMargin);
  const [finalPriceCents, setFinalPrice] = useState<number | null>(initial?.finalPriceCents ?? null);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [terms, setTerms] = useState(initial?.terms ?? defaultTerms);
  const [catalog, setCatalog] = useState("");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [workCategoryId, setWorkCategoryId] = useState("");
  const [showAllCatalog, setShowAllCatalog] = useState(preferredCategoryIds.length === 0);
  const visibleCatalogItems = useMemo(() => filterCatalogItems(catalogItems, {
    query: catalogQuery,
    categoryId: showAllCatalog ? undefined : workCategoryId || undefined,
    preferredCategoryIds,
    showAll: showAllCatalog,
  }), [catalogItems, catalogQuery, preferredCategoryIds, showAllCatalog, workCategoryId]);

  const calculation = useMemo(() => calculateQuote({
    items: items.map((item) => ({ itemType: item.itemType, quantity: item.quantity, unitCostCents: item.unitCostCents, unitPriceCents: item.unitPriceCents })),
    laborCostCents, transportCostCents, otherCostCents, marginType, marginValue, finalPriceCents,
  }), [items, laborCostCents, transportCostCents, otherCostCents, marginType, marginValue, finalPriceCents]);
  const commercialPreview = useMemo(() => buildCommercialProposalLines(
    {
      final_price_cents: calculation.finalPriceCents,
      labor_cost_cents: calculation.laborCostCents,
      transport_cost_cents: calculation.transportCostCents,
      other_cost_cents: calculation.otherCostCents,
    },
    items.map((item) => ({
      id: item.id,
      name: item.name || "Concepto sin nombre",
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      total_price_cents: Math.round(item.quantity * item.unitPriceCents),
    })),
  ), [calculation, items]);

  const payload: QuoteEditorPayload = {
    customerId, eventName, eventType, eventDate, eventLocation, validUntil: validUntil || null,
    items, laborCostCents, transportCostCents, otherCostCents, marginType, marginValue,
    finalPriceCents, notes, terms,
  };

  function updateItem(id: string, changes: Partial<QuoteEditorItem>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));
  }

  function addCatalogItem() {
    const [kind, id] = catalog.split(":");
    if (kind === "service") {
      const service = services.find((entry) => entry.id === id);
      if (service) setItems((current) => [...current, { id: newId(), itemType: "service", referenceId: service.id, name: service.name, description: service.description ?? "", quantity: 1, unit: "servicio", unitCostCents: service.default_cost_cents, unitPriceCents: service.default_price_cents }]);
    } else if (kind === "material") {
      const material = materials.find((entry) => entry.id === id);
      if (material) setItems((current) => [...current, { id: newId(), itemType: "material", referenceId: material.id, name: material.name, description: material.description ?? "", quantity: 1, unit: material.unit, unitCostCents: material.unit_cost_cents, unitPriceCents: material.default_price_cents }]);
    } else if (kind === "global") {
      const item = catalogItems.find((entry) => entry.id === id);
      if (item) setItems((current) => [...current, {
        id: newId(),
        itemType: item.itemType,
        referenceId: item.id,
        name: item.name,
        description: item.description,
        quantity: 1,
        unit: item.unit,
        unitCostCents: item.defaultCostCents,
        unitPriceCents: item.defaultPriceCents,
      }]);
    }
    setCatalog("");
  }

  function changeMarginType(nextType: "percentage" | "fixed") {
    setMarginType(nextType);
    setMarginValue(nextType === "percentage" ? defaultMargin : 0);
  }

  return (
    <form action={action} className="quote-editor">
      {quoteId ? <input name="quoteId" type="hidden" value={quoteId} /> : null}
      <input name="payload" type="hidden" value={JSON.stringify(payload)} />
      <div className="mb-5"><FormFeedback state={state} /></div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className={card}>
            <h2 className="text-lg font-semibold text-slate-950">1. Cliente</h2>
            {customers.length ? (
              <label className="mt-4 block text-sm font-medium text-slate-700">Seleccionar cliente
                <select className={input} onChange={(event) => setCustomerId(event.target.value)} required value={customerId}>
                  <option value="">Selecciona…</option>
                  {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.full_name}</option>)}
                </select>
              </label>
            ) : <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Primero agrega un cliente desde el módulo Clientes.</p>}
          </section>

          <section className={card}>
            <h2 className="text-lg font-semibold text-slate-950">2. Datos del evento</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">Nombre del evento<input className={input} onChange={(e) => setEventName(e.target.value)} required value={eventName} placeholder="Cumpleaños Isabella" /></label>
              <label className="text-sm font-medium text-slate-700">Tipo<input className={input} onChange={(e) => setEventType(e.target.value)} required value={eventType} placeholder="Cumpleaños" /></label>
              <label className="text-sm font-medium text-slate-700">Fecha<input className={input} onChange={(e) => setEventDate(e.target.value)} required type="date" value={eventDate} /></label>
              <label className="text-sm font-medium text-slate-700">Válida hasta<input className={input} onChange={(e) => setValidUntil(e.target.value)} type="date" value={validUntil} /></label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">Lugar<input className={input} onChange={(e) => setEventLocation(e.target.value)} required value={eventLocation} placeholder="Salón, ciudad o dirección" /></label>
            </div>
          </section>

          <section className={card}>
            <h2 className="text-lg font-semibold text-slate-950">3. Servicios y materiales</h2>
            <div className="mt-4 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 via-rose-50/40 to-amber-50/50 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Tipo de trabajo
                  <select className={input} disabled={showAllCatalog} onChange={(event) => setWorkCategoryId(event.target.value)} value={workCategoryId}>
                    <option value="">Mis rubros prioritarios</option>
                    {catalogCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Buscar catálogo
                  <input className={input} onChange={(event) => setCatalogQuery(event.target.value)} placeholder="globo, cartulina, topper…" type="search" value={catalogQuery} />
                </label>
              </div>
              <label className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-600"><input checked={showAllCatalog} className="size-4 accent-violet-600" onChange={(event) => setShowAllCatalog(event.target.checked)} type="checkbox" />Ver todo el catálogo</label>
              <p className="mt-2 text-xs leading-5 text-slate-500">Los elementos de tus rubros aparecen primero. Sus costos y precios siguen abiertos para que coloques tus valores reales.</p>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <select className={`${input} mt-0 flex-1`} onChange={(e) => setCatalog(e.target.value)} value={catalog}>
                <option value="">Agregar desde el catálogo…</option>
                {visibleCatalogItems.map((item) => <option key={item.id} value={`global:${item.id}`}>{CATALOG_ITEM_TYPE_LABELS[item.itemType]} · {item.name} · {item.categoryNames[0] ?? "General"}</option>)}
                {services.map((service) => <option key={service.id} value={`service:${service.id}`}>Mi catálogo · {service.name}</option>)}
                {materials.map((material) => <option key={material.id} value={`material:${material.id}`}>Mi material · {material.name}</option>)}
              </select>
              <button className="min-h-11 rounded-xl border border-violet-200 px-4 text-sm font-semibold text-violet-700 disabled:opacity-40" disabled={!catalog} onClick={addCatalogItem} type="button">Agregar</button>
              <button className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold" onClick={() => setItems((current) => [...current, emptyItem()])} type="button">+ Personalizado</button>
            </div>
            <div className="mt-5 space-y-4">
              {items.map((item, index) => (
                <article className="rounded-2xl border border-[#eadff0] bg-gradient-to-br from-white to-[#fdf9ff] p-4 shadow-sm" key={item.id}>
                  <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Concepto {index + 1}</p><button className="text-xs font-semibold text-rose-600" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} type="button">Quitar</button></div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                    <label className="text-xs font-medium text-slate-600 sm:col-span-2 lg:col-span-3">Nombre<input className={input} onChange={(e) => updateItem(item.id, { name: e.target.value })} required value={item.name} /></label>
                    <label className="text-xs font-medium text-slate-600">Cantidad<input className={input} defaultValue={item.quantity || ""} inputMode="decimal" onChange={(e) => updateItem(item.id, { quantity: toDecimal(e.target.value) })} placeholder="1" type="text" /></label>
                    <label className="text-xs font-medium text-slate-600 lg:col-span-2">Unidad<input className={input} onChange={(e) => updateItem(item.id, { unit: e.target.value })} value={item.unit} /></label>
                    <label className="text-xs font-medium text-slate-600 lg:col-span-2">Costo unitario<input className={input} defaultValue={item.unitCostCents ? centsToInput(item.unitCostCents) : ""} inputMode="decimal" onChange={(e) => updateItem(item.id, { unitCostCents: toCents(e.target.value) })} placeholder="0.00" type="text" /></label>
                    <label className="text-xs font-medium text-slate-600 lg:col-span-2">Precio unitario<input className={input} defaultValue={item.unitPriceCents ? centsToInput(item.unitPriceCents) : ""} inputMode="decimal" onChange={(e) => updateItem(item.id, { unitPriceCents: toCents(e.target.value) })} placeholder="0.00" type="text" /></label>
                    <div className="flex items-end text-sm font-semibold text-slate-700 lg:col-span-2">Total: {formatCurrency(Math.round(item.quantity * item.unitPriceCents), currency)}</div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={card}>
            <h2 className="text-lg font-semibold">4. Costos adicionales</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {[["Mano de obra", laborCostCents, setLabor], ["Transporte", transportCostCents, setTransport], ["Otros gastos", otherCostCents, setOther]].map(([label, value, setter]) => (
                <label className="text-sm font-medium text-slate-700" key={String(label)}>{String(label)}
                  <input className={input} defaultValue={(value as number) ? centsToInput(value as number) : ""} inputMode="decimal" onChange={(e) => (setter as (value: number) => void)(toCents(e.target.value))} placeholder="0.00" type="text" />
                </label>
              ))}
            </div>
          </section>

          <section className={card}>
            <h2 className="text-lg font-semibold">5. Margen y precio final</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">Tipo de margen<select className={input} onChange={(e) => changeMarginType(e.target.value as "percentage" | "fixed")} value={marginType}><option value="percentage">Porcentaje sobre costo (markup)</option><option value="fixed">Monto fijo</option></select></label>
              <label className="text-sm font-medium text-slate-700">{marginType === "percentage" ? "Porcentaje (%)" : `Margen fijo (${currency})`}<input className={input} defaultValue={marginValue ? (marginType === "percentage" ? marginValue : centsToInput(marginValue)) : ""} inputMode="decimal" key={marginType} onChange={(e) => setMarginValue(marginType === "percentage" ? toDecimal(e.target.value) : toCents(e.target.value))} placeholder="0.00" type="text" /></label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">Precio final manual <span className="font-normal text-slate-400">(opcional)</span><input className={input} defaultValue={finalPriceCents === null ? "" : centsToInput(finalPriceCents)} inputMode="decimal" onChange={(e) => setFinalPrice(e.target.value.trim() ? toCents(e.target.value) : null)} placeholder={centsToInput(calculation.recommendedPriceCents)} type="text" /></label>
            </div>
            {calculation.hasLoss ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-800">Este precio genera una pérdida estimada de {formatCurrency(calculation.lossAmountCents, currency)}.</p> : null}
          </section>

          <section className={card}>
            <h2 className="text-lg font-semibold">6. Notas y condiciones</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">Notas internas<textarea className={`${input} min-h-28 py-3`} onChange={(e) => setNotes(e.target.value)} value={notes} /></label>
              <label className="text-sm font-medium text-slate-700">Condiciones para el cliente<textarea className={`${input} min-h-28 py-3`} onChange={(e) => setTerms(e.target.value)} value={terms} /></label>
            </div>
          </section>
        </div>

        <aside className="deco-sheen relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#3f3150] via-[#32283c] to-[#4b345e] p-5 text-white shadow-2xl shadow-violet-200/40 xl:sticky xl:top-8">
          <span className="absolute -right-10 -top-10 size-28 rounded-full bg-rose-300/15" />
          <span className="absolute -bottom-12 -left-10 size-28 rounded-full bg-sky-300/10" />
          <p className="relative text-xs font-bold uppercase tracking-[0.18em] text-violet-200">Resumen en tiempo real</p>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-300">Servicios/materiales</dt><dd>{formatCurrency(calculation.itemsCostCents, currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-300">Mano de obra</dt><dd>{formatCurrency(calculation.laborCostCents, currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-300">Transporte</dt><dd>{formatCurrency(calculation.transportCostCents, currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-300">Otros</dt><dd>{formatCurrency(calculation.otherCostCents, currency)}</dd></div>
            <div className="flex justify-between border-t border-slate-700 pt-3 font-semibold"><dt>Costo total</dt><dd>{formatCurrency(calculation.totalCostCents, currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-300">Ganancia estimada</dt><dd className={calculation.hasLoss ? "text-rose-300" : "text-emerald-300"}>{formatCurrency(calculation.estimatedProfitCents, currency)}</dd></div>
          </dl>
          <div className="relative mt-5 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 p-4 shadow-lg shadow-violet-950/20"><p className="text-xs font-bold uppercase tracking-wide text-violet-100">Precio recomendado</p><p className="mt-1 text-3xl font-bold">{formatCurrency(calculation.recommendedPriceCents, currency)}</p>{finalPriceCents !== null ? <p className="mt-2 text-sm text-violet-100">Precio final: {formatCurrency(calculation.finalPriceCents, currency)}</p> : null}</div>
          <div className="relative mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">Desglose comercial del PDF</p>
            <div className="mt-3 space-y-2 text-xs">
              {commercialPreview.map((line) => (
                <div className="flex items-start justify-between gap-3" key={line.id}>
                  <span className="text-slate-300">{line.name}</span>
                  <span className="shrink-0 font-semibold">{line.amountCents > 0 ? formatCurrency(line.amountCents, currency) : "Incluido"}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between border-t border-slate-700 pt-3 text-sm font-semibold"><span>Total cliente</span><span>{formatCurrency(calculation.finalPriceCents, currency)}</span></div>
            <p className="mt-3 text-[11px] leading-4 text-slate-400">Los importes son comerciales y suman el precio final. Costos, margen y ganancia permanecen privados.</p>
          </div>
          <div className="mt-5"><SubmitButton pendingLabel="Guardando cotización…">{quoteId ? "Guardar cambios" : "Guardar cotización"}</SubmitButton></div>
        </aside>
      </div>
    </form>
  );
}
