import { destinations } from '../../data/destinations'
import { validatePlanningInput } from '../../services/planningValidation'
import type { Destination, PlanningInput } from '../../types'
import { centsToInputValue, computeBudget } from '../../utils/budget'
import { totalTravelers } from '../../utils/travelers'
import { resolveTripDays, type PlanningDraft, type PlanningStepId } from './planningSteps'

/**
 * Adaptador entre o rascunho do planejamento progressivo e o contrato do motor
 * (`PlanningInput`). Não altera o motor nem o formato dos roteiros salvos.
 *
 * Classificação dos dados do rascunho:
 * - Suportados diretamente: destino, interesses, estilo financeiro.
 * - Conversíveis sem perda de significado: duração (datas ou dias → `days`) e
 *   orçamento (valor total ou por pessoa → `budget` por pessoa, em centavos,
 *   arredondando para baixo; nunca inventa valor).
 * - Não suportados pelo motor: datas exatas, composição dos viajantes (só entra
 *   no cálculo do orçamento por pessoa), transporte, ritmo, perfil e acessibilidade.
 */

export interface PlanningIssue {
  /** Etapa onde o usuário pode corrigir o problema. */
  step: PlanningStepId
  message: string
}

export type PlanningAdapterResult =
  | { ok: true; input: PlanningInput; destination: Destination }
  | { ok: false; issues: PlanningIssue[] }

const FIELD_STEP: Record<string, PlanningStepId> = {
  destinationId: 'destino',
  days: 'datas',
  interests: 'interesses',
  style: 'orcamento',
  budget: 'orcamento',
}

/**
 * Monta o `PlanningInput` do motor a partir do rascunho. Sem orçamento (o motor
 * exige valor > 0), a geração é bloqueada em vez de assumir um valor.
 */
export function buildPlanningInput(draft: PlanningDraft): PlanningAdapterResult {
  const destination = destinations.find((item) => item.id === draft.destinationId)
  const figures = computeBudget(draft.budget, totalTravelers(draft.travelers))
  const perPerson = figures !== null && figures.perPersonCents > 0 ? Number(centsToInputValue(figures.perPersonCents)) : NaN

  const input: PlanningInput = {
    destinationId: draft.destinationId,
    days: resolveTripDays(draft) ?? NaN,
    interests: draft.interests,
    style: draft.budget.style,
    budget: perPerson,
  }

  const validation = validatePlanningInput(
    input,
    destinations.map((item) => item.id),
  )
  const issues: PlanningIssue[] = Object.entries(validation.errors).map(([field, message]) => ({
    step: FIELD_STEP[field] ?? 'revisao',
    message: field === 'budget' ? budgetMessage(draft) : (message ?? ''),
  }))
  if (!validation.valid || !destination) {
    return { ok: false, issues: issues.length > 0 ? issues : [{ step: 'destino', message: 'Selecione um destino.' }] }
  }
  return { ok: true, input, destination }
}

function budgetMessage(draft: PlanningDraft): string {
  if (draft.budget.amountMode !== 'value' || draft.budget.amount.trim() === '') {
    return 'Informe um orçamento para gerar o roteiro: o gerador precisa de um valor por pessoa.'
  }
  return 'Corrija o valor do orçamento: o gerador precisa de um valor por pessoa maior que zero.'
}
