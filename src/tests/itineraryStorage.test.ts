import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { destinations } from '../data/destinations'
import { generateItinerary } from '../services/itineraryGenerator'
import {
  buildPlanningFingerprint,
  CORRUPTED_BACKUP_KEY,
  discardCorruptedData,
  isSavedItinerary,
  loadSavedItineraries,
  removeSavedItinerary,
  saveItinerary,
  STORAGE_KEY,
} from '../services/itineraryStorage'
import type { Itinerary, PlanningInput, SavedItinerary } from '../types'

function buildSampleItinerary(
  overrides: Partial<PlanningInput> = {},
): Itinerary {
  const input: PlanningInput = {
    destinationId: 'florianopolis',
    days: 3,
    interests: ['natureza', 'gastronomia'],
    style: 'equilibrado',
    budget: 2000,
    ...overrides,
  }
  const destination = destinations.find((item) => item.id === input.destinationId)
  if (!destination) throw new Error('destino de teste inexistente')
  const result = generateItinerary(input, destination)
  if (!result.ok) throw new Error('falha ao gerar roteiro de teste')
  return result.itinerary
}

function saveOk(itinerary: Itinerary): SavedItinerary {
  const result = saveItinerary(itinerary)
  if (!result.ok) throw new Error(`falha ao salvar roteiro de teste: ${result.message}`)
  return result.record
}

