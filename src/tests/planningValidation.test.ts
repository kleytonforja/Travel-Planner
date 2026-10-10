import { describe, expect, it } from 'vitest'

import { destinations } from '../data/destinations'
import { validatePlanningInput } from '../services/planningValidation'
import type { PlanningInput } from '../types'

const KNOWN_IDS = destinations.map((destination) => destination.id)

const VALID_INPUT: PlanningInput = {
  destinationId: KNOWN_IDS[0],
  days: 5,
  interests: ['natureza', 'gastronomia'],
  style: 'equilibrado',
  budget: 2000,
}

describe('validatePlanningInput', () => {
  it('aceita um planejamento com todos os campos válidos', () => {
    const result = validatePlanningInput(VALID_INPUT, KNOWN_IDS)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('rejeita quando nenhum destino é selecionado', () => {
    const result = validatePlanningInput(
      { ...VALID_INPUT, destinationId: '' },
      KNOWN_IDS,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.destinationId).toBeTruthy()
  })

  it('rejeita destino que não existe na base local', () => {
    const result = validatePlanningInput(
      { ...VALID_INPUT, destinationId: 'destino-inexistente' },
      KNOWN_IDS,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.destinationId).toBeTruthy()
  })

  it.each([0, -3, 15, 2.5, Number.NaN])(
    'rejeita duração fora do intervalo de 1 a 14 dias inteiros (%s)',
    (days) => {
      const result = validatePlanningInput({ ...VALID_INPUT, days }, KNOWN_IDS)
      expect(result.valid).toBe(false)
      expect(result.errors.days).toBeTruthy()
    },
  )

  it.each([1, 14])('aceita os limites de duração (%s dias)', (days) => {
    const result = validatePlanningInput({ ...VALID_INPUT, days }, KNOWN_IDS)
    expect(result.errors.days).toBeUndefined()
  })

  it('rejeita quando nenhum interesse é selecionado', () => {
    const result = validatePlanningInput(
      { ...VALID_INPUT, interests: [] },
      KNOWN_IDS,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.interests).toBeTruthy()
  })

  it('rejeita estilo de viagem inválido', () => {
    const result = validatePlanningInput(
      { ...VALID_INPUT, style: 'luxo' as PlanningInput['style'] },
      KNOWN_IDS,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.style).toBeTruthy()
  })

  it.each([0, -100, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejeita orçamento não positivo ou inválido (%s)',
    (budget) => {
      const result = validatePlanningInput(
        { ...VALID_INPUT, budget },
        KNOWN_IDS,
      )
      expect(result.valid).toBe(false)
      expect(result.errors.budget).toBeTruthy()
    },
  )

  it('acumula erros de múltiplos campos ao mesmo tempo', () => {
    const result = validatePlanningInput(
      {
        destinationId: '',
        days: 0,
        interests: [],
        style: '' as PlanningInput['style'],
        budget: -1,
      },
      KNOWN_IDS,
    )
    expect(result.valid).toBe(false)
    expect(Object.keys(result.errors)).toHaveLength(5)
  })
})
