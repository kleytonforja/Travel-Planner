import { beforeEach, describe, expect, it } from 'vitest'

import { destinations } from '../data/destinations'
import {
  isSavedItinerary,
  loadSavedItineraries,
  STORAGE_KEY,
  validateSavedItinerary,
} from '../services/itineraryStorage'
import type { SavedItinerary, ScheduledActivity } from '../types'
import {
  buildHistoricalValidRecord,
  buildOverlappingHistoricalRecord,
} from './fixtures/savedItineraries'

/**
 * Testes de regressão da VALIDAÇÃO estrutural e semântica (TP-02),
 * conforme docs/PERSISTENCE_REMEDIATION_PLAN.md (seção 5 e tabela de
 * testes). Cada cenário parte de um registro válido e introduz UMA
 * inconsistência, conferindo a rejeição com motivo.
 */

function getActivity(activityId: string) {
  const activity = destinations
    .flatMap((destination) => destination.activities)
    .find((item) => item.id === activityId)
  if (!activity) throw new Error(`atividade de teste inexistente: ${activityId}`)
  return activity
}

/** Cópia profunda do registro histórico válido, pronta para mutação. */
function validRecord(): SavedItinerary {
  return structuredClone(buildHistoricalValidRecord())
}

function reasonsOf(record: unknown): string[] {
  const result = validateSavedItinerary(record)
  expect(result.ok).toBe(false)
  return result.reasons
}

/** Regrava os totais após alterar os custos das atividades do dia. */
function syncTotals(record: SavedItinerary): void {
  const cost = record.itinerary.days.reduce(
    (total, day) =>
      total +
      day.activities.reduce((sum, item) => sum + item.activity.estimatedCost, 0),
    0,
  )
  record.itinerary.totals = {
    estimatedActivitiesCost: cost,
    unallocatedBudget: (record.itinerary.input.budget as number) - cost,
    averageCostPerDay: cost / record.itinerary.input.days,
  }
}

