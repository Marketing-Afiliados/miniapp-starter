"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import { ensureProfile } from "@/lib/auth/profile";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export interface AuthActionState {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: Partial<Record<"fullName" | "email" | "password" | "avatarUrl", string>>;
}

export const initialAuthState: AuthActionState = {
  status: "idle",
  message: "",
};

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = field(formData, "email").toLowerCase();
  const password = field(formData, "password");
  const fieldErrors: AuthActionState["fieldErrors"] = {};

  if (!isEmail(email)) fieldErrors.email = "Ingresa un correo válido.";
  if (!password) fieldErrors.password = "Ingresa tu contraseña.";
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Revisa los campos indicados.", fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message = error.message.toLowerCase().includes("email not confirmed")
      ? "Confirma tu correo antes de iniciar sesión."
      : "El correo o la contraseña no son correctos.";
    return { status: "error", message };
  }

  if (data.user) await ensureProfile(data.user);
  redirect("/dashboard");
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const fullName = field(formData, "fullName");
  const email = field(formData, "email").toLowerCase();
  const password = field(formData, "password");
  const fieldErrors: AuthActionState["fieldErrors"] = {};

  if (fullName.length < 2) fieldErrors.fullName = "Ingresa tu nombre completo.";
  if (!isEmail(email)) fieldErrors.email = "Ingresa un correo válido.";
  if (password.length < 8) fieldErrors.password = "Usa al menos 8 caracteres.";
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Revisa los campos indicados.", fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    const tooMany = error.message.toLowerCase().includes("rate");
    return {
      status: "error",
      message: tooMany
        ? "Espera unos minutos antes de volver a intentarlo."
        : "No pudimos crear la cuenta. Verifica los datos e inténtalo de nuevo.",
    };
  }

  if (data.session) {
    if (data.user) await ensureProfile(data.user);
    redirect("/dashboard");
  }

  return {
    status: "success",
    message: "Cuenta creada. Revisa tu correo para confirmar el registro.",
  };
}

export async function forgotPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = field(formData, "email").toLowerCase();

  if (!isEmail(email)) {
    return {
      status: "error",
      message: "Ingresa un correo válido.",
      fieldErrors: { email: "Revisa el formato del correo." },
    };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/update-password`,
  });

  return {
    status: "success",
    message: "Si existe una cuenta con ese correo, recibirás un enlace para cambiar la contraseña.",
  };
}

export async function updatePasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = field(formData, "password");

  if (password.length < 8) {
    return {
      status: "error",
      message: "La contraseña debe tener al menos 8 caracteres.",
      fieldErrors: { password: "Usa al menos 8 caracteres." },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "El enlace expiró. Solicita uno nuevo." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { status: "error", message: "No pudimos actualizar la contraseña. Inténtalo de nuevo." };
  }

  redirect("/dashboard?message=Contraseña+actualizada+correctamente");
}

export async function updateAccountAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const { user } = await requireUser();
  const fullName = field(formData, "fullName");
  const avatarUrl = field(formData, "avatarUrl");
  const fieldErrors: AuthActionState["fieldErrors"] = {};

  if (fullName.length < 2) fieldErrors.fullName = "Ingresa tu nombre completo.";
  if (avatarUrl) {
    try {
      const parsed = new URL(avatarUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("invalid");
    } catch {
      fieldErrors.avatarUrl = "Usa una URL válida que comience con http:// o https://.";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Revisa los campos indicados.", fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, avatar_url: avatarUrl || null })
    .eq("id", user.id);

  if (error) {
    return { status: "error", message: "No pudimos guardar los cambios." };
  }

  revalidatePath("/dashboard", "layout");
  return { status: "success", message: "Tu cuenta se actualizó correctamente." };
}
