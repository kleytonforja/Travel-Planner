import { DestinationStep } from './DestinationStep'
import type { StepRegistry } from './planningSteps'

/**
 * Etapas implementadas. Hoje apenas a de destino; as demais (datas,
 * viajantes, transporte, interesses, orçamento e revisão) entram aqui
 * quando forem entregues.
 */
export const STEP_REGISTRY: StepRegistry = {
  destino: DestinationStep,
}
