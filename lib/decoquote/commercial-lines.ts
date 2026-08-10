import type { Quote, QuoteItem } from "@/types/database";

export type CommercialLineKind =
  | "item"
  | "labor"
  | "transport"
  | "other"
  | "coordination";

export interface CommercialProposalLine {
  id: string;
  kind: CommercialLineKind;
  name: string;
  description: string;
  quantityLabel: string;
  amountCents: number;
}

type CommercialQuote = Pick<
  Quote,
  "final_price_cents" | "labor_cost_cents" | "transport_cost_cents" | "other_cost_cents"
>;

type CommercialItem = Pick<
  QuoteItem,
  "id" | "name" | "description" | "quantity" | "unit" | "total_price_cents"
>;

function safeCents(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function allocateCents(totalCents: number, weights: number[]): number[] {
  const total = safeCents(totalCents);
  if (!weights.length) return [];
  const normalized = weights.map(safeCents);
  const weightTotal = normalized.reduce((sum, weight) => sum + weight, 0);
  const effectiveWeights = weightTotal > 0 ? normalized : normalized.map(() => 1);
  const effectiveTotal = effectiveWeights.reduce((sum, weight) => sum + weight, 0);
  const exact = effectiveWeights.map((weight) => (total * weight) / effectiveTotal);
  const allocation = exact.map(Math.floor);
  const remainder = total - allocation.reduce((sum, amount) => sum + amount, 0);
  const priority = exact
    .map((amount, index) => ({ index, fraction: amount - Math.floor(amount) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (let index = 0; index < remainder; index += 1) {
    allocation[priority[index % priority.length].index] += 1;
  }
  return allocation;
}

function quantityLabel(quantity: number, unit: string) {
  const plurals: Record<string, string> = {
    unidad: "unidades",
    servicio: "servicios",
    paquete: "paquetes",
    metro: "metros",
    rollo: "rollos",
    hoja: "hojas",
    litro: "litros",
    caja: "cajas",
  };
  const normalizedUnit = quantity === 1 ? unit : (plurals[unit.toLowerCase()] ?? unit);
  return `${quantity} ${normalizedUnit}`.trim();
}

function itemLine(item: CommercialItem, amountCents: number): CommercialProposalLine {
  return {
    id: item.id,
    kind: "item",
    name: item.name,
    description: item.description ?? "",
    quantityLabel: quantityLabel(item.quantity, item.unit),
    amountCents,
  };
}

/**
 * Builds the customer-facing commercial breakdown.
 *
 * Internal costs and markup are never exposed. Existing item sale prices are
 * preserved whenever the final price covers them. Any remaining commercial
 * value is assigned to real customer-facing work (coordination, logistics and
 * additional services) in proportion to its internal cost. When a manually
 * reduced final price is below the item subtotal, visible item amounts are
 * proportionally reconciled so their sum still equals the final price.
 */
export function buildCommercialProposalLines(
  quote: CommercialQuote,
  items: CommercialItem[],
): CommercialProposalLine[] {
  const finalPriceCents = safeCents(quote.final_price_cents);
  const itemAmounts = items.map((item) => safeCents(item.total_price_cents));
  const itemSubtotal = itemAmounts.reduce((sum, amount) => sum + amount, 0);

  if (finalPriceCents < itemSubtotal) {
    const reconciled = allocateCents(finalPriceCents, itemAmounts);
    return items.map((item, index) => itemLine(item, reconciled[index]));
  }

  const lines = items.map((item, index) => itemLine(item, itemAmounts[index]));
  const remainingCents = finalPriceCents - itemSubtotal;
  if (remainingCents === 0) return lines;

  const additional = [
    {
      id: "commercial-labor",
      kind: "labor" as const,
      name: "Montaje y coordinación",
      description: "Preparación, montaje y coordinación operativa del evento.",
      weight: quote.labor_cost_cents,
    },
    {
      id: "commercial-transport",
      kind: "transport" as const,
      name: "Logística y transporte",
      description: "Traslado y logística necesarios para realizar el montaje.",
      weight: quote.transport_cost_cents,
    },
    {
      id: "commercial-other",
      kind: "other" as const,
      name: "Servicios adicionales",
      description: "Producción y requerimientos complementarios de la propuesta.",
      weight: quote.other_cost_cents,
    },
  ].filter((line) => safeCents(line.weight) > 0);

  if (!additional.length) {
    return [
      ...lines,
      {
        id: "commercial-coordination",
        kind: "coordination",
        name: "Diseño, producción y coordinación",
        description: "Servicio integral para desarrollar y ejecutar la propuesta.",
        quantityLabel: "1 servicio",
        amountCents: remainingCents,
      },
    ];
  }

  const allocated = allocateCents(remainingCents, additional.map((line) => line.weight));
  return [
    ...lines,
    ...additional.map((line, index) => ({
      id: line.id,
      kind: line.kind,
      name: line.name,
      description: line.description,
      quantityLabel: "1 servicio",
      amountCents: allocated[index],
    })),
  ];
}
