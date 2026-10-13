import { describe, expect, it } from 'vitest'

import { destinations } from '../data/destinations'
import { generateItinerary } from '../services/itineraryGenerator'
import { isSavedItinerary, validateSavedItinerary } from '../services/itineraryStorage'
import {
  isValidBudgetValue,
  isValidPace,
  validatePlanningInput,
} from '../services/planningValidation'
import type { ItineraryTotals, PlanningInput, SavedItinerary, TripPace } from '../types'
import { buildHistoricalValidRecord, HISTORICAL_VALID_INPUT } from './fixtures/savedItineraries'

/**
 * Contratos de dados do esquema v2 (M2.2): orçamento, ritmo e saldo opcionais.
 * Os tipos aceitam a ausência; a geração (M2.5), a persistência (M2.3) e a
 * importação/exportação (M2.4) tratam a omissão completa (ver os testes de cada uma).
 */

const KNOWN_IDS = destinations.map((destination) => destination.id)
const rio = destinations.find((destination) => destination.id === 'rio-de-janeiro')!

const base = (): PlanningInput => ({
  destinationId: 'rio-de-janeiro',
  days: 3,
  interests: ['cultura', 'natureza'],
  style: 'equilibrado',
  budget: 3000,
})

/** Entradas com valores que o tipo não permite, como viriam de dados externos. */
const external = (patch: Record<string, unknown>) => ({ ...base(), ...patch }) as unknown as PlanningInput

