import { ArrowRight, CalendarDays, FileJson, HardDrive, Wallet } from 'lucide-react'

import { HeroPhoto } from './ui/photos'
import { buttonClasses } from './ui/variants'

/** Destaques verdadeiros do aplicativo atual (sem prometer recursos futuros). */
const HIGHLIGHTS = [
  {
    icon: CalendarDays,
    title: 'Roteiro por dia',
    text: 'atividades por período, sem sobreposição',
  },
  {
    icon: Wallet,
    title: 'Estimativa de custos',
    text: 'ilustrativa, conforme o orçamento',
  },
  {
    icon: FileJson,
    title: 'Exportar e importar',
    text: 'seus roteiros em arquivo JSON',
  },
  {
    icon: HardDrive,
    title: 'Dados no navegador',
    text: 'sem cadastro e sem servidor',
  },
] as const

interface HeroProps {
  /** Abre o planejamento progressivo; sem ele, o botão leva ao formulário tradicional. */
  onStartPlanning?: () => void
}

/** Seção principal da home: fundo imersivo azul-escuro, mensagem e chamadas para ação. */
export function Hero({ onStartPlanning }: HeroProps) {
  return (
    <section
      id="inicio"
      className="relative isolate overflow-hidden bg-night-gradient text-night-ink"
    >
      <HeroPhoto />
      {/* Escurece o lado do texto para garantir o contraste sobre a fotografia. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-night-950/50 bg-gradient-to-r from-night-950/75 via-night-950/40 to-transparent md:bg-night-950/40 lg:bg-night-950/12"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-night-950 from-20% via-night-950/75 via-50% to-transparent"
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-28 pt-10 sm:px-6 sm:pb-32 sm:pt-14 lg:pb-36 lg:pt-16">
        <p className="inline-flex items-center rounded-full border border-white/25 bg-night-950/60 px-4 py-1 text-sm font-medium text-night-ink">
          Planejamento de viagens por regras claras
        </p>
        <h1 className="mt-5 max-w-xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          Viagens incríveis começam com{' '}
          <span className="text-brand-300">boas escolhas.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-night-ink">
          Escolha um destino, informe seus interesses e o seu orçamento e receba
          um roteiro organizado dia a dia, com custos ilustrativos, feito com
          dados locais e regras determinísticas.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="#planejar"
            onClick={(event) => {
              if (onStartPlanning) {
                event.preventDefault()
                onStartPlanning()
              }
            }}
            className={buttonClasses({ variant: 'primary', size: 'lg', width: 'responsive' }) + ' focus-ring-on-dark'}
          >
            Planejar minha viagem
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </a>
          <a
            href="#destinos"
            className={buttonClasses({ variant: 'onDark', size: 'lg', width: 'responsive' })}
          >
            Explorar destinos
          </a>
        </div>

        <ul className="mt-10 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((item) => (
            <li key={item.title} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/30 text-white">
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-sm leading-snug">
                <span className="block font-semibold text-white">{item.title}</span>
                <span className="block text-night-ink-muted">{item.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
