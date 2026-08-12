import "server-only";

import type { User } from "@supabase/supabase-js";

import {
  resolveHotmartPlan,
  type HotmartPlanReference,
} from "@/lib/hotmart/plan-mapping";
import { normalizeHotmartEvent } from "@/lib/hotmart/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Json,
  Plan,
  Profile,
  SubscriptionStatus,
} from "@/types/database";

export class HotmartWebhookError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
  ) {
    super(code);
  }
}

interface SubscriptionInput {
  userId: string;
  planId: string;
  providerSubscriptionId: string;
  transactionId: string | null;
  status: SubscriptionStatus;
  eventDate: string;
  periodStart: string | null;
  periodEnd: string | null;
}

async function findProfile(email: string | null): Promise<Profile> {
  if (!email) throw new HotmartWebhookError("BUYER_EMAIL_MISSING", 422);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .maybeSingle();
  if (error) throw new HotmartWebhookError("PROFILE_LOOKUP_FAILED", 500);
  if (!data) throw new HotmartWebhookError("PROFILE_NOT_FOUND", 422);
  return data;
}

async function findPlan(reference: HotmartPlanReference): Promise<Plan> {
  const supabase = createAdminClient();
  if (reference.productIds.length > 0) {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .in("provider_product_id", reference.productIds)
      .eq("active", true);
    if (error) throw new HotmartWebhookError("PLAN_LOOKUP_FAILED", 500);
    const resolution = resolveHotmartPlan(data ?? [], reference);
    if (resolution.status === "matched") return resolution.plan;
    if (resolution.status === "ambiguous") {
      throw new HotmartWebhookError("PLAN_MAPPING_AMBIGUOUS", 422);
    }
    if ((data ?? []).length > 0) {
      throw new HotmartWebhookError("PLAN_MAPPING_NOT_FOUND", 422);
    }
  }

  const hasProviderReference =
    reference.productIds.length > 0 ||
    reference.offerCode !== null ||
    reference.subscriptionPlanId !== null;
  const defaultCode = hasProviderReference
    ? null
    : process.env.HOTMART_DEFAULT_PLAN_CODE;
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

async function upsertSubscription(input: SubscriptionInput) {
  const supabase = createAdminClient();
  const { data: current } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("provider", "hotmart")
    .eq("provider_subscription_id", input.providerSubscriptionId)
    .maybeSingle();
  const isCancelled = input.status === "cancelled";
  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: input.userId,
      plan_id: input.planId,
      provider: "hotmart",
      provider_subscription_id: input.providerSubscriptionId,
      provider_transaction_id:
        input.transactionId ?? current?.provider_transaction_id ?? null,
      status: input.status,
      started_at:
        current?.started_at ??
        (input.status === "active" ? input.periodStart ?? input.eventDate : null),
      current_period_start: input.periodStart ?? current?.current_period_start ?? null,
      current_period_end: input.periodEnd ?? current?.current_period_end ?? null,
      cancelled_at: isCancelled ? input.eventDate : current?.cancelled_at ?? null,
    },
    { onConflict: "provider,provider_subscription_id" },
  );
  if (error) throw new HotmartWebhookError("SUBSCRIPTION_UPSERT_FAILED", 500);
}

async function completeEvent(eventId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("webhook_events")
    .update({
      processed: true,
      processed_at: new Date().toISOString(),
      error: null,
    })
    .eq("id", eventId);
  if (error) throw new HotmartWebhookError("EVENT_COMPLETION_FAILED", 500);
}

