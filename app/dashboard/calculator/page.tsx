import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { QuickCalculator } from "@/components/decoquote/quick-calculator";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export default async function CalculatorPage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const { data: business } = await supabase
    .from("business_profiles")
    .select("currency, default_margin_percentage")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!business) redirect("/dashboard/onboarding");

  return (
    <div>
      <PageHeader
        eyebrow="Herramienta express"
        title="Calculadora rápida"
        description="Obtén un precio recomendado y revisa tu ganancia sin crear una cotización."
      />
      <div className="mt-8">
        <QuickCalculator
          currency={business.currency}
          defaultMargin={business.default_margin_percentage}
        />
      </div>
    </div>
  );
}
