import type { PlanningInput, TravelStyle } from '../types'

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

export interface PlanningValidationResult {
  valid: boolean
  /** Mensagens de erro em pt-BR, indexadas por campo. */
  errors: Partial<Record<PlanningField, string>>
}

const VALID_STYLES: TravelStyle[] = ['economico', 'equilibrado', 'confortavel']

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

  if (!Number.isFinite(input.budget) || input.budget <= 0) {
    errors.budget = 'Informe um orçamento numérico maior que zero.'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}
