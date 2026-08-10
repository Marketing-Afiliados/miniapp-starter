"use client";

import { useActionState } from "react";

import { updateAccountAction } from "@/app/auth/actions";
import { initialAuthState } from "@/types/auth-actions";

const inputClass =
  "mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-500";

export function AccountForm({
  fullName,
  avatarUrl,
  email,
  role,
  status,
}: {
  fullName: string;
  avatarUrl: string;
  email: string;
  role: string;
  status: string;
}) {
  const [state, action, pending] = useActionState(updateAccountAction, initialAuthState);
  return (
    <form action={action} className="mt-8 max-w-2xl space-y-6">
      {state.message ? (
        <div className={`rounded-xl border px-4 py-3 text-sm ${state.status === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"}`} role="status">
          {state.message}
        </div>
      ) : null}
      <label className="block text-sm font-medium text-slate-700" htmlFor="fullName">
        Nombre completo
        <input className={inputClass} defaultValue={fullName} id="fullName" name="fullName" required />
        {state.fieldErrors?.fullName ? <span className="mt-1.5 block text-sm text-rose-600">{state.fieldErrors.fullName}</span> : null}
      </label>
      <label className="block text-sm font-medium text-slate-700" htmlFor="email">
        Correo electrónico
        <input className={inputClass} defaultValue={email} id="email" disabled />
        <span className="mt-1.5 block text-xs text-slate-500">El correo se administra desde Supabase Auth.</span>
      </label>
      <label className="block text-sm font-medium text-slate-700" htmlFor="avatarUrl">
        URL del avatar <span className="font-normal text-slate-400">(opcional)</span>
        <input className={inputClass} defaultValue={avatarUrl} id="avatarUrl" name="avatarUrl" type="url" placeholder="https://…" />
        {state.fieldErrors?.avatarUrl ? <span className="mt-1.5 block text-sm text-rose-600">{state.fieldErrors.avatarUrl}</span> : null}
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">Rol<input className={inputClass} value={role} disabled readOnly /></label>
        <label className="block text-sm font-medium text-slate-700">Estado<input className={inputClass} value={status} disabled readOnly /></label>
      </div>
      <button className="h-12 rounded-xl bg-indigo-600 px-6 font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
