import Link from "next/link";
import { redirect } from "next/navigation";
import { QuoteEditor } from "@/components/decoquote/quote-editor";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export default async function NewQuotePage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const [{ data: business }, { data: customers }, { data: services }, { data: materials }] = await Promise.all([
    supabase.from("business_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("customers").select("*").eq("user_id", user.id).is("deleted_at", null).order("full_name"),
    supabase.from("services").select("*").eq("user_id", user.id).eq("active", true).order("name"),
    supabase.from("materials").select("*").eq("user_id", user.id).eq("active", true).order("name"),
  ]);
  if (!business) redirect("/dashboard/onboarding");
  return (
    <div>
      <PageHeader eyebrow="Cotizaciones" title="Nueva cotización" description="Calcula el costo real, protege tu ganancia y prepara una propuesta profesional." action={<Link className="text-sm font-semibold text-slate-600" href="/dashboard/quotes">Cancelar</Link>} />
      <div className="mt-8">
        <QuoteEditor customers={customers ?? []} defaultMargin={business.default_margin_percentage} defaultTerms={business.default_terms ?? ""} materials={materials ?? []} services={services ?? []} />
      </div>
    </div>
  );
}
