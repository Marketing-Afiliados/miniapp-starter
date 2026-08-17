"use client";

import { useActionState } from "react";
import { resetCatalogOverrideAction, saveCatalogOverrideAction } from "@/app/dashboard/decoquote-actions";
import { ConfirmAction } from "@/components/decoquote/confirm-action";
import { FormFeedback } from "@/components/decoquote/form-feedback";
import { SubmitButton } from "@/components/decoquote/submit-button";
import { MATERIAL_UNITS } from "@/lib/decoquote/constants";
import { centsToInput } from "@/lib/decoquote/money";
import { initialActionState } from "@/types/action-state";
import type { CatalogItemView } from "@/types/decoquote";

const input = "mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100";

export function CatalogOverrideForm({ item, currency }: { item: CatalogItemView; currency: string }) {
  const [state, action] = useActionState(saveCatalogOverrideAction, initialActionState);
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4">
        <input name="catalogItemId" type="hidden" value={item.id} />
        <FormFeedback state={state} />
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-medium text-slate-600">Unidad
            <select className={input} defaultValue={item.unit} name="unit">
              {MATERIAL_UNITS.map((unit) => <option key={unit}>{unit}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">Costo ({currency})
            <input className={input} defaultValue={centsToInput(item.defaultCostCents)} inputMode="decimal" min="0" name="defaultCost" step="0.01" type="number" />
          </label>
          <label className="text-xs font-medium text-slate-600">Precio ({currency})
            <input className={input} defaultValue={centsToInput(item.defaultPriceCents)} inputMode="decimal" min="0" name="defaultPrice" step="0.01" type="number" />
          </label>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <input className="size-4 accent-violet-600" defaultChecked={item.hidden} name="hidden" type="checkbox" />
          Ocultar este elemento en mi catálogo
        </label>
        <SubmitButton pendingLabel="Guardando…">Guardar personalización</SubmitButton>
      </form>
      {item.personalized ? (
        <div className="border-t border-slate-100 pt-4">
          <ConfirmAction
            action={resetCatalogOverrideAction}
            id={item.id}
            label="Restablecer valores originales"
            question="¿Restablecer esta personalización? Dejará de aparecer en tu catálogo personal."
          />
        </div>
      ) : null}
    </div>
  );
}
