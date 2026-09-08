import "server-only";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { canUseFeature, hasActiveSubscription } from "@/lib/billing/access";
import { createClient } from "@/lib/supabase/server";
import type { Purchase, Entitlement } from "@/types/database";

export interface OneTimeAccess {
  purchases: Purchase[];
  entitlements: Entitlement[];
  active: boolean;
  unavailable: boolean;
}

const unavailableAccess = (): OneTimeAccess => ({ purchases: [], entitlements: [], active: false, unavailable: true });

export async function getOneTimeAccess(userId: string): Promise<OneTimeAccess> {
  try {
    const supabase = await createClient();
    // A missing migration or a temporary billing outage must not break the login session.
    // Failure never grants access and is distinguished from a verified absence of purchase.
    const { error: claimError } = await supabase.rpc("claim_one_time_purchases");
    if (claimError) return unavailableAccess();
    const { data: purchases, error } = await supabase.from("purchases").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) return unavailableAccess();
    if (!purchases?.length) return { purchases: [], entitlements: [], active: false, unavailable: false };
    const { data: entitlements, error: accessError } = await supabase.from("access_entitlements").select("*").in("purchase_id", purchases.map(p => p.id));
    if (accessError) return { ...unavailableAccess(), purchases };
    return { purchases, entitlements: entitlements ?? [], active: (entitlements ?? []).some(e => e.status === "active"), unavailable: false };
  } catch {
    return unavailableAccess();
  }
}

export async function hasDecoQuoteAccess(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: admin } = await supabase.rpc("is_admin");
  if (admin === true || await hasActiveSubscription(userId)) return true;
  return (await getOneTimeAccess(userId)).active;
}

export async function requireDecoQuoteUser() {
  const context = await requireUser();
  if (!(await hasDecoQuoteAccess(context.user.id))) redirect("/dashboard/plan");
  return context;
}

export async function canUseDecoQuoteFeature(userId: string, feature: string) {
  const supabase = await createClient();
  const { data: admin } = await supabase.rpc("is_admin");
  if (admin === true) return { allowed: true, reason: "available" as const, remaining: null };
  const access = await getOneTimeAccess(userId);
  if (access.active) return { allowed: true, reason: "available" as const, remaining: null };
  const legacy = await canUseFeature(userId, feature);
  return { allowed: legacy.allowed, reason: legacy.reason === "no_subscription" ? access.unavailable ? "access_unavailable" as const : "no_access" as const : legacy.reason, remaining: legacy.remaining };
}
