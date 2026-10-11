import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { destinations } from '../data/destinations'
import { generateItinerary } from '../services/itineraryGenerator'
import {
  CORRUPTED_BACKUP_KEY,
  discardQuarantineCopy,
  loadQuarantine,
  loadSavedItineraries,
  recoverCorruptedStorage,
  removeSavedItinerary,
  restoreQuarantineCopy,
  saveItinerary,
  STORAGE_KEY,
  type ReplaceConfirmation,
} from '../services/itineraryStorage'
import type { Itinerary, PlanningInput, SavedItinerary } from '../types'
import {
  installFailingWebLocksMock,
  installWebLocksMock,
  uninstallWebLocksMock,
} from './helpers/webLocksMock'

/**
 * Testes de regressão do fluxo de gravação segura (TP-04 e concorrência),
 * conforme docs/PERSISTENCE_REMEDIATION_PLAN.md (seções 3 e 8):
 *
 * - Uma leitura de decisão por operação; falha de leitura nunca vira
 *   lista vazia.
 * - Um único setItem na chave principal, confirmado por releitura.
 * - Sucesso confirmado, falha sem alteração e resultado incerto são
 *   resultados distintos.
 * - Mutações coordenadas pelo lock exclusivo Web Locks; sem a API, as
 *   mutações são bloqueadas (sem fallback inseguro).
 * - Ações desatualizadas não modificam nenhuma chave.
 *
 * Os testes comparam o CONTEÚDO BRUTO das chaves antes e depois.
 */

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

function expectUncertain(result: { ok: boolean }): void {
  if (result.ok || !('outcome' in result) || result.outcome !== 'uncertain') {
    throw new Error('esperado resultado incerto')
  }
}

