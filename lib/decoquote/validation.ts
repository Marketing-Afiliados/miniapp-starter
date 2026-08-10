import { z } from "zod";
import { CURRENCY_OPTIONS } from "@/lib/decoquote/constants";

const supportedCurrencies = CURRENCY_OPTIONS.map(({ code }) => code) as ["USD", "EUR"];

const optionalText = (max: number) =>
  z.string().trim().max(max, `Usa máximo ${max} caracteres.`).transform((value) => value || null);
const optionalEmail = z
  .string()
  .trim()
  .transform((value) => value || null)
  .refine((value) => value === null || z.email().safeParse(value).success, "Ingresa un correo válido.");
const money = z.coerce.number().finite().min(0, "El valor no puede ser negativo.");

export const businessProfileSchema = z.object({
  businessName: z.string().trim().min(2, "Ingresa el nombre del negocio.").max(120),
  ownerName: z.string().trim().min(2, "Ingresa tu nombre.").max(120),
  email: optionalEmail,
  phone: optionalText(30),
  whatsapp: z.string().trim().min(7, "Ingresa un WhatsApp válido.").max(30),
  instagram: optionalText(80),
  logoUrl: optionalText(500),
  address: optionalText(300),
  currency: z.enum(supportedCurrencies, { message: "Selecciona dólares o euros." }),
  defaultMarginPercentage: money.max(1000, "Revisa el porcentaje."),
  defaultTerms: optionalText(3000),
});

export const customerSchema = z.object({
  id: z.string().uuid().optional(),
  fullName: z.string().trim().min(2, "Ingresa el nombre del cliente.").max(160),
  email: optionalEmail,
  phone: optionalText(30),
  whatsapp: optionalText(30),
  notes: optionalText(3000),
});

export const serviceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Ingresa el nombre del servicio.").max(160),
  description: optionalText(1000),
  defaultCost: money,
  defaultPrice: money,
  active: z.boolean(),
});

export const materialSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Ingresa el nombre del material.").max(160),
  unit: z.string().trim().min(1, "Selecciona una unidad.").max(40),
  unitCost: money,
  active: z.boolean(),
});

export const quoteEditorItemSchema = z.object({
  id: z.string().min(1),
  itemType: z.enum(["service", "material", "custom"]),
  referenceId: z.string().uuid().nullable(),
  name: z.string().trim().min(1, "Cada línea necesita un nombre.").max(200),
  description: z.string().trim().max(1000),
  quantity: z.number().finite().min(0),
  unit: z.string().trim().min(1).max(40),
  unitCostCents: z.number().int().min(0),
  unitPriceCents: z.number().int().min(0),
});

export const quoteEditorSchema = z.object({
  customerId: z.string().uuid("Selecciona un cliente."),
  eventName: z.string().trim().min(2, "Ingresa el nombre del evento.").max(200),
  eventType: z.string().trim().min(2, "Ingresa el tipo de evento.").max(120),
  eventDate: z.iso.date("Selecciona la fecha del evento."),
  eventLocation: z.string().trim().min(2, "Ingresa el lugar del evento.").max(300),
  validUntil: z.iso.date().nullable(),
  items: z.array(quoteEditorItemSchema).min(1, "Agrega al menos un concepto.").max(100),
  laborCostCents: z.number().int().min(0),
  transportCostCents: z.number().int().min(0),
  otherCostCents: z.number().int().min(0),
  marginType: z.enum(["percentage", "fixed"]),
  marginValue: z.number().finite().min(0),
  finalPriceCents: z.number().int().min(0).nullable(),
  notes: z.string().trim().max(3000),
  terms: z.string().trim().max(3000),
});

export function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
