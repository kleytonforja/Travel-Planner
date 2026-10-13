import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { destinations } from '../data/destinations'
import { buildPlanningInput } from '../components/planning/planningAdapter'
import { EMPTY_DRAFT, type PlanningDraft } from '../components/planning/planningSteps'
import { serializeItineraryExport } from '../services/itineraryExport'
import { generateItinerary } from '../services/itineraryGenerator'
import { parseItineraryImport } from '../services/itineraryImport'
import { isSavedItinerary, loadSavedItineraries, saveItinerary } from '../services/itineraryStorage'
import { validatePlanningInput } from '../services/planningValidation'
import type { Destination, InterestCategory, Itinerary, PlanningInput, TravelStyle } from '../types'
import { DEFAULT_BUDGET } from '../utils/budget'
import golden from './fixtures/goldenItineraries.json'
import { installWebLocksMock, uninstallWebLocksMock } from './helpers/webLocksMock'

/**
 * Geração sem orçamento (M2.5): ausência de `budget` = sem teto financeiro informado,
 * sem valor fictício e sem Infinity. Com orçamento, o resultado é idêntico ao anterior
 * (golden gerado ANTES da alteração do motor).
 */

const STYLES: TravelStyle[] = ['economico', 'equilibrado', 'confortavel']
const ALL: InterestCategory[] = ['gastronomia', 'natureza', 'cultura', 'aventura', 'compras', 'relaxamento', 'vida-noturna']
const SETS: InterestCategory[][] = [ALL, ['cultura'], ['natureza', 'gastronomia']]
const DAYS = [1, 3, 7, 14]
const BUDGETS = [50, 300, 1000, 1_000_000]

function hash(text: string): string {
  let h = 5381
  for (let i = 0; i < text.length; i += 1) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0
  return h.toString(16)
}

const destinationOf = (id: string) => destinations.find((item) => item.id === id) as Destination

function generate(input: PlanningInput): Itinerary {
  const result = generateItinerary(input, destinationOf(input.destinationId))
  if (!result.ok) throw new Error(`falha inesperada: ${result.message}`)
  return result.itinerary
}

const noBudget = (patch: Partial<PlanningInput> = {}): PlanningInput => ({
  destinationId: 'rio-de-janeiro',
  days: 3,
  interests: ['cultura', 'natureza'],
  style: 'equilibrado',
  ...patch,
})

const ids = (itinerary: Itinerary) => itinerary.days.map((day) => day.activities.map((item) => item.activity.id))

describe('Motor sem orçamento', () => {
  it('gera o roteiro, com custo estimado e média, e sem saldo', () => {
    const itinerary = generate(noBudget())
    const cost = itinerary.days.flatMap((day) => day.activities).reduce((sum, item) => sum + item.activity.estimatedCost, 0)
    expect(cost).toBeGreaterThan(0)
    expect(itinerary.totals.estimatedActivitiesCost).toBe(cost)
    expect(itinerary.totals.averageCostPerDay).toBe(cost / 3)
    expect(itinerary.totals).not.toHaveProperty('unallocatedBudget')
    expect(Object.keys(itinerary.totals)).toEqual(['estimatedActivitiesCost', 'averageCostPerDay'])
    expect(itinerary.input).not.toHaveProperty('budget')
    expect(Number.isFinite(itinerary.totals.estimatedActivitiesCost)).toBe(true)
  })

  it('não há teto financeiro: atividades caras entram e nenhum aviso de orçamento é emitido', () => {
    for (const destination of destinations) {
      const itinerary = generate(noBudget({ destinationId: destination.id, days: 14, interests: ALL, style: 'confortavel' }))
      expect(itinerary.warnings.join(' ')).not.toMatch(/orçamento/i)
      const placed = itinerary.days.flat().length
      void placed
      const eligible = destination.activities.filter((item) => item.suitableStyles.includes('confortavel'))
      const placedIds = new Set(ids(itinerary).flat())
      // Com 14 dias todas as elegíveis cabem; sem teto, nenhuma é cortada por custo.
      expect(placedIds.size).toBe(eligible.length)
      const mostExpensive = [...eligible].sort((a, b) => b.estimatedCost - a.estimatedCost)[0]
      expect(placedIds.has(mostExpensive.id)).toBe(true)
    }
  })

  it('equivale a um orçamento maior que o custo de todas as atividades (mesmas atividades, ordem e custo)', () => {
    for (const destination of destinations) {
      for (const style of STYLES) {
        for (const days of DAYS) {
          const without = generate(noBudget({ destinationId: destination.id, days, interests: ALL, style }))
          const huge = generate({ ...noBudget({ destinationId: destination.id, days, interests: ALL, style }), budget: 1e12 })
          expect(ids(without)).toEqual(ids(huge))
          expect(without.days).toEqual(huge.days)
          expect(without.totals.estimatedActivitiesCost).toBe(huge.totals.estimatedActivitiesCost)
          expect(without.totals.averageCostPerDay).toBe(huge.totals.averageCostPerDay)
          expect(without.warnings).toEqual(huge.warnings)
        }
      }
    }
  })

  it('é determinístico e não repete atividades', () => {
    const input = noBudget({ destinationId: 'florianopolis', days: 7, interests: ALL, style: 'equilibrado' })
    const first = generate(input)
    expect(generate(input)).toEqual(first)
    const flat = ids(first).flat()
    expect(new Set(flat).size).toBe(flat.length)
  })

  it('o roteiro sem orçamento passa na validação de persistência (horários e invariantes)', () => {
    for (const destination of destinations) {
      for (const style of STYLES) {
        const itinerary = generate(noBudget({ destinationId: destination.id, days: 5, interests: ALL, style }))
        expect(isSavedItinerary({ id: 'x', savedAt: '2026-10-12T12:00:00.000Z', itinerary }), `${destination.id} ${style}`).toBe(true)
      }
    }
  })

  it.each([
    ['null', null],
    ['zero', 0],
    ['negativo', -1],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['texto', '100'],
  ])('rejeita orçamento %s (motor e validação)', (_label, value) => {
    const input = { ...noBudget(), budget: value } as unknown as PlanningInput
    const result = generateItinerary(input, destinationOf('rio-de-janeiro'))
    expect(result.ok).toBe(false)
    expect(result.ok === false && result.message).toMatch(/orçamento informado é inválido/)
    expect(validatePlanningInput(input, destinations.map((d) => d.id)).errors.budget).toBeTruthy()
  })

  it('a validação aceita a ausência de orçamento', () => {
    expect(validatePlanningInput(noBudget(), destinations.map((d) => d.id))).toEqual({ valid: true, errors: {} })
  })
})

