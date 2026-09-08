import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseOneTimeEvent } from "@/lib/hotmart/one-time";

export async function processOneTimePayment(payload: unknown) {
  const event = parseOneTimeEvent(payload);
  if (!event) return { ok: false, status: 400 };
  const environment = process.env.HOTMART_ENVIRONMENT;
  if (environment !== "production" && environment !== "test") return { ok: false, status: 503 };
  if (process.env.VERCEL_ENV && (process.env.VERCEL_ENV === "production") !== (environment === "production")) return { ok: false, status: 503 };
  const { data, error } = await createAdminClient().rpc("process_one_time_purchase", { p_event: event, p_environment: environment });
  if (error || !data || typeof data !== "object" || Array.isArray(data)) return { ok: false, status: 500 };
  return { ok: data.ok === true, status: data.ok === true ? 200 : data.error === "PROCESSING_FAILED" ? 500 : 422, duplicate: data.duplicate === true };
}
