import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeHotmartEvent } from "@/lib/hotmart/types";
import type { Json, Plan, Profile } from "@/types/database";

export class HotmartWebhookError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
  ) {
    super(code);
  }
}

async function findProfile(email: string | null): Promise<Profile> {
  if (!email) throw new HotmartWebhookError("BUYER_EMAIL_MISSING", 422);
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("email", email).maybeSingle();
  if (error) throw new HotmartWebhookError("PROFILE_LOOKUP_FAILED", 500);
  if (!data) throw new HotmartWebhookError("PROFILE_NOT_FOUND", 422);
  return data;
}

async function findPlan(productIds: string[]): Promise<Plan> {
  const supabase = createAdminClient();
  if (productIds.length > 0) {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .in("provider_product_id", productIds)
      .eq("active", true)
      .limit(1)
      .maybeSingle();
    if (error) throw new HotmartWebhookError("PLAN_LOOKUP_FAILED", 500);
    if (data) return data;
  }

  const defaultCode = process.env.HOTMART_DEFAULT_PLAN_CODE;
  if (defaultCode) {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("code", defaultCode)
      .eq("active", true)
      .maybeSingle();
    if (error) throw new HotmartWebhookError("PLAN_LOOKUP_FAILED", 500);
    if (data) return data;
  }

  throw new HotmartWebhookError("PLAN_NOT_FOUND", 422);
}

export async function processHotmartWebhook(payload: Json) {
  const event = normalizeHotmartEvent(payload);
  if (!event) throw new HotmartWebhookError("INVALID_EVENT", 400);
  const supabase = createAdminClient();

  const { data: storedEvent, error: insertError } = await supabase
    .from("webhook_events")
    .insert({
      provider: "hotmart",
      event_id: event.id,
      event_type: event.type,
      payload,
      processed: false,
    })
    .select("id")
    .single();

  if (insertError?.code === "23505") {
    return { duplicate: true, processed: false };
  }
  if (insertError || !storedEvent) {
    throw new HotmartWebhookError("EVENT_STORE_FAILED", 500);
  }

  try {
    if (event.subscriptionStatus) {
      const [profile, plan] = await Promise.all([
        findProfile(event.buyerEmail),
        findPlan(event.productIds),
      ]);
      const providerSubscriptionId = event.subscriptionId ?? event.transactionId;
      if (!providerSubscriptionId) {
        throw new HotmartWebhookError("SUBSCRIPTION_IDENTIFIER_MISSING", 422);
      }

      const { data: current } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("provider", "hotmart")
        .eq("provider_subscription_id", providerSubscriptionId)
        .maybeSingle();
      const isCancelled = event.subscriptionStatus === "cancelled";
      const { error: subscriptionError } = await supabase.from("subscriptions").upsert(
        {
          user_id: profile.id,
          plan_id: plan.id,
          provider: "hotmart",
          provider_subscription_id: providerSubscriptionId,
          provider_transaction_id: event.transactionId,
          status: event.subscriptionStatus,
          started_at:
            current?.started_at ??
            (event.subscriptionStatus === "active" ? event.orderDate ?? event.createdAt : null),
          current_period_start: event.orderDate ?? current?.current_period_start ?? null,
          current_period_end: event.nextChargeDate ?? current?.current_period_end ?? null,
          cancelled_at: isCancelled ? event.createdAt : current?.cancelled_at ?? null,
        },
        { onConflict: "provider,provider_subscription_id" },
      );
      if (subscriptionError) {
        throw new HotmartWebhookError("SUBSCRIPTION_UPSERT_FAILED", 500);
      }
    }

    const { error: completionError } = await supabase
      .from("webhook_events")
      .update({ processed: true, processed_at: new Date().toISOString(), error: null })
      .eq("id", storedEvent.id);
    if (completionError) throw new HotmartWebhookError("EVENT_COMPLETION_FAILED", 500);
    return { duplicate: false, processed: true };
  } catch (error) {
    const code = error instanceof HotmartWebhookError ? error.code : "PROCESSING_FAILED";
    await supabase.from("webhook_events").update({ error: code }).eq("id", storedEvent.id);
    throw error;
  }
}
