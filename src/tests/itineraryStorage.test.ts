import { beforeEach, describe, expect, it } from 'vitest'

import { destinations } from '../data/destinations'
import { generateItinerary } from '../services/itineraryGenerator'
import {
  buildItineraryId,
  isSavedItinerary,
  loadSavedItineraries,
  removeSavedItinerary,
  saveItinerary,
  STORAGE_KEY,
} from '../services/itineraryStorage'
import type { Itinerary, PlanningInput } from '../types'

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

describe('itineraryStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('salva e recupera um roteiro (round-trip)', () => {
    const itinerary = buildSampleItinerary()
    const record = saveItinerary(itinerary)

    expect(record.id).toBe(buildItineraryId(itinerary.input))
    expect(record.savedAt).toBeTruthy()

    const loaded = loadSavedItineraries()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].id).toBe(record.id)
    expect(loaded[0].itinerary).toEqual(itinerary)
  })

  it('substitui o registro ao salvar o mesmo planejamento novamente', () => {
    const itinerary = buildSampleItinerary()
    saveItinerary(itinerary)
    saveItinerary(itinerary)
    expect(loadSavedItineraries()).toHaveLength(1)
  })

  it('mantém roteiros de planejamentos diferentes', () => {
    saveItinerary(buildSampleItinerary())
    saveItinerary(buildSampleItinerary({ days: 5 }))
    expect(loadSavedItineraries()).toHaveLength(2)
  })

  it('remove um roteiro pelo identificador', () => {
    const first = saveItinerary(buildSampleItinerary())
    const second = saveItinerary(buildSampleItinerary({ days: 5 }))

    removeSavedItinerary(first.id)

    const loaded = loadSavedItineraries()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].id).toBe(second.id)
  })

  it('retorna lista vazia quando o LocalStorage está corrompido (JSON inválido)', () => {
    localStorage.setItem(STORAGE_KEY, '{json-invalido')
    expect(loadSavedItineraries()).toEqual([])
  })

  it('descarta entradas com estrutura inválida e mantém as válidas', () => {
    const valid = saveItinerary(buildSampleItinerary())
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { foo: 'bar' },
        null,
        'texto',
        valid,
        { id: 123, savedAt: 'ontem', itinerary: {} },
      ]),
    )

    const loaded = loadSavedItineraries()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].id).toBe(valid.id)
  })

  it('retorna lista vazia quando o conteúdo não é um array', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ roteiros: [] }))
    expect(loadSavedItineraries()).toEqual([])
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

  it('buildItineraryId é determinístico e independente da ordem dos interesses', () => {
    const base: PlanningInput = {
      destinationId: 'lisboa',
      days: 4,
      interests: ['cultura', 'gastronomia'],
      style: 'equilibrado',
      budget: 500,
    }
    expect(buildItineraryId(base)).toBe(buildItineraryId({ ...base }))
    expect(
      buildItineraryId({
        ...base,
        interests: ['gastronomia', 'cultura'],
      }),
    ).toBe(buildItineraryId(base))
    expect(buildItineraryId({ ...base, days: 6 })).not.toBe(
      buildItineraryId(base),
    )
  })
})
