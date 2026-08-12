import { describe, expect, it } from "vitest";
import { DECOQUOTE_CONFIG, getCurrencyOptionsForCountry } from "./constants";

describe("getCurrencyOptionsForCountry", () => {
  it.each([
    ["AR", ["USD", "EUR", "ARS"]],
    ["MX", ["USD", "EUR", "MXN"]],
    ["CL", ["USD", "EUR", "CLP"]],
    ["CO", ["USD", "EUR", "COP"]],
    ["EC", ["USD", "EUR"]],
    ["ES", ["USD", "EUR"]],
  ])("ofrece monedas estandar y local para %s", (country, expected) => {
    expect(getCurrencyOptionsForCountry(country).map((option) => option.code)).toEqual(expected);
  });
});

describe("planes DecoQuote", () => {
  it("conecta cada plan con su oferta de Hotmart", () => {
    expect(
      DECOQUOTE_CONFIG.plans.map(({ code, checkoutUrl }) => [code, checkoutUrl]),
    ).toEqual([
      [
        "decoquote-emprende",
        "https://pay.hotmart.com/A107093913L?off=r5jsptik",
      ],
      [
        "decoquote-pro",
        "https://pay.hotmart.com/A107093913L?off=lyyel4u7",
      ],
    ]);
  });
});
