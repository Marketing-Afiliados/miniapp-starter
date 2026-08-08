import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/shell";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await requireAdmin();
  return (
    <DashboardShell user={user} profile={profile} admin>
      {children}
    </DashboardShell>
  );
}
