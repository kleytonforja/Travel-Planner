import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  arePlanningsEquivalent,
  buildPlanningFingerprint,
  loadSavedItineraries,
  saveItinerary,
  STORAGE_KEY,
} from '../services/itineraryStorage'
import type { PlanningInput, SavedItinerary } from '../types'
import { buildItineraryFromInput } from './fixtures/savedItineraries'
import {
  installWebLocksMock,
  uninstallWebLocksMock,
} from './helpers/webLocksMock'

/**
 * Regressão da COLISÃO VERDADEIRA de fingerprints (AUD-07), conforme
 * docs/FINAL_AUDIT_FINDINGS.md (seções 2 e 3, critério do AUD-07):
 *
 * - O teste CALCULA os dois fingerprints e comprova sua igualdade.
 * - O registro legado e o novo roteiro devem ser preservados.
 *
 * Origem dos dados: par SINTÉTICO reconstruído pela auditoria
 * independente final (seção 2, "Colisão verdadeira reconstruída") —
 * dois planejamentos distintos que geram exatamente o fingerprint
 * `roteiro-2cd27b6e`. NÃO são os dois planejamentos originais da
 * auditoria anterior, que permanecem indisponíveis (ambiguidade nº 9 do
 * plano); esta regressão não substitui a rastreabilidade do par
 * original e não deve ser apresentada como tal.
 */

const COLLIDING_INPUT_A: PlanningInput = {
  destinationId: 'florianopolis',
  days: 1,
  style: 'economico',
  budget: 95263682,
  interests: ['natureza', 'cultura', 'relaxamento'],
}

const COLLIDING_INPUT_B: PlanningInput = {
  destinationId: 'florianopolis',
  days: 1,
  style: 'economico',
  budget: 97062267,
  interests: ['gastronomia', 'natureza', 'cultura', 'aventura', 'relaxamento'],
}

/** Fingerprint exato citado pelo plano e reconstruído pela auditoria. */
const EXPECTED_FINGERPRINT = 'roteiro-2cd27b6e'

const UUID_ID_PATTERN =
  /^roteiro-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

describe('colisão verdadeira reconstruída (AUD-07)', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
  })

  afterEach(() => {
    uninstallWebLocksMock()
  })

  it('os dois planejamentos sintéticos distintos produzem exatamente roteiro-2cd27b6e', () => {
    // A igualdade é CALCULADA, não presumida.
    const fingerprintA = buildPlanningFingerprint(COLLIDING_INPUT_A)
    const fingerprintB = buildPlanningFingerprint(COLLIDING_INPUT_B)
    expect(fingerprintA).toBe(EXPECTED_FINGERPRINT)
    expect(fingerprintB).toBe(EXPECTED_FINGERPRINT)
    expect(fingerprintA).toBe(fingerprintB)

    // Apesar da colisão de hash, os planejamentos NÃO são equivalentes
    // (orçamento e interesses diferem) — a comparação é por campos.
    expect(arePlanningsEquivalent(COLLIDING_INPUT_A, COLLIDING_INPUT_B)).toBe(
      false,
    )
  })

  it('salvar o planejamento B preserva integralmente o registro legado A com o id colidido', async () => {
    const itineraryA = buildItineraryFromInput(COLLIDING_INPUT_A)
    const legacyRecord: SavedItinerary = {
      // O id legado é o próprio fingerprint colidido (formato v1).
      id: EXPECTED_FINGERPRINT,
      savedAt: '2025-08-20T14:00:00Z',
      itinerary: itineraryA,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([legacyRecord]))
    const rawBefore = localStorage.getItem(STORAGE_KEY)

    const result = await saveItinerary(
      buildItineraryFromInput(COLLIDING_INPUT_B),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return

    // O novo registro recebe UUID próprio — o hash não participa de
    // nenhuma decisão de persistência.
    expect(result.record.id).toMatch(UUID_ID_PATTERN)
    expect(result.record.id).not.toBe(EXPECTED_FINGERPRINT)

    // Os DOIS registros são preservados; o legado permanece intacto.
    const load = loadSavedItineraries()
    expect(load.status).toBe('ok')
    expect(load.records).toHaveLength(2)
    const preserved = load.records.find(
      (item) => item.id === EXPECTED_FINGERPRINT,
    )
    expect(preserved).toBeDefined()
    expect(preserved?.savedAt).toBe(legacyRecord.savedAt)
    expect(preserved?.itinerary.input).toEqual(COLLIDING_INPUT_A)

    // O conteúdo anterior está contido, byte a byte, na nova coleção:
    // o registro legado não foi reescrito nem reordenado em relação ao
    // payload original (o novo registro é acrescentado no início).
    const rawAfter = localStorage.getItem(STORAGE_KEY)
    expect(rawAfter).not.toBeNull()
    expect(rawBefore).not.toBeNull()
    const legacySegment = JSON.stringify(legacyRecord)
    expect(rawAfter).toContain(legacySegment)
  })
})
