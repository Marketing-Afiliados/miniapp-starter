import { createClient } from "@/lib/supabase/server";
import { getFeaturePlanLimit } from "@/lib/billing/limits";
import type { Plan, Subscription } from "@/types/database";

export interface SubscriptionAccess {
  subscription: Subscription;
  plan: Plan;
}

export interface FeatureAccess {
  allowed: boolean;
  limit: number | null;
  used: number;
  remaining: number | null;
  reason: "available" | "no_subscription" | "disabled" | "limit_reached";
}

export async function getActiveSubscription(userId: string): Promise<SubscriptionAccess | null> {
  const supabase = await createClient();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription) return null;
  if (subscription.current_period_end && new Date(subscription.current_period_end) <= new Date()) {
    return null;
  }

  const { data: plan } = await supabase
    .from("plans")
    .select("*")
    .eq("id", subscription.plan_id)
    .eq("active", true)
    .maybeSingle();

  return plan ? { subscription, plan } : null;
}

export async function hasActiveSubscription(userId: string) {
  return (await getActiveSubscription(userId)) !== null;
}

export async function canUseFeature(userId: string, feature: string): Promise<FeatureAccess> {
  const access = await getActiveSubscription(userId);
  if (!access) {
    return { allowed: false, limit: null, used: 0, remaining: null, reason: "no_subscription" };
  }

  const policy = getFeaturePlanLimit(access.plan.limits, feature);
  if (policy.kind === "disabled") {
    return { allowed: false, limit: 0, used: 0, remaining: 0, reason: "disabled" };
  }
  if (policy.kind === "unlimited" || policy.kind === "unconfigured") {
    return { allowed: true, limit: null, used: 0, remaining: null, reason: "available" };
  }

  const now = new Date();
  const periodStart =
    access.subscription.current_period_start ??
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const periodEnd =
    access.subscription.current_period_end ??
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
  const supabase = await createClient();
  const { data: records } = await supabase
    .from("usage")
    .select("quantity")
    .eq("user_id", userId)
    .eq("feature", feature)
    .gte("period_start", periodStart)
    .lte("period_end", periodEnd);
  const used = (records ?? []).reduce((total, item) => total + item.quantity, 0);
  const remaining = Math.max(policy.limit - used, 0);

  return {
    allowed: remaining > 0,
    limit: policy.limit,
    used,
    remaining,
    reason: remaining > 0 ? "available" : "limit_reached",
  };
}
