import type { QuoteItemType, QuoteStatus } from "@/types/database";

export const CURRENCY_OPTIONS = [
  { code: "USD", label: "USD — Dólar estadounidense" },
  { code: "EUR", label: "EUR — Euro" },
] as const;

export type SupportedCurrency = (typeof CURRENCY_OPTIONS)[number]["code"];

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