describe('fluxo de gravação segura (TP-04 e concorrência)', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
  })

  afterEach(() => {
    uninstallWebLocksMock()
    vi.restoreAllMocks()
  })

  it('falha na primeira leitura: nenhuma chamada de escrita é feita', async () => {
    const setSpy = vi.spyOn(Storage.prototype, 'setItem')
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('leitura bloqueada', 'SecurityError')
    })

    const result = await saveItinerary(buildSampleItinerary())
    expect(result.ok).toBe(false)
    expect(setSpy).not.toHaveBeenCalled()
    // A falha de leitura não virou lista vazia usada para gravar.
    vi.restoreAllMocks()
    expect(readRawStorage()).toBeNull()
  })

  it('falha na confirmação de escrita: resultado incerto, sem repetição nem rollback', async () => {
    await saveOk(buildSampleItinerary())
    const rawBefore = readRawStorage()

    const originalGet = Storage.prototype.getItem.bind(localStorage)
    const originalSet = Storage.prototype.setItem.bind(localStorage)
    let failReads = false
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (failReads) throw new DOMException('leitura instável', 'UnknownError')
      return originalGet(key)
    })
    const setSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation((key, value) => {
        failReads = true
        // A escrita real acontece — só a leitura de confirmação falha.
        originalSet(key, value)
      })

    const result = await saveItinerary(buildSampleItinerary({ days: 5 }))

    expectUncertain(result)
    if (!result.ok && 'message' in result) {
      expect(result.message).toBe(
        'Não foi possível confirmar a operação. Recarregue os roteiros antes de tentar novamente.',
      )
    }
    // Um único setItem: sem repetição de escrita.
    expect(setSpy).toHaveBeenCalledTimes(1)
    // Sem rollback automático: o conteúdo gravado permanece.
    vi.restoreAllMocks()
    expect(readRawStorage()).not.toBe(rawBefore)
  })

  it('confirmação encontra conteúdo divergente: resultado incerto', async () => {
    const originalGet = Storage.prototype.getItem.bind(localStorage)
    const originalSet = Storage.prototype.setItem.bind(localStorage)
    let diverge = false
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (diverge && key === STORAGE_KEY) return '["outro-conteudo"]'
      return originalGet(key)
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      diverge = true
      originalSet(key, value)
    })

    const result = await saveItinerary(buildSampleItinerary())
    expectUncertain(result)
  })

  it('quota excedida na escrita principal: falha com a chave idêntica ao estado anterior', async () => {
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
    expect(readRawStorage()).toBe(rawBefore)
    const load = loadSavedItineraries()
    expect(load.records.map((item) => item.id)).toEqual([first.id])
  })

  it('escritas consecutivas: cada estado intermediário é confirmado pelo conteúdo bruto', async () => {
    const first = await saveOk(buildSampleItinerary())
    const rawAfterFirst = readRawStorage()
    expect(rawAfterFirst).toContain(first.id)

    const second = await saveOk(buildSampleItinerary({ days: 5 }))
    const rawAfterSecond = readRawStorage()
    expect(rawAfterSecond).toContain(first.id)
    expect(rawAfterSecond).toContain(second.id)

    const observed = loadSavedItineraries()
    expect(observed.raw).toBe(rawAfterSecond)
    const removed = await removeSavedItinerary(first.id, {
      expectedRaw: observed.raw,
    })
    expect(removed.ok).toBe(true)

    const rawAfterRemove = readRawStorage()
    expect(rawAfterRemove).not.toBeNull()
    expect(rawAfterRemove).toContain(second.id)
    expect(rawAfterRemove).not.toContain(first.id)
  })

  it('leituras e escritas falhando em tentativas consecutivas nunca viram lista vazia', async () => {
    const first = await saveOk(buildSampleItinerary())
    const rawBefore = readRawStorage()

    // Tentativa 1: leitura falha.
    vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new DOMException('instável', 'UnknownError')
    })
    const attempt1 = await saveItinerary(buildSampleItinerary({ days: 5 }))
    expect(attempt1.ok).toBe(false)
    expect(readRawStorage()).toBe(rawBefore)

    // Tentativa 2: escrita falha.
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('instável', 'UnknownError')
    })
    const attempt2 = await saveItinerary(buildSampleItinerary({ days: 5 }))
    expect(attempt2.ok).toBe(false)
    expect(readRawStorage()).toBe(rawBefore)

    // Tentativa 3: tudo estável — grava normalmente.
    const attempt3 = await saveItinerary(buildSampleItinerary({ days: 5 }))
    expect(attempt3.ok).toBe(true)
    const load = loadSavedItineraries()
    expect(load.records).toHaveLength(2)
    expect(load.records.map((item) => item.id)).toContain(first.id)
  })

  it('duas operações concorrentes são serializadas pelo lock, sem atualização perdida', async () => {
    const [first, second] = await Promise.all([
      saveItinerary(buildSampleItinerary()),
      saveItinerary(buildSampleItinerary({ days: 5 })),
    ])

    // Ambas as operações concluem com sucesso confirmado: a segunda
    // leu o estado já gravado pela primeira (execução serializada).
    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)

    const load = loadSavedItineraries()
    expect(load.status).toBe('ok')
    expect(load.records).toHaveLength(2)
  })

  it('sem a API Web Locks, as mutações são bloqueadas e a leitura segue utilizável', async () => {
    const record = await saveOk(buildSampleItinerary())
    const rawBefore = readRawStorage()
    localStorage.setItem(CORRUPTED_BACKUP_KEY, 'copia-existente')
    const quarantineBefore = localStorage.getItem(CORRUPTED_BACKUP_KEY)

    uninstallWebLocksMock()

    const save = await saveItinerary(buildSampleItinerary({ days: 5 }))
    expect(save.ok).toBe(false)
    if (!save.ok && save.outcome !== 'needs-confirmation') {
      expect(save.outcome).toBe('failure')
      expect(save.message).toContain('Web Locks')
    }

    const remove = await removeSavedItinerary(record.id, { expectedRaw: rawBefore })
    expect(remove.ok).toBe(false)
    if (!remove.ok) expect(remove.message).toContain('Web Locks')

    const recover = await recoverCorruptedStorage('qualquer')
    expect(recover.ok).toBe(false)
    if (!recover.ok) expect(recover.message).toContain('Web Locks')

    const restore = await restoreQuarantineCopy('copia-existente')
    expect(restore.ok).toBe(false)
    if (!restore.ok) expect(restore.message).toContain('Web Locks')

    const discard = await discardQuarantineCopy('copia-existente')
    expect(discard.ok).toBe(false)
    if (!discard.ok) expect(discard.message).toContain('Web Locks')

    // Nenhuma chave foi alterada.
    expect(readRawStorage()).toBe(rawBefore)
    expect(localStorage.getItem(CORRUPTED_BACKUP_KEY)).toBe(quarantineBefore)

    // Leitura e exportação permanecem utilizáveis.
    const load = loadSavedItineraries()
    expect(load.status).toBe('ok')
    expect(load.records).toHaveLength(1)
    expect(loadQuarantine().status).toBe('occupied')
  })

  it('falha na aquisição do lock bloqueia a mutação sem nenhuma escrita', async () => {
    const rawBefore = readRawStorage()
    installFailingWebLocksMock()

    const setSpy = vi.spyOn(Storage.prototype, 'setItem')
    const result = await saveItinerary(buildSampleItinerary())
    expect(result.ok).toBe(false)
    if (!result.ok && result.outcome !== 'needs-confirmation') {
      expect(result.message).toContain('coordenar')
    }
    expect(setSpy).not.toHaveBeenCalled()
    expect(readRawStorage()).toBe(rawBefore)
  })

  it('ação desatualizada na exclusão: conteúdo mudou desde a leitura, nenhuma chave é alterada', async () => {
    const first = await saveOk(buildSampleItinerary())
    await saveOk(buildSampleItinerary({ days: 5 }))
    const observedRaw = readRawStorage()

    // Outra aba/janela altera o armazenamento entre a leitura e a ação.
    const interference = await saveItinerary(buildSampleItinerary({ days: 7 }))
    expect(interference.ok).toBe(true)
    const rawAfterInterference = readRawStorage()
    expect(rawAfterInterference).not.toBe(observedRaw)

    const result = await removeSavedItinerary(first.id, {
      expectedRaw: observedRaw,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.outcome).toBe('failure')
      expect(result.message).toContain('mudaram desde a última leitura')
    }
    // Nenhuma chave foi modificada pela ação desatualizada.
    expect(readRawStorage()).toBe(rawAfterInterference)
  })

  it('confirmação de substituição desatualizada é cancelada sem escrita', async () => {
    const itinerary = buildSampleItinerary()
    await saveOk(itinerary)

    const attempt = await saveItinerary(itinerary)
    const confirmation = expectNeedsConfirmation(attempt)

    // Conteúdo muda entre a solicitação e a confirmação do usuário.
    const interference = await saveItinerary(buildSampleItinerary({ days: 7 }))
    expect(interference.ok).toBe(true)
    const rawAfterInterference = readRawStorage()

    const result = await saveItinerary(itinerary, confirmation)
    expect(result.ok).toBe(false)
    if (!result.ok && result.outcome !== 'needs-confirmation') {
      expect(result.outcome).toBe('failure')
      expect(result.message).toContain('mudaram desde a última leitura')
    }
    expect(readRawStorage()).toBe(rawAfterInterference)
  })

  it('exclusão de identificador ausente falha sem nenhuma escrita', async () => {
    await saveOk(buildSampleItinerary())
    const rawBefore = readRawStorage()

    const result = await removeSavedItinerary('roteiro-inexistente', {
      expectedRaw: rawBefore,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.outcome).toBe('failure')
      expect(result.message).toContain('não foi encontrado')
    }
    expect(readRawStorage()).toBe(rawBefore)
  })
})
