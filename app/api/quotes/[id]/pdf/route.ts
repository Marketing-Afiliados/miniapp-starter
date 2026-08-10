import { requireUser } from "@/lib/auth/guards";
import { canUseDecoQuoteFeature } from "@/lib/decoquote/access";
import { BUSINESS_LOGO_BUCKET, getBusinessLogoStoragePath } from "@/lib/decoquote/logo";
import { generateQuotePdf } from "@/lib/decoquote/pdf";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireUser();
  const access = await canUseDecoQuoteFeature(user.id, "pdf_generations");
  if (!access.allowed) {
    const error = access.reason === "no_subscription"
      ? "Tu cuenta todavía no tiene una suscripción activa."
      : "Tu plan no permite generar más PDFs este mes.";
    return Response.json({ error }, { status: 402 });
  }
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: quote }, { data: business }, { data: items }] = await Promise.all([
    supabase.from("quotes").select("*").eq("id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("business_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("quote_items").select("*").eq("quote_id", id).eq("user_id", user.id).order("sort_order"),
  ]);
  if (!quote || !business || !items) return Response.json({ error: "Cotización no encontrada." }, { status: 404 });
  const { data: customer } = await supabase.from("customers").select("*").eq("id", quote.customer_id).eq("user_id", user.id).maybeSingle();
  if (!customer) return Response.json({ error: "Cliente no encontrado." }, { status: 404 });
  const logoPath = getBusinessLogoStoragePath(business.logo_url);
  let logo: { bytes: Uint8Array; mimeType: "image/jpeg" | "image/png" } | null = null;
  if (logoPath) {
    const { data: logoFile } = await supabase.storage.from(BUSINESS_LOGO_BUCKET).download(logoPath);
    if (logoFile && (logoFile.type === "image/jpeg" || logoFile.type === "image/png")) {
      logo = {
        bytes: new Uint8Array(await logoFile.arrayBuffer()),
        mimeType: logoFile.type,
      };
    }
  }
  const pdf = await generateQuotePdf({ business, customer, quote, items, logo });
  await supabase.rpc("record_decoquote_usage", { p_feature: "pdf_generations", p_quantity: 1 });
  const body = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer;
  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${quote.quote_number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
