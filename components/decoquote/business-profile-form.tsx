"use client";

import { useActionState } from "react";

import { saveBusinessProfileAction } from "@/app/dashboard/decoquote-actions";
import { FormFeedback } from "@/components/decoquote/form-feedback";
import { SubmitButton } from "@/components/decoquote/submit-button";
import { CURRENCY_OPTIONS } from "@/lib/decoquote/constants";
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
            {CURRENCY_OPTIONS.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}
          </select>
          <span className="mt-1 block text-xs font-normal text-slate-500">Se aplicará a las nuevas cotizaciones; no convierte automáticamente importes existentes.</span>
        </label>
        <label className="text-sm font-medium text-slate-700">Margen predeterminado (%)
          <input className={input} defaultValue={profile?.default_margin_percentage ?? 40} min="0" name="defaultMarginPercentage" step="0.01" type="number" />
        </label>
      </div>
      <label className="block text-sm font-medium text-slate-700">Dirección
        <input className={input} defaultValue={profile?.address ?? ""} name="address" />
      </label>
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div
            aria-label={profile?.logo_url ? "Logo actual del negocio" : "Sin logo cargado"}
            className="flex size-20 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white bg-contain bg-center bg-no-repeat text-xs font-semibold text-slate-400"
            role="img"
            style={profile?.logo_url ? { backgroundImage: `url("${profile.logo_url}")` } : undefined}
          >
            {profile?.logo_url ? null : "Sin logo"}
          </div>
          <div className="min-w-0 flex-1">
            <label className="block text-sm font-medium text-slate-700">Logo del negocio <span className="font-normal text-slate-400">(opcional)</span>
              <input accept="image/png,image/jpeg" className={`${input} py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-50 file:px-3 file:py-1.5 file:font-semibold file:text-violet-700`} name="logoFile" type="file" />
            </label>
            <p className="mt-1 text-xs text-slate-500">PNG o JPG, máximo 2 MB. Se mostrará en tus propuestas PDF.</p>
            {state.fieldErrors?.logoFile ? <span className="mt-1 block text-xs text-rose-600">{state.fieldErrors.logoFile}</span> : null}
            {profile?.logo_url ? <label className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-600"><input className="size-4 accent-violet-600" name="removeLogo" type="checkbox" />Eliminar el logo actual</label> : null}
          </div>
        </div>
      </section>
      <label className="block text-sm font-medium text-slate-700">Condiciones predeterminadas
        <textarea className={`${input} min-h-28 py-3`} defaultValue={profile?.default_terms ?? "Cotización válida por 15 días. La fecha se reserva al confirmar el anticipo."} name="defaultTerms" />
      </label>
      <SubmitButton>{onboarding ? "Comenzar a cotizar" : "Guardar perfil"}</SubmitButton>
    </form>
  );
}
