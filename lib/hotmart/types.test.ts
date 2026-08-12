import { describe, expect, it } from "vitest";

import { normalizeHotmartEvent } from "./types";

describe("normalizeHotmartEvent", () => {
  it("extrae producto, oferta y plan de una compra recurrente", () => {
    const event = normalizeHotmartEvent({
      id: "event-purchase",
      creation_date: 1_786_406_400_000,
      event: "PURCHASE_APPROVED",
      data: {
        product: { id: 8284042, ucode: "product-ucode" },
        buyer: { email: "CLIENTE@EXAMPLE.COM" },
        purchase: {
          transaction: "HP123",
          offer: { code: "offer-pro" },
          order_date: "2026-08-11T00:00:00Z",
          date_next_charge: 1_789_084_800_000,
        },
        subscription: {
          subscriber: { code: "subscriber-1" },
          plan: { id: 701, name: "Pro" },
        },
      },
    });

    expect(event).toMatchObject({
      buyerEmail: "cliente@example.com",
      transactionId: "HP123",
      subscriptionId: "subscriber-1",
      productIds: ["product-ucode", "8284042"],
      offerCode: "offer-pro",
      subscriptionPlanId: "701",
      subscriptionStatus: "active",
    });
  });

  it("extrae el suscriptor y plan del payload de cancelacion", () => {
    const event = normalizeHotmartEvent({
      id: "event-cancel",
      creation_date: 1_786_406_400_000,
      event: "SUBSCRIPTION_CANCELLATION",
      data: {
        product: { id: 8284042 },
        subscriber: { code: "subscriber-1", email: "client@example.com" },
        subscription: { id: 9001, plan: { id: 701, name: "Pro" } },
        date_next_charge: 1_789_084_800_000,
      },
    });

    expect(event).toMatchObject({
      buyerEmail: "client@example.com",
      subscriptionId: "subscriber-1",
      productIds: ["8284042"],
      offerCode: null,
      subscriptionPlanId: "701",
      subscriptionStatus: "cancelled",
    });
  });

  it("identifica la oferta actual en un cambio de plan", () => {
    const event = normalizeHotmartEvent({
      id: "event-switch",
      creation_date: 1_786_406_400_000,
      event: "SWITCH_PLAN",
      data: {
        switch_plan_date: 1_786_406_400_000,
        subscription: {
          subscriber_code: "subscriber-1",
          status: "ACTIVE",
          product: { id: 8284042 },
          user: { email: "client@example.com" },
        },
        plans: [
          { id: 700, offer: { key: "offer-emprende" }, current: false },
          { id: 701, offer: { key: "offer-pro" }, current: true },
        ],
      },
    });

    expect(event).toMatchObject({
      subscriptionId: "subscriber-1",
      offerCode: "offer-pro",
      subscriptionPlanId: "701",
      subscriptionStatus: "active",
    });
  });
});
