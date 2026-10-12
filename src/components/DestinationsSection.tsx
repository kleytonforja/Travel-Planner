import { Info } from 'lucide-react'

import { destinations } from '../data/destinations'
import { DestinationCard } from './DestinationCard'

interface DestinationsSectionProps {
  selectedDestinationId: string
  onSelectDestination: (id: string) => void
  /** Rótulo do botão de cada card (padrão: "Selecionar destino"). */
  actionLabel?: string
}

/** Painel "Destinos em destaque": sobrepõe a base do hero, com os destinos da base local. */
export function DestinationsSection({
  selectedDestinationId,
  onSelectDestination,
  actionLabel,
}: DestinationsSectionProps) {
  return (
    <section
      id="destinos"
      aria-labelledby="destinos-titulo"
      className="relative z-10 -mt-24 scroll-mt-20 px-4 pb-16 sm:-mt-28 sm:px-6"
    >
      <div className="mx-auto max-w-6xl rounded-card-lg bg-surface p-5 shadow-float sm:p-8">
        <h2
          id="destinos-titulo"
          className="text-2xl font-bold tracking-tight text-ink sm:text-3xl"
        >
          Destinos em destaque
        </h2>
        <p className="mt-2 text-base text-ink-muted">
          Escolha um destino e comece a planejar sua próxima aventura.
        </p>

        <div className="mt-4 flex items-start gap-3 rounded-lg border border-brand-200 bg-brand-50 p-3 text-left">
          <Info
            className="mt-0.5 h-5 w-5 shrink-0 text-brand-600"
            aria-hidden="true"
          />
          <p className="text-sm text-slate-800">
            Os custos e as durações das atividades são{' '}
            <strong>valores ilustrativos</strong>, usados apenas para
            demonstração. Eles não representam cotações atuais, horários
            oficiais ou disponibilidade real. As fotografias são do
            Unsplash; os créditos estão no rodapé.
          </p>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {destinations.map((destination) => (
            <DestinationCard
              key={destination.id}
              destination={destination}
              selected={destination.id === selectedDestinationId}
              onSelect={onSelectDestination}
              actionLabel={actionLabel}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
