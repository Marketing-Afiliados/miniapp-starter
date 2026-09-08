import { describe, expect, it } from "vitest";
import { parseOneTimeEvent } from "./one-time";
import { validHotmartToken, readWebhookBody } from "./request";
import { getCheckoutConfiguration, DECOQUOTE_PRODUCT } from "../decoquote/product";

export function fixture(event = "PURCHASE_APPROVED", status = "APPROVED") {
  return { id: "event-1", event, version: "2.0.0", creation_date: 1788753600000,
    data: { product: { id: 123, ucode: "product-real-fixture" }, buyer: { email: "Buyer@example.com" },
      purchase: { transaction: "TEST-TRANSACTION", offer: { code: "offer-fixture" }, status, approved_date: 1788753500000, price: { value: 12.99, currency_value: "USD" } } } };
}
describe("one-time Hotmart contract", () => {
  it.each([["PURCHASE_APPROVED","APPROVED","approved"],["PURCHASE_COMPLETE","COMPLETE","approved"],["PURCHASE_BILLET_PRINTED","PRINTED_BILLET","pending"],["PURCHASE_DELAYED","OVERDUE","pending"],["PURCHASE_CANCELED","CANCELLED","cancelled"],["PURCHASE_EXPIRED","EXPIRED","cancelled"],["PURCHASE_REFUNDED","REFUNDED","refunded"],["PURCHASE_CHARGEBACK","CHARGEBACK","chargeback"],["PURCHASE_PROTEST","DISPUTE","review"]])("normalizes %s", (event,status,expected) => {
    expect(parseOneTimeEvent(fixture(event,status))?.status).toBe(expected);
  });
  it("requires coherent status, version, event id, approval timestamp and provider identifiers", () => {
    const p = fixture();
    expect(parseOneTimeEvent({ ...p, version: "1.0.0" })).toBeNull();
    expect(parseOneTimeEvent({ ...p, id: "" })).toBeNull();
    expect(parseOneTimeEvent(fixture("PURCHASE_APPROVED","WAITING_PAYMENT"))).toBeNull();
    expect(parseOneTimeEvent({ ...p, data: { ...p.data, purchase: { ...p.data.purchase, approved_date: undefined } } })).toBeNull();
    expect(parseOneTimeEvent({ ...p, data: { ...p.data, product: {} } })).toBeNull();
    expect(parseOneTimeEvent({ ...p, data: { ...p.data, subscription: { id: 1 } } })).toBeNull();
  });
  it("normalizes verified-provider email and minimizes stored PII", () => {
    expect(parseOneTimeEvent(fixture())?.buyer_email).toBe("buyer@example.com");
    expect(parseOneTimeEvent({ ...fixture(), sensitive: "not stored" })).not.toHaveProperty("sensitive");
  });
  it("requires exact Hottok, including missing and unequal-length tokens", () => {
    expect(validHotmartToken(null,"secret")).toBe(false);
    expect(validHotmartToken("secret",undefined)).toBe(false);
    expect(validHotmartToken("wrong-longer","secret")).toBe(false);
    expect(validHotmartToken("secret","secret")).toBe(true);
  });
  it("limits the actual request stream without Content-Length", async () => {
    await expect(readWebhookBody(new Request("https://local.test", { method: "POST", body: "x".repeat(50) }), 10)).rejects.toBeInstanceOf(RangeError);
    await expect(readWebhookBody(new Request("https://local.test", { method: "POST", body: "invalid" }))).rejects.toBeInstanceOf(SyntaxError);
  });
});
describe("lifetime offer", () => {
  it("has one price and the owner-authorized checkout with an explicit off switch", () => {
    expect(DECOQUOTE_PRODUCT.priceCents).toBe(1299);
    expect(getCheckoutConfiguration({}).checkoutUrl).toBe(DECOQUOTE_PRODUCT.checkoutUrl);
    expect(getCheckoutConfiguration({ HOTMART_ONE_TIME_ENABLED: "false" }).checkoutUrl).toBeNull();
    expect(getCheckoutConfiguration({ HOTMART_ONE_TIME_ENABLED: "true", HOTMART_CHECKOUT_URL: "https://example.com", DECOQUOTE_TERMS_URL: "https://example.com/terms" }).checkoutUrl).toBeNull();
    expect(getCheckoutConfiguration({ HOTMART_ONE_TIME_ENABLED: "true", HOTMART_CHECKOUT_URL: "https://pay.hotmart.com/TEST", DECOQUOTE_TERMS_URL: "https://example.com/terms" }).checkoutUrl).toBe("https://pay.hotmart.com/TEST");
  });
});
