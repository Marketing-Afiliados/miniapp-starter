"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, pendingLabel = "Guardando…" }: { children: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      className="pastel-primary deco-sheen inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-bold disabled:cursor-wait disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
