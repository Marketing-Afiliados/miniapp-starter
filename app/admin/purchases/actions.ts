"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
export async function retryPaymentEvent(formData: FormData) {
  await requireAdmin();
  const eventId = String(formData.get("eventId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(eventId) || reason.length < 10 || reason.length > 1000) redirect("/admin/purchases?result=invalid");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("retry_one_time_event", { p_event_id: eventId, p_reason: reason });
  revalidatePath("/admin/purchases");
  const ok = !error && data && typeof data === "object" && !Array.isArray(data) && data.ok === true;
  redirect(`/admin/purchases?result=${ok ? "processed" : "failed"}`);
}
