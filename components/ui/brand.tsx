import Link from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 font-semibold tracking-tight text-slate-950">
      <span className="grid size-9 place-items-center rounded-xl bg-violet-600 text-xs font-bold text-white shadow-sm shadow-violet-200">
        DQ
      </span>
      <span>DecoQuote</span>
    </Link>
  );
}
