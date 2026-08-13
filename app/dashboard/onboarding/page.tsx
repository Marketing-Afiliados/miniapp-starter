import { redirect } from "next/navigation";
import { BusinessProfileForm } from "@/components/decoquote/business-profile-form";
import { requireUser } from "@/lib/auth/guards";
import { displayName } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const { user, profile } = await requireUser();
  const supabase = await createClient();
  const [{ data: business }, { data: categories }] = await Promise.all([
    supabase.from("business_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("catalog_categories").select("*").eq("active", true).order("sort_order"),
  ]);
  if (business) redirect("/dashboard");
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-semibold text-violet-600">Primer paso</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Prepara tu negocio para cotizar</h1>
      <p className="mt-3 max-w-2xl leading-7 text-slate-600">Solo necesitamos los datos que aparecerán en tus propuestas. Podrás modificarlos después.</p>
      <section className="mt-8 rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-8">
        <BusinessProfileForm categories={categories ?? []} fallbackEmail={user.email ?? ""} fallbackName={displayName(profile?.full_name, user.email ?? "")} onboarding />
      </section>
    </div>
  );
}
