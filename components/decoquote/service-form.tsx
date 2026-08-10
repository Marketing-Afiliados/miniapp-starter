"use client";

import { useActionState } from "react";
import { saveServiceAction } from "@/app/dashboard/decoquote-actions";
import { FormFeedback } from "@/components/decoquote/form-feedback";
import { SubmitButton } from "@/components/decoquote/submit-button";
import { centsToInput } from "@/lib/decoquote/money";
import { initialActionState } from "@/types/action-state";
import type { Service } from "@/types/database";

const input = "mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100";

export function ServiceForm({ service, currency = "USD" }: { service?: Service; currency?: string }) {
  const [state, action] = useActionState(saveServiceAction, initialActionState);
  return (
    <form action={action} className="space-y-4">
      {service ? <input name="id" type="hidden" value={service.id} /> : null}
      <FormFeedback state={state} />
      <label className="block text-sm font-medium text-slate-700">Nombre
        <input className={input} defaultValue={service?.name ?? ""} name="name" placeholder="Arco orgánico" required />
      </label>
      <label className="block text-sm font-medium text-slate-700">Descripción
        <textarea className={`${input} min-h-20 py-3`} defaultValue={service?.description ?? ""} name="description" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Costo ({currency})
          <input className={input} defaultValue={centsToInput(service?.default_cost_cents ?? 0)} min="0" name="defaultCost" step="0.01" type="number" />
        </label>
        <label className="text-sm font-medium text-slate-700">Precio ({currency})
          <input className={input} defaultValue={centsToInput(service?.default_price_cents ?? 0)} min="0" name="defaultPrice" step="0.01" type="number" />
        </label>
      </div>
      <label className="flex items-center gap-3 text-sm font-medium text-slate-700"><input className="size-4 accent-violet-600" defaultChecked={service?.active ?? true} name="active" type="checkbox" />Servicio activo</label>
      <SubmitButton>{service ? "Guardar cambios" : "Agregar servicio"}</SubmitButton>
    </form>
  );
}
