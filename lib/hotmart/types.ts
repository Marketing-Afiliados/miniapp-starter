import type { Json, SubscriptionStatus } from "@/types/database";

export interface HotmartEvent {
  id: string;
  type: string;
  createdAt: string;
  buyerEmail: string | null;
  transactionId: string | null;
  subscriptionId: string | null;
  productIds: string[];
  offerCode: string | null;
  subscriptionPlanId: string | null;
  orderDate: string | null;
  nextChargeDate: string | null;
  subscriptionStatus: SubscriptionStatus | null;
}

function asRecord(value: Json | undefined): { [key: string]: Json | undefined } | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : null;
}

function asString(value: Json | undefined): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number") return String(value);
  return null;
}

function asIsoDate(value: Json | undefined): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const date = new Date(typeof value === "number" ? value : value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function currentSwitchPlan(value: Json | undefined) {
  if (!Array.isArray(value)) return null;
  for (const item of value) {
    const plan = asRecord(item);
    if (plan?.current === true) return plan;
  }
  return null;
}

function statusForEvent(type: string): SubscriptionStatus | null {
  const statuses: Record<string, SubscriptionStatus> = {
    PURCHASE_APPROVED: "active",
    PURCHASE_COMPLETE: "active",
    PURCHASE_DELAYED: "past_due",
    PURCHASE_CANCELED: "cancelled",
    SUBSCRIPTION_CANCELLATION: "cancelled",
    PURCHASE_EXPIRED: "expired",
    SUBSCRIPTION_EXPIRED: "expired",
    PURCHASE_REFUNDED: "refunded",
    PURCHASE_CHARGEBACK: "refunded",
    SWITCH_PLAN: "active",
  };
  return statuses[type] ?? null;
}

export function normalizeHotmartEvent(payload: Json): HotmartEvent | null {
  const root = asRecord(payload);
  if (!root) return null;

  const id = asString(root.id);
  const type = asString(root.event)?.toUpperCase();
  if (!id || !type) return null;

  const data = asRecord(root.data);
  const buyer = asRecord(data?.buyer);
  const purchase = asRecord(data?.purchase);
  const subscription = asRecord(data?.subscription);
  const nestedSubscriber = asRecord(subscription?.subscriber);
  const rootSubscriber = asRecord(data?.subscriber);
  const subscriptionUser = asRecord(subscription?.user);
  const purchaseOffer = asRecord(purchase?.offer);
  const subscriptionPlan = asRecord(subscription?.plan);
  const billingPlan = asRecord(data?.plan);
  const currentPlan = currentSwitchPlan(data?.plans);
  const currentPlanOffer = asRecord(currentPlan?.offer);
  const subscriptionProduct = asRecord(subscription?.product);
  const product = asRecord(data?.product) ?? subscriptionProduct;
  const productIds = [asString(product?.ucode), asString(product?.id)].filter(
    (value): value is string => Boolean(value),
  );

  return {
    id,
    type,
    createdAt: asIsoDate(root.creation_date) ?? new Date().toISOString(),
    buyerEmail:
      asString(buyer?.email)?.toLowerCase() ??
      asString(rootSubscriber?.email)?.toLowerCase() ??
      asString(subscriptionUser?.email)?.toLowerCase() ??
      null,
    transactionId: asString(purchase?.transaction),
    subscriptionId:
      asString(nestedSubscriber?.code) ??
      asString(rootSubscriber?.code) ??
      asString(subscription?.subscriber_code),
    productIds: [...new Set(productIds)],
    offerCode:
      asString(purchaseOffer?.code) ??
      asString(currentPlanOffer?.key) ??
      asString(asRecord(billingPlan?.offer)?.code),
    subscriptionPlanId:
      asString(subscriptionPlan?.id) ??
      asString(currentPlan?.id) ??
      asString(billingPlan?.id),
    orderDate: asIsoDate(purchase?.order_date) ?? asIsoDate(data?.switch_plan_date),
    nextChargeDate:
      asIsoDate(purchase?.date_next_charge) ??
      asIsoDate(data?.date_next_charge) ??
      asIsoDate(subscription?.date_next_charge),
    subscriptionStatus: statusForEvent(type),
  };
}

export function isJson(value: unknown): value is Json {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return true;
  if (Array.isArray(value)) return value.every(isJson);
  if (typeof value !== "object") return false;
  return Object.values(value).every(isJson);
}
