import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { destinations } from '../data/destinations'
import { serializeItineraryExport } from '../services/itineraryExport'
import { generateItinerary } from '../services/itineraryGenerator'
import { parseItineraryImport } from '../services/itineraryImport'
import {
  CORRUPTED_BACKUP_KEY,
  loadSavedItineraries,
  removeSavedItinerary,
  saveItinerary,
  STORAGE_KEY,
} from '../services/itineraryStorage'
import type { Destination, Itinerary, PlanningInput, SavedItinerary, TripPace } from '../types'
import { buildHistoricalValidRecord } from './fixtures/savedItineraries'
import { installWebLocksMock, uninstallWebLocksMock } from './helpers/webLocksMock'

/**
 * Validação integrada do esquema v2 (M2.6): coleção mista v1/v2, leitura sem
 * regravação, exclusão sem perda indevida e ida e volta de todas as formas de
 * arquivo (v1 histórico, v2 com orçamento, sem orçamento e com ritmo).
 */

const lisboa = destinations.find((item) => item.id === 'lisboa') as Destination
const BASE: PlanningInput = {
  destinationId: 'lisboa',
  days: 3,
  interests: ['cultura', 'gastronomia'],
  style: 'equilibrado',
}

function make(patch: Partial<PlanningInput> = {}): Itinerary {
  const result = generateItinerary({ ...BASE, ...patch }, lisboa)
  if (!result.ok) throw new Error(result.message)
  return result.itinerary
}

const record = (itinerary: Itinerary, id: string, savedAt: string): SavedItinerary => ({ id, savedAt, itinerary })

function mixedCollection(): SavedItinerary[] {
  return [
    buildHistoricalValidRecord(),
    record(make({ days: 4 }), 'roteiro-v2-sem-orcamento', '2026-10-10T10:00:00.000Z'),
    record(make({ days: 5, budget: 600, pace: 'tranquilo' }), 'roteiro-v2-com-ritmo', '2026-10-11T10:00:00.000Z'),
    record(make({ days: 2, pace: 'intenso' }), 'roteiro-v2-sem-orcamento-com-ritmo', '2026-10-12T10:00:00.000Z'),
  ]
}

describe('Esquema v2 — coleção mista v1/v2', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
  })

  afterEach(() => {
    uninstallWebLocksMock()
    vi.restoreAllMocks()
  })

  it('lê legado e v2 juntos como coleção íntegra, sem regravar nem remover chaves', () => {
    const raw = JSON.stringify(mixedCollection())
    localStorage.setItem(STORAGE_KEY, raw)
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem')
    const loaded = loadSavedItineraries()
    expect(loaded.status).toBe('ok')
    expect(loaded.records).toHaveLength(4)
    expect(loaded.discardedCount).toBe(0)
    expect(setItem).not.toHaveBeenCalled()
    expect(removeItem).not.toHaveBeenCalled()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw)
    expect(localStorage.getItem(CORRUPTED_BACKUP_KEY)).toBeNull()
  })

  it('excluir um registro preserva os demais exatamente como estavam, na mesma ordem', async () => {
    const collection = mixedCollection()
    const raw = JSON.stringify(collection)
    localStorage.setItem(STORAGE_KEY, raw)
    const result = await removeSavedItinerary('roteiro-v2-sem-orcamento', { expectedRaw: raw })
    expect(result.ok).toBe(true)
    const remaining = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    expect(remaining).toEqual(collection.filter((item) => item.id !== 'roteiro-v2-sem-orcamento'))
    expect(localStorage.getItem(CORRUPTED_BACKUP_KEY)).toBeNull()
  })

  it('exclusão com conteúdo observado desatualizado é cancelada sem alterar nada', async () => {
    const raw = JSON.stringify(mixedCollection())
    localStorage.setItem(STORAGE_KEY, raw)
    const stale = JSON.stringify(mixedCollection().slice(0, 2))
    const result = await removeSavedItinerary('roteiro-v2-com-ritmo', { expectedRaw: stale })
    expect(result.ok).toBe(false)
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw)
  })

  it('salvar acrescenta sem tocar nos registros existentes (v1 e v2)', async () => {
    const collection = mixedCollection()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collection))
    const added = await saveItinerary(make({ days: 6, pace: 'equilibrado' }))
    expect(added.ok).toBe(true)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as SavedItinerary[]
    expect(stored).toHaveLength(5)
    for (const original of collection) expect(stored.find((item) => item.id === original.id)).toEqual(original)
  })
})

type Form = { name: string; itinerary: Itinerary; fileVersion: 1 | 2 }

const FORMS: Form[] = [
  { name: 'v1 histórico (com orçamento)', itinerary: make({ budget: 400 }), fileVersion: 1 },
  { name: 'v2 com orçamento', itinerary: make({ budget: 333.33 }), fileVersion: 2 },
  { name: 'v2 sem orçamento', itinerary: make(), fileVersion: 2 },
  { name: 'v2 com ritmo e orçamento', itinerary: make({ budget: 500, pace: 'equilibrado' as TripPace }), fileVersion: 2 },
  { name: 'v2 com ritmo e sem orçamento', itinerary: make({ pace: 'tranquilo' as TripPace }), fileVersion: 2 },
]

describe('Esquema v2 — ida e volta de todas as formas de arquivo', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
  })

  afterEach(() => {
    uninstallWebLocksMock()
  })

  it.each(FORMS)('$name: exporta, importa, salva, relê e reexporta de forma idêntica', async ({ itinerary, fileVersion }) => {
    const saved: SavedItinerary = { id: 'ref', savedAt: '2026-10-12T12:00:00.000Z', itinerary }
    const exported = JSON.parse(serializeItineraryExport(saved, lisboa)) as Record<string, unknown>
    const file = JSON.stringify(fileVersion === 1 ? { ...exported, schemaVersion: 1 } : exported)

    const imported = parseItineraryImport(file)
    expect(imported.ok).toBe(true)
    if (!imported.ok) return
    expect(imported.itinerary).toEqual(itinerary)

    const stored = await saveItinerary(imported.itinerary)
    expect(stored.ok).toBe(true)
    const reloaded = loadSavedItineraries()
    expect(reloaded.status).toBe('ok')
    expect(reloaded.records[0].itinerary).toEqual(itinerary)

    // Reexportar o que foi reimportado produz o mesmo documento (v2), sem perder ou inventar campos.
    const again = JSON.parse(serializeItineraryExport({ ...saved, itinerary: reloaded.records[0].itinerary }, lisboa))
    expect(again).toEqual(exported)
    expect(JSON.stringify(again)).toBe(JSON.stringify(exported))
  })
})
