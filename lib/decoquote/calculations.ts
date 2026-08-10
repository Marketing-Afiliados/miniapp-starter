import type { MarginType, QuoteItemType } from "@/types/database";

export interface QuoteCalculationItem {
  itemType: QuoteItemType;
  quantity: number;
  unitCostCents: number;
  unitPriceCents: number;
}

export interface QuoteCalculationInput {
  items: QuoteCalculationItem[];
  laborCostCents: number;
  transportCostCents: number;
  otherCostCents: number;
  marginType: MarginType;
  marginValue: number;
  finalPriceCents?: number | null;
}

export interface QuoteCalculation {
  itemsCostCents: number;
  itemsPriceCents: number;
  laborCostCents: number;
  transportCostCents: number;
  otherCostCents: number;
  totalCostCents: number;
  marginAmountCents: number;
  recommendedPriceCents: number;
  finalPriceCents: number;
  estimatedProfitCents: number;
  hasLoss: boolean;
  lossAmountCents: number;
}

function safeNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}

function lineTotal(quantity: number, cents: number): number {
  return Math.round(safeNonNegative(quantity) * safeNonNegative(cents));
}

/**
 * Percentage margins are MARKUP over total cost, not gross margin over sale price.
 * Example: 30000 cents at 40% produces 12000 cents of markup and a 42000 price.
 */
export function calculateQuote(input: QuoteCalculationInput): QuoteCalculation {
  const itemsCostCents = input.items.reduce(
    (total, item) => total + lineTotal(item.quantity, item.unitCostCents),
    0,
  );
  const itemsPriceCents = input.items.reduce(
    (total, item) => total + lineTotal(item.quantity, item.unitPriceCents),
    0,
  );
  const laborCostCents = Math.round(safeNonNegative(input.laborCostCents));
  const transportCostCents = Math.round(safeNonNegative(input.transportCostCents));
  const otherCostCents = Math.round(safeNonNegative(input.otherCostCents));
  const totalCostCents = itemsCostCents + laborCostCents + transportCostCents + otherCostCents;
  const marginValue = safeNonNegative(input.marginValue);
  const marginAmountCents =
    input.marginType === "percentage"
      ? Math.round(totalCostCents * (marginValue / 100))
      : Math.round(marginValue);
  const recommendedPriceCents = totalCostCents + marginAmountCents;
  const finalPriceCents =
    input.finalPriceCents === null || input.finalPriceCents === undefined
      ? recommendedPriceCents
      : Math.round(safeNonNegative(input.finalPriceCents));
  const estimatedProfitCents = finalPriceCents - totalCostCents;

  return {
    itemsCostCents,
    itemsPriceCents,
    laborCostCents,
    transportCostCents,
    otherCostCents,
    totalCostCents,
    marginAmountCents,
    recommendedPriceCents,
    finalPriceCents,
    estimatedProfitCents,
    hasLoss: estimatedProfitCents < 0,
    lossAmountCents: Math.max(-estimatedProfitCents, 0),
  };
}
