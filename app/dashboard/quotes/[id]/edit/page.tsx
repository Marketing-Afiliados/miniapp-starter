import { notFound } from "next/navigation";
import { QuoteEditor } from "@/components/decoquote/quote-editor";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { QuoteEditorPayload } from "@/types/decoquote";

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireUser();
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: quote }, { data: items }, { data: business }, { data: customers }, { data: services }, { data: materials }] = await Promise.all([
    supabase.from("quotes").select("*").eq("id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("quote_items").select("*").eq("quote_id", id).eq("user_id", user.id).order("sort_order"),
    supabase.from("business_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("customers").select("*").eq("user_id", user.id).is("deleted_at", null).order("full_name"),
    supabase.from("services").select("*").eq("user_id", user.id).eq("active", true).order("name"),
    supabase.from("materials").select("*").eq("user_id", user.id).eq("active", true).order("name"),
  ]);
  if (!quote || !business) notFound();
  const initial: QuoteEditorPayload = {
    customerId: quote.customer_id, eventName: quote.event_name, eventType: quote.event_type,
    eventDate: quote.event_date, eventLocation: quote.event_location, validUntil: quote.valid_until,
    items: (items ?? []).map((item) => ({ id: item.id, itemType: item.item_type, referenceId: item.reference_id, name: item.name, description: item.description ?? "", quantity: item.quantity, unit: item.unit, unitCostCents: item.unit_cost_cents, unitPriceCents: item.unit_price_cents })),
    laborCostCents: quote.labor_cost_cents, transportCostCents: quote.transport_cost_cents,
    otherCostCents: quote.other_cost_cents, marginType: quote.margin_type,
    marginValue: quote.margin_type === "percentage" ? quote.margin_percentage ?? 0 : quote.fixed_margin_cents ?? 0,
    finalPriceCents: quote.final_price_cents === quote.recommended_price_cents ? null : quote.final_price_cents,
    notes: quote.notes ?? "", terms: quote.terms ?? "",
  };
  return <div><PageHeader eyebrow={quote.quote_number} title="Editar cotización" description="Actualiza los datos y vuelve a calcular en tiempo real." /><div className="mt-8"><QuoteEditor currency={quote.currency} customers={customers ?? []} defaultMargin={business.default_margin_percentage} defaultTerms={business.default_terms ?? ""} initial={initial} materials={materials ?? []} quoteId={id} services={services ?? []} /></div></div>;
}
