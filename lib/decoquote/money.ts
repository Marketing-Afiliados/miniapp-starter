export function toCents(value: string | number): number {
  const normalized = typeof value === "string" ? value.replace(",", ".").trim() : value;
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

export function toDecimal(value: string | number): number {
  const normalized = typeof value === "string" ? value.replace(",", ".").trim() : value;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatCurrency(cents: number, currency = "USD", locale?: string): string {
  const currencyLocales: Record<string, string> = {
    USD: "es-EC",
    EUR: "es-ES",
    ARS: "es-AR",
    MXN: "es-MX",
    CLP: "es-CL",
    COP: "es-CO",
  };
  const resolvedLocale = locale ?? currencyLocales[currency] ?? "es-EC";
  return new Intl.NumberFormat(resolvedLocale, {
    style: "currency",
    currency,
  }).format(fromCents(cents));
}

export function centsToInput(cents: number): string {
  return fromCents(cents).toFixed(2);
}
