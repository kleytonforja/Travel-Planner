import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  arePlanningsEquivalent,
  loadSavedItineraries,
  MAX_ID_GENERATION_ATTEMPTS,
  removeSavedItinerary,
  saveItinerary,
  STORAGE_KEY,
  type ReplaceConfirmation,
} from '../services/itineraryStorage'
import type { Itinerary, PlanningInput, SavedItinerary } from '../types'
import {
  buildCollisionPair,
  buildDuplicateIdsPayload,
  buildHistoricalValidRecord,
  buildItineraryFromInput,
} from './fixtures/savedItineraries'
import {
  installWebLocksMock,
  uninstallWebLocksMock,
} from './helpers/webLocksMock'

/**
 * Testes de regressão de IDENTIDADE E EQUIVALÊNCIA (TP-03), conforme
 * docs/PERSISTENCE_REMEDIATION_PLAN.md (seção 4 e tabela de testes).
 */

const SAMPLE_INPUT: PlanningInput = {
  destinationId: 'florianopolis',
  days: 3,
  interests: ['natureza', 'gastronomia'],
  style: 'equilibrado',
  budget: 2000,
}

async function saveOk(itinerary: Itinerary): Promise<SavedItinerary> {
  const result = await saveItinerary(itinerary)
  if (!result.ok) throw new Error(`falha ao salvar roteiro de teste: ${result.message}`)
  return result.record
}

