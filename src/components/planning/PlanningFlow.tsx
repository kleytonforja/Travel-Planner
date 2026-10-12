import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { destinations } from '../../data/destinations'
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

interface PlanningFlowProps {
  draft: PlanningDraft
  onDraftChange: (patch: Partial<PlanningDraft>) => void
  /** Abre o formulário tradicional (mantido até todas as etapas existirem). */
  onUseLegacyForm: () => void
  /** Etapas disponíveis; por padrão, as implementadas em `stepRegistry`. */
  registry?: StepRegistry
}

/**
 * Container do planejamento progressivo: indicador de progresso, etapa atual,
 * resumo das escolhas e navegação entre etapas. "Continuar" só aparece quando
 * a próxima etapa existe e só habilita com a etapa atual completa; "Voltar"
 * preserva tudo o que já foi escolhido (o rascunho vive fora das etapas).
 * Enquanto a próxima etapa não existir, o caminho continua pelo formulário
 * tradicional, já preenchido.
 */
export function PlanningFlow({
  draft,
  onDraftChange,
  onUseLegacyForm,
  registry = STEP_REGISTRY,
}: PlanningFlowProps) {
  const [stepIndex, setStepIndex] = useState(0)
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
  const StepComponent = registry[step.id]
  const previous = PLANNING_STEPS[stepIndex - 1]
  const next = PLANNING_STEPS[stepIndex + 1]
  const nextAvailable = next !== undefined && isStepImplemented(next.id, registry)

  const isComplete = (id: (typeof PLANNING_STEPS)[number]['id']) =>
    (STEP_COMPLETION[id] ?? (() => true))(draft)
  const currentComplete = isComplete(step.id)
  // Tudo o que existe até a etapa atual precisa estar completo para seguir.
  const progressComplete = PLANNING_STEPS.slice(0, stepIndex + 1).every((item) => isComplete(item.id))
  const pendingLabels = PLANNING_STEPS.slice(stepIndex + 1)
    .filter((item) => !isStepImplemented(item.id, registry))
    .map((item) => item.label)

  const selected = destinations.find((destination) => destination.id === draft.destinationId)
  const days = resolveTripDays(draft)
  const hint = STEP_HINTS[step.id]

  return (
    <div>
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
          <StepComponent draft={draft} onDraftChange={onDraftChange} />
        ) : (
          <p role="alert" className="text-night-ink">
            Esta etapa ainda não está disponível.
          </p>
        )}
      </div>

      <section
        aria-label="Resumo do planejamento"
        className="mt-8 rounded-card-lg border border-white/15 bg-night-950/60 p-4 text-night-ink"
      >
        <p className="font-semibold text-white">
          {selected ? `Destino selecionado: ${selected.name}` : 'Nenhum destino selecionado'}
        </p>
        {days !== null && (
          <p className="mt-1 text-sm">
            Duração: {days} {days === 1 ? 'dia' : 'dias'}
            {draft.dateMode === 'dates'
              ? ` (${formatShortDate(draft.startDate)} a ${formatShortDate(draft.endDate)})`
              : ''}
          </p>
        )}
      </section>

      {(previous || nextAvailable) && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {previous && (
            <Button variant="onDark" onClick={() => setStepIndex(stepIndex - 1)}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Voltar para {previous.label}
            </Button>
          )}
          {nextAvailable && (
            <Button
              variant="primary"
              disabled={!currentComplete}
              aria-describedby={currentComplete ? undefined : 'ajuda-continuar'}
              onClick={() => setStepIndex(stepIndex + 1)}
            >
              Continuar para {next.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
      {nextAvailable && !currentComplete && hint && (
        <p id="ajuda-continuar" className="mt-2 text-sm text-night-ink-muted">
          {hint}
        </p>
      )}

      {!nextAvailable && (
        <aside
          aria-label="Próximas etapas"
          className="mt-6 rounded-card-lg border border-white/15 bg-night-950/60 p-5 text-night-ink"
        >
          <p className="text-sm text-night-ink-muted">
            {pendingLabels.length > 0
              ? `As etapas ${pendingLabels.join(', ')} ainda estão em desenvolvimento. `
              : ''}
            Enquanto isso, você pode continuar pelo formulário tradicional, que já
            vem com as escolhas feitas até aqui.
          </p>
          <div className="mt-4">
            <Button
              variant="primary"
              onClick={onUseLegacyForm}
              disabled={!progressComplete}
              aria-describedby={progressComplete ? undefined : 'ajuda-formulario-tradicional'}
            >
              Continuar com o formulário tradicional
            </Button>
            {!progressComplete && hint && (
              <p id="ajuda-formulario-tradicional" className="mt-2 text-sm text-night-ink-muted">
                {hint}
              </p>
            )}
          </div>
        </aside>
      )}
    </div>
  )
}
