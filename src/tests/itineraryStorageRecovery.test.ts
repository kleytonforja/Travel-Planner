import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { destinations } from '../data/destinations'
import { generateItinerary } from '../services/itineraryGenerator'
import {
  CORRUPTED_BACKUP_KEY,
  discardQuarantineCopy,
  loadQuarantine,
  loadSavedItineraries,
  previewRecovery,
  recoverCorruptedStorage,
  restoreQuarantineCopy,
  saveItinerary,
  STORAGE_KEY,
} from '../services/itineraryStorage'
import type { Itinerary, PlanningInput, SavedItinerary } from '../types'
import {
  buildDuplicateIdsPayload,
  buildHistoricalValidRecord,
} from './fixtures/savedItineraries'
import {
  installWebLocksMock,
  uninstallWebLocksMock,
} from './helpers/webLocksMock'

/**
 * Testes de regressão de QUARENTENA E RECUPERAÇÃO (TP-05), conforme
 * docs/PERSISTENCE_REMEDIATION_PLAN.md (seções 6 e 10):
 *
 * - A quarentena guarda o conteúdo bruto original, sem filtrar nem
 *   reserializar, e confirma a própria gravação por releitura.
 * - Cópia existente diferente (inclusive string vazia) bloqueia a
 *   operação; cópia idêntica é reutilizada.
 * - Falha ao ler, criar ou confirmar o backup impede a escrita principal.
 * - A chave principal nunca é removida antes de ser substituída.
 * - Recuperação, restauração e descarte exigem confirmação vinculada ao
 *   conteúdo observado; ações desatualizadas são canceladas.
 *
 * Os testes comparam o CONTEÚDO BRUTO das duas chaves antes e depois.
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

function readMainRaw(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

function readQuarantineRaw(): string | null {
  return localStorage.getItem(CORRUPTED_BACKUP_KEY)
}

/** Payload corrompido com um registro válido e elementos ilegíveis. */
function buildPartiallyValidPayload(): { raw: string; valid: SavedItinerary } {
  const valid = buildHistoricalValidRecord()
  const raw = JSON.stringify([valid, { foo: 'bar' }, null])
  return { raw, valid }
}

