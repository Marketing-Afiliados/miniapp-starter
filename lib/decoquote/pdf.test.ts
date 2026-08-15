import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fitImageWithin, generateQuotePdf } from "./pdf";
import type { BusinessProfile, Customer, Quote, QuoteItem } from "@/types/database";

describe("generateQuotePdf", () => {
  it("ajusta logos horizontales sin deformar su proporcion", () => {
    const fit = fitImageWithin(1200, 300, 108, 48);
    expect(fit.width).toBe(108);
    expect(fit.height).toBe(27);
    expect(fit.xOffset).toBe(0);
    expect(fit.yOffset).toBe(10.5);
  });

  it("ajusta logos verticales sin deformar su proporcion", () => {
    const fit = fitImageWithin(300, 900, 108, 48);
    expect(fit.width).toBe(16);
    expect(fit.height).toBe(48);
    expect(fit.xOffset).toBe(46);
    expect(fit.yOffset).toBe(0);
  });

  it("genera un PDF comercial válido sin etiquetas privadas", async () => {
    const now = new Date().toISOString();
    const business = { id: "b", user_id: "u", business_name: "Magics Eventos", owner_name: "Andrea López", email: "hola@example.com", phone: null, whatsapp: "+593999999999", instagram: "@magics", logo_url: null, address: "Quito", country_code: "EC", currency: "USD", default_margin_percentage: 40, default_terms: null, created_at: now, updated_at: now } as BusinessProfile;
    const customer = { id: "c", user_id: "u", full_name: "María González", email: "maria@example.com", phone: null, whatsapp: null, notes: null, deleted_at: null, created_at: now, updated_at: now } as Customer;
    const quote = { id: "q", user_id: "u", customer_id: "c", quote_number: "DQ-2026-000001", quote_sequence: 1, event_name: "Cumpleaños Isabella", event_type: "Cumpleaños", event_date: "2026-09-10", event_location: "Salón Jardín", valid_until: "2026-08-25", status: "draft", currency: "USD", items_cost_cents: 18500, items_price_cents: 34500, labor_cost_cents: 5000, transport_cost_cents: 2000, other_cost_cents: 1000, total_cost_cents: 26500, margin_type: "percentage", margin_percentage: 40, fixed_margin_cents: null, margin_amount_cents: 10600, recommended_price_cents: 37100, final_price_cents: 37100, estimated_profit_cents: 10600, notes: "Costo interno privado", terms: "Reserva con 50% de anticipo.", created_at: now, updated_at: now } as Quote;
    const items = [
      { id: "i1", quote_id: "q", user_id: "u", item_type: "service", reference_id: null, name: "Arco orgánico", description: "Paleta lavanda y crema", quantity: 1, unit: "servicio", unit_cost_cents: 8500, unit_price_cents: 13000, total_cost_cents: 8500, total_price_cents: 13000, sort_order: 0, created_at: now, updated_at: now },
      { id: "i2", quote_id: "q", user_id: "u", item_type: "custom", reference_id: null, name: "Panel personalizado", description: "Diseño temático", quantity: 2, unit: "unidad", unit_cost_cents: 3500, unit_price_cents: 6000, total_cost_cents: 7000, total_price_cents: 12000, sort_order: 1, created_at: now, updated_at: now },
    ] as QuoteItem[];
    const bytes = await generateQuotePdf({ business, customer, quote, items });
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    expect(bytes.byteLength).toBeGreaterThan(1000);
    if (process.env.DECOQUOTE_PDF_PREVIEW_PATH) writeFileSync(process.env.DECOQUOTE_PDF_PREVIEW_PATH, bytes);
  });
});
