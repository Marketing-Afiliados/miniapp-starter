import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export async function ensureProfile(user: User) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return;
  }

  const metadataName = user.user_metadata.full_name;
  await supabase.from("profiles").insert({
    id: user.id,
    email: user.email ?? "",
    full_name: typeof metadataName === "string" ? metadataName : null,
  });
}
