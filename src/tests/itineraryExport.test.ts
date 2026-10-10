import { beforeEach, describe, expect, it } from 'vitest'

import { destinations } from '../data/destinations'
import { generateItinerary } from '../services/itineraryGenerator'
import {
  buildItineraryExport,
  EXPORT_DISCLAIMER,
  EXPORT_SCHEMA_VERSION,
  serializeItineraryExport,
} from '../services/itineraryExport'
import { saveItinerary } from '../services/itineraryStorage'
import type { Destination, SavedItinerary } from '../types'

function buildSavedSample(): {
  saved: SavedItinerary
  destination: Destination
} {
  const destination = destinations.find((item) => item.id === 'lisboa')
  if (!destination) throw new Error('destino de teste inexistente')
  const result = generateItinerary(
    {
      destinationId: destination.id,
      days: 3,
      interests: ['cultura', 'gastronomia'],
      style: 'equilibrado',
      budget: 400,
    },
    destination,
  )
  if (!result.ok) throw new Error('falha ao gerar roteiro de teste')
  const saved = saveItinerary(result.itinerary)
  if (!saved.ok) throw new Error(`falha ao salvar roteiro de teste: ${saved.message}`)
  return { saved: saved.record, destination }
}

describe('itineraryExport', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('exporta resumo, roteiro diário, resumo financeiro e avisos', () => {
    const { saved, destination } = buildSavedSample()
    const exported = buildItineraryExport(saved, destination)

    expect(exported.schemaVersion).toBe(EXPORT_SCHEMA_VERSION)
    expect(exported.resumo.destino).toBe(destination.name)
    expect(exported.resumo.dias).toBe(saved.itinerary.input.days)
    expect(exported.resumo.orcamentoInformado).toBe(
      saved.itinerary.input.budget,
    )
    expect(exported.roteiro).toHaveLength(saved.itinerary.input.days)
    expect(exported.resumoFinanceiro.custoEstimadoAtividades).toBe(
      saved.itinerary.totals.estimatedActivitiesCost,
    )
    expect(exported.resumoFinanceiro.saldoNaoAlocado).toBe(
      saved.itinerary.totals.unallocatedBudget,
    )
    expect(exported.avisos).toEqual(saved.itinerary.warnings)
  })

  it('rotula os valores como ilustrativos', () => {
    const { saved, destination } = buildSavedSample()
    const exported = buildItineraryExport(saved, destination)

    expect(exported.disclaimer).toBe(EXPORT_DISCLAIMER)
    expect(exported.disclaimer).toContain('ilustrativos')

    const firstActivity = exported.roteiro
      .flatMap((day) => day.atividades)
      .at(0)
    if (firstActivity) {
      expect(Object.keys(firstActivity)).toContain('custoEstimadoIlustrativo')
    }
  })

  it('serializa para JSON válido que pode ser relido', () => {
    const { saved, destination } = buildSavedSample()
    const json = serializeItineraryExport(saved, destination)
    const parsed = JSON.parse(json) as Record<string, unknown>
    expect(parsed.app).toBe('Travel Planner')
    expect(parsed.schemaVersion).toBe(EXPORT_SCHEMA_VERSION)
  })

  it('não contém dados sensíveis nem referências a armazenamento interno', () => {
    const { saved, destination } = buildSavedSample()
    const json = serializeItineraryExport(saved, destination)
    expect(json).not.toContain('localStorage')
    expect(json).not.toContain('token')
    expect(json).not.toContain('password')

    const parsed = JSON.parse(json) as Record<string, unknown>
    expect(Object.keys(parsed).sort()).toEqual(
      [
        'app',
        'avisos',
        'disclaimer',
        'resumo',
        'resumoFinanceiro',
        'roteiro',
        'savedAt',
        'schemaVersion',
      ].sort(),
    )
  })
})
