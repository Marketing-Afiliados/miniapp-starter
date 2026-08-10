import { describe, expect, it } from "vitest";
import { formatCurrency, toCents, toDecimal } from "./money";

describe("formatCurrency", () => {
  it("formatea dólares estadounidenses", () => {
    expect(formatCurrency(1050, "USD")).toContain("$");
  });

  it("formatea euros", () => {
    expect(formatCurrency(1050, "EUR")).toContain("€");
  });

  it("acepta coma decimal sin almacenar dinero como float", () => {
    expect(toCents("10,55")).toBe(1055);
    expect(toDecimal("1,5")).toBe(1.5);
  });
});
