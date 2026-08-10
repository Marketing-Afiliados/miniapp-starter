"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { canUseDecoQuoteFeature } from "@/lib/decoquote/access";
import { calculateQuote } from "@/lib/decoquote/calculations";
import { quoteEditorSchema, zodFieldErrors } from "@/lib/decoquote/validation";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/action-state";
import type { Json, QuoteStatus } from "@/types/database";

export async function saveQuoteAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireUser();
  const quoteIdValue = formData.get("quoteId");
  const quoteId = typeof quoteIdValue === "string" && quoteIdValue ? quoteIdValue : null;
  if (!quoteId) {
    const access = await canUseDecoQuoteFeature(user.id, "quotes");
    if (!access.allowed) return { status: "error", message: "Alcanzaste el límite mensual de cotizaciones de tu plan." };
  }
  const raw = formData.get("payload");
  let parsed: unknown;
  try { parsed = JSON.parse(typeof raw === "string" ? raw : ""); }
  catch { return { status: "error", message: "No pudimos leer la cotización. Recarga la página." }; }
  const result = quoteEditorSchema.safeParse(parsed);
  if (!result.success) return { status: "error", message: "Revisa los datos de la cotización.", fieldErrors: zodFieldErrors(result.error) };
  const data = result.data;
  const supabase = await createClient();
  const { data: customer } = await supabase.from("customers").select("id").eq("id", data.customerId).eq("user_id", user.id).is("deleted_at", null).maybeSingle();
  if (!customer) return { status: "error", message: "El cliente seleccionado no está disponible." };
  const calculation = calculateQuote({
    items: data.items.map((item) => ({ itemType: item.itemType, quantity: item.quantity, unitCostCents: item.unitCostCents, unitPriceCents: item.unitPriceCents })),
    laborCostCents: data.laborCostCents, transportCostCents: data.transportCostCents,
    otherCostCents: data.otherCostCents, marginType: data.marginType,
    marginValue: data.marginValue, finalPriceCents: data.finalPriceCents,
  });
  const { data: business } = await supabase.from("business_profiles").select("currency").eq("user_id", user.id).maybeSingle();
  const payload = {
    customer_id: data.customerId, event_name: data.eventName, event_type: data.eventType,
    event_date: data.eventDate, event_location: data.eventLocation, valid_until: data.validUntil ?? "",
    status: "draft", currency: business?.currency ?? "USD",
    items_cost_cents: calculation.itemsCostCents, items_price_cents: calculation.itemsPriceCents,
    labor_cost_cents: calculation.laborCostCents, transport_cost_cents: calculation.transportCostCents,
    other_cost_cents: calculation.otherCostCents, total_cost_cents: calculation.totalCostCents,
    margin_type: data.marginType, margin_percentage: data.marginType === "percentage" ? data.marginValue : "",
    fixed_margin_cents: data.marginType === "fixed" ? data.marginValue : "",
    margin_amount_cents: calculation.marginAmountCents, recommended_price_cents: calculation.recommendedPriceCents,
    final_price_cents: calculation.finalPriceCents, estimated_profit_cents: calculation.estimatedProfitCents,
    notes: data.notes, terms: data.terms,
    items: data.items.map((item, index) => ({
      item_type: item.itemType, reference_id: item.referenceId ?? "", name: item.name,
      description: item.description, quantity: item.quantity, unit: item.unit,
      unit_cost_cents: item.unitCostCents, unit_price_cents: item.unitPriceCents,
      total_cost_cents: Math.round(item.quantity * item.unitCostCents),
      total_price_cents: Math.round(item.quantity * item.unitPriceCents), sort_order: index,
    })),
  };
  const { data: savedId, error } = await supabase.rpc("save_decoquote_quote", { p_quote_id: quoteId, p_payload: payload as Json });
  if (error || !savedId) return { status: "error", message: "No pudimos guardar la cotización. Inténtalo nuevamente." };
  if (!quoteId) await supabase.rpc("record_decoquote_usage", { p_feature: "quotes", p_quantity: 1 });
  revalidatePath("/dashboard"); revalidatePath("/dashboard/quotes");
  redirect(`/dashboard/quotes/${savedId}?saved=1`);
}

export async function updateQuoteStatusAction(formData: FormData): Promise<void> {
  const { user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as QuoteStatus;
  const valid: QuoteStatus[] = ["draft", "sent", "approved", "rejected", "expired", "completed"];
  if (!valid.includes(status)) return;
  const supabase = await createClient();
  await supabase.from("quotes").update({ status }).eq("id", id).eq("user_id", user.id);
  revalidatePath(`/dashboard/quotes/${id}`); revalidatePath("/dashboard/quotes");
}

export async function duplicateQuoteAction(formData: FormData): Promise<void> {
  const { user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const [{ data: quote }, { data: items }] = await Promise.all([
    supabase.from("quotes").select("*").eq("id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("quote_items").select("*").eq("quote_id", id).eq("user_id", user.id).order("sort_order"),
  ]);
  if (!quote || !items) return;
  const payload = {
    customer_id: quote.customer_id, event_name: `${quote.event_name} (copia)`,
    event_type: quote.event_type, event_date: quote.event_date, event_location: quote.event_location,
    valid_until: quote.valid_until ?? "", status: "draft", currency: quote.currency,
    items_cost_cents: quote.items_cost_cents, items_price_cents: quote.items_price_cents,
    labor_cost_cents: quote.labor_cost_cents, transport_cost_cents: quote.transport_cost_cents,
    other_cost_cents: quote.other_cost_cents, total_cost_cents: quote.total_cost_cents,
    margin_type: quote.margin_type, margin_percentage: quote.margin_percentage ?? "",
    fixed_margin_cents: quote.fixed_margin_cents ?? "", margin_amount_cents: quote.margin_amount_cents,
    recommended_price_cents: quote.recommended_price_cents, final_price_cents: quote.final_price_cents,
    estimated_profit_cents: quote.estimated_profit_cents, notes: quote.notes ?? "", terms: quote.terms ?? "",
    items: items.map((item) => ({
      item_type: item.item_type, reference_id: item.reference_id ?? "", name: item.name,
      description: item.description ?? "", quantity: item.quantity, unit: item.unit,
      unit_cost_cents: item.unit_cost_cents, unit_price_cents: item.unit_price_cents,
      total_cost_cents: item.total_cost_cents, total_price_cents: item.total_price_cents, sort_order: item.sort_order,
    })),
  };
  const { data: savedId } = await supabase.rpc("save_decoquote_quote", { p_quote_id: null, p_payload: payload as Json });
  if (savedId) redirect(`/dashboard/quotes/${savedId}/edit?duplicated=1`);
}
