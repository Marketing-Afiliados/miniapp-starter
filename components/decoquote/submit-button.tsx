"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, pendingLabel = "Guardando…" }: { children: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
