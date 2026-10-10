import { CalendarDays, MapPin, Wallet } from 'lucide-react'

const HIGHLIGHTS = [
  {
    icon: MapPin,
    title: '3 destinos',
    text: 'Florianópolis, Rio de Janeiro e Lisboa na base local.',
  },
  {
    icon: CalendarDays,
    title: 'Roteiro por dia',
    text: 'Atividades organizadas por período, sem sobreposição.',
  },
  {
    icon: Wallet,
    title: 'Resumo de custos',
    text: 'Estimativa ilustrativa de acordo com seu orçamento.',
  },
] as const

/** Seção principal (hero) com chamada para ação. */
export function Hero() {
  return (
    <section
      id="inicio"
      className="bg-gradient-to-b from-blue-50 via-white to-white"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <p className="mx-auto mb-4 inline-flex items-center rounded-full bg-blue-100 px-4 py-1 text-sm font-medium text-blue-700">
          Planejamento de viagens simples e determinístico
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Planeje sua próxima viagem{' '}
          <span className="text-blue-600">dia a dia</span>, sem complicação
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          Escolha o destino, informe seus interesses e o seu orçamento. O
          Travel Planner organiza um roteiro com atividades distribuídas ao
          longo dos dias da sua viagem.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#planejar"
            className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto"
          >
            Começar a planejar
          </a>
          <a
            href="#destinos"
            className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto"
          >
            Ver destinos
          </a>
        </div>

        <ul className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-3">
          {HIGHLIGHTS.map((item) => (
            <li
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm"
            >
              <item.icon
                className="h-6 w-6 text-blue-600"
                aria-hidden="true"
              />
              <h2 className="mt-3 text-base font-semibold text-slate-900">
                {item.title}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