function overwriteStorage(records: unknown[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

function readRawStorage(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

/** Salva um roteiro válido, aplica uma mutação no registro cru e regrava. */
function seedMutatedRecord(
  mutate: (record: Record<string, unknown>) => void,
  itinerary: Itinerary = buildSampleItinerary(),
): void {
  const record = saveOk(itinerary)
  const parsed = JSON.parse(readRawStorage() ?? '[]') as Record<string, unknown>[]
  const target = parsed.find((item) => item.id === record.id)
  if (!target) throw new Error('registro de teste não encontrado')
  mutate(target)
  overwriteStorage(parsed)
}

describe('itineraryStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('salva e recupera um roteiro válido (round-trip/reabertura)', () => {
    const itinerary = buildSampleItinerary()
    const record = saveOk(itinerary)

    expect(record.id).toBeTruthy()
    expect(record.savedAt).toBeTruthy()

    const load = loadSavedItineraries()
    expect(load.status).toBe('ok')
    expect(load.discardedCount).toBe(0)
    expect(load.records).toHaveLength(1)
    expect(load.records[0].id).toBe(record.id)
    expect(load.records[0].itinerary).toEqual(itinerary)
    // O registro reaberto continua válido na validação completa.
    expect(isSavedItinerary(load.records[0])).toBe(true)
  })

  it('retorna status "empty" quando não há nada salvo', () => {
    const load = loadSavedItineraries()
    expect(load.status).toBe('empty')
    expect(load.records).toEqual([])
  })

  it('substitui o registro ao salvar o mesmo planejamento, preservando o identificador', () => {
    const itinerary = buildSampleItinerary()
    const first = saveOk(itinerary)
    const second = saveOk(itinerary)

    expect(second.id).toBe(first.id)
    const load = loadSavedItineraries()
    expect(load.records).toHaveLength(1)
  })

  it('mantém compatibilidade: planejamento equivalente substitui o registro legado com id de hash', () => {
    // Registro no formato antigo (id = hash do planejamento).
    const itinerary = buildSampleItinerary()
    const legacyId = buildPlanningFingerprint(itinerary.input)
    const legacyRecord: SavedItinerary = {
      id: legacyId,
      savedAt: new Date().toISOString(),
      itinerary,
    }
    overwriteStorage([legacyRecord])

    const result = saveItinerary(itinerary)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.record.id).toBe(legacyId)
    expect(loadSavedItineraries().records).toHaveLength(1)
  })

  it('mantém roteiros de planejamentos diferentes, com identificadores únicos', () => {
    const first = saveOk(buildSampleItinerary())
    const second = saveOk(buildSampleItinerary({ days: 5 }))

    expect(first.id).not.toBe(second.id)
    expect(loadSavedItineraries().records).toHaveLength(2)
  })

  it('TP-03: não substitui roteiro diferente cujo id legado colide com a impressão digital do novo', () => {
    const itineraryA = buildSampleItinerary()
    const itineraryB = buildSampleItinerary({ days: 5 })

    // Registro legado: id igual à impressão digital de B, mas contendo o
    // roteiro A — exatamente o efeito da colisão de hash antes da correção.
    const legacyRecord: SavedItinerary = {
      id: buildPlanningFingerprint(itineraryB.input),
      savedAt: new Date().toISOString(),
      itinerary: itineraryA,
    }
    overwriteStorage([legacyRecord])

    const result = saveItinerary(itineraryB)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.record.id).not.toBe(legacyRecord.id)

    const { records } = loadSavedItineraries()
    expect(records).toHaveLength(2)
    const preserved = records.find((item) => item.id === legacyRecord.id)
    expect(preserved).toBeDefined()
    expect(preserved?.itinerary.input).toEqual(itineraryA.input)
  })

  it('remove um roteiro pelo identificador', () => {
    const first = saveOk(buildSampleItinerary())
    const second = saveOk(buildSampleItinerary({ days: 5 }))

    const result = removeSavedItinerary(first.id)
    expect(result.ok).toBe(true)

    const load = loadSavedItineraries()
    expect(load.records).toHaveLength(1)
    expect(load.records[0].id).toBe(second.id)
  })

  it('TP-05: JSON corrompido é "corrupted", nunca tratado como vazio, e não é alterado na leitura', () => {
    localStorage.setItem(STORAGE_KEY, '{json-invalido')

    const load = loadSavedItineraries()
    expect(load.status).toBe('corrupted')
    expect(load.records).toEqual([])
    // A leitura não toca no conteúdo original.
    expect(readRawStorage()).toBe('{json-invalido')
  })

  it('TP-05: conteúdo legível mas em formato inesperado é tratado como corrompido', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ roteiros: [] }))
    const load = loadSavedItineraries()
    expect(load.status).toBe('corrupted')
    expect(load.records).toEqual([])
  })

  it('TP-05: salvar com dados corrompidos move o payload para quarentena em vez de sobrescrevê-lo', () => {
    localStorage.setItem(STORAGE_KEY, '{json-invalido')

    const result = saveItinerary(buildSampleItinerary())
    expect(result.ok).toBe(true)

    // O conteúdo ilegível foi preservado na quarentena...
    expect(localStorage.getItem(CORRUPTED_BACKUP_KEY)).toBe('{json-invalido')
    // ...e a chave principal passou a conter apenas o novo registro válido.
    const load = loadSavedItineraries()
    expect(load.status).toBe('ok')
    expect(load.records).toHaveLength(1)
  })

  it('TP-05: descarte de dados corrompidos exige ação explícita e mantém cópia em quarentena', () => {
    localStorage.setItem(STORAGE_KEY, '{json-invalido')

    const result = discardCorruptedData()
    expect(result.ok).toBe(true)

    expect(localStorage.getItem(CORRUPTED_BACKUP_KEY)).toBe('{json-invalido')
    expect(loadSavedItineraries().status).toBe('empty')
  })

  it('descarta entradas com estrutura inválida, mantém as válidas e informa o descarte', () => {
    const valid = saveOk(buildSampleItinerary())
    overwriteStorage([
      { foo: 'bar' },
      null,
      'texto',
      valid,
      { id: 123, savedAt: '2026-10-10T12:00:00.000Z', itinerary: {} },
    ])

    const load = loadSavedItineraries()
    expect(load.status).toBe('ok')
    expect(load.discardedCount).toBe(4)
    expect(load.records).toHaveLength(1)
    expect(load.records[0].id).toBe(valid.id)
  })

  it('TP-02: rejeita registro com data inválida ("ontem")', () => {
    seedMutatedRecord((record) => {
      record.savedAt = 'ontem'
    })
    const load = loadSavedItineraries()
    expect(load.records).toEqual([])
    expect(load.discardedCount).toBe(1)
  })

  it('TP-02: rejeita registro com identificador vazio', () => {
    seedMutatedRecord((record) => {
      record.id = ''
    })
    expect(loadSavedItineraries().records).toEqual([])
  })

  it('TP-02: rejeita registro com destino desconhecido', () => {
    seedMutatedRecord((record) => {
      const itinerary = record.itinerary as Record<string, unknown>
      const input = itinerary.input as Record<string, unknown>
      input.destinationId = 'atlantida'
    })
    expect(loadSavedItineraries().records).toEqual([])
  })

  it('TP-02: rejeita registro cujos dias são objetos vazios', () => {
    seedMutatedRecord((record) => {
      const itinerary = record.itinerary as Record<string, unknown>
      const input = itinerary.input as PlanningInput
      itinerary.days = Array.from({ length: input.days }, () => ({}))
    })
    const load = loadSavedItineraries()
    expect(load.records).toEqual([])
    expect(load.discardedCount).toBe(1)
  })

  it('TP-02: rejeita registro com quantidade de dias incoerente com o planejamento', () => {
    seedMutatedRecord((record) => {
      const itinerary = record.itinerary as Record<string, unknown>
      const days = itinerary.days as unknown[]
      itinerary.days = days.slice(1)
    })
    expect(loadSavedItineraries().records).toEqual([])
  })

  it('TP-02: rejeita registro com sobreposição de horários dentro do dia', () => {
    const itinerary = buildSampleItinerary()
    const dayWithTwo = itinerary.days.find((day) => day.activities.length >= 2)
    if (!dayWithTwo) throw new Error('cenário de teste precisa de um dia com 2+ atividades')

    seedMutatedRecord((record) => {
      const stored = record.itinerary as Itinerary
      const day = stored.days.find((item) => item.dayNumber === dayWithTwo.dayNumber)
      if (!day) throw new Error('dia de teste não encontrado')
      // Força sobreposição: a segunda atividade começa junto com a primeira.
      day.activities[1].startMinutes = day.activities[0].startMinutes
    }, itinerary)

    expect(loadSavedItineraries().records).toEqual([])
  })

  it('TP-02: rejeita totais financeiros incompatíveis com o orçamento', () => {
    seedMutatedRecord((record) => {
      const itinerary = record.itinerary as Itinerary
      itinerary.totals.unallocatedBudget += 1
    })
    expect(loadSavedItineraries().records).toEqual([])
  })

  it('TP-02: rejeita custo estimado que não corresponde às atividades agendadas', () => {
    seedMutatedRecord((record) => {
      const itinerary = record.itinerary as Itinerary
      itinerary.totals.estimatedActivitiesCost += 10
    })
    expect(loadSavedItineraries().records).toEqual([])
  })

  it('TP-02: rejeita valores monetários inválidos (NaN, negativos)', () => {
    const record = saveOk(buildSampleItinerary())
    const valid = JSON.parse(readRawStorage() ?? '[]')[0] as SavedItinerary
    expect(isSavedItinerary(valid)).toBe(true)

    const withNan = structuredClone(valid)
    withNan.itinerary.totals.estimatedActivitiesCost = Number.NaN
    expect(isSavedItinerary(withNan)).toBe(false)

    const withNegative = structuredClone(valid)
    withNegative.itinerary.totals.unallocatedBudget = -5
    expect(isSavedItinerary(withNegative)).toBe(false)

    const withNegativeCost = structuredClone(valid)
    const firstDay = withNegativeCost.itinerary.days.find(
      (day) => day.activities.length > 0,
    )
    if (!firstDay) throw new Error('cenário de teste precisa de atividade')
    firstDay.activities[0].activity.estimatedCost = -1
    expect(isSavedItinerary(withNegativeCost)).toBe(false)

    expect(record.id).toBe(valid.id)
  })

  it('TP-02: rejeita categoria de interesse desconhecida', () => {
    seedMutatedRecord((record) => {
      const itinerary = record.itinerary as Record<string, unknown>
      const input = itinerary.input as Record<string, unknown>
      input.interests = ['natureza', 'categoria-inexistente']
    })
    expect(loadSavedItineraries().records).toEqual([])
  })

  it('isSavedItinerary rejeita valores sem estrutura mínima', () => {
    expect(isSavedItinerary(null)).toBe(false)
    expect(isSavedItinerary({})).toBe(false)
    expect(isSavedItinerary({ id: 'x', savedAt: 'y' })).toBe(false)
    expect(
      isSavedItinerary({
        id: 'x',
        savedAt: 'y',
        itinerary: { input: {}, days: [], warnings: [], totals: {} },
      }),
    ).toBe(false)
  })

  it('TP-04: falha por quota excedida retorna erro e preserva os registros anteriores', () => {
    const first = saveOk(buildSampleItinerary())

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('sem espaço', 'QuotaExceededError')
    })

    const result = saveItinerary(buildSampleItinerary({ days: 5 }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('cheio')

    vi.restoreAllMocks()
    const load = loadSavedItineraries()
    expect(load.records).toHaveLength(1)
    expect(load.records[0].id).toBe(first.id)
  })

  it('TP-04: armazenamento indisponível é sinalizado na leitura, no salvamento e na exclusão', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('bloqueado', 'SecurityError')
    })

    const load = loadSavedItineraries()
    expect(load.status).toBe('unavailable')
    expect(load.records).toEqual([])

    const save = saveItinerary(buildSampleItinerary())
    expect(save.ok).toBe(false)
    if (!save.ok) expect(save.message).toContain('armazenamento')

    const remove = removeSavedItinerary('qualquer')
    expect(remove.ok).toBe(false)
  })

  it('TP-04: falha de escrita na exclusão retorna erro e mantém o registro', () => {
    const record = saveOk(buildSampleItinerary())

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('falha genérica', 'UnknownError')
    })

    const result = removeSavedItinerary(record.id)
    expect(result.ok).toBe(false)

    vi.restoreAllMocks()
    const load = loadSavedItineraries()
    expect(load.records).toHaveLength(1)
    expect(load.records[0].id).toBe(record.id)
  })

  it('buildPlanningFingerprint é determinístico e independente da ordem dos interesses', () => {
    const base: PlanningInput = {
      destinationId: 'lisboa',
      days: 4,
      interests: ['cultura', 'gastronomia'],
      style: 'equilibrado',
      budget: 500,
    }
    expect(buildPlanningFingerprint(base)).toBe(
      buildPlanningFingerprint({ ...base }),
    )
    expect(
      buildPlanningFingerprint({
        ...base,
        interests: ['gastronomia', 'cultura'],
      }),
    ).toBe(buildPlanningFingerprint(base))
    expect(buildPlanningFingerprint({ ...base, days: 6 })).not.toBe(
      buildPlanningFingerprint(base),
    )
  })
})
