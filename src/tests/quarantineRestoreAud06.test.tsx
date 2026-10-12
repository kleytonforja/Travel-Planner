import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HomePage } from '../pages/HomePage'
import {
  CORRUPTED_BACKUP_KEY,
  STORAGE_KEY,
} from '../services/itineraryStorage'
import {
  buildDuplicateIdsPayload,
  buildHistoricalValidRecord,
} from './fixtures/savedItineraries'
import {
  installWebLocksMock,
  uninstallWebLocksMock,
} from './helpers/webLocksMock'

/**
 * Testes de regressão do AUD-06 (docs/FINAL_AUDIT_FINDINGS.md) e da
 * lacuna de autorização da restauração da quarentena (mesmo padrão do
 * AUD-01, registrado como risco remanescente no relatório da correção
 * AUD-01):
 *
 * - AUD-06: o painel de restauração era genérico e não informava que o
 *   serviço atribui NOVOS identificadores aos integrantes de grupos com
 *   IDs duplicados. A confirmação precisa apresentar previamente essa
 *   análise, vinculada ao conteúdo analisado.
 * - Lacuna de restauração: a confirmação era representada por um
 *   booleano e lia `quarantine.raw` do estado no momento da confirmação.
 *   A correção vincula a confirmação ao conteúdo bruto EXATO observado
 *   na abertura do painel; se os dados mudarem antes da confirmação, a
 *   operação é cancelada sem modificar nenhuma chave.
 *
 * Nota de reprodução: diferente do descarte (AUD-01), nenhum caminho da
 * interface recarrega o estado da quarentena mantendo o painel de
 * restauração aberto — com a chave principal vazia (pré-condição da
 * restauração), não há mutação local disponível que provoque recarga
 * sem fechar o painel. A lacuna é estrutural (mesmo padrão do AUD-01) e
 * a correção aplica o mesmo vínculo; o cenário "conteúdo alterado entre
 * abertura e confirmação" verifica a garantia de cancelamento.
 *
 * Todos os cenários comparam o CONTEÚDO BRUTO das duas chaves antes e
 * depois. Dados sintéticos (fixtures geradas da base local).
 */

function renderHome() {
  const onOpenSaved = vi.fn()
  render(
    <HomePage
      onOpenSaved={onOpenSaved}
    />,
  )
}

function readMainRaw(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

function readQuarantineRaw(): string | null {
  return localStorage.getItem(CORRUPTED_BACKUP_KEY)
}

async function openRestorePanel(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    await screen.findByRole('button', { name: 'Restaurar registros da cópia' }),
  )
  expect(
    await screen.findByRole('button', { name: 'Confirmar restauração' }),
  ).toBeInTheDocument()
}

function listItem(text: string) {
  return screen.getByText(
    (content, element) => element?.tagName === 'LI' && content === text,
  )
}

