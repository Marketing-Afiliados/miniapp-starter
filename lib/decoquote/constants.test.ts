import { describe, expect, it } from "vitest";
import { getCurrencyOptionsForCountry } from "./constants";

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
