import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export interface AuthContext {
  user: User;
  profile: Profile | null;
}

export async function getOptionalUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export const getAuthContext = cache(async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile };
});

export async function requireUser(): Promise<AuthContext> {
  const context = await getAuthContext();

  if (!context) {
    redirect("/login?message=Debes+iniciar+sesi%C3%B3n+para+continuar");
  }

  return context;
}

export async function requireAdmin(): Promise<AuthContext & { profile: Profile }> {
  const context = await requireUser();

  if (context.profile?.role !== "admin" || context.profile.status !== "active") {
    redirect("/dashboard?message=No+tienes+permisos+para+acceder+al+panel+administrativo");
  }

  return { ...context, profile: context.profile };
}
