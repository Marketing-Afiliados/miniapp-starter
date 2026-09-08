import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import HomePage from "../app/page";
afterEach(() => vi.unstubAllEnvs());
describe("single purchase landing", () => {
  it("publishes the confirmed lifetime offer without legacy sales links", () => {
    vi.stubEnv("HOTMART_ONE_TIME_ENABLED", "false");
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain("$12.99"); expect(html).toContain("Licencia de por vida");
    expect(html).toContain("Soporte gratis de por vida"); expect(html).toContain("Actualizaciones gratis de por vida");
    expect(html).not.toContain("$9.99"); expect(html).not.toContain("$19.99");
    expect(html).not.toContain("r5jsptik"); expect(html).not.toContain("lyyel4u7");
    expect(html).toContain("Compra disponible próximamente");
    expect(html).not.toContain("pay.hotmart.com");
  });
  it("links to the configured real checkout only after activation and terms", () => {
    vi.stubEnv("HOTMART_ONE_TIME_ENABLED", "true");
    vi.stubEnv("HOTMART_CHECKOUT_URL", "https://pay.hotmart.com/TEST-ONLY");
    vi.stubEnv("DECOQUOTE_TERMS_URL", "https://example.com/terms");
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain('href="https://pay.hotmart.com/TEST-ONLY"');
    expect(html).toContain('href="https://example.com/terms"');
  });
});
