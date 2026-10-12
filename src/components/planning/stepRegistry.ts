import { DatesStep } from './DatesStep'
import { DestinationStep } from './DestinationStep'
import {
  resolveTripDays,
  type PlanningDraft,
  type PlanningStepId,
  type StepRegistry,
} from './planningSteps'

/**
 * Etapas implementadas: destino e datas. As demais (viajantes, transporte,
 * interesses, orçamento e revisão) entram aqui quando forem entregues.
 */
export const STEP_REGISTRY: StepRegistry = {
  destino: DestinationStep,
  datas: DatesStep,
}

/** Critério de conclusão de cada etapa (etapa sem critério conta como completa). */
export const STEP_COMPLETION: Partial<Record<PlanningStepId, (draft: PlanningDraft) => boolean>> = {
  destino: (draft) => draft.destinationId !== '',
  datas: (draft) => resolveTripDays(draft) !== null,
}

/** Orientação exibida enquanto a etapa não está completa. */
export const STEP_HINTS: Partial<Record<PlanningStepId, string>> = {
  destino: 'Selecione um destino para continuar.',
  datas: 'Informe uma duração válida (de 1 a 14 dias) para continuar.',
}
