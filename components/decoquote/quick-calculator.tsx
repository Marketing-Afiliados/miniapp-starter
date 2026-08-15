"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { calculateQuote } from "@/lib/decoquote/calculations";
import { formatCurrency, toCents, toDecimal } from "@/lib/decoquote/money";

const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-[#e8dfec] bg-white px-4 text-lg font-semibold text-[#403448] outline-none transition placeholder:font-normal placeholder:text-[#b0a5b6] focus:border-violet-400 focus:ring-4 focus:ring-violet-100";

function AmountInput({
  label,
  hint,
  currency,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  currency: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-[#514359]">{label}</span>
      <span className="mt-1 block text-xs leading-5 text-[#8b7d93]">{hint}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-4 top-1/2 z-10 mt-1 -translate-y-1/2 text-sm font-bold text-violet-600">{currency}</span>
        <input
          aria-label={label}
          className={`${inputClass} pl-16`}
          inputMode="decimal"
          onChange={(event) => onChange(event.target.value)}
          placeholder="0.00"
          type="text"
          value={value}
        />
      </span>
    </label>
  );
}

export function QuickCalculator({
  currency,
  defaultMargin,
}: {
  currency: string;
  defaultMargin: number;
}) {
  const [materials, setMaterials] = useState("");
  const [services, setServices] = useState("");
  const [labor, setLabor] = useState("");
  const [transport, setTransport] = useState("");
  const [other, setOther] = useState("");
  const [marginType, setMarginType] = useState<"percentage" | "fixed">("percentage");
  const [margin, setMargin] = useState(String(defaultMargin));
  const [finalPrice, setFinalPrice] = useState("");
  const [copiedPrice, setCopiedPrice] = useState<number | null>(null);

  const calculation = useMemo(
    () => calculateQuote({
      items: [
        { itemType: "material", quantity: 1, unitCostCents: toCents(materials), unitPriceCents: 0 },
        { itemType: "service", quantity: 1, unitCostCents: toCents(services), unitPriceCents: 0 },
      ],
      laborCostCents: toCents(labor),
      transportCostCents: toCents(transport),
      otherCostCents: toCents(other),
      marginType,
      marginValue: marginType === "percentage" ? toDecimal(margin) : toCents(margin),
      finalPriceCents: finalPrice.trim() ? toCents(finalPrice) : null,
    }),
    [finalPrice, labor, margin, marginType, materials, other, services, transport],
  );

  const profitRate = calculation.finalPriceCents > 0
    ? (calculation.estimatedProfitCents / calculation.finalPriceCents) * 100
    : 0;

  function reset() {
    setMaterials("");
    setServices("");
    setLabor("");
    setTransport("");
    setOther("");
    setMarginType("percentage");
    setMargin(String(defaultMargin));
    setFinalPrice("");
    setCopiedPrice(null);
  }

  async function copyRecommendedPrice() {
    try {
      await navigator.clipboard.writeText(formatCurrency(calculation.recommendedPriceCents, currency));
      setCopiedPrice(calculation.recommendedPriceCents);
    } catch {
      setCopiedPrice(null);
    }
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
      <section className="app-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-violet-100 bg-gradient-to-r from-violet-50/90 via-rose-50/60 to-amber-50/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <h2 className="text-lg font-bold text-[#403448]">Costos del evento</h2>
            <p className="mt-1 text-sm text-[#74667d]">Ingresa tus costos reales. Puedes usar punto o coma para los decimales.</p>
          </div>
          <button className="pastel-secondary self-start rounded-xl px-4 py-2 text-sm font-bold sm:self-auto" onClick={reset} type="button">Limpiar</button>
        </div>

        <div className="p-5 sm:p-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <AmountInput currency={currency} hint="Globos, flores, papelería, telas e insumos." label="Materiales" onChange={setMaterials} value={materials} />
            <AmountInput currency={currency} hint="Alquileres, impresiones o servicios externos." label="Servicios y alquileres" onChange={setServices} value={services} />
            <AmountInput currency={currency} hint="Tu tiempo y el de las personas que te ayudan." label="Mano de obra" onChange={setLabor} value={labor} />
            <AmountInput currency={currency} hint="Combustible, flete, peajes o mensajería." label="Transporte" onChange={setTransport} value={transport} />
            <div className="sm:col-span-2">
              <AmountInput currency={currency} hint="Imprevistos y cualquier gasto que no esté incluido arriba." label="Otros gastos" onChange={setOther} value={other} />
            </div>
          </div>

          <div className="my-7 h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent" />

          <div>
            <h2 className="text-lg font-bold text-[#403448]">Margen de ganancia</h2>
            <p className="mt-1 text-sm leading-6 text-[#74667d]">El porcentaje se calcula como markup sobre el costo total.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                aria-pressed={marginType === "percentage"}
                className={`rounded-2xl border p-4 text-left transition ${marginType === "percentage" ? "border-violet-300 bg-violet-50 shadow-sm" : "border-[#e8dfec] bg-white hover:border-violet-200"}`}
                onClick={() => {
                  setMarginType("percentage");
                  setMargin(String(defaultMargin));
                  setCopiedPrice(null);
                }}
                type="button"
              >
                <span className="block text-sm font-bold text-[#403448]">Porcentaje sobre costo</span>
                <span className="mt-1 block text-xs text-[#8b7d93]">Ejemplo: costo 300 + 40% = precio 420.</span>
              </button>
              <button
                aria-pressed={marginType === "fixed"}
                className={`rounded-2xl border p-4 text-left transition ${marginType === "fixed" ? "border-violet-300 bg-violet-50 shadow-sm" : "border-[#e8dfec] bg-white hover:border-violet-200"}`}
                onClick={() => {
                  setMarginType("fixed");
                  setMargin("");
                  setCopiedPrice(null);
                }}
                type="button"
              >
                <span className="block text-sm font-bold text-[#403448]">Ganancia fija</span>
                <span className="mt-1 block text-xs text-[#8b7d93]">Escribe el valor exacto que deseas ganar.</span>
              </button>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-bold text-[#514359]">{marginType === "percentage" ? "Porcentaje de markup" : "Ganancia fija"}</span>
              <span className="relative block max-w-md">
                <input
                  className={`${inputClass} ${marginType === "percentage" ? "pr-12" : "pl-16"}`}
                  inputMode="decimal"
                  onChange={(event) => {
                    setMargin(event.target.value);
                    setCopiedPrice(null);
                  }}
                  placeholder="0.00"
                  type="text"
                  value={margin}
                />
                <span className={`pointer-events-none absolute top-1/2 z-10 mt-1 -translate-y-1/2 text-sm font-bold text-violet-600 ${marginType === "percentage" ? "right-4" : "left-4"}`}>
                  {marginType === "percentage" ? "%" : currency}
                </span>
              </span>
            </label>
          </div>

          <div className="my-7 h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent" />

          <label className="block">
            <span className="text-sm font-bold text-[#514359]">Precio final que deseas cobrar <span className="font-medium text-[#9b8fa2]">(opcional)</span></span>
            <span className="mt-1 block text-xs leading-5 text-[#8b7d93]">Déjalo vacío para usar el precio recomendado o escribe otro valor para comprobar la ganancia real.</span>
            <span className="relative block max-w-md">
              <span className="pointer-events-none absolute left-4 top-1/2 z-10 mt-1 -translate-y-1/2 text-sm font-bold text-violet-600">{currency}</span>
              <input
                className={`${inputClass} pl-16`}
                inputMode="decimal"
                onChange={(event) => setFinalPrice(event.target.value)}
                placeholder="Opcional"
                type="text"
                value={finalPrice}
              />
            </span>
          </label>
        </div>
      </section>

      <aside className="deco-sheen relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#3f3150] via-[#4d3562] to-[#6d45a2] p-6 text-white shadow-2xl shadow-violet-200/50 xl:sticky xl:top-8">
        <span className="absolute -right-10 -top-10 size-28 rounded-full bg-rose-300/15" />
        <span className="absolute -bottom-12 -left-10 size-28 rounded-full bg-sky-300/10" />
        <p className="relative text-xs font-bold uppercase tracking-[0.18em] text-violet-200">Resultado inmediato</p>

        <dl className="relative mt-5 space-y-3 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-violet-100">Materiales</dt><dd className="font-semibold">{formatCurrency(toCents(materials), currency)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-violet-100">Servicios y alquileres</dt><dd className="font-semibold">{formatCurrency(toCents(services), currency)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-violet-100">Mano de obra</dt><dd className="font-semibold">{formatCurrency(calculation.laborCostCents, currency)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-violet-100">Transporte</dt><dd className="font-semibold">{formatCurrency(calculation.transportCostCents, currency)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-violet-100">Otros gastos</dt><dd className="font-semibold">{formatCurrency(calculation.otherCostCents, currency)}</dd></div>
          <div className="flex justify-between gap-4 border-t border-white/15 pt-3"><dt className="font-bold">Costo total</dt><dd className="font-bold">{formatCurrency(calculation.totalCostCents, currency)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-violet-100">Margen aplicado</dt><dd className="font-semibold">{formatCurrency(calculation.marginAmountCents, currency)}</dd></div>
        </dl>

        <div className="relative mt-5 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 p-5 shadow-lg shadow-violet-950/20">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-100">Precio recomendado</p>
          <p className="mt-2 text-4xl font-bold tracking-[-0.04em]">{formatCurrency(calculation.recommendedPriceCents, currency)}</p>
        </div>

        <div className={`relative mt-4 rounded-2xl border p-4 ${calculation.hasLoss ? "border-rose-300/30 bg-rose-400/15" : "border-emerald-200/20 bg-emerald-300/10"}`}>
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-xs text-violet-100">Ganancia estimada</p><p className={`mt-1 text-xl font-bold ${calculation.hasLoss ? "text-rose-200" : "text-emerald-200"}`}>{formatCurrency(calculation.estimatedProfitCents, currency)}</p></div>
            <p className={`text-sm font-bold ${calculation.hasLoss ? "text-rose-200" : "text-emerald-200"}`}>{profitRate.toFixed(1)}%</p>
          </div>
          {calculation.hasLoss ? <p className="mt-3 text-xs leading-5 text-rose-100">Este precio genera una pérdida de {formatCurrency(calculation.lossAmountCents, currency)}.</p> : null}
          {finalPrice.trim() ? <p className="mt-3 border-t border-white/10 pt-3 text-xs text-violet-100">Precio final evaluado: {formatCurrency(calculation.finalPriceCents, currency)}</p> : null}
        </div>

        <div className="relative mt-5 grid gap-3">
          <button className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-violet-700 transition hover:-translate-y-0.5" onClick={copyRecommendedPrice} type="button">
            {copiedPrice === calculation.recommendedPriceCents ? "Precio copiado ✓" : "Copiar precio recomendado"}
          </button>
          <Link className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-white/20" href="/dashboard/quotes/new">
            Crear cotización completa →
          </Link>
        </div>
        <p className="relative mt-4 text-center text-[11px] leading-5 text-violet-200">Este cálculo no se guarda y no consume el límite de tu plan.</p>
      </aside>
    </div>
  );
}
