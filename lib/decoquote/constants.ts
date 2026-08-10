import type { QuoteItemType, QuoteStatus } from "@/types/database";

export const SUPPORTED_CURRENCY_CODES = ["USD", "EUR", "ARS", "MXN", "CLP", "COP"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCY_CODES)[number];

export const CURRENCY_OPTIONS: ReadonlyArray<{ code: SupportedCurrency; label: string }> = [
  { code: "USD", label: "USD — Dólar estadounidense" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "ARS", label: "ARS — Peso argentino" },
  { code: "MXN", label: "MXN — Peso mexicano" },
  { code: "CLP", label: "CLP — Peso chileno" },
  { code: "COP", label: "COP — Peso colombiano" },
];

export const SUPPORTED_COUNTRY_CODES = ["AR", "CL", "CO", "EC", "ES", "MX", "US", "OTHER"] as const;
export type SupportedCountry = (typeof SUPPORTED_COUNTRY_CODES)[number];

export const COUNTRY_OPTIONS: ReadonlyArray<{
  code: SupportedCountry;
  label: string;
  localCurrency: SupportedCurrency | null;
}> = [
  { code: "AR", label: "Argentina", localCurrency: "ARS" },
  { code: "CL", label: "Chile", localCurrency: "CLP" },
  { code: "CO", label: "Colombia", localCurrency: "COP" },
  { code: "EC", label: "Ecuador", localCurrency: "USD" },
  { code: "ES", label: "España", localCurrency: "EUR" },
  { code: "US", label: "Estados Unidos", localCurrency: "USD" },
  { code: "MX", label: "México", localCurrency: "MXN" },
  { code: "OTHER", label: "Otro país", localCurrency: null },
];

export function getCurrencyOptionsForCountry(countryCode: string) {
  const country = COUNTRY_OPTIONS.find((option) => option.code === countryCode);
  const allowed = new Set<SupportedCurrency>(["USD", "EUR"]);
  if (country?.localCurrency) allowed.add(country.localCurrency);
  return CURRENCY_OPTIONS.filter((option) => allowed.has(option.code));
}

export const DECOQUOTE_CONFIG = {
  name: "DecoQuote",
  fullName: "Magics DecoQuote",
  tagline: "Cotiza tus decoraciones con confianza y conoce cuánto realmente ganas.",
  currency: "USD",
  plan: {
    code: "decoquote-pro",
    name: "DecoQuote Pro",
    price: 9.99,
    billingInterval: "mes",
  },
  limits: {
    quotes_per_month: 50,
    pdf_generations_per_month: 50,
    customers: -1,
  },
} as const;

export const QUOTE_STATUS: Record<Uppercase<QuoteStatus>, QuoteStatus> = {
  DRAFT: "draft",
  SENT: "sent",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXPIRED: "expired",
  COMPLETED: "completed",
};

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Borrador",
  sent: "Enviada",
  approved: "Aprobada",
  rejected: "Rechazada",
  expired: "Vencida",
  completed: "Completada",
};

export const ITEM_TYPE_LABEL: Record<QuoteItemType, string> = {
  service: "Servicio",
  material: "Material",
  custom: "Personalizado",
};

export const MATERIAL_UNITS = [
  "unidad",
  "paquete",
  "metro",
  "rollo",
  "hoja",
  "litro",
  "caja",
] as const;
