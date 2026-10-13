import { Gauge, Rabbit, Turtle } from 'lucide-react'

import { INTEREST_LABELS } from '../../data/labels'
import {
  INTEREST_DESCRIPTIONS,
  INTEREST_OPTIONS,
  toggleInterest,
  TRIP_PACES,
  type TripPace,
} from '../../utils/interests'
import { SelectableCard } from '../ui/SelectableCard'
import { CATEGORY_STYLES } from '../ui/variants'
import type { StepProps } from './planningSteps'

const PACE_ICONS: Record<TripPace, typeof Gauge> = {
  tranquilo: Turtle,
  equilibrado: Gauge,
  intenso: Rabbit,
}

/**
 * Etapa 5 do planejamento progressivo: "Que experiências você gostaria de
 * viver?". Interesses (múltipla escolha, categorias do catálogo) e ritmo
 * (escolha única, padrão Equilibrado). Os interesses são os mesmos que o motor
 * usa; o ritmo ainda não é usado pelo motor (V1-T3.7).
 */
export function InterestsStep({ draft, onDraftChange }: StepProps) {
  const count = draft.interests.length
  return (
    <section aria-labelledby="etapa-interesses-titulo">
      <h1 id="etapa-interesses-titulo" className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Que experiências você gostaria de viver?
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-night-ink">
        Escolha um ou mais interesses e o ritmo que combina com a sua viagem.
      </p>

      <fieldset className="mt-6">
        <legend className="text-lg font-semibold text-white">Seus interesses</legend>
        <p className="mt-1 text-sm text-night-ink">Selecione quantos quiser; clique de novo para remover.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {INTEREST_OPTIONS.map((interest) => (
            <SelectableCard
              key={interest}
              label={INTEREST_LABELS[interest]}
              description={INTEREST_DESCRIPTIONS[interest]}
              icon={CATEGORY_STYLES[interest].icon}
              selected={draft.interests.includes(interest)}
              onClick={() => onDraftChange({ interests: toggleInterest(draft.interests, interest) })}
            />
          ))}
        </div>
        <p role="status" className="mt-3 text-sm text-night-ink">
          {count === 0
            ? 'Nenhum interesse selecionado.'
            : `${count} ${count === 1 ? 'interesse selecionado' : 'interesses selecionados'}.`}
        </p>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="text-lg font-semibold text-white">Ritmo da viagem</legend>
        <p className="mt-1 text-sm text-night-ink">Escolha um ritmo; o padrão é Equilibrado.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {TRIP_PACES.map((pace) => (
            <SelectableCard
              key={pace.id}
              label={pace.label}
              description={pace.description}
              icon={PACE_ICONS[pace.id]}
              selected={draft.pace === pace.id}
              onClick={() => onDraftChange({ pace: pace.id })}
            />
          ))}
        </div>
      </fieldset>

      <p className="mt-4 text-sm text-night-ink-muted">
        Os interesses e o ritmo orientam o roteiro gerado na revisão. O ritmo só limita a
        quantidade de atividades por dia (com poucos dias ou poucas opções no catálogo, pode não
        haver diferença); ele não indica esforço físico nem acessibilidade.
      </p>
    </section>
  )
}