describe('AUD-06 — restauração da quarentena com aviso prévio e confirmação vinculada', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
    // jsdom não implementa rolagem; stub silencioso.
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    uninstallWebLocksMock()
    vi.restoreAllMocks()
  })

  it('reproduz o cenário exato do AUD-06: o painel informa previamente os IDs que serão corrigidos', async () => {
    const user = userEvent.setup()
    // Cenário da auditoria: principal com [] e quarentena com dois
    // registros individualmente válidos compartilhando o mesmo ID.
    localStorage.setItem(STORAGE_KEY, '[]')
    const { payload } = buildDuplicateIdsPayload()
    const quarantineRaw = JSON.stringify(payload)
    localStorage.setItem(CORRUPTED_BACKUP_KEY, quarantineRaw)
    renderHome()

    await openRestorePanel(user)

    // O painel DEVE informar previamente a análise do conteúdo: quantos
    // registros serão restaurados e quantos receberão novos IDs.
    expect(listItem('2 registros válidos serão restaurados.')).toBeInTheDocument()
    expect(
      listItem(
        '2 registros com identificadores duplicados receberão novos identificadores.',
      ),
    ).toBeInTheDocument()

    // Nada muda antes da confirmação.
    expect(readMainRaw()).toBe('[]')
    expect(readQuarantineRaw()).toBe(quarantineRaw)
  })

  it('confirmação válida: IDs novos e distintos, demais campos preservados e quarentena intacta', async () => {
    const user = userEvent.setup()
    localStorage.setItem(STORAGE_KEY, '[]')
    const { payload, duplicateId } = buildDuplicateIdsPayload()
    const quarantineRaw = JSON.stringify(payload)
    localStorage.setItem(CORRUPTED_BACKUP_KEY, quarantineRaw)
    renderHome()

    await openRestorePanel(user)
    await user.click(
      screen.getByRole('button', { name: 'Confirmar restauração' }),
    )

    expect(
      await screen.findByText(
        /Restauração concluída e confirmada: 2 registros restaurados \(2 identificadores duplicados foram corrigidos\)/,
      ),
    ).toBeInTheDocument()

    // IDs novos e distintos; savedAt e demais campos preservados.
    const records = JSON.parse(readMainRaw() ?? 'null') as Array<{
      id: string
      savedAt: string
    }>
    expect(records).toHaveLength(2)
    expect(records[0].id).not.toBe(duplicateId)
    expect(records[1].id).not.toBe(duplicateId)
    expect(records[0].id).not.toBe(records[1].id)
    expect(records.map((record) => record.savedAt).sort()).toEqual(
      ['2024-02-29T12:00:00.500Z', '2025-12-01T09:00:00Z'].sort(),
    )
    // A quarentena é mantida integralmente após a restauração.
    expect(readQuarantineRaw()).toBe(quarantineRaw)
  })

  it('conteúdo alterado entre a abertura e a confirmação: operação cancelada sem modificar as chaves', async () => {
    const user = userEvent.setup()
    localStorage.setItem(STORAGE_KEY, '[]')
    const copyA = JSON.stringify([buildHistoricalValidRecord()])
    localStorage.setItem(CORRUPTED_BACKUP_KEY, copyA)
    renderHome()

    await openRestorePanel(user)

    // Outra aba substitui a quarentena SEM nenhuma operação (e portanto
    // sem recarga) nesta página.
    const copyB = JSON.stringify([
      { ...buildHistoricalValidRecord(), id: 'registro-de-outra-aba' },
    ])
    localStorage.setItem(CORRUPTED_BACKUP_KEY, copyB)

    await user.click(
      screen.getByRole('button', { name: 'Confirmar restauração' }),
    )

    // A confirmação envia o conteúdo autorizado na abertura (A); o
    // serviço cancela a ação desatualizada e NENHUMA chave é modificada.
    expect(
      await screen.findByText(/mudaram desde a última leitura/),
    ).toBeInTheDocument()
    expect(readQuarantineRaw()).toBe(copyB)
    expect(readMainRaw()).toBe('[]')
    expect(
      screen.queryByText(/Restauração concluída e confirmada/),
    ).not.toBeInTheDocument()
  })

  it('confirmação cancelada: nenhuma chave é alterada', async () => {
    const user = userEvent.setup()
    localStorage.setItem(STORAGE_KEY, '[]')
    const quarantineRaw = JSON.stringify([buildHistoricalValidRecord()])
    localStorage.setItem(CORRUPTED_BACKUP_KEY, quarantineRaw)
    renderHome()

    await openRestorePanel(user)
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(
      screen.queryByRole('button', { name: 'Confirmar restauração' }),
    ).not.toBeInTheDocument()
    expect(readQuarantineRaw()).toBe(quarantineRaw)
    expect(readMainRaw()).toBe('[]')
  })

  it('confirmação reutilizada: após uma restauração confirmada, nenhuma autorização herdada permanece', async () => {
    const user = userEvent.setup()
    localStorage.setItem(STORAGE_KEY, '[]')
    const copyA = JSON.stringify([buildHistoricalValidRecord()])
    localStorage.setItem(CORRUPTED_BACKUP_KEY, copyA)
    renderHome()

    // Restauração autorizada e válida de A.
    await openRestorePanel(user)
    await user.click(
      screen.getByRole('button', { name: 'Confirmar restauração' }),
    )
    expect(
      await screen.findByText(/Restauração concluída e confirmada: 1 registro restaurado/),
    ).toBeInTheDocument()

    // Outra aba cria uma nova cópia B na quarentena. Nenhuma confirmação
    // herdada de A permanece aberta: o painel está fechado e B intacta.
    const copyB = 'copia-B-nova-apos-restauracao'
    localStorage.setItem(CORRUPTED_BACKUP_KEY, copyB)
    expect(
      screen.queryByRole('button', { name: 'Confirmar restauração' }),
    ).not.toBeInTheDocument()
    expect(readQuarantineRaw()).toBe(copyB)
    expect(readMainRaw()).not.toBe('[]')
  })

  it('quarentena indisponível na confirmação: erro explícito, sem falso sucesso e sem alterações', async () => {
    const user = userEvent.setup()
    localStorage.setItem(STORAGE_KEY, '[]')
    const quarantineRaw = JSON.stringify([buildHistoricalValidRecord()])
    localStorage.setItem(CORRUPTED_BACKUP_KEY, quarantineRaw)
    renderHome()

    await openRestorePanel(user)

    const originalGet = Storage.prototype.getItem.bind(localStorage)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      if (key === CORRUPTED_BACKUP_KEY) {
        throw new DOMException('leitura bloqueada', 'SecurityError')
      }
      return originalGet(key)
    })
    await user.click(
      screen.getByRole('button', { name: 'Confirmar restauração' }),
    )

    expect(
      await screen.findByText(/Não foi possível acessar a cópia de segurança/),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/Restauração concluída e confirmada/),
    ).not.toBeInTheDocument()

    // Com o acesso restabelecido, as duas chaves estão intactas.
    vi.restoreAllMocks()
    expect(readQuarantineRaw()).toBe(quarantineRaw)
    expect(readMainRaw()).toBe('[]')
  })

  it('falha de confirmação (resultado incerto): mensagem própria, uma única escrita e sem repetição nem rollback', async () => {
    const user = userEvent.setup()
    localStorage.setItem(STORAGE_KEY, '[]')
    const quarantineRaw = JSON.stringify([buildHistoricalValidRecord()])
    localStorage.setItem(CORRUPTED_BACKUP_KEY, quarantineRaw)
    renderHome()

    await openRestorePanel(user)

    // A escrita principal ocorre, mas a leitura de confirmação encontra
    // conteúdo divergente: resultado incerto.
    const originalSet = Storage.prototype.setItem.bind(localStorage)
    const originalGet = Storage.prototype.getItem.bind(localStorage)
    let written = false
    const setSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation((key: string, value: string) => {
        if (key === STORAGE_KEY) written = true
        originalSet(key, value)
      })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      if (key === STORAGE_KEY && written) return 'conteudo-divergente'
      return originalGet(key)
    })

    await user.click(
      screen.getByRole('button', { name: 'Confirmar restauração' }),
    )

    expect(
      await screen.findByText(
        'Não foi possível confirmar a operação. Recarregue os roteiros antes de tentar novamente.',
      ),
    ).toBeInTheDocument()
    // Uma única escrita principal; sem repetição nem rollback.
    expect(setSpy).toHaveBeenCalledTimes(1)
    // Leitura de verificação com o acesso restabelecido.
    vi.restoreAllMocks()
    expect(readMainRaw()).not.toBe('[]')
    expect(readMainRaw()).not.toBe('conteudo-divergente')
    // A quarentena nunca é tocada pela restauração.
    expect(readQuarantineRaw()).toBe(quarantineRaw)
    expect(
      screen.queryByText(/Restauração concluída e confirmada/),
    ).not.toBeInTheDocument()
  })
})
