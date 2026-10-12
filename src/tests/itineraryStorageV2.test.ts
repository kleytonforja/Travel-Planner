import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  arePlanningsEquivalent,
  buildPlanningFingerprint,
  CORRUPTED_BACKUP_KEY,
  isSavedItinerary,
  loadQuarantine,
  loadSavedItineraries,
  recoverCorruptedStorage,
  saveItinerary,
  STORAGE_KEY,
  validateSavedItinerary,
  type ReplaceConfirmation,
} from '../services/itineraryStorage'
import type { Itinerary, PlanningInput, SavedItinerary, TripPace } from '../types'
import { buildHistoricalValidRecord, buildItineraryFromInput } from './fixtures/savedItineraries'
import { installWebLocksMock, uninstallWebLocksMock } from './helpers/webLocksMock'

/**
 * Persistência do esquema v2 (M2.3): orçamento e saldo opcionais, ritmo
 * opcional, registros legados intactos, equivalência estrita, quarentena e
 * recuperação sem perda silenciosa. A geração sem orçamento continua desativada
 * (M2.5): os registros sem orçamento são montados à mão a partir de um roteiro
 * gerado com orçamento.
 */

const INPUT: PlanningInput = {
  destinationId: 'florianopolis',
  days: 3,
  interests: ['natureza', 'gastronomia'],
  style: 'equilibrado',
  budget: 2000,
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

/** Roteiro válido sem orçamento: propriedades `budget` e `unallocatedBudget` omitidas. */
function budgetlessItinerary(pace?: TripPace): Itinerary {
  const itinerary = clone(buildItineraryFromInput(INPUT))
  delete itinerary.input.budget
  delete itinerary.totals.unallocatedBudget
  if (pace) itinerary.input.pace = pace
  return itinerary
}

function withPace(itinerary: Itinerary, pace: TripPace): Itinerary {
  const copy = clone(itinerary)
  copy.input.pace = pace
  return copy
}

function record(itinerary: Itinerary, id = 'roteiro-v2-teste'): SavedItinerary {
  return { id, savedAt: '2026-10-12T12:00:00.000Z', itinerary }
}

function seed(records: unknown): string {
  const raw = JSON.stringify(records)
  localStorage.setItem(STORAGE_KEY, raw)
  return raw
}

function confirmationOf(result: Awaited<ReturnType<typeof saveItinerary>>): ReplaceConfirmation {
  if (result.ok || result.outcome !== 'needs-confirmation') throw new Error('esperado needs-confirmation')
  return result.confirmation
}

/** Cópia mutável e não tipada, para fabricar registros inválidos vindos de fora. */
function mutated(source: SavedItinerary, change: (itinerary: Record<string, any>) => void): unknown {
  const copy = clone(source) as unknown as { itinerary: Record<string, any> }
  change(copy.itinerary)
  return copy
}

describe('M2.3 — validação dos registros', () => {
  it('registro legado (com orçamento e saldo, sem ritmo) continua válido e inalterado', () => {
    const legacy = buildHistoricalValidRecord()
    expect(legacy.itinerary.input).not.toHaveProperty('pace')
    expect(isSavedItinerary(legacy)).toBe(true)
    const raw = seed([legacy])
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const loaded = loadSavedItineraries()
    expect(loaded.status).toBe('ok')
    expect(loaded.records).toEqual([legacy])
    // A leitura nunca migra nem regrava.
    expect(setItem).not.toHaveBeenCalled()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw)
  })

  it('registro sem orçamento e sem saldo é válido', () => {
    const value = record(budgetlessItinerary())
    expect(validateSavedItinerary(value)).toEqual({ ok: true, reasons: [] })
    seed([value])
    const loaded = loadSavedItineraries()
    expect(loaded.status).toBe('ok')
    expect(loaded.records[0].itinerary.input).not.toHaveProperty('budget')
    expect(loaded.records[0].itinerary.totals).not.toHaveProperty('unallocatedBudget')
  })

  it.each<TripPace>(['tranquilo', 'equilibrado', 'intenso'])('registro com ritmo %s é aceito (com e sem orçamento)', (pace) => {
    expect(isSavedItinerary(record(withPace(buildItineraryFromInput(INPUT), pace)))).toBe(true)
    expect(isSavedItinerary(record(budgetlessItinerary(pace)))).toBe(true)
  })

  it.each([
    ['null', null],
    ['zero', 0],
    ['negativo', -1],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['texto', '2000'],
  ])('rejeita orçamento %s', (_label, value) => {
    const bad = mutated(record(buildItineraryFromInput(INPUT)), (itinerary) => {
      itinerary.input.budget = value
    })
    expect(isSavedItinerary(bad)).toBe(false)
  })

  it.each([
    ['desconhecido', 'relaxado'],
    ['maiúsculas', 'Intenso'],
    ['vazio', ''],
    ['nulo', null],
    ['número', 2],
  ])('rejeita ritmo %s', (_label, value) => {
    const bad = mutated(record(buildItineraryFromInput(INPUT)), (itinerary) => {
      itinerary.input.pace = value
    })
    expect(isSavedItinerary(bad)).toBe(false)
    const badBudgetless = mutated(record(budgetlessItinerary()), (itinerary) => {
      itinerary.input.pace = value
    })
    expect(isSavedItinerary(badBudgetless)).toBe(false)
  })

  it('rejeita saldo presente sem orçamento (inclusive 0 e null)', () => {
    for (const balance of [0, 100, null, -1]) {
      const bad = mutated(record(budgetlessItinerary()), (itinerary) => {
        itinerary.totals.unallocatedBudget = balance
      })
      expect(isSavedItinerary(bad), String(balance)).toBe(false)
    }
    const reasons = validateSavedItinerary(
      mutated(record(budgetlessItinerary()), (itinerary) => {
        itinerary.totals.unallocatedBudget = 0
      }),
    ).reasons
    expect(reasons).toContain('saldo não alocado presente sem orçamento informado')
  })

  it('rejeita orçamento presente sem saldo', () => {
    const missing = mutated(record(buildItineraryFromInput(INPUT)), (itinerary) => {
      delete itinerary.totals.unallocatedBudget
    })
    expect(isSavedItinerary(missing)).toBe(false)
    expect(validateSavedItinerary(missing).reasons).toContain('saldo não alocado ausente com orçamento informado')
    const nullBalance = mutated(record(buildItineraryFromInput(INPUT)), (itinerary) => {
      itinerary.totals.unallocatedBudget = null
    })
    expect(isSavedItinerary(nullBalance)).toBe(false)
  })

  it('os invariantes financeiros continuam valendo com orçamento', () => {
    const overBudget = mutated(record(buildItineraryFromInput(INPUT)), (itinerary) => {
      itinerary.input.budget = 1
      itinerary.totals.unallocatedBudget = 0
    })
    expect(validateSavedItinerary(overBudget).reasons).toContain('custo estimado superior ao orçamento informado')
    const wrongBalance = mutated(record(buildItineraryFromInput(INPUT)), (itinerary) => {
      itinerary.totals.unallocatedBudget += 1
    })
    expect(validateSavedItinerary(wrongBalance).reasons).toContain('saldo não alocado inconsistente com orçamento e custo')
    const negativeBalance = mutated(record(buildItineraryFromInput(INPUT)), (itinerary) => {
      itinerary.totals.unallocatedBudget = -1
    })
    expect(isSavedItinerary(negativeBalance)).toBe(false)
  })

  it('sem orçamento, custo e média continuam validados contra as atividades', () => {
    const wrongCost = mutated(record(budgetlessItinerary()), (itinerary) => {
      itinerary.totals.estimatedActivitiesCost += 5
    })
    expect(validateSavedItinerary(wrongCost).reasons).toContain('custo estimado não corresponde às atividades agendadas')
    const wrongAverage = mutated(record(budgetlessItinerary()), (itinerary) => {
      itinerary.totals.averageCostPerDay += 5
    })
    expect(validateSavedItinerary(wrongAverage).reasons).toContain('custo médio por dia inconsistente com custo e duração')
    const negative = mutated(record(budgetlessItinerary()), (itinerary) => {
      itinerary.totals.estimatedActivitiesCost = -1
    })
    expect(isSavedItinerary(negative)).toBe(false)
  })

  it('o JSON bruto com "budget": null torna o registro inválido (coleção corrompida)', () => {
    const raw = JSON.stringify([record(buildItineraryFromInput(INPUT))]).replace('"budget":2000', '"budget":null')
    expect(raw).toContain('"budget":null')
    localStorage.setItem(STORAGE_KEY, raw)
    const loaded = loadSavedItineraries()
    expect(loaded.status).toBe('corrupted')
    expect(loaded.records).toEqual([])
    expect(loaded.discardedCount).toBe(1)
  })

  it('uma entrada em memória com budget undefined equivale à ausência após a serialização', () => {
    const itinerary = budgetlessItinerary()
    ;(itinerary.input as unknown as Record<string, unknown>).budget = undefined
    expect(isSavedItinerary(record(itinerary))).toBe(true)
    expect(JSON.stringify(record(itinerary))).not.toContain('budget')
  })
})