function readRawStorage(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

function expectNeedsConfirmation(
  result: Awaited<ReturnType<typeof saveItinerary>>,
): ReplaceConfirmation {
  if (result.ok || result.outcome !== 'needs-confirmation') {
    throw new Error('esperado resultado needs-confirmation')
  }
  return result.confirmation
}

const UUID_ID_PATTERN =
  /^roteiro-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

describe('identidade e equivalência (TP-03)', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
  })

  afterEach(() => {
    uninstallWebLocksMock()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('novos registros usam UUID (crypto.randomUUID), nunca hash ou horário', async () => {
    const record = await saveOk(buildItineraryFromInput(SAMPLE_INPUT))
    expect(record.id).toMatch(UUID_ID_PATTERN)
  })

  it('TP-03: colisão real — registro legado cujo id coincide com o fingerprint de outro planejamento é preservado', async () => {
    // O par exato da auditoria (fingerprint roteiro-2cd27b6e) não foi
    // transcrito no plano (ambiguidade nº 9); esta fixture reproduz o
    // mesmo mecanismo com planejamentos da base local.
    const { legacyRecord, collidingItinerary } = buildCollisionPair()
    localStorage.setItem(STORAGE_KEY, JSON.stringify([legacyRecord]))

    const result = await saveItinerary(collidingItinerary)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    // O novo registro recebe UUID próprio e o registro legado (que
    // contém um roteiro DIFERENTE) não é substituído.
    expect(result.record.id).toMatch(UUID_ID_PATTERN)
    expect(result.record.id).not.toBe(legacyRecord.id)

    const load = loadSavedItineraries()
    expect(load.status).toBe('ok')
    expect(load.records).toHaveLength(2)
    const preserved = load.records.find((item) => item.id === legacyRecord.id)
    expect(preserved).toBeDefined()
    expect(preserved?.itinerary.input.days).toBe(3)
    expect(preserved?.savedAt).toBe(legacyRecord.savedAt)
  })

  it('TP-03: interesses em ordens diferentes configuram planejamento equivalente', async () => {
    const first = await saveOk(buildItineraryFromInput(SAMPLE_INPUT))
    const reordered = buildItineraryFromInput({
      ...SAMPLE_INPUT,
      interests: ['gastronomia', 'natureza'],
    })

    // Equivalente exige confirmação; confirmada, preserva o id do alvo.
    const attempt = await saveItinerary(reordered)
    const confirmation = expectNeedsConfirmation(attempt)
    const second = await saveItinerary(reordered, confirmation)
    expect(second.ok).toBe(true)
    if (second.ok) expect(second.record.id).toBe(first.id)
    expect(loadSavedItineraries().records).toHaveLength(1)
  })

  it('equivalência compara campos diretamente: qualquer diferença gera registro novo', () => {
    const base = arePlanningsEquivalent(SAMPLE_INPUT, { ...SAMPLE_INPUT })
    expect(base).toBe(true)

    const variants: PlanningInput[] = [
      { ...SAMPLE_INPUT, destinationId: 'lisboa' },
      { ...SAMPLE_INPUT, days: 4 },
      { ...SAMPLE_INPUT, style: 'confortavel' },
      // Orçamento numérico exato, sem arredondamento.
      { ...SAMPLE_INPUT, budget: 2000.01 },
      { ...SAMPLE_INPUT, interests: ['natureza'] },
      { ...SAMPLE_INPUT, interests: ['natureza', 'gastronomia', 'cultura'] },
    ]
    for (const variant of variants) {
      expect(arePlanningsEquivalent(SAMPLE_INPUT, variant)).toBe(false)
    }
  })

  it('TP-03: UUID repetido gera alternativa confrontando com os IDs existentes', async () => {
    const existing = await saveOk(buildItineraryFromInput(SAMPLE_INPUT))
    const freshId = '11111111-2222-4333-8444-555555555555'

    const randomUUID = vi
      .fn<() => string>()
      .mockReturnValueOnce(existing.id.replace('roteiro-', ''))
      .mockReturnValue(freshId)
    vi.stubGlobal('crypto', { randomUUID })

    const result = await saveItinerary(
      buildItineraryFromInput({ ...SAMPLE_INPUT, days: 5 }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(randomUUID).toHaveBeenCalledTimes(2)
    expect(result.record.id).toBe(`roteiro-${freshId}`)
    expect(loadSavedItineraries().records).toHaveLength(2)
  })

  it('TP-03: esgotamento das 10 tentativas de UUID falha sem nenhuma escrita', async () => {
    const existing = await saveOk(buildItineraryFromInput(SAMPLE_INPUT))
    const before = readRawStorage()

    const randomUUID = vi
      .fn<() => string>()
      .mockReturnValue(existing.id.replace('roteiro-', ''))
    vi.stubGlobal('crypto', { randomUUID })

    const result = await saveItinerary(
      buildItineraryFromInput({ ...SAMPLE_INPUT, days: 5 }),
    )
    expect(result.ok).toBe(false)
    if (result.ok || result.outcome === 'needs-confirmation') return

    expect(randomUUID).toHaveBeenCalledTimes(MAX_ID_GENERATION_ATTEMPTS)
    expect(result.message).toContain('identificador único')
    // Falha sem alteração da chave principal.
    expect(readRawStorage()).toBe(before)
  })

  it('TP-03: indisponibilidade da geração de UUID falha sem nenhuma escrita', async () => {
    const before = readRawStorage()
    vi.stubGlobal('crypto', {})

    const result = await saveItinerary(buildItineraryFromInput(SAMPLE_INPUT))
    expect(result.ok).toBe(false)
    if (result.ok || result.outcome === 'needs-confirmation') return

    expect(result.message).toContain('identificador único')
    expect(readRawStorage()).toBe(before)
  })

  it('TP-03: mais de um planejamento equivalente bloqueia a substituição automática', async () => {
    // Dois registros válidos, com IDs distintos, para o MESMO
    // planejamento (só possível via edição manual ou versões antigas).
    const first = buildHistoricalValidRecord()
    const second: SavedItinerary = {
      ...structuredClone(first),
      id: 'roteiro-outro-id',
      savedAt: '2025-10-01T08:00:00Z',
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([first, second]))
    const before = readRawStorage()

    const result = await saveItinerary(
      buildItineraryFromInput({
        destinationId: 'florianopolis',
        days: 2,
        interests: ['gastronomia', 'natureza'],
        style: 'equilibrado',
        budget: 500,
      }),
    )
    expect(result.ok).toBe(false)
    if (result.ok || result.outcome === 'needs-confirmation') return

    expect(result.message).toContain('mais de um roteiro salvo equivalente')
    // Nenhuma escolha automática: a chave principal permanece idêntica.
    expect(readRawStorage()).toBe(before)
  })

  it('TP-03: IDs duplicados na coleção tornam a coleção corrompida, sem ações individuais', () => {
    const { payload, duplicateId } = buildDuplicateIdsPayload()
    const raw = JSON.stringify(payload)
    localStorage.setItem(STORAGE_KEY, raw)

    const load = loadSavedItineraries()
    expect(load.status).toBe('corrupted')
    expect(load.records).toEqual([])
    expect(load.duplicateIds).toEqual([duplicateId])

    // A leitura nunca altera o conteúdo observado.
    expect(readRawStorage()).toBe(raw)
  })

  it('TP-03: IDs duplicados bloqueiam a exclusão individual de qualquer registro', async () => {
    const { payload, duplicateId } = buildDuplicateIdsPayload()
    const raw = JSON.stringify(payload)
    localStorage.setItem(STORAGE_KEY, raw)

    const result = await removeSavedItinerary(duplicateId, { expectedRaw: raw })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('bloqueadas')
    expect(readRawStorage()).toBe(raw)
  })

  it('registros históricos com id legado de hash continuam utilizáveis', async () => {
    const legacy = buildHistoricalValidRecord()
    localStorage.setItem(STORAGE_KEY, JSON.stringify([legacy]))

    const load = loadSavedItineraries()
    expect(load.status).toBe('ok')
    expect(load.records).toHaveLength(1)
    expect(load.records[0].id).toBe(legacy.id)
    expect(load.records[0].savedAt).toBe(legacy.savedAt)

    // Salvar o planejamento equivalente exige confirmação e preserva o
    // identificador legado.
    const equivalent = buildItineraryFromInput({
      destinationId: 'florianopolis',
      days: 2,
      interests: ['natureza', 'gastronomia'],
      style: 'equilibrado',
      budget: 500,
    })
    const attempt = await saveItinerary(equivalent)
    const confirmation = expectNeedsConfirmation(attempt)
    expect(confirmation.targetId).toBe(legacy.id)

    const result = await saveItinerary(equivalent, confirmation)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.record.id).toBe(legacy.id)
    expect(loadSavedItineraries().records).toHaveLength(1)
  })
})
