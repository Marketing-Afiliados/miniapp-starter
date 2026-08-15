import Link from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-3 text-[#352b3d]">
      <span className="relative grid size-11 place-items-center overflow-hidden rounded-[15px] bg-gradient-to-br from-violet-500 via-fuchsia-400 to-rose-300 shadow-lg shadow-violet-200/60 transition duration-300 group-hover:-rotate-3 group-hover:scale-105">
        <svg aria-hidden="true" className="size-8" viewBox="0 0 40 40">
          <circle cx="20" cy="12" fill="#fff" fillOpacity=".92" r="7" />
          <circle cx="27" cy="20" fill="#fff7ed" fillOpacity=".95" r="7" />
          <circle cx="20" cy="27" fill="#ecfdf5" fillOpacity=".95" r="7" />
          <circle cx="13" cy="20" fill="#fdf2f8" fillOpacity=".95" r="7" />
          <circle cx="20" cy="20" fill="#6d28d9" r="4.5" />
        </svg>
        <span className="absolute right-1.5 top-1 size-1.5 rounded-full bg-white shadow-[0_0_0_3px_rgb(255_255_255_/_0.22)]" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-violet-500">Magics</span>
        <span className="mt-1 text-lg font-bold tracking-[-0.035em]">DecoQuote</span>
      </span>
    </Link>
  );
}