describe('M2.3 — equivalência e identidade', () => {
  const same = (patch: Partial<PlanningInput> = {}): PlanningInput => ({ ...INPUT, ...patch })

  it('mantém a equivalência existente para planejamentos idênticos e ordem de interesses', () => {
    expect(arePlanningsEquivalent(INPUT, same())).toBe(true)
    expect(arePlanningsEquivalent(INPUT, same({ interests: ['gastronomia', 'natureza'] }))).toBe(true)
    expect(arePlanningsEquivalent(INPUT, same({ budget: 2000.01 }))).toBe(false)
  })

  it('orçamento ausente só equivale a ausente', () => {
    const { budget: _a, ...noBudgetA } = INPUT
    const { budget: _b, ...noBudgetB } = INPUT
    void _a
    void _b
    expect(arePlanningsEquivalent(noBudgetA, noBudgetB)).toBe(true)
    expect(arePlanningsEquivalent(noBudgetA, INPUT)).toBe(false)
    expect(arePlanningsEquivalent(INPUT, noBudgetA)).toBe(false)
  })

  it('ritmo ausente só equivale a ausente e nunca a "intenso" explícito', () => {
    expect(arePlanningsEquivalent(INPUT, same({ pace: 'intenso' }))).toBe(false)
    expect(arePlanningsEquivalent(same({ pace: 'intenso' }), INPUT)).toBe(false)
    expect(arePlanningsEquivalent(same({ pace: 'intenso' }), same({ pace: 'intenso' }))).toBe(true)
    expect(arePlanningsEquivalent(same({ pace: 'tranquilo' }), same({ pace: 'equilibrado' }))).toBe(false)
  })

  it('a impressão digital dos planejamentos legados não muda; ritmo e ausência de orçamento a distinguem', () => {
    // Fórmula histórica (hash djb2 de destino|dias|estilo|orçamento|interesses).
    const legacyRaw = 'florianopolis|3|equilibrado|2000|gastronomia,natureza'
    let hash = 5381
    for (let index = 0; index < legacyRaw.length; index += 1) {
      hash = ((hash << 5) + hash + legacyRaw.charCodeAt(index)) >>> 0
    }
    expect(buildPlanningFingerprint(INPUT)).toBe(`roteiro-${hash.toString(16)}`)
    const { budget: _omitted, ...noBudget } = INPUT
    void _omitted
    const prints = new Set([
      buildPlanningFingerprint(INPUT),
      buildPlanningFingerprint(same({ pace: 'intenso' })),
      buildPlanningFingerprint(same({ pace: 'tranquilo' })),
      buildPlanningFingerprint(noBudget),
    ])
    expect(prints.size).toBe(4)
  })
})

