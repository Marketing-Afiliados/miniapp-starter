import { BusinessProfileForm } from "@/components/decoquote/business-profile-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireUser } from "@/lib/auth/guards";
import { displayName } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function BusinessAccountPage() {
  const { user, profile } = await requireUser();
  const supabase = await createClient();
  const { data: business } = await supabase.from("business_profiles").select("*").eq("user_id", user.id).maybeSingle();
  return (
    <div>
      <PageHeader eyebrow="Mi cuenta" title="Perfil del negocio" description="Estos datos se usarán en tus cotizaciones y propuestas PDF." />
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <BusinessProfileForm fallbackEmail={user.email ?? ""} fallbackName={displayName(profile?.full_name, user.email ?? "")} profile={business} />
      </section>
    </div>
  );
}