describe('Contrato v2 — orçamento', () => {
  it('orçamento válido: finito e positivo', () => {
    expect(isValidBudgetValue(0.01)).toBe(true)
    expect(isValidBudgetValue(333.33)).toBe(true)
    expect(isValidBudgetValue(10_000_000)).toBe(true)
    expect(validatePlanningInput(base(), KNOWN_IDS)).toEqual({ valid: true, errors: {} })
  })

  it('ausência é a propriedade omitida e é representável nos tipos', () => {
    const { budget: _omitted, ...withoutBudget } = base()
    void _omitted
    const input: PlanningInput = withoutBudget
    expect('budget' in input).toBe(false)
    // JSON não cria `budget` (nem null) quando a propriedade é omitida.
    expect(JSON.parse(JSON.stringify(input))).not.toHaveProperty('budget')
    // A ausência não é um VALOR de orçamento…
    expect(isValidBudgetValue(undefined)).toBe(false)
    // …mas é uma entrada válida (orçamento opcional, M2.5): gera sem teto e sem saldo.
    expect(validatePlanningInput(input, KNOWN_IDS)).toEqual({ valid: true, errors: {} })
    const generation = generateItinerary(input, rio)
    expect(generation.ok).toBe(true)
    expect(generation.ok && generation.itinerary.totals).not.toHaveProperty('unallocatedBudget')
    expect(generation.ok && generation.itinerary.input).not.toHaveProperty('budget')
  })

  it.each([
    ['nulo', null],
    ['zero', 0],
    ['negativo', -1],
    ['negativo pequeno', -0.01],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['-Infinity', Number.NEGATIVE_INFINITY],
    ['texto', '100'],
    ['booleano', true],
  ])('rejeita orçamento %s', (_label, value) => {
    expect(isValidBudgetValue(value)).toBe(false)
    const result = validatePlanningInput(external({ budget: value }), KNOWN_IDS)
    expect(result.valid).toBe(false)
    expect(result.errors.budget).toBeTruthy()
  })

  it('a persistência rejeita orçamento inválido e orçamento omitido com saldo remanescente (M2.3 aceita a omissão completa)', () => {
    const record = buildHistoricalValidRecord()
    expect(isSavedItinerary(record)).toBe(true)

    const withoutBudget = structuredClone(record) as SavedItinerary
    delete withoutBudget.itinerary.input.budget
    expect(isSavedItinerary(withoutBudget)).toBe(false)
    expect(validateSavedItinerary(withoutBudget).reasons.length).toBeGreaterThan(0)

    for (const bad of [null, 0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const invalid = structuredClone(record) as SavedItinerary
      ;(invalid.itinerary.input as unknown as Record<string, unknown>).budget = bad
      expect(isSavedItinerary(invalid), String(bad)).toBe(false)
    }
  })

  it('roteiro com orçamento mantém o saldo e os totais exatamente como antes', () => {
    const generation = generateItinerary(base(), rio)
    expect(generation.ok).toBe(true)
    if (!generation.ok) return
    const { totals } = generation.itinerary
    expect(totals.unallocatedBudget).toBeDefined()
    expect((totals.unallocatedBudget as number) + totals.estimatedActivitiesCost).toBeCloseTo(3000)
    expect(generation.itinerary.input).not.toHaveProperty('pace')
  })
})

describe('Contrato v2 — saldo opcional', () => {
  it('o saldo ausente é a propriedade omitida e é representável nos tipos', () => {
    const totals: ItineraryTotals = { estimatedActivitiesCost: 10, averageCostPerDay: 5 }
    expect('unallocatedBudget' in totals).toBe(false)
    expect(JSON.parse(JSON.stringify(totals))).not.toHaveProperty('unallocatedBudget')
  })

  it('a persistência rejeita saldo omitido quando há orçamento', () => {
    const record = structuredClone(buildHistoricalValidRecord()) as SavedItinerary
    delete record.itinerary.totals.unallocatedBudget
    expect(isSavedItinerary(record)).toBe(false)
  })
})

describe('Contrato v2 — ritmo', () => {
  it.each<TripPace>(['tranquilo', 'equilibrado', 'intenso'])('ritmo válido: %s', (pace) => {
    expect(isValidPace(pace)).toBe(true)
    expect(validatePlanningInput({ ...base(), pace }, KNOWN_IDS)).toEqual({ valid: true, errors: {} })
  })

  it('ritmo ausente é válido e não é preenchido com padrão', () => {
    expect(validatePlanningInput(base(), KNOWN_IDS).valid).toBe(true)
    expect(isValidPace(undefined)).toBe(false) // não é um valor de ritmo
    expect(base()).not.toHaveProperty('pace')
    const generation = generateItinerary(base(), rio)
    expect(generation.ok && generation.itinerary.input).not.toHaveProperty('pace')
  })

  it.each([
    ['desconhecido', 'relaxado'],
    ['maiúsculas', 'Tranquilo'],
    ['vazio', ''],
    ['nulo', null],
    ['número', 1],
    ['objeto', {}],
  ])('rejeita ritmo %s', (_label, value) => {
    expect(isValidPace(value)).toBe(false)
    const result = validatePlanningInput(external({ pace: value }), KNOWN_IDS)
    expect(result.valid).toBe(false)
    expect(result.errors.pace).toBeTruthy()
  })

  it('o ritmo Intenso equivale a não informar ritmo (sem limite adicional)', () => {
    const plain = generateItinerary(base(), rio)
    const intense = generateItinerary({ ...base(), pace: 'intenso' }, rio)
    expect(intense.ok && plain.ok && intense.itinerary.days).toEqual(plain.ok && plain.itinerary.days)
    expect(intense.ok && plain.ok && intense.itinerary.totals).toEqual(plain.ok && plain.itinerary.totals)
    expect(intense.ok && intense.itinerary.input.pace).toBe('intenso') // gravado no roteiro
  })
})

describe('Contrato v2 — demais campos preservados', () => {
  it('continuam validados como antes', () => {
    expect(validatePlanningInput({ ...base(), destinationId: '' }, KNOWN_IDS).errors.destinationId).toBeTruthy()
    expect(validatePlanningInput({ ...base(), destinationId: 'x' }, KNOWN_IDS).errors.destinationId).toBeTruthy()
    expect(validatePlanningInput({ ...base(), days: 0 }, KNOWN_IDS).errors.days).toBeTruthy()
    expect(validatePlanningInput({ ...base(), days: 15 }, KNOWN_IDS).errors.days).toBeTruthy()
    expect(validatePlanningInput({ ...base(), interests: [] }, KNOWN_IDS).errors.interests).toBeTruthy()
    expect(validatePlanningInput(external({ style: 'x' }), KNOWN_IDS).errors.style).toBeTruthy()
  })

  it('o registro histórico do fixture continua válido', () => {
    expect(HISTORICAL_VALID_INPUT.budget).toBeGreaterThan(0)
    expect(isSavedItinerary(buildHistoricalValidRecord())).toBe(true)
  })
})