describe('M2.3 — gravação, substituição e concorrência', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
  })

  afterEach(() => {
    uninstallWebLocksMock()
    vi.restoreAllMocks()
  })

  it('grava um roteiro sem orçamento e sem saldo; as propriedades ficam omitidas no armazenamento', async () => {
    const result = await saveItinerary(budgetlessItinerary('tranquilo'))
    expect(result.ok).toBe(true)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].itinerary.input).not.toHaveProperty('budget')
    expect(stored[0].itinerary.totals).not.toHaveProperty('unallocatedBudget')
    expect(stored[0].itinerary.input.pace).toBe('tranquilo')
    expect(loadSavedItineraries().status).toBe('ok')
  })

  it('o mesmo planejamento sem orçamento exige confirmação e a substituição preserva o id', async () => {
    const first = await saveItinerary(budgetlessItinerary())
    if (!first.ok) throw new Error('falha ao salvar')
    const second = await saveItinerary(budgetlessItinerary())
    const confirmation = confirmationOf(second)
    expect(confirmation.targetId).toBe(first.record.id)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toHaveLength(1)
    const confirmed = await saveItinerary(budgetlessItinerary(), confirmation)
    expect(confirmed.ok && confirmed.record.id).toBe(first.record.id)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toHaveLength(1)
  })

  it('ausência não equivale a valor explícito: roteiro com ritmo ou com orçamento é um registro novo', async () => {
    const legacy = await saveItinerary(buildItineraryFromInput(INPUT))
    if (!legacy.ok) throw new Error('falha ao salvar')
    // Mesmo planejamento, mas com ritmo explícito: nunca substitui o legado.
    const paced = await saveItinerary(withPace(buildItineraryFromInput(INPUT), 'intenso'))
    expect(paced.ok).toBe(true)
    // Sem orçamento: também é outro planejamento.
    const noBudget = await saveItinerary(budgetlessItinerary())
    expect(noBudget.ok).toBe(true)
    const ids = loadSavedItineraries().records.map((item) => item.id)
    expect(new Set(ids).size).toBe(3)
    expect(ids).toContain(legacy.record.id)
  })

  it('o roteiro legado salvo permanece byte a byte quando outro roteiro é acrescentado', async () => {
    const legacy = buildHistoricalValidRecord()
    seed([legacy])
    const result = await saveItinerary(withPace(buildItineraryFromInput(INPUT), 'equilibrado'))
    expect(result.ok).toBe(true)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as SavedItinerary[]
    expect(stored).toHaveLength(2)
    expect(stored.find((item) => item.id === legacy.id)).toEqual(legacy)
  })

  it('expectedRaw: conteúdo alterado entre a confirmação e a gravação cancela a substituição', async () => {
    await saveItinerary(budgetlessItinerary())
    const confirmation = confirmationOf(await saveItinerary(budgetlessItinerary()))
    // Outra aba grava um terceiro roteiro (mudando o conteúdo bruto).
    const other = await saveItinerary(withPace(buildItineraryFromInput(INPUT), 'tranquilo'))
    expect(other.ok).toBe(true)
    const rawBefore = localStorage.getItem(STORAGE_KEY)
    const stale = await saveItinerary(budgetlessItinerary(), confirmation)
    expect(stale.ok).toBe(false)
    expect(!stale.ok && stale.outcome).toBe('failure')
    expect(localStorage.getItem(STORAGE_KEY)).toBe(rawBefore)
  })

  it('gravações concorrentes de roteiros v2 distintos são serializadas e nenhuma se perde', async () => {
    const results = await Promise.all([
      saveItinerary(budgetlessItinerary('tranquilo')),
      saveItinerary(budgetlessItinerary('equilibrado')),
      saveItinerary(withPace(buildItineraryFromInput(INPUT), 'intenso')),
    ])
    expect(results.every((result) => result.ok)).toBe(true)
    const loaded = loadSavedItineraries()
    expect(loaded.status).toBe('ok')
    expect(loaded.records).toHaveLength(3)
  })

  it('uma gravação com registro inválido é recusada sem alterar o armazenamento', async () => {
    const itinerary = budgetlessItinerary()
    ;(itinerary.totals as unknown as Record<string, unknown>).unallocatedBudget = 0 // saldo sem orçamento
    const before = seedEmpty()
    const result = await saveItinerary(itinerary)
    expect(result.ok).toBe(false)
    expect(localStorage.getItem(STORAGE_KEY)).toBe(before)
  })
})

