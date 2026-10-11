import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  CORRUPTED_BACKUP_KEY,
  loadSavedItineraries,
  saveItinerary,
  STORAGE_KEY,
  validateSavedItinerary,
} from '../services/itineraryStorage'
import type { Activity, SavedItinerary } from '../types'
import { buildHistoricalValidRecord } from './fixtures/savedItineraries'
import {
  installWebLocksMock,
  uninstallWebLocksMock,
} from './helpers/webLocksMock'

/**
 * Testes adversos de VALIDAÇÃO FINANCEIRA — reprodução dos achados
 * AUD-03 e AUD-04 da auditoria independente final
 * (docs/FINAL_AUDIT_FINDINGS.md, seção 3):
 *
 * - AUD-03: custo superior ao orçamento era aceito quando a diferença
 *   ficava dentro da tolerância absoluta de 1e-6. O plano (seção 5)
 *   exige REJEITAR custo superior ao orçamento; a tolerância só se
 *   aplica às relações financeiras que a admitem.
 * - AUD-04: o saldo era validado por `custo + saldo ≈ orçamento`; com
 *   valores grandes, a soma absorvia um saldo incorreto pela precisão
 *   numérica. O plano exige comparar o saldo com orçamento − custo.
 *
 * Cada cenário é exercitado nos três caminhos que compartilham a
 * validação: `validateSavedItinerary`, `loadSavedItineraries` e
 * `saveItinerary` (que deve falhar sem NENHUMA escrita nas duas chaves).
 *
 * Cenário exato do AUD-03: uma atividade de custo 10, um dia,
 * orçamento 9.9999995, custo estimado 10, saldo declarado 0 e média 10.
 * Cenário exato do AUD-04: orçamento e custo 10000000000000000, saldo
 * declarado 1 (o calculado é 0), um dia, média 10000000000000000.
 */

/** Atividade sintética válida, com custo parametrizável. */
function buildActivity(cost: number): Activity {
  return {
    id: 'teste-atividade-financeira',
    name: 'Atividade sintética',
    description: 'Atividade sintética para os cenários financeiros.',
    categories: ['natureza'],
    durationHours: 2,
    estimatedCost: cost,
    recommendedPeriod: 'manha',
    suitableStyles: ['equilibrado'],
  }
}

interface FinancialScenario {
  budget: number
  activityCost: number
  estimated: number
  unallocated: number
  average: number
}

/** Registro estruturalmente válido de 1 dia com os totais do cenário. */
function buildFinancialRecord(scenario: FinancialScenario): SavedItinerary {
  return {
    id: 'roteiro-cenario-financeiro',
    savedAt: '2026-01-15T10:00:00Z',
    itinerary: {
      input: {
        destinationId: 'florianopolis',
        days: 1,
        interests: ['natureza'],
        style: 'equilibrado',
        budget: scenario.budget,
      },
      days: [
        {
          dayNumber: 1,
          activities: [
            {
              activity: buildActivity(scenario.activityCost),
              period: 'manha',
              startMinutes: 9 * 60,
              endMinutes: 11 * 60,
            },
          ],
        },
      ],
      totals: {
        estimatedActivitiesCost: scenario.estimated,
        unallocatedBudget: scenario.unallocated,
        averageCostPerDay: scenario.average,
      },
      warnings: [],
    },
  }
}