describe('validação de registros persistidos (TP-02)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('aceita o registro histórico válido da fixture (sanidade da base)', () => {
    const record = buildHistoricalValidRecord()
    const result = validateSavedItinerary(record)
    expect(result.reasons).toEqual([])
    expect(result.ok).toBe(true)
    expect(isSavedItinerary(record)).toBe(true)
  })

  describe('datas reais de calendário', () => {
    it.each([
      ['2026-02-30T10:00:00Z', '30 de fevereiro'],
      ['2026-04-31T10:00:00Z', '31 de abril'],
      ['2023-02-29T10:00:00Z', '29/02 em ano não bissexto'],
      ['2026-01-15T24:00:00Z', 'horário 24:00'],
      ['2026-01-15T10:60:00Z', 'minuto 60'],
      ['2026-13-15T10:00:00Z', 'mês 13'],
    ])('rejeita data normalizada indevidamente: %s (%s)', (savedAt) => {
      const record = validRecord()
      record.savedAt = savedAt
      expect(reasonsOf(record).join(' ')).toContain('data de salvamento')
    })

    it.each([
      '2024-02-29T10:00:00Z', // ano bissexto
      '2026-01-15T23:59:59Z',
      '2026-01-15T23:59:59.9Z', // fração de 1 dígito
      '2026-01-15T23:59:59.999Z', // fração de 3 dígitos
    ])('aceita data real: %s', (savedAt) => {
      const record = validRecord()
      record.savedAt = savedAt
      expect(isSavedItinerary(record)).toBe(true)
    })

    it('rejeita formato sem segundos ou fora do padrão ISO UTC', () => {
      const record = validRecord()
      record.savedAt = '2026-01-15T10:00Z'
      expect(isSavedItinerary(record)).toBe(false)
      record.savedAt = 'ontem'
      expect(isSavedItinerary(record)).toBe(false)
    })
  })

  describe('dias do roteiro', () => {
    it('rejeita dias fora de sequência, com motivo', () => {
      const record = validRecord()
      record.itinerary.days = [record.itinerary.days[1], record.itinerary.days[0]]
      expect(reasonsOf(record).join(' ')).toContain('fora de sequência')
    })

    it('rejeita numeração de dias duplicada', () => {
      const record = validRecord()
      record.itinerary.days[1].dayNumber = 1
      expect(reasonsOf(record).join(' ')).toContain('fora de sequência')
    })

    it('rejeita dia sem lista de atividades', () => {
      const record = validRecord()
      const days = record.itinerary.days as unknown as Record<string, unknown>[]
      delete days[0].activities
      expect(reasonsOf(record).join(' ')).toContain('sem lista de atividades')
    })

    it('rejeita quantidade de dias incompleta', () => {
      const record = validRecord()
      record.itinerary.days = record.itinerary.days.slice(0, 1)
      expect(reasonsOf(record).join(' ')).toContain('quantidade de dias')
    })
  })

  describe('atividades', () => {
    it('rejeita a mesma atividade repetida no roteiro', () => {
      const record = validRecord()
      const mercado = record.itinerary.days[0].activities[0]
      record.itinerary.days[1].activities.push({
        activity: mercado.activity,
        period: 'noite',
        startMinutes: 19 * 60,
        endMinutes: 21 * 60,
      })
      syncTotals(record)
      expect(reasonsOf(record).join(' ')).toContain('repetida')
    })

    it('rejeita atividade incompatível com o estilo do planejamento', () => {
      const record = validRecord()
      // Passeio de escuna: apenas estilo confortável; o planejamento é equilibrado.
      const escuna = getActivity('fln-passeio-escuna')
      record.itinerary.days[1].activities.push({
        activity: escuna,
        period: 'noite',
        startMinutes: 19 * 60,
        endMinutes: 23 * 60,
      })
      syncTotals(record)
      expect(reasonsOf(record).join(' ')).toContain('incompatível com o estilo')
    })

    it('rejeita atividade que não atende a nenhum interesse do planejamento', () => {
      const record = validRecord()
      // Jurerê: apenas relaxamento; interesses são natureza e gastronomia.
      const jurere = getActivity('fln-jurere-internacional')
      record.itinerary.days[1].activities.push({
        activity: jurere,
        period: 'noite',
        startMinutes: 19 * 60,
        endMinutes: 23 * 60,
      })
      syncTotals(record)
      expect(reasonsOf(record).join(' ')).toContain('nenhum interesse')
    })

    it('rejeita atividade com campos obrigatórios incompletos', () => {
      const record = validRecord()
      const scheduled = record.itinerary.days[0].activities[0]
      scheduled.activity.name = ''
      expect(reasonsOf(record).join(' ')).toContain('incompletos')
    })
  })

  describe('horários', () => {
    it('rejeita sobreposição de horários (registro histórico anterior à TP-01)', () => {
      const record = buildOverlappingHistoricalRecord()
      expect(reasonsOf(record).join(' ')).toContain('sobrepostos')

      // Na leitura, o registro é identificado e preservado: o conteúdo
      // bruto permanece intacto e nada é descartado automaticamente.
      const raw = JSON.stringify([record])
      localStorage.setItem(STORAGE_KEY, raw)
      const load = loadSavedItineraries()
      expect(load.records).toEqual([])
      expect(load.discardedCount).toBe(1)
      expect(load.rejections[0].reasons.join(' ')).toContain('sobrepostos')
      expect(localStorage.getItem(STORAGE_KEY)).toBe(raw)
    })

    it('aceita atividades que apenas se encostam (término = início)', () => {
      const record = validRecord()
      const touching: ScheduledActivity = {
        activity: {
          id: 'teste-atividade-toque',
          name: 'Atividade de teste',
          description: 'Atividade sintética para o cenário de contato.',
          categories: ['natureza'],
          durationHours: 1.5,
          estimatedCost: 40,
          recommendedPeriod: 'manha',
          suitableStyles: ['equilibrado'],
        },
        period: 'manha',
        // Começa exatamente quando a atividade anterior termina (11:00).
        startMinutes: 11 * 60,
        endMinutes: 12 * 60 + 30,
      }
      record.itinerary.days[0].activities.push(touching)
      syncTotals(record)
      expect(isSavedItinerary(record)).toBe(true)
    })

    it('rejeita atividade fora da janela do seu período', () => {
      const record = validRecord()
      const lagoa = record.itinerary.days[1].activities[0]
      // Tarde começa às 14:00; 13:00 está fora da janela.
      lagoa.startMinutes = 13 * 60
      lagoa.endMinutes = 16 * 60
      expect(reasonsOf(record).join(' ')).toContain('fora das janelas')
    })

    it('aceita passeio de dia inteiro iniciado às 09:00 (exceção existente)', () => {
      const record = validRecord()
      const campeche = getActivity('fln-ilha-do-campeche') // 6 h
      record.itinerary.days[0].activities = [
        {
          activity: campeche,
          period: 'manha',
          startMinutes: 9 * 60,
          endMinutes: 15 * 60,
        },
      ]
      syncTotals(record)
      expect(isSavedItinerary(record)).toBe(true)
    })

    it('rejeita passeio de dia inteiro fora da exceção (início após 09:00)', () => {
      const record = validRecord()
      const campeche = getActivity('fln-ilha-do-campeche')
      record.itinerary.days[0].activities = [
        {
          activity: campeche,
          period: 'manha',
          startMinutes: 10 * 60,
          endMinutes: 16 * 60,
        },
      ]
      syncTotals(record)
      expect(reasonsOf(record).join(' ')).toContain('fora das janelas')
    })

    it('rejeita horário incoerente com a duração declarada', () => {
      const record = validRecord()
      const lagoa = record.itinerary.days[1].activities[0]
      lagoa.endMinutes += 30 // 3,5 h para uma atividade de 3 h
      expect(reasonsOf(record).join(' ')).toContain(
        'incompatível com a duração',
      )
    })

    it('rejeita horários que não são minutos inteiros', () => {
      const record = validRecord()
      record.itinerary.days[0].activities[0].startMinutes = 540.5
      expect(reasonsOf(record).join(' ')).toContain('minutos inteiros')
    })
  })

  describe('integridade financeira', () => {
    it('rejeita saldo −169 com orçamento 1 e custo 170 (cenário do plano)', () => {
      const record = validRecord()
      record.itinerary.input.budget = 1
      record.itinerary.days[0].activities[0].activity.estimatedCost = 140
      record.itinerary.days[1].activities[0].activity.estimatedCost = 30
      record.itinerary.totals = {
        estimatedActivitiesCost: 170,
        unallocatedBudget: -169,
        averageCostPerDay: 85,
      }
      const reasons = reasonsOf(record).join(' ')
      expect(reasons).toContain('saldo não alocado')
    })

    it('rejeita custo estimado superior ao orçamento', () => {
      const record = validRecord()
      // Custo 170 > orçamento 120, com saldo zerado (sem saldo negativo).
      record.itinerary.input.budget = 120
      record.itinerary.days[0].activities[0].activity.estimatedCost = 140
      record.itinerary.days[1].activities[0].activity.estimatedCost = 30
      record.itinerary.totals = {
        estimatedActivitiesCost: 170,
        unallocatedBudget: 0,
        averageCostPerDay: 85,
      }
      expect(reasonsOf(record).join(' ')).toContain('superior ao orçamento')
    })

    it('rejeita valores não finitos (NaN e Infinity)', () => {
      const withNan = validRecord()
      withNan.itinerary.totals.averageCostPerDay = Number.NaN
      expect(isSavedItinerary(withNan)).toBe(false)

      const withInfinity = validRecord()
      withInfinity.itinerary.totals.unallocatedBudget = Number.POSITIVE_INFINITY
      expect(isSavedItinerary(withInfinity)).toBe(false)
    })

    it('rejeita overflow na soma dos custos das atividades', () => {
      const record = validRecord()
      record.itinerary.input.budget = Number.MAX_VALUE
      record.itinerary.days[0].activities[0].activity.estimatedCost =
        Number.MAX_VALUE
      record.itinerary.days[1].activities[0].activity.estimatedCost =
        Number.MAX_VALUE
      record.itinerary.totals = {
        estimatedActivitiesCost: Number.POSITIVE_INFINITY,
        unallocatedBudget: 0,
        averageCostPerDay: Number.POSITIVE_INFINITY,
      }
      expect(isSavedItinerary(record)).toBe(false)
    })

    it('rejeita discrepância financeira acima da tolerância absoluta (1e-6)', () => {
      const record = validRecord()
      record.itinerary.totals.estimatedActivitiesCost += 0.01
      expect(reasonsOf(record).join(' ')).toContain(
        'não corresponde às atividades',
      )
    })

    it('aceita média periódica e diferenças inferiores à tolerância, sem arredondar o armazenamento', () => {
      const record = validRecord()
      // Custo 100 em 3 dias: média periódica 33,333...
      record.itinerary.input.days = 3
      record.itinerary.days.push({ dayNumber: 3, activities: [] })
      record.itinerary.days[0].activities[0].activity.estimatedCost = 70
      record.itinerary.totals = {
        estimatedActivitiesCost: 100,
        unallocatedBudget: (record.itinerary.input.budget as number) - 100,
        averageCostPerDay: 100 / 3,
      }
      expect(isSavedItinerary(record)).toBe(true)

      // Representação truncada da média periódica (diferença < 1e-6).
      record.itinerary.totals.averageCostPerDay = 33.33333333333333
      expect(isSavedItinerary(record)).toBe(true)

      // A leitura não arredonda nem altera o valor armazenado.
      localStorage.setItem(STORAGE_KEY, JSON.stringify([record]))
      const load = loadSavedItineraries()
      expect(load.status).toBe('ok')
      expect(load.records[0].itinerary.totals.averageCostPerDay).toBe(
        33.33333333333333,
      )
    })
  })

  describe('identificadores', () => {
    it('rejeita identificador composto apenas de espaços', () => {
      const record = validRecord()
      record.id = '   '
      expect(reasonsOf(record).join(' ')).toContain('identificador')
    })
  })

  describe('dados históricos válidos', () => {
    it('preserva o registro histórico, inclusive campos adicionais desconhecidos', () => {
      const historical = {
        ...buildHistoricalValidRecord(),
        origem: 'amostra-historica-auditoria',
      }
      const raw = JSON.stringify([historical])
      localStorage.setItem(STORAGE_KEY, raw)

      const load = loadSavedItineraries()
      expect(load.status).toBe('ok')
      expect(load.discardedCount).toBe(0)
      expect(load.records).toHaveLength(1)
      // ID e data históricos preservados, sem migração nem reescrita.
      expect(load.records[0].id).toBe(historical.id)
      expect(load.records[0].savedAt).toBe(historical.savedAt)
      expect((load.records[0] as unknown as Record<string, unknown>).origem).toBe(
        'amostra-historica-auditoria',
      )
      expect(localStorage.getItem(STORAGE_KEY)).toBe(raw)
    })
  })
})
