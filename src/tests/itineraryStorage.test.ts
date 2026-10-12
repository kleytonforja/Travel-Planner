import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { destinations } from '../data/destinations'
import { generateItinerary } from '../services/itineraryGenerator'
import {
  buildPlanningFingerprint,
  CORRUPTED_BACKUP_KEY,
  isSavedItinerary,
  loadSavedItineraries,
  removeSavedItinerary,
  saveItinerary,
  STORAGE_KEY,
  type ReplaceConfirmation,
} from '../services/itineraryStorage'
import type { Itinerary, PlanningInput, SavedItinerary } from '../types'
import {
  installWebLocksMock,
  uninstallWebLocksMock,
} from './helpers/webLocksMock'

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

async function saveOk(itinerary: Itinerary): Promise<SavedItinerary> {
  const result = await saveItinerary(itinerary)
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
async function seedMutatedRecord(
  mutate: (record: Record<string, unknown>) => void,
  itinerary: Itinerary = buildSampleItinerary(),
): Promise<void> {
  const record = await saveOk(itinerary)
  const parsed = JSON.parse(readRawStorage() ?? '[]') as Record<string, unknown>[]
  const target = parsed.find((item) => item.id === record.id)
  if (!target) throw new Error('registro de teste não encontrado')
  mutate(target)
  overwriteStorage(parsed)
}

function expectNeedsConfirmation(
  result: Awaited<ReturnType<typeof saveItinerary>>,
): ReplaceConfirmation {
  if (result.ok || result.outcome !== 'needs-confirmation') {
    throw new Error('esperado resultado needs-confirmation')
  }
  return result.confirmation
}

describe('itineraryStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
  })

  afterEach(() => {
    uninstallWebLocksMock()
    vi.restoreAllMocks()
  })

  it('salva e recupera um roteiro válido (round-trip/reabertura)', async () => {
    const itinerary = buildSampleItinerary()
    const record = await saveOk(itinerary)

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
    expect(load.raw).toBeNull()
    expect(load.records).toEqual([])
  })

  it('TP-05: string vazia armazenada é conteúdo corrompido, não ausência de dados', () => {
    localStorage.setItem(STORAGE_KEY, '')
    const load = loadSavedItineraries()
    expect(load.status).toBe('corrupted')
    expect(load.records).toEqual([])
    // A leitura não altera o conteúdo.
    expect(readRawStorage()).toBe('')
  })

  it('substituição de planejamento equivalente exige confirmação e preserva o identificador', async () => {
    const itinerary = buildSampleItinerary()
    const first = await saveOk(itinerary)
    const rawBefore = readRawStorage()

    // Sem confirmação: nenhuma substituição, nenhuma escrita.
    const attempt = await saveItinerary(itinerary)
    const confirmation = expectNeedsConfirmation(attempt)
    expect(confirmation.targetId).toBe(first.id)
    expect(confirmation.expectedRaw).toBe(rawBefore)
    expect(readRawStorage()).toBe(rawBefore)

    // Com a confirmação vinculada: somente o alvo é substituído.
    const second = await saveItinerary(itinerary, confirmation)
    expect(second.ok).toBe(true)
    if (second.ok) expect(second.record.id).toBe(first.id)
    const load = loadSavedItineraries()
    expect(load.records).toHaveLength(1)
  })

  it('mantém compatibilidade: planejamento equivalente substitui o registro legado com id de hash', async () => {
    // Registro no formato antigo (id = hash do planejamento).
    const itinerary = buildSampleItinerary()
    const legacyId = buildPlanningFingerprint(itinerary.input)
    const legacyRecord: SavedItinerary = {
      id: legacyId,
      savedAt: new Date().toISOString(),
      itinerary,
    }
    overwriteStorage([legacyRecord])

    const attempt = await saveItinerary(itinerary)
    const confirmation = expectNeedsConfirmation(attempt)
    expect(confirmation.targetId).toBe(legacyId)

    const result = await saveItinerary(itinerary, confirmation)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.record.id).toBe(legacyId)
    expect(loadSavedItineraries().records).toHaveLength(1)
  })

  it('mantém roteiros de planejamentos diferentes, com identificadores únicos', async () => {
    const first = await saveOk(buildSampleItinerary())
    const second = await saveOk(buildSampleItinerary({ days: 5 }))

    expect(first.id).not.toBe(second.id)
    expect(loadSavedItineraries().records).toHaveLength(2)
  })

  it('TP-03: não substitui roteiro diferente cujo id legado colide com a impressão digital do novo', async () => {
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

    const result = await saveItinerary(itineraryB)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.record.id).not.toBe(legacyRecord.id)

    const { records } = loadSavedItineraries()
    expect(records).toHaveLength(2)
    const preserved = records.find((item) => item.id === legacyRecord.id)
    expect(preserved).toBeDefined()
    expect(preserved?.itinerary.input).toEqual(itineraryA.input)
  })

  it('remove um roteiro pelo identificador, vinculado ao conteúdo observado', async () => {
    const first = await saveOk(buildSampleItinerary())
    const second = await saveOk(buildSampleItinerary({ days: 5 }))

    const observed = loadSavedItineraries()
    const result = await removeSavedItinerary(first.id, {
      expectedRaw: observed.raw,
    })
    expect(result.ok).toBe(true)

    const load = loadSavedItineraries()
    expect(load.records).toHaveLength(1)
    expect(load.records[0].id).toBe(second.id)
  })

  it('excluir o último roteiro grava um array vazio e não remove a chave principal', async () => {
    const record = await saveOk(buildSampleItinerary())
    const observed = loadSavedItineraries()

    const result = await removeSavedItinerary(record.id, {
      expectedRaw: observed.raw,
    })
    expect(result.ok).toBe(true)
    expect(readRawStorage()).toBe('[]')
    expect(loadSavedItineraries().status).toBe('empty')
  })

  it('TP-05: JSON corrompido é "corrupted", nunca tratado como vazio, e não é alterado na leitura', () => {
    localStorage.setItem(STORAGE_KEY, '{json-invalido')

    const load = loadSavedItineraries()
    expect(load.status).toBe('corrupted')
    expect(load.records).toEqual([])
    expect(load.raw).toBe('{json-invalido')
    // A leitura não toca no conteúdo original.
    expect(readRawStorage()).toBe('{json-invalido')
  })

  it('TP-05: conteúdo legível mas em formato inesperado é tratado como corrompido', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ roteiros: [] }))
    const load = loadSavedItineraries()
    expect(load.status).toBe('corrupted')
    expect(load.records).toEqual([])
  })

  it('TP-05: salvar com coleção corrompida é bloqueado, sem quarentena automática nem escrita', async () => {
    localStorage.setItem(STORAGE_KEY, '{json-invalido')

    const result = await saveItinerary(buildSampleItinerary())
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.outcome).toBe('failure')
      expect(result.message).toContain('bloqueadas')
    }

    // O conteúdo original permanece intacto e nenhuma cópia é criada
    // como efeito colateral — a preservação é parte da recuperação
    // explícita, não do salvamento.
    expect(readRawStorage()).toBe('{json-invalido')
    expect(localStorage.getItem(CORRUPTED_BACKUP_KEY)).toBeNull()
  })

  it('TP-05: coleção parcialmente válida é corrompida e bloqueia escritas normais', async () => {
    const valid = await saveOk(buildSampleItinerary())
    overwriteStorage([
      { foo: 'bar' },
      null,
      'texto',
      valid,
      { id: 123, savedAt: '2026-10-10T12:00:00.000Z', itinerary: {} },
    ])
    const rawBefore = readRawStorage()

    const load = loadSavedItineraries()
    expect(load.status).toBe('corrupted')
    expect(load.discardedCount).toBe(4)
    // Registros íntegros permanecem disponíveis para consulta.
    expect(load.records).toHaveLength(1)
    expect(load.records[0].id).toBe(valid.id)

    const save = await saveItinerary(buildSampleItinerary({ days: 5 }))
    expect(save.ok).toBe(false)
    expect(readRawStorage()).toBe(rawBefore)
  })

  it('TP-02: rejeita registro com data inválida ("ontem")', async () => {
    await seedMutatedRecord((record) => {
      record.savedAt = 'ontem'
    })
    const load = loadSavedItineraries()
    expect(load.status).toBe('corrupted')
    expect(load.records).toEqual([])
    expect(load.discardedCount).toBe(1)
  })

  it('TP-02: rejeita registro com identificador vazio', async () => {
    await seedMutatedRecord((record) => {
      record.id = ''
    })
    expect(loadSavedItineraries().records).toEqual([])
  })

  it('TP-02: rejeita registro com destino desconhecido', async () => {
    await seedMutatedRecord((record) => {
      const itinerary = record.itinerary as Record<string, unknown>
      const input = itinerary.input as Record<string, unknown>
      input.destinationId = 'atlantida'
    })
    expect(loadSavedItineraries().records).toEqual([])
  })

  it('TP-02: rejeita registro cujos dias são objetos vazios', async () => {
    await seedMutatedRecord((record) => {
      const itinerary = record.itinerary as Record<string, unknown>
      const input = itinerary.input as PlanningInput
      itinerary.days = Array.from({ length: input.days }, () => ({}))
    })
    const load = loadSavedItineraries()
    expect(load.records).toEqual([])
    expect(load.discardedCount).toBe(1)
  })

  it('TP-02: rejeita registro com quantidade de dias incoerente com o planejamento', async () => {
    await seedMutatedRecord((record) => {
      const itinerary = record.itinerary as Record<string, unknown>
      const days = itinerary.days as unknown[]
      itinerary.days = days.slice(1)
    })
    expect(loadSavedItineraries().records).toEqual([])
  })

  it('TP-02: rejeita registro com sobreposição de horários dentro do dia', async () => {
    const itinerary = buildSampleItinerary()
    const dayWithTwo = itinerary.days.find((day) => day.activities.length >= 2)
    if (!dayWithTwo) throw new Error('cenário de teste precisa de um dia com 2+ atividades')

    await seedMutatedRecord((record) => {
      const stored = record.itinerary as Itinerary
      const day = stored.days.find((item) => item.dayNumber === dayWithTwo.dayNumber)
      if (!day) throw new Error('dia de teste não encontrado')
      // Força sobreposição: a segunda atividade começa junto com a primeira.
      day.activities[1].startMinutes = day.activities[0].startMinutes
    }, itinerary)

    expect(loadSavedItineraries().records).toEqual([])
  })

  it('TP-02: rejeita totais financeiros incompatíveis com o orçamento', async () => {
    await seedMutatedRecord((record) => {
      const itinerary = record.itinerary as Itinerary
      itinerary.totals.unallocatedBudget = (itinerary.totals.unallocatedBudget as number) + 1
    })
    expect(loadSavedItineraries().records).toEqual([])
  })

  it('TP-02: rejeita custo estimado que não corresponde às atividades agendadas', async () => {
    await seedMutatedRecord((record) => {
      const itinerary = record.itinerary as Itinerary
      itinerary.totals.estimatedActivitiesCost += 10
    })
    expect(loadSavedItineraries().records).toEqual([])
  })

  it('TP-02: rejeita valores monetários inválidos (NaN, negativos)', async () => {
    const record = await saveOk(buildSampleItinerary())
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

  it('TP-02: rejeita categoria de interesse desconhecida', async () => {
    await seedMutatedRecord((record) => {
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

  it('TP-04: falha por quota excedida retorna erro e preserva exatamente a chave principal', async () => {
    const first = await saveOk(buildSampleItinerary())
    const rawBefore = readRawStorage()

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('sem espaço', 'QuotaExceededError')
    })

    const result = await saveItinerary(buildSampleItinerary({ days: 5 }))
    expect(result.ok).toBe(false)
    if (!result.ok && result.outcome !== 'needs-confirmation') {
      expect(result.outcome).toBe('failure')
      expect(result.message).toContain('cheio')
    }

    vi.restoreAllMocks()
    // Conteúdo bruto idêntico ao estado anterior.
    expect(readRawStorage()).toBe(rawBefore)
    const load = loadSavedItineraries()
    expect(load.records).toHaveLength(1)
    expect(load.records[0].id).toBe(first.id)
  })

  it('TP-04: armazenamento indisponível é sinalizado na leitura, no salvamento e na exclusão', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('bloqueado', 'SecurityError')
    })

    const load = loadSavedItineraries()
    expect(load.status).toBe('unavailable')
    expect(load.records).toEqual([])

    const save = await saveItinerary(buildSampleItinerary())
    expect(save.ok).toBe(false)
    if (!save.ok && save.outcome !== 'needs-confirmation') {
      expect(save.message).toContain('armazenamento')
    }

    const remove = await removeSavedItinerary('qualquer', { expectedRaw: null })
    expect(remove.ok).toBe(false)
  })

  it('TP-04: falha de escrita na exclusão retorna erro e mantém o registro', async () => {
    const record = await saveOk(buildSampleItinerary())
    const rawBefore = readRawStorage()

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('falha genérica', 'UnknownError')
    })

    const result = await removeSavedItinerary(record.id, {
      expectedRaw: rawBefore,
    })
    expect(result.ok).toBe(false)

    vi.restoreAllMocks()
    expect(readRawStorage()).toBe(rawBefore)
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
