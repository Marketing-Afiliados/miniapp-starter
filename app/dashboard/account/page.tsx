import Link from "next/link";
import { AccountForm } from "@/components/dashboard/account-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireUser } from "@/lib/auth/guards";

export default async function AccountPage() {
  const { user, profile } = await requireUser();
  return (
    <div>
      <PageHeader title="Mi cuenta" description="Administra la información visible de tu perfil." />
      <Link className="mt-6 inline-flex rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700" href="/dashboard/account/business">Editar perfil del negocio →</Link>
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <AccountForm
          fullName={profile?.full_name ?? ""}
          avatarUrl={profile?.avatar_url ?? ""}
          email={user.email ?? ""}
          role={profile?.role ?? "user"}
          status={profile?.status ?? "active"}
        />
      </section>
    </div>
  );
}
