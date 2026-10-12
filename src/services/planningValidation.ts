import type { PlanningInput, TravelStyle, TripPace } from '../types'

/**
 * Validação do formulário de planejamento.
 *
 * Regra de negócio pura e determinística, separada da interface para
 * facilitar testes (ver `src/tests/planningValidation.test.ts`).
 */

export const MIN_DAYS = 1
export const MAX_DAYS = 14

export type PlanningField =
  | 'destinationId'
  | 'days'
  | 'interests'
  | 'style'
  | 'budget'
  | 'pace'

export interface PlanningValidationResult {
  valid: boolean
  /** Mensagens de erro em pt-BR, indexadas por campo. */
  errors: Partial<Record<PlanningField, string>>
}

const VALID_STYLES: TravelStyle[] = ['economico', 'equilibrado', 'confortavel']

const VALID_PACES: readonly TripPace[] = ['tranquilo', 'equilibrado', 'intenso']

/**
 * Contrato v2 do orçamento: quando PRESENTE, deve ser um número finito e
 * positivo. `null`, 0, negativos, NaN, Infinity e não numéricos são inválidos.
 * (A AUSÊNCIA — propriedade omitida — é tratada por quem chama.)
 */
export function isValidBudgetValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

/** Contrato v2 do ritmo: quando PRESENTE, deve ser um dos três valores conhecidos. */
export function isValidPace(value: unknown): value is TripPace {
  return typeof value === 'string' && (VALID_PACES as readonly string[]).includes(value)
}

/**
 * Valida os dados do formulário de planejamento.
 *
 * @param input dados informados pelo usuário.
 * @param knownDestinationIds ids de destinos cadastrados na base local.
 */
export function validatePlanningInput(
  input: PlanningInput,
  knownDestinationIds: string[],
): PlanningValidationResult {
  const errors: Partial<Record<PlanningField, string>> = {}

  if (!input.destinationId) {
    errors.destinationId = 'Selecione um destino para a viagem.'
  } else if (!knownDestinationIds.includes(input.destinationId)) {
    errors.destinationId = 'Destino inválido. Escolha uma opção da lista.'
  }

  if (
    !Number.isFinite(input.days) ||
    !Number.isInteger(input.days) ||
    input.days < MIN_DAYS ||
    input.days > MAX_DAYS
  ) {
    errors.days = `Informe uma duração entre ${MIN_DAYS} e ${MAX_DAYS} dias.`
  }

  if (input.interests.length === 0) {
    errors.interests = 'Selecione pelo menos um interesse.'
  }

  if (!VALID_STYLES.includes(input.style)) {
    errors.style = 'Selecione um estilo de viagem.'
  }

  // Orçamento opcional (v2): a ausência (propriedade omitida) é válida e significa "sem teto
  // financeiro". Quando presente — inclusive null, 0 ou negativo — precisa ser finito e > 0.
  if (input.budget !== undefined && !isValidBudgetValue(input.budget)) {
    errors.budget = 'Informe um orçamento numérico maior que zero ou deixe o orçamento em branco.'
  }

  // `pace` é opcional, mas, se presente, precisa ser conhecido (inclusive `null`).
  if ('pace' in input && input.pace !== undefined && !isValidPace(input.pace)) {
    errors.pace = 'Selecione um ritmo de viagem válido.'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}
