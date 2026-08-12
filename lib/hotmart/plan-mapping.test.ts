import { describe, expect, it } from "vitest";

import type { Plan } from "@/types/database";
import { resolveHotmartPlan } from "./plan-mapping";

function plan(overrides: Partial<Plan>): Plan {
  return {
    id: "plan-id",
    name: "Plan",
    code: "plan",
    description: null,
    price: 0,
    currency: "USD",
    billing_interval: "monthly",
    limits: {},
    provider_product_id: "8284042",
    provider_offer_code: null,
    provider_plan_id: null,
    active: true,
    created_at: "2026-08-11T00:00:00Z",
    updated_at: "2026-08-11T00:00:00Z",
    ...overrides,
  };
}

describe("resolveHotmartPlan", () => {
  const emprende = plan({
    id: "emprende",
    code: "decoquote-emprende",
    provider_offer_code: "offer-emprende",
    provider_plan_id: "700",
  });
  const pro = plan({
    id: "pro",
    code: "decoquote-pro",
    provider_offer_code: "offer-pro",
    provider_plan_id: "701",
  });

  it("distingue dos planes del mismo producto por oferta", () => {
    expect(
      resolveHotmartPlan([emprende, pro], {
        productIds: ["8284042"],
        offerCode: "offer-emprende",
        subscriptionPlanId: "700",
      }),
    ).toEqual({ status: "matched", plan: emprende });
  });

  it("resuelve una cancelacion por subscription.plan.id", () => {
    expect(
      resolveHotmartPlan([emprende, pro], {
        productIds: ["8284042"],
        offerCode: null,
        subscriptionPlanId: "701",
      }),
    ).toEqual({ status: "matched", plan: pro });
  });

  it("rechaza un producto ambiguo si falta la oferta y el plan", () => {
    expect(
      resolveHotmartPlan([emprende, pro], {
        productIds: ["8284042"],
        offerCode: null,
        subscriptionPlanId: null,
      }),
    ).toEqual({ status: "ambiguous" });
  });

  it("rechaza identificadores contradictorios de dos planes", () => {
    expect(
      resolveHotmartPlan([emprende, pro], {
        productIds: ["8284042"],
        offerCode: "offer-emprende",
        subscriptionPlanId: "701",
      }),
    ).toEqual({ status: "ambiguous" });
  });
});