function readMainRaw(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

function readQuarantineRaw(): string | null {
  return localStorage.getItem(CORRUPTED_BACKUP_KEY)
}

describe('validação financeira (AUD-03 e AUD-04)', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
  })

  afterEach(() => {
    uninstallWebLocksMock()
  })

  describe('AUD-03: custo superior ao orçamento, mesmo dentro da tolerância', () => {
    const record = (): SavedItinerary =>
      buildFinancialRecord({
        budget: 9.9999995,
        activityCost: 10,
        estimated: 10,
        unallocated: 0,
        average: 10,
      })

    it('a validação rejeita o caso exato da auditoria', () => {
      const result = validateSavedItinerary(record())
      expect(result.ok).toBe(false)
      expect(result.reasons.join(' ')).toContain('superior ao orçamento')
    })

    it('a leitura classifica o registro como corrompido, sem alterar a chave', () => {
      const raw = JSON.stringify([record()])
      localStorage.setItem(STORAGE_KEY, raw)

      const load = loadSavedItineraries()
      expect(load.status).toBe('corrupted')
      expect(load.records).toEqual([])
      expect(load.discardedCount).toBe(1)
      expect(load.rejections[0].reasons.join(' ')).toContain(
        'superior ao orçamento',
      )
      // A leitura nunca altera o conteúdo observado.
      expect(readMainRaw()).toBe(raw)
      expect(readQuarantineRaw()).toBeNull()
    })

    it('o salvamento falha sem nenhuma escrita nas duas chaves', async () => {
      const invalid = record()
      const result = await saveItinerary(invalid.itinerary)

      expect(result.ok).toBe(false)
      if (!result.ok && result.outcome !== 'needs-confirmation') {
        expect(result.message).toContain('validação interna')
      }
      expect(readMainRaw()).toBeNull()
      expect(readQuarantineRaw()).toBeNull()
    })

    it('o limite é respeitado: custo igual ao orçamento permanece válido', () => {
      const atLimit = buildFinancialRecord({
        budget: 10,
        activityCost: 10,
        estimated: 10,
        unallocated: 0,
        average: 10,
      })
      expect(validateSavedItinerary(atLimit).ok).toBe(true)

      localStorage.setItem(STORAGE_KEY, JSON.stringify([atLimit]))
      expect(loadSavedItineraries().status).toBe('ok')
    })

    it('custo abaixo do orçamento por menos que a tolerância permanece válido', () => {
      const budget = 10.0000005
      const below = buildFinancialRecord({
        budget,
        activityCost: 10,
        estimated: 10,
        unallocated: budget - 10,
        average: 10,
      })
      expect(validateSavedItinerary(below).ok).toBe(true)
    })
  })

  describe('AUD-04: saldo comparado diretamente com orçamento − custo', () => {
    const BIG = 10000000000000000
    const record = (): SavedItinerary =>
      buildFinancialRecord({
        budget: BIG,
        activityCost: BIG,
        estimated: BIG,
        unallocated: 1,
        average: BIG,
      })

    it('a validação rejeita o caso exato da auditoria (discrepância de 1 absorvida pela soma)', () => {
      // Controle da premissa: orçamento − custo é 0 e a soma custo +
      // saldo perde a discrepância pela precisão numérica.
      expect(BIG - BIG).toBe(0)
      expect(BIG + 1).toBe(BIG)

      const result = validateSavedItinerary(record())
      expect(result.ok).toBe(false)
      expect(result.reasons.join(' ')).toContain('saldo não alocado')
    })

    it('a leitura classifica o registro como corrompido, sem alterar a chave', () => {
      const raw = JSON.stringify([record()])
      localStorage.setItem(STORAGE_KEY, raw)

      const load = loadSavedItineraries()
      expect(load.status).toBe('corrupted')
      expect(load.records).toEqual([])
      expect(load.discardedCount).toBe(1)
      expect(load.rejections[0].reasons.join(' ')).toContain(
        'saldo não alocado',
      )
      expect(readMainRaw()).toBe(raw)
      expect(readQuarantineRaw()).toBeNull()
    })

    it('o salvamento falha sem nenhuma escrita nas duas chaves', async () => {
      const invalid = record()
      const result = await saveItinerary(invalid.itinerary)

      expect(result.ok).toBe(false)
      if (!result.ok && result.outcome !== 'needs-confirmation') {
        expect(result.message).toContain('validação interna')
      }
      expect(readMainRaw()).toBeNull()
      expect(readQuarantineRaw()).toBeNull()
    })

    it('o controle com saldo 0 permanece válido (mesmos valores grandes)', () => {
      const control = buildFinancialRecord({
        budget: BIG,
        activityCost: BIG,
        estimated: BIG,
        unallocated: 0,
        average: BIG,
      })
      expect(validateSavedItinerary(control).ok).toBe(true)

      localStorage.setItem(STORAGE_KEY, JSON.stringify([control]))
      expect(loadSavedItineraries().status).toBe('ok')
    })
  })

  describe('demais inconsistências financeiras', () => {
    it('rejeita média diária incorreta além da tolerância', () => {
      const wrongAverage = buildFinancialRecord({
        budget: 500,
        activityCost: 100,
        estimated: 100,
        unallocated: 400,
        // Média correta: 100 ÷ 1 = 100; declarada: 60.
        average: 60,
      })
      const result = validateSavedItinerary(wrongAverage)
      expect(result.ok).toBe(false)
      expect(result.reasons.join(' ')).toContain('custo médio por dia')
    })

    it('rejeita valores não finitos no orçamento e nos custos das atividades', () => {
      const nanBudget = buildFinancialRecord({
        budget: Number.NaN,
        activityCost: 10,
        estimated: 10,
        unallocated: 0,
        average: 10,
      })
      expect(validateSavedItinerary(nanBudget).ok).toBe(false)

      const infiniteActivityCost = buildFinancialRecord({
        budget: 500,
        activityCost: Number.POSITIVE_INFINITY,
        estimated: Number.POSITIVE_INFINITY,
        unallocated: 0,
        average: Number.POSITIVE_INFINITY,
      })
      expect(validateSavedItinerary(infiniteActivityCost).ok).toBe(false)
    })

    it('rejeita custo estimado que não corresponde à soma das atividades', () => {
      const mismatched = buildFinancialRecord({
        budget: 500,
        activityCost: 100,
        // Declarado 100.01: discrepância de 0.01 > 1e-6 em relação à soma.
        estimated: 100.01,
        unallocated: 399.99,
        average: 50.005,
      })
      const result = validateSavedItinerary(mismatched)
      expect(result.ok).toBe(false)
      expect(result.reasons.join(' ')).toContain(
        'não corresponde às atividades',
      )
    })

    it('rejeita saldo negativo mesmo dentro da tolerância', () => {
      const negativeBalance = buildFinancialRecord({
        budget: 10,
        activityCost: 10,
        estimated: 10,
        // Saldo declarado −5e-7: dentro da tolerância, mas negativo.
        unallocated: -0.0000005,
        average: 10,
      })
      const result = validateSavedItinerary(negativeBalance)
      expect(result.ok).toBe(false)
      expect(result.reasons.join(' ')).toContain('saldo não alocado')
    })
  })

  describe('compatibilidade com registros históricos válidos', () => {
    it('o registro histórico da fixture continua válido após o endurecimento', () => {
      const historical = buildHistoricalValidRecord()
      const result = validateSavedItinerary(historical)
      expect(result.reasons).toEqual([])
      expect(result.ok).toBe(true)
    })

    it('a leitura do histórico permanece íntegra, byte a byte', () => {
      const raw = JSON.stringify([buildHistoricalValidRecord()])
      localStorage.setItem(STORAGE_KEY, raw)

      const load = loadSavedItineraries()
      expect(load.status).toBe('ok')
      expect(load.records).toHaveLength(1)
      expect(readMainRaw()).toBe(raw)
    })
  })
})
