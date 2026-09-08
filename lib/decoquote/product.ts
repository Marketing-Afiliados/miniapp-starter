/** Commercial terms explicitly confirmed by the product owner. */
export const DECOQUOTE_PRODUCT = {
  code: "decoquote-lifetime",
  name: "Magics DecoQuote",
  priceCents: 1299,
  currency: "USD",
  acquisition: "Pago único",
  license: "Licencia de por vida",
  support: "Soporte gratis de por vida",
  updates: "Actualizaciones gratis de por vida",
  features: "Todas las funcionalidades, sin cuotas de uso",
  checkoutUrl: "https://pay.hotmart.com/Y107492007M?off=ij6szo4g",
  termsVersion: "2026-09-07-lifetime",
} as const;

export function getCheckoutConfiguration(env: Record<string, string | undefined>) {
  let termsUrl: string | null = null;
  try {
    const terms = new URL(env.DECOQUOTE_TERMS_URL ?? "");
    if (terms.protocol === "https:" && !terms.username && !terms.password) termsUrl = terms.toString();
  } catch { /* Only render a terms link when a valid destination is configured. */ }
  try {
    const url = new URL(env.HOTMART_CHECKOUT_URL || DECOQUOTE_PRODUCT.checkoutUrl);
    const enabled = env.HOTMART_ONE_TIME_ENABLED !== "false" &&
      url.protocol === "https:" && url.hostname === "pay.hotmart.com" &&
      !url.username && !url.password;
    return { checkoutUrl: enabled ? url.toString() : null, termsUrl };
  } catch {
    return { checkoutUrl: null, termsUrl };
  }
}
