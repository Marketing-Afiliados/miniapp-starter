import { PageHeader } from "@/components/dashboard/page-header";

const TELEGRAM_SUPPORT_URL = "https://t.me/+8u0ZtQ5G4VNlMDAx";
const SUPPORT_EMAIL = "magicsglobes@gmail.com";

export default function SupportPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Estamos para ayudarte"
        title="Soporte"
        description="Aclara tus dudas sobre DecoQuote, tu cuenta, los planes o la creación de propuestas."
      />

      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        <article className="app-card-soft group relative overflow-hidden p-6 sm:p-7">
          <span className="absolute -right-8 -top-8 size-28 rounded-full bg-sky-100/80" />
          <div className="relative flex items-start gap-4">
            <span className="grid size-13 shrink-0 place-items-center rounded-2xl bg-sky-100 text-sky-700 shadow-sm transition duration-300 group-hover:-rotate-3 group-hover:scale-105">
              <svg aria-hidden="true" className="size-6" fill="none" viewBox="0 0 24 24">
                <path d="m21 4-3.2 16-5.1-4.4-3 2.8.5-5.3L18 6.4 8.4 12 3 10.2 21 4Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
              </svg>
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Comunidad y soporte</p>
              <h2 className="mt-2 text-xl font-bold text-[#403448]">Escríbenos por Telegram</h2>
              <p className="mt-2 text-sm leading-6 text-[#74667d]">Únete al canal de soporte para consultar dudas sobre el uso de la aplicación.</p>
            </div>
          </div>
          <a
            className="relative mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#229ED9] px-5 text-sm font-bold text-white shadow-lg shadow-sky-200/60 transition hover:-translate-y-0.5 hover:bg-[#168dcc]"
            href={TELEGRAM_SUPPORT_URL}
            rel="noreferrer"
            target="_blank"
          >
            Abrir soporte en Telegram
            <span aria-hidden="true" className="ml-2">↗</span>
          </a>
        </article>

        <article className="app-card-soft group relative overflow-hidden p-6 sm:p-7">
          <span className="absolute -right-8 -top-8 size-28 rounded-full bg-violet-100/80" />
          <div className="relative flex items-start gap-4">
            <span className="grid size-13 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700 shadow-sm transition duration-300 group-hover:rotate-3 group-hover:scale-105">
              <svg aria-hidden="true" className="size-6" fill="none" viewBox="0 0 24 24">
                <rect height="15" rx="2" stroke="currentColor" strokeWidth="1.7" width="19" x="2.5" y="4.5" />
                <path d="m4 7 8 6 8-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
              </svg>
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Atención por correo</p>
              <h2 className="mt-2 text-xl font-bold text-[#403448]">Envíanos un correo</h2>
              <p className="mt-2 text-sm leading-6 text-[#74667d]">Ideal si necesitas explicar el caso con más detalle o adjuntar una captura.</p>
            </div>
          </div>
          <a
            className="pastel-primary deco-sheen relative mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-5 text-sm font-bold"
            href="mailto:magicsglobes@gmail.com?subject=Soporte%20Magics%20DecoQuote"
          >
            {SUPPORT_EMAIL}
          </a>
        </article>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <article className="app-card p-6 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">Para ayudarte mejor</p>
          <h2 className="mt-2 text-xl font-bold text-[#403448]">Incluye estos datos en tu mensaje</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ["01", "Qué querías hacer", "Por ejemplo: guardar el perfil, crear una cotización o descargar el PDF."],
              ["02", "Qué ocurrió", "Copia el mensaje de error o describe qué resultado apareció."],
              ["03", "Una captura", "Si es posible, adjunta una imagen donde se vea el problema."],
            ].map(([number, title, description]) => (
              <li className="rounded-2xl border border-violet-100 bg-gradient-to-br from-white to-violet-50/50 p-4" key={number}>
                <span className="text-xs font-bold tracking-[0.15em] text-violet-500">PASO {number}</span>
                <h3 className="mt-3 text-sm font-bold text-[#514359]">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-[#817489]">{description}</p>
              </li>
            ))}
          </ol>
        </article>

        <aside className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#4c3565] via-[#6d45a2] to-[#a05fc1] p-6 text-white shadow-xl shadow-violet-200/50 sm:p-7">
          <span className="absolute -right-8 -top-8 size-28 rounded-full bg-rose-300/20" />
          <p className="relative text-xs font-bold uppercase tracking-[0.16em] text-violet-100">Tu seguridad</p>
          <h2 className="relative mt-3 text-xl font-bold">Nunca compartas tus contraseñas</h2>
          <p className="relative mt-3 text-sm leading-6 text-violet-100">El equipo de soporte no necesita tu contraseña, claves privadas de Supabase, credenciales de Hotmart ni códigos de acceso.</p>
          <div className="relative mt-5 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm leading-6 text-white/90">
            Puedes indicar el correo asociado a tu cuenta, pero evita enviar información sensible.
          </div>
        </aside>
      </section>
    </div>
  );
}
