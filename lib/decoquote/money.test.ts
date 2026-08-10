import { describe, expect, it } from "vitest";
import { formatCurrency } from "./money";

describe("formatCurrency", () => {
  it("formatea dólares estadounidenses", () => {
    expect(formatCurrency(1050, "USD")).toContain("$");
  });

  it("formatea euros", () => {
    expect(formatCurrency(1050, "EUR")).toContain("€");
  });
});
