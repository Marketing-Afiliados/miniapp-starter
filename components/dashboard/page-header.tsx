import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-600"><span className="size-2 rounded-full bg-rose-300" />{eyebrow}</p> : null}
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#352b3d] sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl leading-7 text-[#74667d]">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
