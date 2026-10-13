import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { Itinerary } from '../../types'

import { destinations } from '../../data/destinations'
import { describeBudget } from '../../utils/budget'
import { describeInterests } from '../../utils/interests'
import { describeTransport } from '../../utils/transport'
import { describeTravelers, totalTravelers } from '../../utils/travelers'
import { formatShortDate } from '../../utils/tripDates'
import { Button } from '../ui/Button'
import { ProgressSteps } from '../ui/ProgressSteps'
import {
  isStepImplemented,
  PLANNING_STEPS,
  resolveTripDays,
  type PlanningDraft,
  type StepRegistry,
} from './planningSteps'
import { STEP_COMPLETION, STEP_HINTS, STEP_REGISTRY } from './stepRegistry'

/** Campos que abrem o teclado virtual (texto, número, data, select, textarea). */
function isTextField(target: EventTarget): boolean {
  if (target instanceof HTMLInputElement) {
    return !['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file'].includes(target.type)
  }
  return target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement
}

interface PlanningFlowProps {
  draft: PlanningDraft
  onDraftChange: (patch: Partial<PlanningDraft>) => void
  /** Chamado quando a revisão gera o roteiro. */
  onItineraryGenerated?: (itinerary: Itinerary) => void
  /** Etapas disponíveis; por padrão, as implementadas em `stepRegistry`. */
  registry?: StepRegistry
}

/**
 * Container do planejamento progressivo: indicador de progresso, etapa atual,
 * resumo das escolhas e navegação entre etapas. "Continuar" só aparece quando
 * a próxima etapa existe e só habilita com a etapa atual completa; "Voltar"
 * preserva tudo o que já foi escolhido (o rascunho vive fora das etapas).
 * A última etapa (revisão) gera o roteiro. Etapas ainda não registradas são
 * apenas listadas, sem controles.
 */