export async function processHotmartWebhook(payload: Json) {
  const event = normalizeHotmartEvent(payload);
  if (!event) throw new HotmartWebhookError("INVALID_EVENT", 400);
  const supabase = createAdminClient();
  const providerSubscriptionId = event.subscriptionId ?? event.transactionId;

  const { data: storedEvent, error: insertError } = await supabase
    .from("webhook_events")
    .insert({
      provider: "hotmart",
      event_id: event.id,
      event_type: event.type,
      payload,
      buyer_email: event.buyerEmail,
      provider_subscription_id: providerSubscriptionId,
      provider_transaction_id: event.transactionId,
      subscription_status: event.subscriptionStatus,
      current_period_start: event.orderDate,
      current_period_end: event.nextChargeDate,
      processed: false,
    })
    .select("id")
    .single();

  if (insertError?.code === "23505") {
    const { data: existing } = await supabase
      .from("webhook_events")
      .select("processed,error")
      .eq("provider", "hotmart")
      .eq("event_id", event.id)
      .maybeSingle();
    return {
      duplicate: true,
      processed: existing?.processed ?? false,
      pending: existing?.error === "PROFILE_NOT_FOUND",
    };
  }
  if (insertError || !storedEvent) {
    throw new HotmartWebhookError("EVENT_STORE_FAILED", 500);
  }

  try {
    if (event.subscriptionStatus) {
      if (!providerSubscriptionId) {
        throw new HotmartWebhookError("SUBSCRIPTION_IDENTIFIER_MISSING", 422);
      }

      const plan = await findPlan({
        productIds: event.productIds,
        offerCode: event.offerCode,
        subscriptionPlanId: event.subscriptionPlanId,
      });
      await supabase
        .from("webhook_events")
        .update({ plan_id: plan.id })
        .eq("id", storedEvent.id);

      let profile: Profile;
      try {
        profile = await findProfile(event.buyerEmail);
      } catch (error) {
        if (
          error instanceof HotmartWebhookError &&
          error.code === "PROFILE_NOT_FOUND"
        ) {
          await supabase
            .from("webhook_events")
            .update({ error: error.code })
            .eq("id", storedEvent.id);
          return { duplicate: false, processed: false, pending: true };
        }
        throw error;
      }

      await upsertSubscription({
        userId: profile.id,
        planId: plan.id,
        providerSubscriptionId,
        transactionId: event.transactionId,
        status: event.subscriptionStatus,
        eventDate: event.createdAt,
        periodStart: event.orderDate,
        periodEnd: event.nextChargeDate,
      });
    }

    await completeEvent(storedEvent.id);
    return { duplicate: false, processed: true, pending: false };
  } catch (error) {
    const code =
      error instanceof HotmartWebhookError ? error.code : "PROCESSING_FAILED";
    await supabase
      .from("webhook_events")
      .update({ error: code })
      .eq("id", storedEvent.id);
    throw error;
  }
}

export async function reconcilePendingHotmartEvents(user: User) {
  if (
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !user.email ||
    !user.email_confirmed_at
  ) {
    return { linked: 0 };
  }

  const supabase = createAdminClient();
  const email = user.email.toLowerCase();
  const { data: events, error } = await supabase
    .from("webhook_events")
    .select("*")
    .eq("provider", "hotmart")
    .eq("buyer_email", email)
    .eq("processed", false)
    .eq("error", "PROFILE_NOT_FOUND")
    .order("created_at", { ascending: true });

  if (error || !events) return { linked: 0 };

  let linked = 0;
  for (const event of events) {
    if (
      !event.plan_id ||
      !event.provider_subscription_id ||
      !event.subscription_status
    ) {
      continue;
    }

    try {
      await upsertSubscription({
        userId: user.id,
        planId: event.plan_id,
        providerSubscriptionId: event.provider_subscription_id,
        transactionId: event.provider_transaction_id,
        status: event.subscription_status,
        eventDate: event.created_at,
        periodStart: event.current_period_start,
        periodEnd: event.current_period_end,
      });
      await completeEvent(event.id);
      linked += 1;
    } catch {
      await supabase
        .from("webhook_events")
        .update({ error: "RECONCILIATION_FAILED" })
        .eq("id", event.id);
    }
  }

  return { linked };
}
