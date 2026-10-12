import { Pencil } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { destinations } from '../../data/destinations'
import { INTEREST_LABELS, STYLE_LABELS } from '../../data/labels'
import { generateItinerary } from '../../services/itineraryGenerator'
import { centsToMoney, computeBudget, describeBudget } from '../../utils/budget'
import { TRIP_PACES } from '../../utils/interests'
import { ARRIVAL_MODES, LOCAL_MODES, validateOrigin } from '../../utils/transport'
import {
  ACCESSIBILITY_NEEDS,
  CHILD_AGE_BANDS,
  describeTravelers,
  totalTravelers,
  TRAVEL_PROFILES,
} from '../../utils/travelers'
import { formatShortDate } from '../../utils/tripDates'
import { Button } from '../ui/Button'
import { DestinationPhotoImage } from '../ui/photos'
import { buildPlanningInput } from './planningAdapter'
import { resolveTripDays, type StepProps } from './planningSteps'
import type { PlanningStepId } from './planningSteps'

interface ReviewCardProps {
  title: string
  step: PlanningStepId
  onEdit: (step: PlanningStepId) => void
  children: ReactNode
}

function ReviewCard({ title, step, onEdit, children }: ReviewCardProps) {
  return (
    <section
      aria-label={title}
      className="flex flex-col justify-between rounded-card-lg bg-surface p-5 text-ink shadow-card"
    >
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{title}</h2>
        <div className="mt-2 space-y-1 text-base">{children}</div>
      </div>
      <div className="mt-4">
        <button
          type="button"
          onClick={() => onEdit(step)}
          aria-label={`Editar ${title}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-control px-3 text-sm font-semibold text-brand-700 ring-1 ring-line-strong transition-colors hover:bg-brand-50 focus-ring"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Editar
        </button>
      </div>
    </section>
  )
}

/**
 * Etapa 7 do planejamento progressivo: "Sua viagem está quase pronta!".
 * Revisa as escolhas, permite editar cada seção e gera o roteiro com o mesmo
 * gerador do motor, via `buildPlanningInput`. Somente destino,
 * duração, interesses, estilo e orçamento por pessoa são considerados pelo
 * motor; o restante é preferência guardada na sessão, não salva no roteiro.
 */
export function ReviewStep({ draft, goToStep, onItineraryGenerated }: StepProps) {
  const [generationError, setGenerationError] = useState<string | null>(null)
  const edit = (step: PlanningStepId) => goToStep?.(step)

  const destination = destinations.find((item) => item.id === draft.destinationId)
  const days = resolveTripDays(draft)
  const travelers = draft.travelers
  const adapted = buildPlanningInput(draft)
  const figures = computeBudget(draft.budget, totalTravelers(travelers))
  const currency = destination?.currency ?? null

  const arrival = ARRIVAL_MODES.find((item) => item.id === draft.transport.arrival)
  const origin = validateOrigin(draft.transport.origin)
  const local = LOCAL_MODES.filter((item) => draft.transport.local.includes(item.id))
  const ages = CHILD_AGE_BANDS.filter((band) => travelers.childAges[band.id] > 0)
  const profile = TRAVEL_PROFILES.find((item) => item.id === travelers.profile)
  const needs = ACCESSIBILITY_NEEDS.filter((item) => travelers.accessibility.includes(item.id))
  const pace = TRIP_PACES.find((item) => item.id === draft.pace)

  function handleGenerate() {
    if (!adapted.ok) return
    const generation = generateItinerary(adapted.input, adapted.destination)
    if (generation.ok) {
      setGenerationError(null)
      onItineraryGenerated?.(generation.itinerary)
    } else {
      // As escolhas ficam no rascunho: o usuário ajusta e tenta de novo.
      setGenerationError(generation.message)
    }
  }

  return (
    <section aria-labelledby="etapa-revisao-titulo">
      <h1 id="etapa-revisao-titulo" className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Sua viagem está quase pronta!
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-night-ink">
        Revise as suas escolhas. Você pode editar qualquer seção antes de gerar o roteiro.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <ReviewCard title="Destino" step="destino" onEdit={edit}>
          {destination ? (
            <>
              <div className="aspect-[16/7] overflow-hidden rounded-card">
                <DestinationPhotoImage destinationId={destination.id} name={destination.name} />
              </div>
              <p className="pt-2 font-semibold">{destination.name}</p>
            </>
          ) : (
            <p>Nenhum destino selecionado.</p>
          )}
        </ReviewCard>

        <ReviewCard title="Datas e duração" step="datas" onEdit={edit}>
          {days === null ? (
            <p>Duração não definida.</p>
          ) : draft.dateMode === 'dates' ? (
            <>
              <p className="font-semibold">
                {days} {days === 1 ? 'dia' : 'dias'}
              </p>
              <p>
                {formatShortDate(draft.startDate)} a {formatShortDate(draft.endDate)}
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold">
                {days} {days === 1 ? 'dia' : 'dias'}
              </p>
              <p>Datas ainda não definidas.</p>
            </>
          )}
        </ReviewCard>

        <ReviewCard title="Viajantes" step="viajantes" onEdit={edit}>
          <p className="font-semibold">{describeTravelers(travelers)}</p>
          {ages.length > 0 && (
            <p>Crianças: {ages.map((band) => `${travelers.childAges[band.id]} de ${band.label}`).join(', ')}.</p>
          )}
          {profile && <p>Perfil: {profile.label}.</p>}
          {needs.length > 0 && <p>Acessibilidade: {needs.map((item) => item.label).join('; ')}.</p>}
        </ReviewCard>

        <ReviewCard title="Transporte até o destino" step="transporte" onEdit={edit}>
          <p className="font-semibold">{arrival ? arrival.label : 'Não definido'}</p>
          {origin.status === 'valid' && <p>Saindo de {origin.value} (texto informado, não verificado).</p>}
        </ReviewCard>

        <ReviewCard title="Deslocamentos locais" step="transporte" onEdit={edit}>
          <p className="font-semibold">{local.length > 0 ? local.map((item) => item.label).join(', ') : 'Não definidos'}</p>
        </ReviewCard>

        <ReviewCard title="Interesses" step="interesses" onEdit={edit}>
          <p className="font-semibold">
            {draft.interests.length > 0
              ? draft.interests.map((item) => INTEREST_LABELS[item]).join(', ')
              : 'Nenhum interesse selecionado.'}
          </p>
        </ReviewCard>

        <ReviewCard title="Ritmo da viagem" step="interesses" onEdit={edit}>
          <p className="font-semibold">{pace?.label}</p>
        </ReviewCard>

        <ReviewCard title="Estilo e orçamento" step="orcamento" onEdit={edit}>
          <p className="font-semibold">Estilo: {STYLE_LABELS[draft.budget.style]}</p>
          <p>
            {figures && currency
              ? describeBudget(draft.budget, totalTravelers(travelers), currency)
              : 'Orçamento não definido.'}
          </p>
        </ReviewCard>
      </div>

      <aside
        aria-label="O que o gerador utiliza"
        className="mt-6 rounded-card-lg border border-white/15 bg-night-950/60 p-5 text-sm text-night-ink"
      >
        <p className="font-semibold text-white">O que será usado na geração do roteiro</p>
        <p className="mt-1">
          Destino, duração em dias, interesses, estilo e orçamento por pessoa
          {adapted.ok && currency
            ? ` (${centsToMoney(Math.round(adapted.input.budget * 100), currency)}${draft.budget.basis === 'total' ? ', do valor total dividido igualmente entre os viajantes e arredondado para baixo' : ''})`
            : ''}
          .
        </p>
        <p className="mt-2">
          Ainda não influenciam o roteiro: datas exatas, composição dos viajantes, perfil,
          acessibilidade, transporte e ritmo. Estas preferências ficam apenas nesta sessão e não
          são salvas junto com o roteiro. Valores de atrações são estimativas ilustrativas, e
          hospedagem, alimentação e transporte não são calculados.
        </p>
      </aside>

      {!adapted.ok && (
        <div role="alert" className="mt-4 rounded-card-lg border border-red-400/60 bg-red-950/60 p-4 text-sm text-white">
          <p className="font-semibold">Complete as informações abaixo para gerar o roteiro:</p>
          <ul className="mt-2 space-y-2">
            {adapted.issues.map((issue) => (
              <li key={`${issue.step}-${issue.message}`} className="flex flex-wrap items-center gap-2">
                <span>{issue.message}</span>
                <Button variant="onDark" onClick={() => edit(issue.step)}>
                  Corrigir
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {generationError && (
        <p role="alert" className="mt-4 rounded-card-lg border border-red-400/60 bg-red-950/60 p-4 text-sm text-white">
          {generationError}
        </p>
      )}

      <div className="mt-6">
        <Button variant="primary" size="lg" disabled={!adapted.ok} onClick={handleGenerate}>
          Gerar roteiro
        </Button>
      </div>
    </section>
  )
}
