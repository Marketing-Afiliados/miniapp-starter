"use client";

import { useActionState } from "react";

import { saveBusinessProfileAction } from "@/app/dashboard/decoquote-actions";
import { FormFeedback } from "@/components/decoquote/form-feedback";
import { SubmitButton } from "@/components/decoquote/submit-button";
import { initialActionState } from "@/types/action-state";
import type { BusinessProfile } from "@/types/database";

const input = "mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-slate-950 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100";

export function BusinessProfileForm({
  profile,
  fallbackName,
  fallbackEmail,
  onboarding = false,
}: {
  profile?: BusinessProfile | null;
  fallbackName: string;
  fallbackEmail: string;
  onboarding?: boolean;
}) {
  const [state, action] = useActionState(saveBusinessProfileAction, initialActionState);
  return (
    <form action={action} className="space-y-6">
      <input name="intent" type="hidden" value={onboarding ? "onboarding" : "settings"} />
      <FormFeedback state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Nombre del negocio
          <input className={input} defaultValue={profile?.business_name ?? ""} name="businessName" placeholder="Magics Eventos" required />
          {state.fieldErrors?.businessName ? <span className="mt-1 block text-xs text-rose-600">{state.fieldErrors.businessName}</span> : null}
        </label>
        <label className="text-sm font-medium text-slate-700">Nombre de la decoradora
          <input className={input} defaultValue={profile?.owner_name ?? fallbackName} name="ownerName" required />
        </label>
        <label className="text-sm font-medium text-slate-700">WhatsApp
          <input className={input} defaultValue={profile?.whatsapp ?? ""} inputMode="tel" name="whatsapp" placeholder="+593…" required />
          {state.fieldErrors?.whatsapp ? <span className="mt-1 block text-xs text-rose-600">{state.fieldErrors.whatsapp}</span> : null}
        </label>
        <label className="text-sm font-medium text-slate-700">Instagram <span className="font-normal text-slate-400">(opcional)</span>
          <input className={input} defaultValue={profile?.instagram ?? ""} name="instagram" placeholder="@tunegocio" />
        </label>
        <label className="text-sm font-medium text-slate-700">Correo del negocio
          <input className={input} defaultValue={profile?.email ?? fallbackEmail} name="email" type="email" />
        </label>
        <label className="text-sm font-medium text-slate-700">Teléfono
          <input className={input} defaultValue={profile?.phone ?? ""} inputMode="tel" name="phone" />
        </label>
        <label className="text-sm font-medium text-slate-700">Moneda
          <select className={input} defaultValue={profile?.currency ?? "USD"} name="currency">
            <option value="USD">USD — Dólar estadounidense</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">Margen predeterminado (%)
          <input className={input} defaultValue={profile?.default_margin_percentage ?? 40} min="0" name="defaultMarginPercentage" step="0.01" type="number" />
        </label>
      </div>
      <label className="block text-sm font-medium text-slate-700">Dirección
        <input className={input} defaultValue={profile?.address ?? ""} name="address" />
      </label>
      <label className="block text-sm font-medium text-slate-700">URL del logo <span className="font-normal text-slate-400">(opcional)</span>
        <input className={input} defaultValue={profile?.logo_url ?? ""} name="logoUrl" type="url" />
      </label>
      <label className="block text-sm font-medium text-slate-700">Condiciones predeterminadas
        <textarea className={`${input} min-h-28 py-3`} defaultValue={profile?.default_terms ?? "Cotización válida por 15 días. La fecha se reserva al confirmar el anticipo."} name="defaultTerms" />
      </label>
      <SubmitButton>{onboarding ? "Comenzar a cotizar" : "Guardar perfil"}</SubmitButton>
    </form>
  );
}
