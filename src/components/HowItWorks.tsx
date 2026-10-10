import { CalendarCheck, MapPin, SlidersHorizontal } from 'lucide-react'

const STEPS = [
  {
    icon: MapPin,
    title: '1. Escolha o destino',
    text: 'Selecione uma das cidades cadastradas na nossa base local, cada uma com atividades organizadas por categoria.',
  },
  {
    icon: SlidersHorizontal,
    title: '2. Defina suas preferências',
    text: 'Informe a duração da viagem, seus interesses, o estilo (econômico, equilibrado ou confortável) e o orçamento disponível.',
  },
  {
    icon: CalendarCheck,
    title: '3. Receba o roteiro por dia',
    text: 'Um algoritmo determinístico distribui as atividades ao longo dos dias, respeitando períodos, durações e pausas.',
  },
] as const

/** Seção explicativa sobre o funcionamento da aplicação. */
export function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-20 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Como funciona
          </h2>
          <p className="mt-3 text-lg text-slate-600">
            Sem inteligência artificial e sem consultas externas: o roteiro é
            montado com regras claras a partir de uma base de dados local.
          </p>
        </div>

        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <step.icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
