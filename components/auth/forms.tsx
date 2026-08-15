"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  forgotPasswordAction,
  loginAction,
  registerAction,
  updatePasswordAction,
} from "@/app/auth/actions";
import {
  initialAuthState,
  type AuthActionState,
} from "@/types/auth-actions";

const inputClass =
  "mt-2 h-12 w-full rounded-xl border border-[#e8dfec] bg-white/90 px-4 text-[#352b3d] outline-none transition placeholder:text-[#aa9eb0] focus:border-violet-400 focus:ring-4 focus:ring-violet-100";

function Feedback({ state }: { state: AuthActionState }) {
  if (!state.message) return null;
  const success = state.status === "success";
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${success ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"}`}
      role="status"
    >
      {state.message}
    </div>
  );
}

function ErrorText({ children }: { children?: string }) {
  return children ? <p className="mt-1.5 text-sm text-rose-600">{children}</p> : null;
}

function SubmitButton({ pending, children }: { pending: boolean; children: string }) {
  return (
    <button
      className="pastel-primary deco-sheen flex h-12 w-full items-center justify-center rounded-xl px-5 font-bold disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Procesando…" : children}
    </button>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialAuthState);
  return (
    <form action={action} className="space-y-5">
      <Feedback state={state} />
      <label className="block text-sm font-medium text-slate-700" htmlFor="email">
        Correo electrónico
        <input className={inputClass} id="email" name="email" type="email" autoComplete="email" required />
        <ErrorText>{state.fieldErrors?.email}</ErrorText>
      </label>
      <label className="block text-sm font-medium text-slate-700" htmlFor="password">
        <span className="flex items-center justify-between">
          Contraseña
          <Link className="font-semibold text-violet-600 hover:text-violet-700" href="/forgot-password">
            ¿La olvidaste?
          </Link>
        </span>
        <input className={inputClass} id="password" name="password" type="password" autoComplete="current-password" required />
        <ErrorText>{state.fieldErrors?.password}</ErrorText>
      </label>
      <SubmitButton pending={pending}>Iniciar sesión</SubmitButton>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initialAuthState);
  return (
    <form action={action} className="space-y-5">
      <Feedback state={state} />
      <label className="block text-sm font-medium text-slate-700" htmlFor="fullName">
        Nombre completo
        <input className={inputClass} id="fullName" name="fullName" autoComplete="name" required />
        <ErrorText>{state.fieldErrors?.fullName}</ErrorText>
      </label>
      <label className="block text-sm font-medium text-slate-700" htmlFor="email">
        Correo electrónico
        <input className={inputClass} id="email" name="email" type="email" autoComplete="email" required />
        <ErrorText>{state.fieldErrors?.email}</ErrorText>
      </label>
      <label className="block text-sm font-medium text-slate-700" htmlFor="password">
        Contraseña
        <input className={inputClass} id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
        <ErrorText>{state.fieldErrors?.password}</ErrorText>
        <span className="mt-1.5 block text-xs text-slate-500">Mínimo 8 caracteres.</span>
      </label>
      <SubmitButton pending={pending}>Crear cuenta</SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, initialAuthState);
  return (
    <form action={action} className="space-y-5">
      <Feedback state={state} />
      <label className="block text-sm font-medium text-slate-700" htmlFor="email">
        Correo electrónico
        <input className={inputClass} id="email" name="email" type="email" autoComplete="email" required />
        <ErrorText>{state.fieldErrors?.email}</ErrorText>
      </label>
      <SubmitButton pending={pending}>Enviar enlace</SubmitButton>
    </form>
  );
}

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, initialAuthState);
  return (
    <form action={action} className="space-y-5">
      <Feedback state={state} />
      <label className="block text-sm font-medium text-slate-700" htmlFor="password">
        Nueva contraseña
        <input className={inputClass} id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
        <ErrorText>{state.fieldErrors?.password}</ErrorText>
      </label>
      <SubmitButton pending={pending}>Guardar contraseña</SubmitButton>
    </form>
  );
}
