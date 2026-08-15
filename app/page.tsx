import Link from "next/link";

import { Brand } from "@/components/ui/brand";
import { DECOQUOTE_CONFIG } from "@/lib/decoquote/constants";

const features = [
  { icon: "✦", title: "Costos reales", description: "Suma materiales, servicios, mano de obra, transporte y cada gasto del montaje.", accent: "bg-violet-100 text-violet-700" },
  { icon: "♡", title: "Margen protegido", description: "Aplica tu margen y conoce la ganancia estimada antes de enviar la propuesta.", accent: "bg-rose-100 text-rose-700" },
  { icon: "▤", title: "PDF profesional", description: "Entrega una propuesta clara sin mostrar costos internos, margen ni ganancia.", accent: "bg-sky-100 text-sky-700" },
  { icon: "⌁", title: "Catálogos reutilizables", description: "Guarda clientes, servicios y materiales para cotizar con mayor agilidad.", accent: "bg-amber-100 text-amber-700" },
  { icon: "↻", title: "Historial completo", description: "Edita, duplica y consulta cotizaciones sin empezar nuevamente.", accent: "bg-emerald-100 text-emerald-700" },
  { icon: "↗", title: "Rentabilidad visible", description: "Consulta ingresos, costos y ganancia estimada según el período.", accent: "bg-fuchsia-100 text-fuchsia-700" },
];

const steps = [
  { number: "01", title: "Cuéntanos sobre el evento", description: "Selecciona el cliente y registra fecha, tipo y lugar.", accent: "from-rose-100 to-rose-50", icon: "♡" },
  { number: "02", title: "Construye tu propuesta", description: "Agrega servicios, materiales y todos los costos involucrados.", accent: "from-amber-100 to-orange-50", icon: "✦" },
  { number: "03", title: "Cotiza con confianza", description: "Protege tu margen, ajusta el precio y descarga el PDF.", accent: "from-violet-100 to-fuchsia-50", icon: "✓" },
];