function seedEmpty(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

describe('M2.3 — quarentena e recuperação com registros v2', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
  })

  afterEach(() => {
    uninstallWebLocksMock()
    vi.restoreAllMocks()
  })

  function mixedCollection() {
    const good = record(budgetlessItinerary('tranquilo'), 'roteiro-v2-valido')
    const legacy = buildHistoricalValidRecord()
    const badPace = mutated(record(buildItineraryFromInput(INPUT), 'roteiro-v2-ritmo-invalido'), (itinerary) => {
      itinerary.input.pace = 'relaxado'
    })
    const badBalance = mutated(record(budgetlessItinerary(), 'roteiro-v2-saldo-invalido'), (itinerary) => {
      itinerary.totals.unallocatedBudget = 10
    })
    return { good, legacy, badPace, badBalance }
  }

  it('registro v2 inválido torna a coleção corrompida, expõe só os válidos e bloqueia gravações', async () => {
    const { good, legacy, badPace, badBalance } = mixedCollection()
    seed([good, legacy, badPace, badBalance])
    const loaded = loadSavedItineraries()
    expect(loaded.status).toBe('corrupted')
    expect(loaded.records.map((item) => item.id).sort()).toEqual([good.id, legacy.id].sort())
    expect(loaded.discardedCount).toBe(2)
    expect(loaded.rejections.map((item) => item.id).sort()).toEqual(['roteiro-v2-ritmo-invalido', 'roteiro-v2-saldo-invalido'])
    const raw = localStorage.getItem(STORAGE_KEY)
    const write = await saveItinerary(withPace(buildItineraryFromInput(INPUT), 'intenso'))
    expect(write.ok).toBe(false)
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw)
  })

  it('a recuperação preserva o conteúdo bruto na quarentena e mantém os válidos (v2 e legado) intactos', async () => {
    const { good, legacy, badPace, badBalance } = mixedCollection()
    const raw = seed([good, legacy, badPace, badBalance])
    const result = await recoverCorruptedStorage(raw)
    expect(result.ok).toBe(true)
    expect(result.ok && result.recoveredCount).toBe(2)
    expect(result.ok && result.backupOnlyCount).toBe(2)
    // Nada some em silêncio: o original inteiro está na quarentena…
    const quarantine = loadQuarantine()
    expect(quarantine.status).toBe('occupied')
    expect(localStorage.getItem(CORRUPTED_BACKUP_KEY)).toBe(raw)
    // …e os registros válidos ficam como estavam (inclusive campos omitidos).
    const active = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as SavedItinerary[]
    expect(active.find((item) => item.id === good.id)).toEqual(good)
    expect(active.find((item) => item.id === legacy.id)).toEqual(legacy)
    expect(active.find((item) => item.id === good.id)?.itinerary.input).not.toHaveProperty('budget')
    expect(loadSavedItineraries().status).toBe('ok')
  })

  it('recuperação com conteúdo alterado desde a exibição é cancelada sem alterar nenhuma chave', async () => {
    const { good, badPace } = mixedCollection()
    const shown = seed([good, badPace])
    seed([good, badPace, record(budgetlessItinerary('intenso'), 'roteiro-v2-novo')])
    const current = localStorage.getItem(STORAGE_KEY)
    const result = await recoverCorruptedStorage(shown)
    expect(result.ok).toBe(false)
    expect(localStorage.getItem(STORAGE_KEY)).toBe(current)
    expect(localStorage.getItem(CORRUPTED_BACKUP_KEY)).toBeNull()
  })
})
