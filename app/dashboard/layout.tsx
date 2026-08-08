import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/shell";
import { requireUser } from "@/lib/auth/guards";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await requireUser();
  return (
    <DashboardShell user={user} profile={profile}>
      {children}
    </DashboardShell>
  );
}
