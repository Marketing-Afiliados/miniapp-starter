"use client";

import { useActionState } from "react";
import { saveCustomerAction } from "@/app/dashboard/decoquote-actions";
import { FormFeedback } from "@/components/decoquote/form-feedback";
import { SubmitButton } from "@/components/decoquote/submit-button";
import { initialActionState } from "@/types/action-state";
import type { Customer } from "@/types/database";

const input = "mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100";

export function CustomerForm({ customer }: { customer?: Customer }) {
  const [state, action] = useActionState(saveCustomerAction, initialActionState);
  return (
    <form action={action} className="space-y-4">
      {customer ? <input name="id" type="hidden" value={customer.id} /> : null}
      <FormFeedback state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">Nombre completo
          <input className={input} defaultValue={customer?.full_name ?? ""} name="fullName" required />
          {state.fieldErrors?.fullName ? <span className="mt-1 block text-xs text-rose-600">{state.fieldErrors.fullName}</span> : null}
        </label>
        <label className="text-sm font-medium text-slate-700">Correo
          <input className={input} defaultValue={customer?.email ?? ""} name="email" type="email" />
        </label>
        <label className="text-sm font-medium text-slate-700">Teléfono
          <input className={input} defaultValue={customer?.phone ?? ""} name="phone" />
        </label>
        <label className="text-sm font-medium text-slate-700">WhatsApp
          <input className={input} defaultValue={customer?.whatsapp ?? ""} name="whatsapp" />
        </label>
      </div>
      <label className="block text-sm font-medium text-slate-700">Notas
        <textarea className={`${input} min-h-24 py-3`} defaultValue={customer?.notes ?? ""} name="notes" />
      </label>
      <SubmitButton>{customer ? "Guardar cambios" : "Agregar cliente"}</SubmitButton>
    </form>
  );
}
