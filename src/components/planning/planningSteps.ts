import type { ComponentType } from 'react'

/**
 * Estrutura do planejamento progressivo (V1-T3).
 *
 * As sete etapas previstas ficam declaradas aqui. Uma etapa só é navegável
 * quando existe em `STEP_COMPONENTS`; as demais são exibidas apenas no
 * indicador de progresso, sem controles. Para entregar uma nova etapa,
 * basta criar o componente e registrá-lo no mapa — a navegação e o
 * indicador não precisam ser reescritos.
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

/**
 * Rascunho do planejamento compartilhado entre as etapas e a navegação.
 * Hoje guarda apenas o destino; as próximas etapas acrescentam seus campos.
 */
export interface PlanningDraft {
  /** Identificador do destino do catálogo ('' = nenhum selecionado). */
  destinationId: string
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