export function PlanningFlow({
  draft,
  onDraftChange,
  onItineraryGenerated,
  registry = STEP_REGISTRY,
}: PlanningFlowProps) {
  const [stepIndex, setStepIndex] = useState(0)
  // Maior etapa já visitada: o resumo só mostra o grupo depois que a etapa foi vista.
  const [reached, setReached] = useState(0)
  // Verdadeiro quando o usuário saiu da revisão para editar uma seção: oferece o retorno direto.
  const [fromReview, setFromReview] = useState(false)
  // Enquanto um campo de texto está em foco (teclado virtual aberto), a barra deixa de ser fixa.
  const [typing, setTyping] = useState(false)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // A barra só volta a ficar fixa um instante depois do blur: se o toque no botão começou com o campo
  // em foco, o botão não pode sair do lugar entre o toque e o clique (o clique se perderia).
  function handleFocus(target: EventTarget) {
    if (typingTimer.current) clearTimeout(typingTimer.current)
    if (isTextField(target)) setTyping(true)
    else typingTimer.current = setTimeout(() => setTyping(false), 400)
  }
  function handleBlur() {
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => setTyping(false), 400)
  }
  if (stepIndex > reached) setReached(stepIndex)
  const stepArea = useRef<HTMLDivElement>(null)
  const mounted = useRef(false)

  // Ao trocar de etapa, leva o foco ao título da nova etapa (teclado e leitores de tela).
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    const heading = stepArea.current?.querySelector('h1')
    if (heading) {
      heading.setAttribute('tabindex', '-1')
      heading.focus()
    }
  }, [stepIndex])

  const step = PLANNING_STEPS[stepIndex]
  const reviewIndex = PLANNING_STEPS.findIndex((item) => item.id === 'revisao')
  if (fromReview && stepIndex === reviewIndex) setFromReview(false)

  function goToStep(id: (typeof PLANNING_STEPS)[number]['id']) {
    const target = PLANNING_STEPS.findIndex((item) => item.id === id)
    if (target < 0 || !isStepImplemented(id, registry)) return
    if (stepIndex === reviewIndex) setFromReview(true)
    setStepIndex(target)
  }
  const StepComponent = registry[step.id]
  const previous = PLANNING_STEPS[stepIndex - 1]
  const next = PLANNING_STEPS[stepIndex + 1]
  const nextAvailable = next !== undefined && isStepImplemented(next.id, registry)

  const isComplete = (id: (typeof PLANNING_STEPS)[number]['id']) =>
    (STEP_COMPLETION[id] ?? (() => true))(draft)
  const currentComplete = isComplete(step.id)
  const pendingLabels = PLANNING_STEPS.slice(stepIndex + 1)
    .filter((item) => !isStepImplemented(item.id, registry))
    .map((item) => item.label)

  const selected = destinations.find((destination) => destination.id === draft.destinationId)
  const days = resolveTripDays(draft)
  const hint = STEP_HINTS[step.id]

  const summaryParts: string[] = [
    selected ? `Destino selecionado: ${selected.name}` : 'Nenhum destino selecionado',
  ]
  if (days !== null) {
    summaryParts.push(
      `Duração: ${days} ${days === 1 ? 'dia' : 'dias'}${
        draft.dateMode === 'dates' ? ` (${formatShortDate(draft.startDate)} a ${formatShortDate(draft.endDate)})` : ''
      }`,
    )
  }
  const reachedStep = (id: (typeof PLANNING_STEPS)[number]['id']) =>
    reached >= PLANNING_STEPS.findIndex((item) => item.id === id)
  if (reachedStep('viajantes')) summaryParts.push(`Viajantes: ${describeTravelers(draft.travelers)}`)
  if (reachedStep('transporte')) summaryParts.push(`Transporte: ${describeTransport(draft.transport)}`)
  if (reachedStep('interesses')) summaryParts.push(`Interesses: ${describeInterests(draft.interests, draft.pace)}`)
  if (reachedStep('orcamento')) {
    summaryParts.push(
      `Orçamento: ${describeBudget(draft.budget, totalTravelers(draft.travelers), selected?.currency ?? null)}`,
    )
  }
  const compactSummary = summaryParts.join(' · ')
  const isReview = stepIndex === reviewIndex

  return (
    <div
      className="max-[769px]:pb-24"
      onFocus={(event) => handleFocus(event.target)}
      onBlur={handleBlur}
    >
      <ProgressSteps
        steps={PLANNING_STEPS}
        currentIndex={stepIndex}
        label="Progresso do planejamento"
        tone="onDark"
      />
      <p className="mt-6 inline-flex rounded-full border border-white/25 bg-night-950/60 px-3 py-1 text-sm font-medium text-night-ink">
        Etapa {stepIndex + 1} de {PLANNING_STEPS.length}
      </p>

      <div ref={stepArea} className="mt-4">
        {StepComponent ? (
          <StepComponent
            draft={draft}
            onDraftChange={onDraftChange}
            goToStep={goToStep}
            onItineraryGenerated={onItineraryGenerated}
          />
        ) : (
          <p role="alert" className="text-night-ink">
            Esta etapa ainda não está disponível.
          </p>
        )}
      </div>

      {isReview ? (
        <section
          aria-label="Resumo do planejamento"
          className="mt-8 rounded-card-lg border border-white/15 bg-night-950/60 p-4 text-night-ink"
        >
          <p className="font-semibold text-white">{summaryParts[0]}</p>
          {summaryParts.slice(1).map((part) => (
            <p key={part} className="mt-1 text-sm">
              {part}
            </p>
          ))}
        </section>
      ) : (
        <section
          aria-label="Resumo do planejamento"
          className="mt-6 rounded-card border border-white/15 bg-night-950/60 px-4 py-2 text-sm text-night-ink"
        >
          {/* Uma linha (até duas no celular); o texto completo fica em title e no DOM. */}
          <p className="line-clamp-2" title={compactSummary}>
            {compactSummary}
          </p>
        </section>
      )}

      {(fromReview && stepIndex !== reviewIndex) || previous || nextAvailable ? (
        <div
          className={
            typing
              ? 'mt-6'
              : 'mt-6 max-[769px]:fixed max-[769px]:inset-x-0 max-[769px]:bottom-0 max-[769px]:z-40 max-[769px]:mt-0 max-[769px]:border-t max-[769px]:border-white/15 max-[769px]:bg-night-950 max-[769px]:px-4 max-[769px]:pt-3 max-[769px]:pb-[calc(0.75rem+env(safe-area-inset-bottom))]'
          }
          data-testid="barra-navegacao"
        >
          {nextAvailable && !currentComplete && hint && (
            <p id="ajuda-continuar" className="mb-2 text-sm text-night-ink-muted">
              {hint}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 max-[769px]:flex-nowrap max-[769px]:[&>button]:flex-1">
            {fromReview && stepIndex !== reviewIndex && (
              <Button variant="primary" className="max-[769px]:min-h-11" onClick={() => setStepIndex(reviewIndex)}>
                Voltar para a revisão
              </Button>
            )}
            {previous && (
              <Button variant="onDark" className="max-[769px]:min-h-11" onClick={() => setStepIndex(stepIndex - 1)}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Voltar para {previous.label}
              </Button>
            )}
            {nextAvailable && (
              <Button
                variant="primary"
                className="max-[769px]:min-h-11"
                disabled={!currentComplete}
                aria-describedby={currentComplete ? undefined : 'ajuda-continuar'}
                onClick={() => setStepIndex(stepIndex + 1)}
              >
                Continuar para {next.label}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {!nextAvailable && pendingLabels.length > 0 && (
        <aside
          aria-label="Próximas etapas"
          className="mt-6 rounded-card-lg border border-white/15 bg-night-950/60 p-5 text-sm text-night-ink-muted"
        >
          {pendingLabels.length === 1
            ? `A etapa ${pendingLabels[0]} ainda está em desenvolvimento.`
            : `As etapas ${pendingLabels.join(', ')} ainda estão em desenvolvimento.`}
        </aside>
      )}
    </div>
  )
}
