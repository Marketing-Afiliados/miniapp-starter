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
  termsVersion: "2026-09-07-lifetime",
} as const;

export function getCheckoutConfiguration(env: Record<string, string | undefined>) {
  let termsUrl: string | null = null;
  try {
    const terms = new URL(env.DECOQUOTE_TERMS_URL ?? "");
    if (terms.protocol === "https:" && !terms.username && !terms.password) termsUrl = terms.toString();
  } catch { /* Unconfigured commercial terms: keep checkout closed. */ }
  try {
    const url = new URL(env.HOTMART_CHECKOUT_URL ?? "");
    const enabled = env.HOTMART_ONE_TIME_ENABLED === "true" && termsUrl !== null &&
      url.protocol === "https:" && url.hostname === "pay.hotmart.com" &&
      !url.username && !url.password;
    return { checkoutUrl: enabled ? url.toString() : null, termsUrl };
  } catch {
    return { checkoutUrl: null, termsUrl };
  }
}
