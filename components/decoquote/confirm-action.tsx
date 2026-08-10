"use client";

import { useState } from "react";

export function ConfirmAction({ action, id, label, question }: { action: (formData: FormData) => void | Promise<void>; id: string; label: string; question: string }) {
  const [open, setOpen] = useState(false);
  if (!open) return <button className="text-sm font-medium text-rose-600" onClick={() => setOpen(true)} type="button">{label}</button>;
  return (
    <form action={action} className="flex flex-wrap items-center gap-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-900">
      <input name="id" type="hidden" value={id} /><span>{question}</span>
      <button className="rounded-md bg-rose-600 px-2.5 py-1.5 font-semibold text-white" type="submit">Confirmar</button>
      <button className="px-2 py-1.5 font-semibold" onClick={() => setOpen(false)} type="button">Cancelar</button>
    </form>
  );
}