describe('quarentena e recuperação (TP-05)', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
  })

  afterEach(() => {
    uninstallWebLocksMock()
    vi.restoreAllMocks()
  })

  it('pré-visualização informa recuperáveis, ilegíveis e IDs a corrigir sem alterar chaves', () => {
    const { payload } = buildDuplicateIdsPayload()
    const raw = JSON.stringify([...payload, { invalido: true }])
    localStorage.setItem(STORAGE_KEY, raw)

    const preview = previewRecovery()
    if (preview.status !== 'corrupted') throw new Error('esperado corrompido')
    expect(preview.raw).toBe(raw)
    expect(preview.recoverableCount).toBe(2)
    expect(preview.backupOnlyCount).toBe(1)
    expect(preview.idsToFixCount).toBe(2)

    // Nenhuma chave foi alterada pela pré-visualização.
    expect(readMainRaw()).toBe(raw)
    expect(readQuarantineRaw()).toBeNull()
  })

  it('pré-visualização em coleção íntegra ou ausente não propõe recuperação', () => {
    expect(previewRecovery().status).toBe('not-corrupted')
    localStorage.setItem(STORAGE_KEY, '[]')
    expect(previewRecovery().status).toBe('not-corrupted')
    localStorage.setItem(STORAGE_KEY, JSON.stringify([buildHistoricalValidRecord()]))
    expect(previewRecovery().status).toBe('not-corrupted')
  })

  it('recuperação preserva o conteúdo bruto original na quarentena e grava os registros válidos', async () => {
    const { raw, valid } = buildPartiallyValidPayload()
    localStorage.setItem(STORAGE_KEY, raw)

    const preview = previewRecovery()
    if (preview.status !== 'corrupted') throw new Error('esperado corrompido')
    expect(preview.recoverableCount).toBe(1)
    expect(preview.backupOnlyCount).toBe(2)

    const result = await recoverCorruptedStorage(preview.raw)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.recoveredCount).toBe(1)
    expect(result.backupOnlyCount).toBe(2)
    expect(result.idsFixedCount).toBe(0)
    expect(result.backup).toBe('created')

    // A quarentena contém EXATAMENTE o conteúdo bruto original.
    expect(readQuarantineRaw()).toBe(raw)
    // A chave principal passa a conter apenas o registro válido.
    const load = loadSavedItineraries()
    expect(load.status).toBe('ok')
    expect(load.records).toHaveLength(1)
    expect(load.records[0].id).toBe(valid.id)
    expect(load.records[0].savedAt).toBe(valid.savedAt)
  })

  it('recuperação preserva campos adicionais desconhecidos dos registros mantidos', async () => {
    const withExtra = {
      ...buildHistoricalValidRecord(),
      origem: 'importacao-antiga',
    }
    const raw = JSON.stringify([withExtra, 'lixo'])
    localStorage.setItem(STORAGE_KEY, raw)

    const result = await recoverCorruptedStorage(raw)
    expect(result.ok).toBe(true)

    const mainRaw = readMainRaw()
    expect(mainRaw).toContain('"origem":"importacao-antiga"')
    expect(readQuarantineRaw()).toBe(raw)
  })

  it('recuperação sem registros recuperáveis deixa a lista vazia e o original na quarentena', async () => {
    localStorage.setItem(STORAGE_KEY, '{json-invalido')

    const preview = previewRecovery()
    if (preview.status !== 'corrupted') throw new Error('esperado corrompido')
    expect(preview.recoverableCount).toBe(0)

    const result = await recoverCorruptedStorage(preview.raw)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.recoveredCount).toBe(0)

    // A lista ativa fica vazia; a chave principal NUNCA é removida.
    expect(readMainRaw()).toBe('[]')
    expect(readQuarantineRaw()).toBe('{json-invalido')
    expect(loadSavedItineraries().status).toBe('empty')
  })

  it('string vazia e formato desconhecido são preservados integralmente na recuperação', async () => {
    // String vazia armazenada é conteúdo corrompido.
    localStorage.setItem(STORAGE_KEY, '')
    const emptyResult = await recoverCorruptedStorage('')
    expect(emptyResult.ok).toBe(true)
    expect(readMainRaw()).toBe('[]')
    expect(readQuarantineRaw()).toBe('')

    // Quarentena ocupada por string vazia bloqueia conteúdo diferente.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ roteiros: [] }))
    const blocked = await recoverCorruptedStorage(JSON.stringify({ roteiros: [] }))
    expect(blocked.ok).toBe(false)

    // Descartando a cópia vazia, a recuperação do formato desconhecido
    // preserva o texto exato.
    const discard = await discardQuarantineCopy('')
    expect(discard.ok).toBe(true)
    const unknownRaw = JSON.stringify({ roteiros: [] })
    const recovered = await recoverCorruptedStorage(unknownRaw)
    expect(recovered.ok).toBe(true)
    expect(readQuarantineRaw()).toBe(unknownRaw)
    expect(readMainRaw()).toBe('[]')
  })

  it('quarentena com conteúdo idêntico é reutilizada e a recuperação prossegue', async () => {
    const { raw } = buildPartiallyValidPayload()
    localStorage.setItem(STORAGE_KEY, raw)
    localStorage.setItem(CORRUPTED_BACKUP_KEY, raw)

    const result = await recoverCorruptedStorage(raw)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.backup).toBe('reused')
    expect(readQuarantineRaw()).toBe(raw)
    expect(loadSavedItineraries().records).toHaveLength(1)
  })

  it('quarentena ocupada por conteúdo diferente bloqueia a recuperação e preserva ambas as chaves', async () => {
    const { raw } = buildPartiallyValidPayload()
    localStorage.setItem(STORAGE_KEY, raw)
    localStorage.setItem(CORRUPTED_BACKUP_KEY, 'copia-anterior-diferente')

    const result = await recoverCorruptedStorage(raw)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.outcome).toBe('failure')
      expect(result.message).toContain('quarentena')
    }

    // Ambas as chaves permanecem intactas.
    expect(readMainRaw()).toBe(raw)
    expect(readQuarantineRaw()).toBe('copia-anterior-diferente')
  })

  it('falha na criação do backup impede a escrita principal (quota: backup não cabe)', async () => {
    const { raw } = buildPartiallyValidPayload()
    localStorage.setItem(STORAGE_KEY, raw)

    // Quota suficiente para a coleção recuperada, mas não para o backup.
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key) => {
      if (key === CORRUPTED_BACKUP_KEY) {
        throw new DOMException('sem espaço', 'QuotaExceededError')
      }
      throw new Error('a chave principal não deveria ser gravada')
    })

    const result = await recoverCorruptedStorage(raw)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.outcome).toBe('failure')
      expect(result.message).toContain('cheio')
    }

    // Original intacto; nenhum backup parcial.
    expect(readMainRaw()).toBe(raw)
    expect(readQuarantineRaw()).toBeNull()
  })

  it('falha na confirmação da gravação do backup impede a escrita principal', async () => {
    const { raw } = buildPartiallyValidPayload()
    localStorage.setItem(STORAGE_KEY, raw)

    const originalGet = Storage.prototype.getItem.bind(localStorage)
    const originalSet = Storage.prototype.setItem.bind(localStorage)
    let backupWritten = false
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      originalSet(key, value)
      if (key === CORRUPTED_BACKUP_KEY) backupWritten = true
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      // A releitura de confirmação do backup retorna outro conteúdo.
      if (key === CORRUPTED_BACKUP_KEY && backupWritten) return 'conteudo-divergente'
      return originalGet(key)
    })

    const result = await recoverCorruptedStorage(raw)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.outcome).toBe('failure')

    // A chave principal nunca foi tocada.
    expect(readMainRaw()).toBe(raw)
  })

  it('backup confirmado e escrita principal com falha: original preservado e backup mantido', async () => {
    const { raw } = buildPartiallyValidPayload()
    localStorage.setItem(STORAGE_KEY, raw)

    const originalSet = Storage.prototype.setItem.bind(localStorage)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      if (key === STORAGE_KEY) {
        throw new DOMException('falha na gravação', 'UnknownError')
      }
      originalSet(key, value)
    })

    const result = await recoverCorruptedStorage(raw)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.outcome).toBe('failure')

    // A cópia adicional na quarentena permanece (não é limpa
    // automaticamente) e o original principal está intacto.
    expect(readMainRaw()).toBe(raw)
    expect(readQuarantineRaw()).toBe(raw)
  })

  it('recuperação de IDs duplicados preserva ambos os registros com IDs novos e distintos', async () => {
    const { payload, duplicateId } = buildDuplicateIdsPayload()
    const raw = JSON.stringify(payload)
    localStorage.setItem(STORAGE_KEY, raw)

    const result = await recoverCorruptedStorage(raw)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.recoveredCount).toBe(2)
    expect(result.idsFixedCount).toBe(2)

    const load = loadSavedItineraries()
    expect(load.status).toBe('ok')
    expect(load.records).toHaveLength(2)
    const ids = load.records.map((item) => item.id)
    // Todos os integrantes do grupo duplicado receberam IDs novos.
    expect(ids).not.toContain(duplicateId)
    expect(new Set(ids).size).toBe(2)
    // savedAt e planejamentos históricos preservados.
    const savedAts = load.records.map((item) => item.savedAt).sort()
    expect(savedAts).toEqual(
      payload.map((item) => (item as SavedItinerary).savedAt).sort(),
    )
    expect(readQuarantineRaw()).toBe(raw)
  })

  it('ação desatualizada: conteúdo mudou entre a exibição e a confirmação cancela a recuperação', async () => {
    const { raw } = buildPartiallyValidPayload()
    localStorage.setItem(STORAGE_KEY, raw)
    const preview = previewRecovery()
    if (preview.status !== 'corrupted') throw new Error('esperado corrompido')

    // Outra aba altera o armazenamento antes da confirmação.
    localStorage.setItem(STORAGE_KEY, '{outro-json-invalido')

    const result = await recoverCorruptedStorage(preview.raw)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.outcome).toBe('failure')
      expect(result.message).toContain('mudaram desde a última leitura')
    }
    expect(readMainRaw()).toBe('{outro-json-invalido')
    expect(readQuarantineRaw()).toBeNull()
  })

  it('ação desatualizada: corrupção corrigida entre a exibição e a confirmação cancela a recuperação', async () => {
    const { raw } = buildPartiallyValidPayload()
    localStorage.setItem(STORAGE_KEY, raw)
    const preview = previewRecovery()
    if (preview.status !== 'corrupted') throw new Error('esperado corrompido')

    // A coleção foi corrigida (ou substituída) por outra via.
    localStorage.setItem(STORAGE_KEY, '[]')

    const result = await recoverCorruptedStorage(preview.raw)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.outcome).toBe('failure')
    // Nenhuma autorização anterior é reutilizada: chaves intactas.
    expect(readMainRaw()).toBe('[]')
    expect(readQuarantineRaw()).toBeNull()
  })

  it('restauração da quarentena com chave principal vazia recupera registros e mantém a cópia', async () => {
    const { payload } = buildDuplicateIdsPayload()
    const quarantineRaw = JSON.stringify(payload)
    localStorage.setItem(CORRUPTED_BACKUP_KEY, quarantineRaw)

    const result = await restoreQuarantineCopy(quarantineRaw)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.restoredCount).toBe(2)
    expect(result.idsFixedCount).toBe(2)

    const load = loadSavedItineraries()
    expect(load.status).toBe('ok')
    expect(load.records).toHaveLength(2)
    // A quarentena é mantida após a restauração.
    expect(readQuarantineRaw()).toBe(quarantineRaw)
  })

  it('restauração com roteiros ativos é bloqueada sem alterações', async () => {
    await saveOk(buildSampleItinerary())
    const mainRaw = readMainRaw()
    const quarantineRaw = JSON.stringify([buildHistoricalValidRecord()])
    localStorage.setItem(CORRUPTED_BACKUP_KEY, quarantineRaw)

    const result = await restoreQuarantineCopy(quarantineRaw)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.outcome).toBe('failure')
      expect(result.message).toContain('bloqueada')
    }
    expect(readMainRaw()).toBe(mainRaw)
    expect(readQuarantineRaw()).toBe(quarantineRaw)
  })

  it('restauração com chave principal corrompida é bloqueada (recuperar primeiro)', async () => {
    localStorage.setItem(STORAGE_KEY, '{json-invalido')
    const quarantineRaw = JSON.stringify([buildHistoricalValidRecord()])
    localStorage.setItem(CORRUPTED_BACKUP_KEY, quarantineRaw)

    const result = await restoreQuarantineCopy(quarantineRaw)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.outcome).toBe('failure')
    expect(readMainRaw()).toBe('{json-invalido')
    expect(readQuarantineRaw()).toBe(quarantineRaw)
  })

  it('restauração com conteúdo divergente do observado é cancelada', async () => {
    const quarantineRaw = JSON.stringify([buildHistoricalValidRecord()])
    localStorage.setItem(CORRUPTED_BACKUP_KEY, quarantineRaw)

    const result = await restoreQuarantineCopy('conteudo-desatualizado')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.outcome).toBe('failure')
    expect(readMainRaw()).toBeNull()
    expect(readQuarantineRaw()).toBe(quarantineRaw)
  })

  it('restauração sem cópia na quarentena falha sem alterações', async () => {
    const result = await restoreQuarantineCopy('qualquer')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.outcome).toBe('failure')
    expect(readMainRaw()).toBeNull()
  })

  it('descarte definitivo da quarentena remove a cópia sem tocar a chave principal', async () => {
    const record = await saveOk(buildSampleItinerary())
    const mainRaw = readMainRaw()
    const quarantineRaw = '{json-invalido'
    localStorage.setItem(CORRUPTED_BACKUP_KEY, quarantineRaw)

    const quarantine = loadQuarantine()
    if (quarantine.status !== 'occupied') throw new Error('esperado ocupada')

    const result = await discardQuarantineCopy(quarantine.raw)
    expect(result.ok).toBe(true)
    expect(readQuarantineRaw()).toBeNull()
    // A chave principal não foi alterada.
    expect(readMainRaw()).toBe(mainRaw)
    expect(loadSavedItineraries().records[0].id).toBe(record.id)
  })

  it('descarte com conteúdo divergente do observado é cancelado (ação desatualizada)', async () => {
    const quarantineRaw = 'copia-real'
    localStorage.setItem(CORRUPTED_BACKUP_KEY, quarantineRaw)

    const result = await discardQuarantineCopy('copia-desatualizada')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.outcome).toBe('failure')
      expect(result.message).toContain('mudaram desde a última leitura')
    }
    expect(readQuarantineRaw()).toBe(quarantineRaw)
  })

  it('falha ao remover a quarentena nunca retorna falso sucesso', async () => {
    const quarantineRaw = 'copia-protegida'
    localStorage.setItem(CORRUPTED_BACKUP_KEY, quarantineRaw)

    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('remoção bloqueada', 'UnknownError')
    })

    const result = await discardQuarantineCopy(quarantineRaw)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.outcome).toBe('failure')
    expect(readQuarantineRaw()).toBe(quarantineRaw)
  })

  it('confirmação do descarte indisponível retorna resultado incerto', async () => {
    const quarantineRaw = 'copia-instavel'
    localStorage.setItem(CORRUPTED_BACKUP_KEY, quarantineRaw)

    const originalGet = Storage.prototype.getItem.bind(localStorage)
    const originalRemove = Storage.prototype.removeItem.bind(localStorage)
    let removed = false
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
      originalRemove(key)
      removed = true
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (removed && key === CORRUPTED_BACKUP_KEY) {
        throw new DOMException('leitura instável', 'UnknownError')
      }
      return originalGet(key)
    })

    const result = await discardQuarantineCopy(quarantineRaw)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.outcome).toBe('uncertain')
      expect(result.message).toBe(
        'Não foi possível confirmar a operação. Recarregue os roteiros antes de tentar novamente.',
      )
    }
  })
})
