export function toCents(value: string | number): number {
  const normalized = typeof value === "string" ? value.replace(",", ".").trim() : value;
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatCurrency(cents: number, currency = "USD", locale = "es-EC"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(fromCents(cents));
}

export function centsToInput(cents: number): string {
  return fromCents(cents).toFixed(2);
}
