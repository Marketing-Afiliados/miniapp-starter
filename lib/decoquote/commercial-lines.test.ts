import { describe, expect, it } from "vitest";
import { buildCommercialProposalLines } from "./commercial-lines";

const quote = {
  final_price_cents: 27580,
  labor_cost_cents: 5000,
  transport_cost_cents: 2000,
  other_cost_cents: 1000,
};

const items = [
  { id: "1", name: "Arco orgánico", description: "Arco de globos", quantity: 2, unit: "unidad", total_price_cents: 10000 },
  { id: "2", name: "Pared de globos", description: "Pared de gibis", quantity: 1, unit: "unidad", total_price_cents: 3500 },
];

describe("buildCommercialProposalLines", () => {
  it("conserva precios comerciales y explica el resto con rubros visibles", () => {
    const lines = buildCommercialProposalLines(quote, items);
    expect(lines.map((line) => line.amountCents)).toEqual([10000, 3500, 8800, 3520, 1760]);
    expect(lines.reduce((total, line) => total + line.amountCents, 0)).toBe(27580);
    expect(lines.map((line) => line.name)).toContain("Logística y transporte");
  });

  it("crea una línea de coordinación cuando no existen rubros adicionales", () => {
    const lines = buildCommercialProposalLines(
      { ...quote, labor_cost_cents: 0, transport_cost_cents: 0, other_cost_cents: 0 },
      items,
    );
    expect(lines.at(-1)?.name).toBe("Diseño, producción y coordinación");
    expect(lines.reduce((total, line) => total + line.amountCents, 0)).toBe(27580);
  });

  it("reconcilia proporcionalmente un precio final menor al subtotal", () => {
    const lines = buildCommercialProposalLines({ ...quote, final_price_cents: 10000 }, items);
    expect(lines.reduce((total, line) => total + line.amountCents, 0)).toBe(10000);
    expect(lines).toHaveLength(2);
  });

  it("mantiene la igualdad exacta aun con residuos de redondeo", () => {
    const lines = buildCommercialProposalLines(
      { final_price_cents: 10001, labor_cost_cents: 1, transport_cost_cents: 1, other_cost_cents: 1 },
      [{ ...items[0], total_price_cents: 1000 }],
    );
    expect(lines.reduce((total, line) => total + line.amountCents, 0)).toBe(10001);
  });
});
