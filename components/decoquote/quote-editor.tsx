"use client";

import { useActionState, useMemo, useState } from "react";
import { saveQuoteAction } from "@/app/dashboard/quotes/actions";
import { FormFeedback } from "@/components/decoquote/form-feedback";
import { SubmitButton } from "@/components/decoquote/submit-button";
import { calculateQuote } from "@/lib/decoquote/calculations";
import { centsToInput, formatCurrency, toCents } from "@/lib/decoquote/money";
import { initialActionState } from "@/types/action-state";
import type { Customer, Material, Service } from "@/types/database";
import type { QuoteEditorItem, QuoteEditorPayload } from "@/types/decoquote";

const input = "mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100";
const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6";
const newId = () => typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now() + Math.random());

function emptyItem(): QuoteEditorItem {
  return { id: newId(), itemType: "custom", referenceId: null, name: "", description: "", quantity: 1, unit: "unidad", unitCostCents: 0, unitPriceCents: 0 };
}

export function QuoteEditor({
  currency,
  customers,
  services,
  materials,
  defaultMargin,
  defaultTerms,
  quoteId,
  initial,
}: {
  currency: string;
  customers: Customer[];
  services: Service[];
  materials: Material[];
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

  const calculation = useMemo(() => calculateQuote({
    items: items.map((item) => ({ itemType: item.itemType, quantity: item.quantity, unitCostCents: item.unitCostCents, unitPriceCents: item.unitPriceCents })),
    laborCostCents, transportCostCents, otherCostCents, marginType, marginValue, finalPriceCents,
  }), [items, laborCostCents, transportCostCents, otherCostCents, marginType, marginValue, finalPriceCents]);

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
      if (material) setItems((current) => [...current, { id: newId(), itemType: "material", referenceId: material.id, name: material.name, description: "", quantity: 1, unit: material.unit, unitCostCents: material.unit_cost_cents, unitPriceCents: material.unit_cost_cents }]);
    }
    setCatalog("");
  }

  return (
    <form action={action}>
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
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <select className={`${input} mt-0 flex-1`} onChange={(e) => setCatalog(e.target.value)} value={catalog}>
                <option value="">Agregar desde el catálogo…</option>
                {services.map((service) => <option key={service.id} value={`service:${service.id}`}>Servicio · {service.name}</option>)}
                {materials.map((material) => <option key={material.id} value={`material:${material.id}`}>Material · {material.name}</option>)}
              </select>
              <button className="min-h-11 rounded-xl border border-violet-200 px-4 text-sm font-semibold text-violet-700 disabled:opacity-40" disabled={!catalog} onClick={addCatalogItem} type="button">Agregar</button>
              <button className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold" onClick={() => setItems((current) => [...current, emptyItem()])} type="button">+ Personalizado</button>
            </div>
            <div className="mt-5 space-y-4">
              {items.map((item, index) => (
                <article className="rounded-xl border border-slate-200 bg-slate-50 p-4" key={item.id}>
                  <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Concepto {index + 1}</p><button className="text-xs font-semibold text-rose-600" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} type="button">Quitar</button></div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                    <label className="text-xs font-medium text-slate-600 sm:col-span-2 lg:col-span-3">Nombre<input className={input} onChange={(e) => updateItem(item.id, { name: e.target.value })} required value={item.name} /></label>
                    <label className="text-xs font-medium text-slate-600">Cantidad<input className={input} min="0" onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })} step="0.001" type="number" value={item.quantity} /></label>
                    <label className="text-xs font-medium text-slate-600 lg:col-span-2">Unidad<input className={input} onChange={(e) => updateItem(item.id, { unit: e.target.value })} value={item.unit} /></label>
                    <label className="text-xs font-medium text-slate-600 lg:col-span-2">Costo unitario<input className={input} min="0" onChange={(e) => updateItem(item.id, { unitCostCents: toCents(e.target.value) })} step="0.01" type="number" value={centsToInput(item.unitCostCents)} /></label>
                    <label className="text-xs font-medium text-slate-600 lg:col-span-2">Precio unitario<input className={input} min="0" onChange={(e) => updateItem(item.id, { unitPriceCents: toCents(e.target.value) })} step="0.01" type="number" value={centsToInput(item.unitPriceCents)} /></label>
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
                  <input className={input} min="0" onChange={(e) => (setter as (value: number) => void)(toCents(e.target.value))} step="0.01" type="number" value={centsToInput(value as number)} />
                </label>
              ))}
            </div>
          </section>

          <section className={card}>
            <h2 className="text-lg font-semibold">5. Margen y precio final</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">Tipo de margen<select className={input} onChange={(e) => setMarginType(e.target.value as "percentage" | "fixed")} value={marginType}><option value="percentage">Porcentaje sobre costo (markup)</option><option value="fixed">Monto fijo</option></select></label>
              <label className="text-sm font-medium text-slate-700">{marginType === "percentage" ? "Porcentaje (%)" : `Margen fijo (${currency})`}<input className={input} min="0" onChange={(e) => setMarginValue(marginType === "percentage" ? Number(e.target.value) : toCents(e.target.value))} step="0.01" type="number" value={marginType === "percentage" ? marginValue : centsToInput(marginValue)} /></label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">Precio final manual <span className="font-normal text-slate-400">(opcional)</span><input className={input} min="0" onChange={(e) => setFinalPrice(e.target.value ? toCents(e.target.value) : null)} placeholder={centsToInput(calculation.recommendedPriceCents)} step="0.01" type="number" value={finalPriceCents === null ? "" : centsToInput(finalPriceCents)} /></label>
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

        <aside className="rounded-2xl bg-slate-950 p-5 text-white shadow-xl xl:sticky xl:top-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-300">Resumen en tiempo real</p>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-300">Servicios/materiales</dt><dd>{formatCurrency(calculation.itemsCostCents, currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-300">Mano de obra</dt><dd>{formatCurrency(calculation.laborCostCents, currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-300">Transporte</dt><dd>{formatCurrency(calculation.transportCostCents, currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-300">Otros</dt><dd>{formatCurrency(calculation.otherCostCents, currency)}</dd></div>
            <div className="flex justify-between border-t border-slate-700 pt-3 font-semibold"><dt>Costo total</dt><dd>{formatCurrency(calculation.totalCostCents, currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-300">Ganancia estimada</dt><dd className={calculation.hasLoss ? "text-rose-300" : "text-emerald-300"}>{formatCurrency(calculation.estimatedProfitCents, currency)}</dd></div>
          </dl>
          <div className="mt-5 rounded-xl bg-violet-500 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-violet-100">Precio recomendado</p><p className="mt-1 text-3xl font-semibold">{formatCurrency(calculation.recommendedPriceCents, currency)}</p>{finalPriceCents !== null ? <p className="mt-2 text-sm text-violet-100">Precio final: {formatCurrency(calculation.finalPriceCents, currency)}</p> : null}</div>
          <div className="mt-5"><SubmitButton pendingLabel="Guardando cotización…">{quoteId ? "Guardar cambios" : "Guardar cotización"}</SubmitButton></div>
        </aside>
      </div>
    </form>
  );
}
