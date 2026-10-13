import { destinations } from '../../data/destinations'
import { validatePlanningInput } from '../../services/planningValidation'
import type { Destination, PlanningInput } from '../../types'
import { centsToInputValue, computeBudget, parseAmount, type AmountParse } from '../../utils/budget'
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
 *   arredondando para baixo; sem orçamento, `budget` fica omitido; nunca inventa valor).
 * - Suportado desde o M3: ritmo (limite de atividades por dia).
 * - Não suportados pelo motor: datas exatas, composição dos viajantes (só entra
 *   no cálculo do orçamento por pessoa), transporte, perfil e acessibilidade.
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
 * Monta o `PlanningInput` do motor a partir do rascunho.
 *
 * Orçamento: sem valor informado ("Ainda não defini" ou campo vazio), a propriedade
 * `budget` é OMITIDA (sem teto financeiro): nenhum valor é inventado. Com valor válido,
 * converte-se para valor por pessoa em centavos, arredondando para baixo. Texto inválido,
 * ou valor pequeno demais para dividir entre os viajantes, impede a geração.
 * O ritmo é repassado ao motor (M3), que o aplica como limite de atividades por dia.
 */
export function buildPlanningInput(draft: PlanningDraft): PlanningAdapterResult {
  const destination = destinations.find((item) => item.id === draft.destinationId)
  const travelers = totalTravelers(draft.travelers)
  const parsed: AmountParse =
    draft.budget.amountMode === 'value' ? parseAmount(draft.budget.amount) : { status: 'empty' }
  const issues: PlanningIssue[] = []
  let budgetField: { budget?: number } = {}

  if (parsed.status === 'invalid') {
    issues.push({ step: 'orcamento', message: 'Corrija o valor do orçamento ou escolha "Ainda não defini" para gerar o roteiro.' })
  } else if (parsed.status === 'valid') {
    const figures = computeBudget(draft.budget, travelers)
    if (figures !== null && figures.perPersonCents > 0) {
      budgetField = { budget: Number(centsToInputValue(figures.perPersonCents)) }
    } else {
      issues.push({
        step: 'orcamento',
        message: `O valor é pequeno demais para dividir entre ${travelers} viajantes: aumente o valor ou escolha "Ainda não defini".`,
      })
    }
  }

  const input: PlanningInput = {
    destinationId: draft.destinationId,
    days: resolveTripDays(draft) ?? NaN,
    interests: draft.interests,
    style: draft.budget.style,
    ...budgetField,
    // O ritmo é aplicado pelo motor (limite de atividades por dia) e fica gravado no roteiro.
    pace: draft.pace,
  }

  const validation = validatePlanningInput(
    input,
    destinations.map((item) => item.id),
  )
  for (const [field, message] of Object.entries(validation.errors)) {
    issues.push({ step: FIELD_STEP[field] ?? 'revisao', message: message ?? '' })
  }
  if (issues.length > 0 || !destination) {
    return { ok: false, issues: issues.length > 0 ? issues : [{ step: 'destino', message: 'Selecione um destino.' }] }
  }
  return { ok: true, input, destination }
}
