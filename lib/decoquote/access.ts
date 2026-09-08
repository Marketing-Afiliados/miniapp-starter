import "server-only";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { canUseFeature, hasActiveSubscription } from "@/lib/billing/access";
import { createClient } from "@/lib/supabase/server";

export async function getOneTimeAccess(userId: string) {
  const supabase = await createClient();
  // RPC validates the session and verified Auth email; callers cannot supply a buyer email.
  const { error: claimError } = await supabase.rpc("claim_one_time_purchases");
  if (claimError) throw new Error("No se pudo verificar tu compra. Inténtalo nuevamente.");
  const { data: purchases, error } = await supabase.from("purchases").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw new Error("No se pudo consultar tu acceso.");
  if (!purchases?.length) return { purchases: [], entitlements: [], active: false };
  const { data: entitlements, error: accessError } = await supabase.from("access_entitlements").select("*").in("purchase_id", purchases.map(p => p.id));
  if (accessError) throw new Error("No se pudo consultar tu acceso.");
  return { purchases, entitlements: entitlements ?? [], active: (entitlements ?? []).some(e => e.status === "active") };
}

export async function hasDecoQuoteAccess(userId: string): Promise<boolean> {
  const access = await getOneTimeAccess(userId);
  if (access.active) return true;
  const supabase = await createClient();
  const { data: admin } = await supabase.rpc("is_admin");
  return admin === true || hasActiveSubscription(userId);
}

export async function requireDecoQuoteUser() {
  const context = await requireUser();
  if (!(await hasDecoQuoteAccess(context.user.id))) redirect("/dashboard/plan");
  return context;
}

export async function canUseDecoQuoteFeature(userId: string, feature: string) {
  const access = await getOneTimeAccess(userId);
  const supabase = await createClient();
  const { data: admin } = await supabase.rpc("is_admin");
  if (access.active || admin === true) return { allowed: true, reason: "available" as const, remaining: null };
  const legacy = await canUseFeature(userId, feature);
  return { allowed: legacy.allowed, reason: legacy.reason === "no_subscription" ? "no_access" as const : legacy.reason, remaining: legacy.remaining };
}
