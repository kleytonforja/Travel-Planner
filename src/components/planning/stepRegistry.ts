import { isBudgetComplete } from '../../utils/budget'
import { hasInterests } from '../../utils/interests'
import { isTransportComplete } from '../../utils/transport'
import { validateTravelers } from '../../utils/travelers'
import { BudgetStep } from './BudgetStep'
import { DatesStep } from './DatesStep'
import { DestinationStep } from './DestinationStep'
import { InterestsStep } from './InterestsStep'
import { ReviewStep } from './ReviewStep'
import { TransportStep } from './TransportStep'
import { TravelersStep } from './TravelersStep'
import {
  resolveTripDays,
  type PlanningDraft,
  type PlanningStepId,
  type StepRegistry,
} from './planningSteps'

/**
 * As sete etapas do planejamento progressivo estão implementadas.
 */
export const STEP_REGISTRY: StepRegistry = {
  destino: DestinationStep,
  datas: DatesStep,
  viajantes: TravelersStep,
  transporte: TransportStep,
  interesses: InterestsStep,
  orcamento: BudgetStep,
  revisao: ReviewStep,
}

/** Critério de conclusão de cada etapa (etapa sem critério conta como completa). */
export const STEP_COMPLETION: Partial<Record<PlanningStepId, (draft: PlanningDraft) => boolean>> = {
  destino: (draft) => draft.destinationId !== '',
  datas: (draft) => resolveTripDays(draft) !== null,
  viajantes: (draft) => validateTravelers(draft.travelers).valid,
  transporte: (draft) => isTransportComplete(draft.transport),
  interesses: (draft) => hasInterests(draft.interests),
  orcamento: (draft) => isBudgetComplete(draft.budget),
  // A revisão mostra o que falta e bloqueia só a geração (ver `planningAdapter`).
  revisao: () => true,
}

/** Orientação exibida enquanto a etapa não está completa. */
export const STEP_HINTS: Partial<Record<PlanningStepId, string>> = {
  destino: 'Selecione um destino para continuar.',
  datas: 'Informe uma duração válida (de 1 a 14 dias) para continuar.',
  viajantes: 'Inclua pelo menos um adulto para continuar.',
  transporte: 'Corrija a cidade de origem (ou apague o campo) para continuar.',
  interesses: 'Selecione pelo menos um interesse para continuar.',
  orcamento: 'Corrija o valor do orçamento (ou escolha "Ainda não defini") para continuar.',
}
