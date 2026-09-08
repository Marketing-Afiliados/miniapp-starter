import { z } from "zod";

const events = ["PURCHASE_APPROVED", "PURCHASE_COMPLETE", "PURCHASE_BILLET_PRINTED", "PURCHASE_DELAYED", "PURCHASE_CANCELED", "PURCHASE_EXPIRED", "PURCHASE_REFUNDED", "PURCHASE_CHARGEBACK", "PURCHASE_PROTEST"] as const;
const timestamp = z.number().int().positive().max(8640000000000000);
const identifier = z.union([z.string().trim().min(1).max(200), z.number().int().positive()]).transform(String);
const schema = z.object({
  id: z.string().trim().min(1).max(200),
  event: z.enum(events),
  version: z.literal("2.0.0"),
  creation_date: timestamp,
  data: z.object({
    product: z.object({ id: identifier.optional(), ucode: identifier.optional() }),
    buyer: z.object({ email: z.email().max(320).transform(s => s.toLowerCase()) }),
    purchase: z.object({
      transaction: z.string().trim().min(1).max(200),
      offer: z.object({ code: z.string().trim().min(1).max(200) }),
      status: z.string(),
      approved_date: timestamp.optional(),
      price: z.object({ value: z.number().finite().nonnegative(), currency_value: z.string().regex(/^[A-Z]{3}$/) }),
      date_next_charge: z.unknown().optional(),
    }),
    subscription: z.unknown().optional(),
  }),
});
const expectedStatus: Record<(typeof events)[number], string> = {
  PURCHASE_APPROVED: "APPROVED", PURCHASE_COMPLETE: "COMPLETE",
  PURCHASE_BILLET_PRINTED: "PRINTED_BILLET", PURCHASE_DELAYED: "OVERDUE",
  PURCHASE_CANCELED: "CANCELLED", PURCHASE_EXPIRED: "EXPIRED",
  PURCHASE_REFUNDED: "REFUNDED", PURCHASE_CHARGEBACK: "CHARGEBACK",
  PURCHASE_PROTEST: "DISPUTE",
};

/** Only documented purchase v2 fields; no frontend payment assertions. */
export function parseOneTimeEvent(payload: unknown) {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return null;
  const { id, event, creation_date, data } = parsed.data;
  const purchase = data.purchase;
  if (purchase.status !== expectedStatus[event] || data.subscription != null || purchase.date_next_charge != null) return null;
  const productIds = [data.product.ucode, data.product.id].filter((v): v is string => !!v);
  if (!productIds.length) return null;
  const approved = event === "PURCHASE_APPROVED" || event === "PURCHASE_COMPLETE";
  if (approved && !purchase.approved_date) return null;
  return {
    id, type: event, occurred_at: new Date(creation_date).toISOString(),
    product_ids: productIds, offer_code: purchase.offer.code,
    transaction: purchase.transaction, buyer_email: data.buyer.email,
    status: approved ? "approved" : event === "PURCHASE_REFUNDED" ? "refunded" : event === "PURCHASE_CHARGEBACK" ? "chargeback" : event === "PURCHASE_PROTEST" ? "review" : event === "PURCHASE_CANCELED" || event === "PURCHASE_EXPIRED" ? "cancelled" : "pending",
    approved_at: purchase.approved_date ? new Date(purchase.approved_date).toISOString() : null,
    amount: purchase.price.value, currency: purchase.price.currency_value,
  };
}
export type OneTimeEvent = NonNullable<ReturnType<typeof parseOneTimeEvent>>;
