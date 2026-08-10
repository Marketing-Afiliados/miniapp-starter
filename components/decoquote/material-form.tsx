"use client";

import { useActionState } from "react";
import { saveMaterialAction } from "@/app/dashboard/decoquote-actions";
import { FormFeedback } from "@/components/decoquote/form-feedback";
import { SubmitButton } from "@/components/decoquote/submit-button";
import { MATERIAL_UNITS } from "@/lib/decoquote/constants";
import { centsToInput } from "@/lib/decoquote/money";
import { initialActionState } from "@/types/action-state";
import type { Material } from "@/types/database";

const input = "mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100";

export function MaterialForm({ material }: { material?: Material }) {
  const [state, action] = useActionState(saveMaterialAction, initialActionState);
  return (
    <form action={action} className="space-y-4">
      {material ? <input name="id" type="hidden" value={material.id} /> : null}
      <FormFeedback state={state} />
      <label className="block text-sm font-medium text-slate-700">Nombre
        <input className={input} defaultValue={material?.name ?? ""} name="name" placeholder={'Globos 12"'} required />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Unidad
          <select className={input} defaultValue={material?.unit ?? "unidad"} name="unit">{MATERIAL_UNITS.map((unit) => <option key={unit}>{unit}</option>)}</select>
        </label>
        <label className="text-sm font-medium text-slate-700">Costo unitario (USD)
          <input className={input} defaultValue={centsToInput(material?.unit_cost_cents ?? 0)} min="0" name="unitCost" step="0.01" type="number" />
        </label>
      </div>
      <label className="flex items-center gap-3 text-sm font-medium text-slate-700"><input className="size-4 accent-violet-600" defaultChecked={material?.active ?? true} name="active" type="checkbox" />Material activo</label>
      <SubmitButton>{material ? "Guardar cambios" : "Agregar material"}</SubmitButton>
    </form>
  );
}
