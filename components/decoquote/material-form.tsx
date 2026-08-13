"use client";

import { useActionState, useState } from "react";
import { saveMaterialAction } from "@/app/dashboard/decoquote-actions";
import { FormFeedback } from "@/components/decoquote/form-feedback";
import { SubmitButton } from "@/components/decoquote/submit-button";
import { MATERIAL_UNITS } from "@/lib/decoquote/constants";
import { centsToInput } from "@/lib/decoquote/money";
import { initialActionState } from "@/types/action-state";
import type { CatalogCategory, CatalogSubcategory, Material } from "@/types/database";

const input = "mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100";

export function MaterialForm({ material, currency = "USD", categories = [], subcategories = [] }: { material?: Material; currency?: string; categories?: CatalogCategory[]; subcategories?: CatalogSubcategory[] }) {
  const [state, action] = useActionState(saveMaterialAction, initialActionState);
  const [categoryId, setCategoryId] = useState(material?.category_id ?? "");
  const availableSubcategories = categoryId
    ? subcategories.filter((subcategory) => subcategory.category_id === categoryId)
    : [];
  return (
    <form action={action} className="space-y-4">
      {material ? <input name="id" type="hidden" value={material.id} /> : null}
      <FormFeedback state={state} />
      <label className="block text-sm font-medium text-slate-700">Nombre
        <input className={input} defaultValue={material?.name ?? ""} name="name" placeholder={'Globos 12"'} required />
      </label>
      <label className="block text-sm font-medium text-slate-700">Descripción
        <textarea className={`${input} min-h-20 py-3`} defaultValue={material?.description ?? ""} name="description" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Unidad
          <select className={input} defaultValue={material?.unit ?? "unidad"} name="unit">{MATERIAL_UNITS.map((unit) => <option key={unit}>{unit}</option>)}</select>
        </label>
        <label className="text-sm font-medium text-slate-700">Costo unitario ({currency})
          <input className={input} defaultValue={centsToInput(material?.unit_cost_cents ?? 0)} min="0" name="unitCost" step="0.01" type="number" />
        </label>
        <label className="text-sm font-medium text-slate-700">Precio unitario ({currency})
          <input className={input} defaultValue={centsToInput(material?.default_price_cents ?? 0)} min="0" name="defaultPrice" step="0.01" type="number" />
        </label>
        <label className="text-sm font-medium text-slate-700">Categoría
          <select className={input} name="categoryId" onChange={(event) => setCategoryId(event.target.value)} value={categoryId}><option value="">Sin categoría</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
        </label>
        <label className="text-sm font-medium text-slate-700">Subcategoría
          <select className={input} defaultValue={material?.subcategory_id ?? ""} key={categoryId} name="subcategoryId"><option value="">Sin subcategoría</option>{availableSubcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}</select>
        </label>
      </div>
      <label className="flex items-center gap-3 text-sm font-medium text-slate-700"><input className="size-4 accent-violet-600" defaultChecked={material?.active ?? true} name="active" type="checkbox" />Material activo</label>
      <SubmitButton>{material ? "Guardar cambios" : "Agregar material"}</SubmitButton>
    </form>
  );
}
