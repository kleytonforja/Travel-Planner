import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { destinations } from '../data/destinations'
import { generateItinerary } from '../services/itineraryGenerator'
import {
  buildItineraryExport,
  buildRecoveryExport,
  EXPORT_DISCLAIMER,
  EXPORT_SCHEMA_VERSION,
  RECOVERY_EXPORT_FORMAT,
  RECOVERY_EXPORT_VERSION,
  serializeItineraryExport,
  serializeRecoveryExport,
} from '../services/itineraryExport'
import { saveItinerary, STORAGE_KEY } from '../services/itineraryStorage'
import type { Destination, SavedItinerary } from '../types'
import {
  installWebLocksMock,
  uninstallWebLocksMock,
} from './helpers/webLocksMock'

async function buildSavedSample(): Promise<{
  saved: SavedItinerary
  destination: Destination
}> {
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
  const saved = await saveItinerary(result.itinerary)
  if (!saved.ok) throw new Error(`falha ao salvar roteiro de teste: ${saved.message}`)
  return { saved: saved.record, destination }
}

describe('itineraryExport', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
  })

  afterEach(() => {
    uninstallWebLocksMock()
  })

  it('exporta resumo, roteiro diário, resumo financeiro e avisos', async () => {
    const { saved, destination } = await buildSavedSample()
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

  it('rotula os valores como ilustrativos', async () => {
    const { saved, destination } = await buildSavedSample()
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

  it('serializa para JSON válido que pode ser relido', async () => {
    const { saved, destination } = await buildSavedSample()
    const json = serializeItineraryExport(saved, destination)
    const parsed = JSON.parse(json) as Record<string, unknown>
    expect(parsed.app).toBe('Travel Planner')
    expect(parsed.schemaVersion).toBe(EXPORT_SCHEMA_VERSION)
  })

  it('não contém dados sensíveis nem referências a armazenamento interno', async () => {
    const { saved, destination } = await buildSavedSample()
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

describe('exportação de recuperação (cópia bruta do armazenamento)', () => {
  it('monta envelope com identificador do formato, versão, chave de origem e raw', () => {
    const raw = '{"qualquer":"conteúdo bruto"}'
    const envelope = buildRecoveryExport(raw, STORAGE_KEY)

    expect(envelope.formato).toBe(RECOVERY_EXPORT_FORMAT)
    expect(envelope.versao).toBe(RECOVERY_EXPORT_VERSION)
    expect(envelope.chaveOrigem).toBe(STORAGE_KEY)
    expect(envelope.raw).toBe(raw)
  })

  it('serializa para JSON válido preservando integralmente o conteúdo bruto', () => {
    const raw = '{json-invalido, com quebras\ne caracteres especiais "çãó"'
    const parsed = JSON.parse(
      serializeRecoveryExport(raw, STORAGE_KEY),
    ) as Record<string, unknown>

    expect(parsed.raw).toBe(raw)
    expect(Object.keys(parsed).sort()).toEqual(
      ['chaveOrigem', 'formato', 'raw', 'versao'].sort(),
    )
  })

  it('não é confundível com a exportação normal do roteiro', () => {
    const recovery = buildRecoveryExport('[]', STORAGE_KEY)
    const parsed = recovery as Record<string, unknown>
    expect(parsed).not.toHaveProperty('schemaVersion')
    expect(parsed).not.toHaveProperty('roteiro')
    expect(parsed).not.toHaveProperty('app')
  })
})
