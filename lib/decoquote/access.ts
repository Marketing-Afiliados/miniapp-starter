import { canUseFeature, hasActiveSubscription } from "@/lib/billing/access";
import { createClient } from "@/lib/supabase/server";

export async function hasDecoQuoteAccess(userId: string): Promise<boolean> {
  if (process.env.NODE_ENV !== "production" || process.env.DECOQUOTE_DEV_ACCESS === "true") return true;
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role === "admin") return true;
  return hasActiveSubscription(userId);
}

export async function canUseDecoQuoteFeature(userId: string, feature: string) {
  if (!(await hasDecoQuoteAccess(userId))) {
    return { allowed: false, reason: "no_subscription" as const, remaining: null };
  }
  if (process.env.NODE_ENV !== "production" || process.env.DECOQUOTE_DEV_ACCESS === "true") {
    return { allowed: true, reason: "development" as const, remaining: null };
  }
  const access = await canUseFeature(userId, feature);
  return { allowed: access.allowed, reason: access.reason, remaining: access.remaining };
}