describe('Regressão: com orçamento, o resultado é idêntico ao de antes', () => {
  it('os 432 cenários gerados antes da alteração do motor produzem exatamente o mesmo resultado', () => {
    const expected = golden as Record<string, string>
    let checked = 0
    for (const destination of destinations) {
      for (const style of STYLES) {
        for (const days of DAYS) {
          SETS.forEach((interests, setIndex) => {
            for (const budget of BUDGETS) {
              const key = `${destination.id}|${style}|${days}|i${setIndex}|${budget}`
              const result = generateItinerary({ destinationId: destination.id, days, interests, style, budget }, destination)
              expect(hash(JSON.stringify(result)), key).toBe(expected[key])
              checked += 1
            }
          })
        }
      }
    }
    expect(checked).toBe(Object.keys(expected).length)
    expect(checked).toBe(432)
  })

  it('com orçamento: teto respeitado, saldo calculado e mensagens existentes preservadas', () => {
    const itinerary = generate({ ...noBudget(), budget: 150 })
    expect(itinerary.totals.estimatedActivitiesCost).toBeLessThanOrEqual(150)
    expect(itinerary.totals.unallocatedBudget).toBe(150 - itinerary.totals.estimatedActivitiesCost)
    expect(Object.keys(itinerary.totals)).toEqual(['estimatedActivitiesCost', 'unallocatedBudget', 'averageCostPerDay'])
    const tooLow = generateItinerary({ ...noBudget({ interests: ['cultura'] }), budget: 0.01 }, destinationOf('rio-de-janeiro'))
    expect(tooLow.ok === false && tooLow.message).toMatch(/orçamento informado não é suficiente/)
    const none = generateItinerary({ ...noBudget({ interests: ['compras'], style: 'confortavel' }), budget: 1000 }, destinationOf('lisboa'))
    void none
  })
})

describe('Adaptador sem orçamento', () => {
  const complete = (budget = DEFAULT_BUDGET): PlanningDraft => ({
    ...EMPTY_DRAFT,
    destinationId: 'lisboa',
    dateMode: 'duration',
    durationDays: 4,
    interests: ['cultura'],
    budget,
  })

  it('a entrada é válida, não leva orçamento ao motor e leva o ritmo', () => {
    const result = buildPlanningInput({ ...complete(), pace: 'intenso' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(Object.keys(result.input).sort()).toEqual(['days', 'destinationId', 'interests', 'pace', 'style'])
    expect(generateItinerary(result.input, result.destination).ok).toBe(true)
  })
})

describe('Persistência e JSON v2 do roteiro gerado sem orçamento', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
  })

  afterEach(() => {
    uninstallWebLocksMock()
  })

  it('gera, salva, relê, exporta v2 e importa preservando dados e custos', async () => {
    const itinerary = generate(noBudget({ destinationId: 'lisboa', days: 4, interests: ['cultura', 'gastronomia'] }))
    const saved = await saveItinerary(itinerary)
    expect(saved.ok).toBe(true)
    if (!saved.ok) return

    const reloaded = loadSavedItineraries()
    expect(reloaded.status).toBe('ok')
    expect(reloaded.records).toHaveLength(1)
    expect(reloaded.records[0].itinerary).toEqual(itinerary)
    expect(reloaded.records[0].itinerary.input).not.toHaveProperty('budget')
    expect(reloaded.records[0].itinerary.totals).not.toHaveProperty('unallocatedBudget')

    const json = serializeItineraryExport(reloaded.records[0], destinationOf('lisboa'))
    expect(JSON.parse(json).schemaVersion).toBe(2)
    expect(json).not.toContain('orcamentoInformado')
    expect(json).not.toContain('saldoNaoAlocado')
    const imported = parseItineraryImport(json)
    expect(imported.ok).toBe(true)
    expect(imported.ok && imported.itinerary).toEqual(itinerary)
    expect(imported.ok && imported.itinerary.totals.estimatedActivitiesCost).toBe(itinerary.totals.estimatedActivitiesCost)
  })

  it('um arquivo v1 histórico (com orçamento) continua importando o mesmo roteiro de antes', () => {
    const itinerary = generate({ ...noBudget({ destinationId: 'lisboa', interests: ['cultura', 'gastronomia'] }), budget: 400 })
    const v1 = { ...JSON.parse(serializeItineraryExport({ id: 'h', savedAt: '2026-01-15T10:00:00.000Z', itinerary }, destinationOf('lisboa'))), schemaVersion: 1 }
    const imported = parseItineraryImport(JSON.stringify(v1))
    expect(imported.ok && imported.itinerary).toEqual(itinerary)
  })
})
