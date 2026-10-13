import {
  Bus,
  CalendarDays,
  Gauge,
  Heart,
  MapPin,
  Pencil,
  Plane,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { destinations } from '../../data/destinations'
import { INTEREST_LABELS } from '../../data/labels'
import { generateItinerary } from '../../services/itineraryGenerator'
import { centsToMoney, describeBudget } from '../../utils/budget'
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
import { Disclosure } from '../ui/Disclosure'
import { DestinationPhotoImage } from '../ui/photos'
import { buildPlanningInput } from './planningAdapter'
import { resolveTripDays, type StepProps } from './planningSteps'
import type { PlanningStepId } from './planningSteps'

const EDIT_BUTTON =
  'inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-control px-3 text-sm font-semibold text-brand-700 ring-1 ring-line-strong transition-colors hover:bg-brand-50 focus-ring'

interface ReviewRowProps {
  title: string
  icon: LucideIcon
  step: PlanningStepId
  onEdit: (step: PlanningStepId) => void
  children: ReactNode
}

/** Grupo compacto da revisão: ícone, título, valor e a ação "Editar" (alvo de toque de 44 px). */
function ReviewRow({ title, icon: Icon, step, onEdit, children }: ReviewRowProps) {
  return (
    <section aria-label={title} className="flex items-center gap-3 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-card bg-brand-100 text-brand-700">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</h2>
        <div className="mt-0.5 space-y-0.5 text-sm leading-snug text-ink">{children}</div>
      </div>
      <button type="button" onClick={() => onEdit(step)} aria-label={`Editar ${title}`} className={EDIT_BUTTON}>
        <Pencil className="h-4 w-4" aria-hidden="true" />
        <span className="max-[400px]:sr-only">Editar</span>
      </button>
    </section>
  )
}

/**
 * Etapa 7 do planejamento progressivo: "Sua viagem está quase pronta!" (modelo "Híbrido Tabi", M4.4).
 * Cabeçalho com a fotografia do destino, grupos compactos com "Editar" por seção, aviso consolidado e a
 * ação principal "Gerar meu roteiro", que usa o mesmo gerador do motor via `buildPlanningInput` e fica na
 * barra de navegação (fixa no celular). Somente destino, duração, interesses, estilo, ritmo e orçamento por
 * pessoa são considerados pelo motor; o restante é preferência guardada na sessão, não salva no roteiro.
 */
export function ReviewStep({ draft, goToStep, onItineraryGenerated, actionSlot }: StepProps) {
  const [generationError, setGenerationError] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const edit = (step: PlanningStepId) => goToStep?.(step)

  const destination = destinations.find((item) => item.id === draft.destinationId)
  const days = resolveTripDays(draft)
  const travelers = draft.travelers
  const adapted = buildPlanningInput(draft)
  const currency = destination?.currency ?? null

  const arrival = ARRIVAL_MODES.find((item) => item.id === draft.transport.arrival)
  const origin = validateOrigin(draft.transport.origin)
  const local = LOCAL_MODES.filter((item) => draft.transport.local.includes(item.id))
  const ages = CHILD_AGE_BANDS.filter((band) => travelers.childAges[band.id] > 0)
  const profile = TRAVEL_PROFILES.find((item) => item.id === travelers.profile)
  const needs = ACCESSIBILITY_NEEDS.filter((item) => travelers.accessibility.includes(item.id))
  const pace = TRIP_PACES.find((item) => item.id === draft.pace)

  // Após uma falha de geração, leva o foco à mensagem (a ação principal fica na barra de navegação).
  useEffect(() => {
    if (generationError) errorRef.current?.focus()
  }, [generationError])

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

  const generateButton = (
    <Button
      variant="primary"
      size="lg"
      className="max-[769px]:min-h-11 max-[769px]:w-full"
      disabled={!adapted.ok}
      aria-describedby={adapted.ok ? undefined : 'ajuda-gerar'}
      onClick={handleGenerate}
    >
      <Sparkles className="h-5 w-5" aria-hidden="true" />
      Gerar meu roteiro
    </Button>
  )

  const durationLabel = days === null ? 'Duração não definida' : `${days} ${days === 1 ? 'dia' : 'dias'}`
  const dateRange =
    days !== null && draft.dateMode === 'dates'
      ? `${formatShortDate(draft.startDate)} a ${formatShortDate(draft.endDate)}`
      : null

  return (
    <section aria-labelledby="etapa-revisao-titulo">
      <h1 id="etapa-revisao-titulo" className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Sua viagem está quase pronta!
      </h1>
      <p className="mt-2 max-w-2xl text-base text-night-ink sm:text-lg">
        Revise as suas escolhas. Você pode editar qualquer seção antes de gerar o roteiro.
      </p>

      {!adapted.ok && (
        <div
          id="ajuda-gerar"
          role="alert"
          className="mt-4 rounded-card-lg border border-red-400/60 bg-red-950/60 p-4 text-sm text-white"
        >
          <p className="font-semibold">Complete as informações abaixo para gerar o roteiro:</p>
          <ul className="mt-2 space-y-2">
            {adapted.issues.map((issue) => (
              <li key={`${issue.step}-${issue.message}`} className="flex flex-wrap items-center gap-2">
                <span>{issue.message}</span>
                <Button variant="onDark" className="max-[769px]:min-h-11" onClick={() => edit(issue.step)}>
                  Corrigir
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {generationError && (
        <p
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mt-4 rounded-card-lg border border-red-400/60 bg-red-950/60 p-4 text-sm text-white focus-ring-on-dark"
        >
          {generationError}
        </p>
      )}

      {/* Cabeçalho: fotografia real do destino (ou a ilustração original se indisponível), nome e duração. */}
      <section aria-label="Destino" className="relative mt-4 overflow-hidden rounded-card-lg bg-night-900 shadow-card">
        {destination ? (
          <>
            <div className="h-36 overflow-hidden sm:h-44 [&>*]:h-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover">
              <DestinationPhotoImage destinationId={destination.id} name={destination.name} eager />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="flex items-center gap-1 text-xs font-medium text-white/90">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {destination.country}
              </p>
              <h2 className="text-2xl font-bold leading-tight text-white">{destination.name}</h2>
              <p className="mt-1 text-sm font-medium text-white">
                {durationLabel}
                {dateRange ? ` · ${dateRange}` : ''}
              </p>
            </div>
          </>
        ) : (
          <p className="p-4 text-sm text-night-ink">Nenhum destino selecionado.</p>
        )}
        <button
          type="button"
          onClick={() => edit('destino')}
          aria-label="Editar Destino"
          className={`${EDIT_BUTTON} absolute right-3 top-3 bg-white`}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          <span className="max-[400px]:sr-only">Editar</span>
        </button>
      </section>

      {/* Resumo: grupos compactos, um por parte do planejamento. */}
      <div className="mt-3 divide-y divide-line overflow-hidden rounded-card-lg bg-surface shadow-card">
        <ReviewRow title="Datas e duração" icon={CalendarDays} step="datas" onEdit={edit}>
          {days === null ? (
            <p>Duração não definida.</p>
          ) : (
            <>
              <p className="font-semibold">{durationLabel}</p>
              <p>{dateRange ?? 'Datas ainda não definidas.'}</p>
            </>
          )}
        </ReviewRow>

        <ReviewRow title="Viajantes" icon={Users} step="viajantes" onEdit={edit}>
          <p className="font-semibold">{describeTravelers(travelers)}</p>
          {ages.length > 0 && (
            <p>Crianças: {ages.map((band) => `${travelers.childAges[band.id]} de ${band.label}`).join(', ')}.</p>
          )}
          {profile && <p>Perfil: {profile.label}.</p>}
          {needs.length > 0 && <p>Acessibilidade: {needs.map((item) => item.label).join('; ')}.</p>}
        </ReviewRow>

        <ReviewRow title="Transporte até o destino" icon={Plane} step="transporte" onEdit={edit}>
          <p className="font-semibold">{arrival ? arrival.label : 'Não definido'}</p>
          {origin.status === 'valid' && <p>Saindo de {origin.value} (texto informado, não verificado).</p>}
        </ReviewRow>

        <ReviewRow title="Deslocamentos locais" icon={Bus} step="transporte" onEdit={edit}>
          <p className="font-semibold">
            {local.length > 0 ? local.map((item) => item.label).join(', ') : 'Não definidos'}
          </p>
        </ReviewRow>

        <ReviewRow title="Interesses" icon={Heart} step="interesses" onEdit={edit}>
          <p className="font-semibold">
            {draft.interests.length > 0
              ? draft.interests.map((item) => INTEREST_LABELS[item]).join(', ')
              : 'Nenhum interesse selecionado.'}
          </p>
        </ReviewRow>

        <ReviewRow title="Ritmo da viagem" icon={Gauge} step="interesses" onEdit={edit}>
          <p className="font-semibold">{pace?.label}</p>
          <p>{pace?.description}</p>
        </ReviewRow>

        <ReviewRow title="Estilo e orçamento" icon={Wallet} step="orcamento" onEdit={edit}>
          <p className="font-semibold">{describeBudget(draft.budget, totalTravelers(travelers), currency)}</p>
        </ReviewRow>
      </div>

      {/* Avisos e limitações consolidados: o essencial fica visível; o detalhe, a um toque. */}
      <aside
        aria-label="O que o gerador utiliza"
        className="mt-4 rounded-card-lg border border-white/15 bg-night-950/60 p-4 text-sm text-night-ink"
      >
        <p>
          Valores de atrações são estimativas ilustrativas; hospedagem, alimentação e transporte não são
          calculados. Datas exatas, viajantes, perfil, acessibilidade e transporte ainda não influenciam o
          roteiro.
        </p>
        <div className="mt-3">
          <Disclosure title="O que será usado na geração do roteiro">
            <p>
              {adapted.ok && adapted.input.budget === undefined
                ? 'Destino, duração em dias, interesses, estilo e ritmo. Sem orçamento informado, o roteiro não tem teto de custo: inclui as atividades compatíveis que couberem na agenda, com seus custos ilustrativos, sem saldo.'
                : `Destino, duração em dias, interesses, estilo, ritmo e orçamento por pessoa${
                    adapted.ok && currency && adapted.input.budget !== undefined
                      ? ` (${centsToMoney(Math.round(adapted.input.budget * 100), currency)}${draft.budget.basis === 'total' ? ', do valor total dividido igualmente entre os viajantes e arredondado para baixo' : ''})`
                      : ''
                  }.`}
            </p>
            <p className="mt-2">
              O ritmo limita a quantidade de atividades por dia e não indica esforço físico nem
              acessibilidade. As preferências que ainda não influenciam o roteiro ficam apenas nesta
              sessão e não são salvas junto com ele.
            </p>
          </Disclosure>
        </div>
      </aside>

      {/* Ação principal: na barra de navegação (fixa no celular); sem a barra, aparece aqui. */}
      {actionSlot ? createPortal(generateButton, actionSlot) : <div className="mt-6">{generateButton}</div>}
    </section>
  )
}
