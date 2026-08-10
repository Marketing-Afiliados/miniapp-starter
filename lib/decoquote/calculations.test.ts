import { describe, expect, it } from "vitest";
import { calculateQuote } from "./calculations";

const base = { items: [], laborCostCents: 0, transportCostCents: 0, otherCostCents: 0 };

describe("calculateQuote", () => {
  it("aplica 40% como markup sobre 30000 centavos", () => {
    const result = calculateQuote({ ...base, laborCostCents: 30000, marginType: "percentage", marginValue: 40 });
    expect(result.marginAmountCents).toBe(12000);
    expect(result.recommendedPriceCents).toBe(42000);
    expect(result.estimatedProfitCents).toBe(12000);
  });
  it("aplica un margen fijo de 10000 centavos", () => {
    const result = calculateQuote({ ...base, laborCostCents: 30000, marginType: "fixed", marginValue: 10000 });
    expect(result.marginAmountCents).toBe(10000);
    expect(result.recommendedPriceCents).toBe(40000);
  });
  it("indica pérdida cuando el precio final es menor que el costo", () => {
    const result = calculateQuote({ ...base, laborCostCents: 30000, marginType: "percentage", marginValue: 40, finalPriceCents: 25000 });
    expect(result.estimatedProfitCents).toBe(-5000);
    expect(result.hasLoss).toBe(true);
    expect(result.lossAmountCents).toBe(5000);
  });
  it("multiplica cantidad por costo y precio unitarios", () => {
    const result = calculateQuote({ ...base, items: [{ itemType: "material", quantity: 180, unitCostCents: 20, unitPriceCents: 40 }], marginType: "percentage", marginValue: 0 });
    expect(result.itemsCostCents).toBe(3600);
    expect(result.itemsPriceCents).toBe(7200);
    expect(result.totalCostCents).toBe(3600);
  });
});
