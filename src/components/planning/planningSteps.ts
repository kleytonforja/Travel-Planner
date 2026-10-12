import type { ComponentType } from 'react'

import { DEFAULT_BUDGET, type BudgetDraft } from '../../utils/budget'
import type { InterestCategory } from '../../types'
import { DEFAULT_PACE, type TripPace } from '../../utils/interests'
import { DEFAULT_TRANSPORT, type TransportDraft } from '../../utils/transport'
import { DEFAULT_TRAVELERS, type TravelersDraft } from '../../utils/travelers'
import { isValidDuration, validateTripDates } from '../../utils/tripDates'

/**
 * Estrutura do planejamento progressivo (V1-T3).
 *
 * As sete etapas previstas ficam declaradas aqui. Uma etapa só é navegável
 * quando existe em `STEP_REGISTRY`; as demais são exibidas apenas no
 * indicador de progresso, sem controles. Para entregar uma nova etapa,
 * basta criar o componente e registrá-lo — a navegação e o indicador não
 * precisam ser reescritos.
 */

export const PLANNING_STEPS = [
  { id: 'destino', label: 'Destino' },
  { id: 'datas', label: 'Datas' },
  { id: 'viajantes', label: 'Viajantes' },
  { id: 'transporte', label: 'Transporte' },
  { id: 'interesses', label: 'Interesses' },
  { id: 'orcamento', label: 'Orçamento' },
  { id: 'revisao', label: 'Revisão' },
] as const

export type PlanningStepId = (typeof PLANNING_STEPS)[number]['id']

/** Como o usuário informa a duração: datas exatas ou apenas a quantidade de dias. */
export type DateMode = 'dates' | 'duration'

/**
 * Rascunho do planejamento compartilhado entre as etapas e a navegação.
 * Guarda, ao mesmo tempo, as escolhas dos dois modos da etapa de datas, para
 * que alternar entre eles não apague nada. Vive apenas na sessão (memória).
 */
export interface PlanningDraft {
  /** Identificador do destino do catálogo ('' = nenhum selecionado). */
  destinationId: string
  /** Modo escolhido na etapa de datas (`null` = ainda não escolhido). */
  dateMode: DateMode | null
  /** Datas `AAAA-MM-DD` do modo "datas" ('' = não informada). */
  startDate: string
  endDate: string
  /** Duração do modo "duração" (`null` = não escolhida ou inválida). */
  durationDays: number | null
  /** Perfil do grupo (etapa 3); começa com 1 adulto. */
  travelers: TravelersDraft
  /** Preferências de transporte (etapa 4); só declaradas, sem cálculo. */
  transport: TransportDraft
  /** Interesses (etapa 5), categorias do catálogo; o motor exige ao menos um. */
  interests: InterestCategory[]
  /** Ritmo da viagem (etapa 5); ainda não usado pelo motor. */
  pace: TripPace
  /** Estilo financeiro e orçamento opcional (etapa 6); o motor ainda não os recebe do fluxo. */
  budget: BudgetDraft
}

export const EMPTY_DRAFT: PlanningDraft = {
  destinationId: '',
  dateMode: null,
  startDate: '',
  endDate: '',
  durationDays: null,
  travelers: DEFAULT_TRAVELERS,
  transport: DEFAULT_TRANSPORT,
  interests: [],
  pace: DEFAULT_PACE,
  budget: DEFAULT_BUDGET,
}

/**
 * Duração em dias que o motor de roteiros usará, conforme o modo escolhido;
 * `null` enquanto não houver duração válida (1 a 14 dias).
 */
export function resolveTripDays(draft: PlanningDraft): number | null {
  if (draft.dateMode === 'dates') {
    const result = validateTripDates(draft.startDate, draft.endDate)
    return result.status === 'valid' ? result.days : null
  }
  if (draft.dateMode === 'duration') {
    return isValidDuration(draft.durationDays) ? draft.durationDays : null
  }
  return null
}

export interface StepProps {
  draft: PlanningDraft
  onDraftChange: (patch: Partial<PlanningDraft>) => void
}

/** Componentes das etapas já implementadas. */
export type StepRegistry = Partial<Record<PlanningStepId, ComponentType<StepProps>>>

export function isStepImplemented(id: PlanningStepId, registry: StepRegistry): boolean {
  return registry[id] !== undefined
}
