import { useState } from 'react'

import { destinations } from '../../data/destinations'
import { Button } from '../ui/Button'
import { ProgressSteps } from '../ui/ProgressSteps'
import {
  isStepImplemented,
  PLANNING_STEPS,
  type PlanningDraft,
  type StepRegistry,
} from './planningSteps'
import { STEP_REGISTRY } from './stepRegistry'

interface PlanningFlowProps {
  draft: PlanningDraft
  onDraftChange: (patch: Partial<PlanningDraft>) => void
  /** Abre o formulário tradicional (mantido até todas as etapas existirem). */
  onUseLegacyForm: () => void
  /** Etapas disponíveis; por padrão, as implementadas em `stepRegistry`. */
  registry?: StepRegistry
}

/**
 * Container do planejamento progressivo: indicador de progresso, etapa
 * atual e, enquanto a próxima etapa não existir, o aviso com o caminho para
 * o formulário tradicional. A etapa atual é um índice; chegar às próximas
 * etapas será acrescentar seus componentes ao registro.
 */
export function PlanningFlow({
  draft,
  onDraftChange,
  onUseLegacyForm,
  registry = STEP_REGISTRY,
}: PlanningFlowProps) {
  // Hoje só a primeira etapa existe e nenhum controle muda o índice.
  const [stepIndex] = useState(0)
  const step = PLANNING_STEPS[stepIndex]
  const StepComponent = registry[step.id]
  const next = PLANNING_STEPS[stepIndex + 1]
  const nextAvailable = next !== undefined && isStepImplemented(next.id, registry)
  const pendingLabels = PLANNING_STEPS.slice(stepIndex + 1)
    .filter((item) => !isStepImplemented(item.id, registry))
    .map((item) => item.label)
  const selected = destinations.find((destination) => destination.id === draft.destinationId)

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

      <div className="mt-4">
        {StepComponent ? (
          <StepComponent draft={draft} onDraftChange={onDraftChange} />
        ) : (
          <p role="alert" className="text-night-ink">
            Esta etapa ainda não está disponível.
          </p>
        )}
      </div>

      {!nextAvailable && (
        <aside
          aria-label="Próximas etapas"
          className="mt-10 rounded-card-lg border border-white/15 bg-night-950/60 p-5 text-night-ink"
        >
          <p className="font-semibold text-white">
            {selected ? `Destino selecionado: ${selected.name}` : 'Nenhum destino selecionado'}
          </p>
          <p className="mt-2 text-sm text-night-ink-muted">
            {pendingLabels.length > 0
              ? `As etapas ${pendingLabels.join(', ')} ainda estão em desenvolvimento. `
              : ''}
            Enquanto isso, você pode continuar pelo formulário tradicional, que já
            vem com o destino escolhido.
          </p>
          <div className="mt-4">
            <Button
              variant="primary"
              onClick={onUseLegacyForm}
              disabled={!selected}
              aria-describedby={selected ? undefined : 'ajuda-formulario-tradicional'}
            >
              Continuar com o formulário tradicional
            </Button>
            {!selected && (
              <p id="ajuda-formulario-tradicional" className="mt-2 text-sm text-night-ink-muted">
                Selecione um destino para continuar.
              </p>
            )}
          </div>
        </aside>
      )}
    </div>
  )
}
