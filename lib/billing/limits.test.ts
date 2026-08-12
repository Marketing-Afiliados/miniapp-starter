import { describe, expect, it } from "vitest";

import { getFeaturePlanLimit, resolvePlanLimit } from "./limits";

describe("resolvePlanLimit", () => {
  it("interpreta -1 como uso ilimitado", () => {
    expect(resolvePlanLimit(-1)).toEqual({ kind: "unlimited", limit: null });
  });

  it("interpreta cero y false como funcion deshabilitada", () => {
    expect(resolvePlanLimit(0)).toEqual({ kind: "disabled", limit: 0 });
    expect(resolvePlanLimit(false)).toEqual({ kind: "disabled", limit: 0 });
  });

  it("acepta limites enteros positivos", () => {
    expect(resolvePlanLimit(50)).toEqual({ kind: "limited", limit: 50 });
  });

  it("resuelve las claves mensuales de un plan", () => {
    expect(getFeaturePlanLimit({ quotes_per_month: 50 }, "quotes")).toEqual({
      kind: "limited",
      limit: 50,
    });
    expect(getFeaturePlanLimit({ pdf_generations_per_month: -1 }, "pdf_generations")).toEqual({
      kind: "unlimited",
      limit: null,
    });
  });
});