const questions = [
  ["¿Necesito crear un catálogo completo?", "No. Puedes agregar conceptos personalizados directamente en la cotización y guardar tu catálogo poco a poco."],
  ["¿El cliente verá mis costos?", "No. El PDF nunca muestra costos internos, margen ni ganancia. Esos datos permanecen en tu cuenta."],
  ["¿Funciona desde el teléfono?", "Sí. El flujo está diseñado para crear y revisar cotizaciones cómodamente desde el móvil."],
  ["¿Reemplaza mi contabilidad?", "No. La rentabilidad es una estimación basada en tus cotizaciones y sirve para tomar mejores decisiones comerciales."],
];

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-[#fffafd] text-[#352b3d]">
      <header className="sticky top-0 z-40 border-b border-violet-100/80 bg-white/82 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Brand />
          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#74667d] md:flex">
            <a className="transition hover:text-violet-700" href="#como-funciona">Cómo funciona</a>
            <a className="transition hover:text-violet-700" href="#beneficios">Beneficios</a>
            <a className="transition hover:text-violet-700" href="#precio">Planes</a>
            <a className="transition hover:text-violet-700" href="#faq">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-[#5f5167] sm:inline-flex" href="/login">Iniciar sesión</Link>
            <Link className="pastel-primary rounded-xl px-4 py-2.5 text-sm font-bold" href="/register">Crear cuenta</Link>
          </div>
        </div>
      </header>

      <section className="relative px-5 py-16 sm:px-8 sm:py-24 lg:py-28">
        <div className="absolute -left-28 top-12 size-72 rounded-full bg-rose-100/60 blur-2xl" />
        <div className="absolute -right-24 top-2 size-80 rounded-full bg-sky-100/70 blur-2xl" />
        <div className="absolute bottom-0 left-[42%] size-64 rounded-full bg-amber-100/45 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.02fr_.98fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/85 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-violet-700 shadow-sm">
              <span className="size-2 rounded-full bg-rose-300" /> Creado para negocios creativos
            </span>
            <h1 className="mt-7 max-w-3xl text-4xl font-bold leading-[1.03] tracking-[-0.055em] sm:text-6xl lg:text-[68px]">
              Cotiza tus decoraciones
              <span className="block bg-gradient-to-r from-violet-600 via-fuchsia-500 to-rose-400 bg-clip-text text-transparent">sin improvisar.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#74667d]">
              Calcula materiales, mano de obra, transporte, margen y ganancia en minutos. Tan cuidado como cada detalle de tus eventos.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="pastel-primary deco-sheen inline-flex min-h-13 items-center justify-center rounded-2xl px-6 font-bold" href="/register">Crear mi primera cotización <span className="ml-2">→</span></Link>
              <a className="pastel-secondary inline-flex min-h-13 items-center justify-center rounded-2xl px-6 font-bold" href="#como-funciona">Ver cómo funciona</a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-[#817489]">
              <span className="flex items-center gap-2"><i className="size-5 rounded-full bg-emerald-100 text-center not-italic text-emerald-700">✓</i>Cálculos claros</span>
              <span className="flex items-center gap-2"><i className="size-5 rounded-full bg-sky-100 text-center not-italic text-sky-700">✓</i>Datos protegidos</span>
              <span className="flex items-center gap-2"><i className="size-5 rounded-full bg-rose-100 text-center not-italic text-rose-700">✓</i>Listo para móvil</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[590px]">
            <span className="deco-float absolute -left-4 top-14 z-20 rounded-2xl border border-white bg-rose-100 px-4 py-2 text-xs font-bold text-rose-700 shadow-lg sm:-left-10">Decoración con globos</span>
            <span className="deco-float-delayed absolute -right-2 bottom-24 z-20 rounded-2xl border border-white bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-700 shadow-lg sm:-right-8">Ganancia protegida ✓</span>
            <span className="absolute -right-3 -top-6 size-24 rounded-[45%_55%_48%_52%] bg-amber-200/70 rotate-12" />
            <span className="absolute -bottom-6 left-8 size-24 rounded-full bg-sky-200/60" />
            <div className="relative rotate-[1.2deg] rounded-[34px] border border-white bg-white/85 p-3 shadow-[0_35px_90px_rgb(96_68_115_/_0.18)] backdrop-blur sm:p-5">
              <div className="overflow-hidden rounded-[26px] border border-violet-100 bg-white">
                <div className="flex items-center justify-between bg-gradient-to-r from-violet-100 via-rose-50 to-amber-50 px-5 py-4">
                  <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-rose-300" /><span className="size-2.5 rounded-full bg-amber-300" /><span className="size-2.5 rounded-full bg-emerald-300" /></div>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-700">Borrador</span>
                </div>
                <div className="p-5 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-500">Cotización DQ-2026-000024</p><h2 className="mt-2 text-xl font-bold">Cumpleaños de Isabella</h2><p className="mt-1 text-sm text-[#8b7d93]">Jardín Encantado · 24 invitados</p></div>
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-400 text-lg text-white">✦</span>
                  </div>
                  <div className="mt-6 space-y-3">
                    {[
                      ["Arco orgánico pastel", "$145.00", "bg-rose-100 text-rose-700"],
                      ["Panel personalizado", "$120.00", "bg-sky-100 text-sky-700"],
                      ["Mesa temática y detalles", "$110.00", "bg-amber-100 text-amber-700"],
                    ].map(([name, price, accent]) => (
                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#eee7f1] p-3.5" key={name}>
                        <div className="flex items-center gap-3"><span className={`size-9 rounded-xl ${accent}`} /><span className="text-sm font-semibold">{name}</span></div>
                        <span className="text-sm font-bold">{price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-[#f8f4fb] p-4"><p className="text-xs text-[#8b7d93]">Costo estimado</p><p className="mt-1 font-bold">$286.00</p></div>
                    <div className="rounded-2xl bg-emerald-50 p-4"><p className="text-xs text-emerald-700">Ganancia estimada</p><p className="mt-1 font-bold text-emerald-700">$189.00</p></div>
                  </div>
                  <div className="deco-sheen mt-3 flex items-end justify-between rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 p-5 text-white">
                    <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-100">Precio recomendado</p><p className="mt-1 text-3xl font-bold">$475.00</p></div>
                    <span className="rounded-xl bg-white/15 px-3 py-2 text-xs font-bold">Listo para PDF</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-10 sm:px-8">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[32px] bg-[#3f3150] text-white shadow-2xl shadow-violet-200/50 lg:grid-cols-[.85fr_1.15fr]">
          <div className="relative overflow-hidden p-8 sm:p-12">
            <span className="absolute -left-12 -top-12 size-40 rounded-full bg-rose-300/15" />
            <span className="relative text-xs font-bold uppercase tracking-[0.2em] text-rose-200">El problema</span>
            <h2 className="relative mt-4 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Deja de adivinar cuánto cobrar.</h2>
          </div>
          <div className="bg-white/7 p-8 sm:p-12">
            <p className="text-lg leading-8 text-violet-100">WhatsApp, Excel, calculadora y notas hacen fácil olvidar un costo o cobrar sin conocer la ganancia.</p>
            <p className="mt-4 text-lg leading-8 text-white">DecoQuote reúne el cálculo y la propuesta en un solo flujo pensado para eventos y manualidades.</p>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-24" id="como-funciona">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">Cómo funciona</p><h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] sm:text-5xl">De la idea al precio recomendado en tres pasos.</h2></div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <article className="app-card-soft group relative overflow-hidden p-6 transition duration-300 hover:-translate-y-1 sm:p-7" key={step.number}>
                <span className={`absolute -right-8 -top-8 size-28 rounded-full bg-gradient-to-br opacity-70 ${step.accent}`} />
                <div className="relative flex items-center justify-between"><span className="text-xs font-bold tracking-[0.18em] text-[#a092a9]">PASO {step.number}</span><span className={`grid size-11 place-items-center rounded-2xl bg-gradient-to-br text-lg font-bold ${step.accent}`}>{step.icon}</span></div>
                <h3 className="relative mt-10 text-xl font-bold">{step.title}</h3>
                <p className="relative mt-3 leading-7 text-[#74667d]">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-gradient-to-b from-[#fbf7ff] to-[#fffafd] px-5 py-20 sm:px-8 sm:py-24" id="beneficios">
        <div className="absolute left-[8%] top-16 size-20 rounded-full bg-rose-100/70" />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">Tu negocio, en orden</p><h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] sm:text-5xl">Conoce el costo real de cada evento.</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-[#74667d]">Protege tu ganancia antes de enviar una cotización y crea propuestas profesionales en minutos.</p></div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article className="group rounded-[24px] border border-white bg-white/80 p-6 shadow-[0_16px_50px_rgb(83_57_96_/_0.07)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgb(83_57_96_/_0.11)]" key={feature.title}>
                <span className={`grid size-11 place-items-center rounded-2xl text-lg font-bold transition group-hover:rotate-6 ${feature.accent}`}>{feature.icon}</span>
                <h3 className="mt-5 text-lg font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#74667d]">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-24" id="precio">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">Planes simples</p>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] sm:text-5xl">Elige el ritmo de tu negocio.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-[#74667d]">Ambos planes incluyen clientes ilimitados, historial y análisis de rentabilidad.</p>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {DECOQUOTE_CONFIG.plans.map((plan) => (
              <article className={`relative overflow-hidden rounded-[30px] border p-7 text-left shadow-xl sm:p-8 ${plan.featured ? "border-violet-300 bg-gradient-to-br from-[#4b3561] to-[#784fa0] text-white shadow-violet-200/70" : "border-violet-100 bg-white text-[#352b3d] shadow-violet-100/60"}`} key={plan.code}>
                <span className={`absolute -right-10 -top-10 size-32 rounded-full ${plan.featured ? "bg-rose-300/20" : "bg-amber-100/70"}`} />
                {plan.featured ? <span className="relative inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">Mayor volumen</span> : <span className="relative inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">Para comenzar</span>}
                <p className={`relative mt-6 font-bold ${plan.featured ? "text-violet-100" : "text-violet-700"}`}>{plan.name}</p>
                <p className="relative mt-3 text-5xl font-bold tracking-[-0.05em]">${plan.price}<span className={`text-base font-medium ${plan.featured ? "text-violet-200" : "text-[#8b7d93]"}`}> / {plan.billingInterval}</span></p>
                <p className={`relative mt-4 min-h-12 text-sm leading-6 ${plan.featured ? "text-violet-100" : "text-[#74667d]"}`}>{plan.description}</p>
                <ul className={`relative mt-7 space-y-3 text-sm font-medium ${plan.featured ? "text-white" : "text-[#5f5167]"}`}>
                  <li>✓ {plan.limits.quotes_per_month === -1 ? "Cotizaciones ilimitadas" : `${plan.limits.quotes_per_month} cotizaciones al mes`}</li>
                  <li>✓ {plan.limits.pdf_generations_per_month === -1 ? "PDFs ilimitados" : `${plan.limits.pdf_generations_per_month} PDFs al mes`}</li>
                  <li>✓ Clientes ilimitados</li>
                  <li>✓ Historial y rentabilidad</li>
                </ul>
                <Link className={`relative mt-8 flex min-h-12 items-center justify-center rounded-2xl font-bold transition hover:-translate-y-0.5 ${plan.featured ? "bg-white text-violet-700 shadow-lg" : "pastel-primary"}`} href={plan.checkoutUrl}>Elegir {plan.name.replace("DecoQuote ", "")}</Link>
              </article>
            ))}
          </div>
          <p className="mt-6 text-xs text-[#9a8ea1]">Compra segura procesada por Hotmart.</p>
        </div>
      </section>

      <section className="bg-white/70 px-5 py-20 sm:px-8 sm:py-24" id="faq">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">Resolvemos tus dudas</p>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Preguntas frecuentes</h2>
          <div className="mt-9 space-y-3">
            {questions.map(([question, answer]) => (
              <details className="group rounded-2xl border border-violet-100 bg-white p-5 shadow-sm" key={question}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-[#4b3d54]">{question}<span className="grid size-8 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700 transition group-open:rotate-45">＋</span></summary>
                <p className="mt-4 border-t border-violet-100 pt-4 leading-7 text-[#74667d]">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-20">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-gradient-to-br from-violet-600 via-fuchsia-500 to-rose-400 px-6 py-14 text-center text-white shadow-2xl shadow-violet-200 sm:px-12">
          <span className="deco-float absolute -left-8 -top-8 size-32 rounded-full bg-white/10" />
          <span className="deco-float-delayed absolute -bottom-14 -right-8 size-40 rounded-full bg-amber-200/20" />
          <h2 className="relative text-3xl font-bold tracking-[-0.04em] sm:text-5xl">Cotiza con claridad. Crea con libertad.</h2>
          <p className="relative mx-auto mt-5 max-w-2xl text-violet-50">{DECOQUOTE_CONFIG.tagline}</p>
          <Link className="relative mt-8 inline-flex min-h-13 items-center rounded-2xl bg-white px-7 font-bold text-violet-700 shadow-lg transition hover:-translate-y-1" href="/register">Crear mi cuenta <span className="ml-2">→</span></Link>
        </div>
      </section>

      <footer className="border-t border-violet-100 bg-white/75 px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[#817489] sm:flex-row sm:items-center sm:justify-between"><Brand /><p>© 2026 Magics DecoQuote. Hecho para negocios creativos.</p></div>
      </footer>
    </main>
  );
}
