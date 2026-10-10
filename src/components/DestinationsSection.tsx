import { Info } from 'lucide-react'

import { destinations } from '../data/destinations'
import { DestinationCard } from './DestinationCard'

interface DestinationsSectionProps {
  selectedDestinationId: string
  onSelectDestination: (id: string) => void
}

/** Seção que lista os destinos disponíveis na base local. */
export function DestinationsSection({
  selectedDestinationId,
  onSelectDestination,
}: DestinationsSectionProps) {
  return (
    <section id="destinos" className="scroll-mt-20 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Destinos disponíveis
          </h2>
          <p className="mt-3 text-lg text-slate-600">
            Escolha um dos destinos cadastrados para começar o planejamento.
          </p>
        </div>

        <div className="mx-auto mt-6 flex max-w-3xl items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-left">
          <Info
            className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
            aria-hidden="true"
          />
          <p className="text-sm text-blue-900">
            Os custos e as durações das atividades são{' '}
            <strong>valores ilustrativos</strong>, usados apenas para
            demonstração. Eles não representam cotações atuais, horários
            oficiais ou disponibilidade real.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {destinations.map((destination) => (
            <DestinationCard
              key={destination.id}
              destination={destination}
              selected={destination.id === selectedDestinationId}
              onSelect={onSelectDestination}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
