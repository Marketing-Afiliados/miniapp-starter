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
  const resolvedLocale = locale ?? (currency === "EUR" ? "es-ES" : "es-EC");
  return new Intl.NumberFormat(resolvedLocale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(fromCents(cents));
}

export function centsToInput(cents: number): string {
  return fromCents(cents).toFixed(2);
}
