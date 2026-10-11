import { render, screen, within } from '@testing-library/react'
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
  HISTORICAL_LEGACY_ID,
} from './fixtures/savedItineraries'
import {
  installWebLocksMock,
  uninstallWebLocksMock,
} from './helpers/webLocksMock'

/**
 * Testes de interação da página inicial (checkpoint P3 do plano de
 * remediação de persistência): exclusão vinculada ao conteúdo observado,
 * estados de armazenamento (indisponível/corrompido) sem falsa lista
 * vazia, recuperação explícita com confirmação, restauração e descarte
 * da quarentena, proteção contra ações desatualizadas e navegação.
 *
 * Todos os dados são sintéticos (fixtures geradas da base local).
 */

function renderHome() {
  const onItineraryGenerated = vi.fn()
  const onOpenSaved = vi.fn()
  render(
    <HomePage
      onItineraryGenerated={onItineraryGenerated}
      onOpenSaved={onOpenSaved}
    />,
  )
  return { onItineraryGenerated, onOpenSaved }
}

function seedMain(raw: string): string {
  localStorage.setItem(STORAGE_KEY, raw)
  return raw
}

function savedSection() {
  return screen.getByRole('region', { name: 'Meus roteiros salvos' })
}

function deleteButton() {
  return within(savedSection()).getByRole('button', {
    name: 'Excluir roteiro de Florianópolis',
  })
}

describe('HomePage — interações de persistência (P3)', () => {
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

  it('exclui um roteiro com sucesso confirmado e grava array vazio (sem remover a chave)', async () => {
    const user = userEvent.setup()
    seedMain(JSON.stringify([buildHistoricalValidRecord()]))
    renderHome()

    await user.click(deleteButton())

    expect(
      await screen.findByText(/Roteiro excluído com sucesso/),
    ).toBeInTheDocument()
    // Excluir o último roteiro grava [] — a chave principal permanece.
    expect(localStorage.getItem(STORAGE_KEY)).toBe('[]')
    expect(
      within(savedSection()).getByText(/Nenhum roteiro salvo ainda/),
    ).toBeInTheDocument()
  })

  it('falha ao excluir (quota excedida): alerta acessível, registro preservado e nova tentativa segura', async () => {
    const user = userEvent.setup()
    const rawBefore = seedMain(JSON.stringify([buildHistoricalValidRecord()]))
    renderHome()

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota esgotada', 'QuotaExceededError')
    })
    await user.click(deleteButton())

    expect(
      await screen.findByText(/armazenamento do navegador está cheio/),
    ).toBeInTheDocument()
    // Nenhuma alteração: conteúdo bruto idêntico e registro ainda listado.
    expect(localStorage.getItem(STORAGE_KEY)).toBe(rawBefore)
    expect(deleteButton()).toBeInTheDocument()

    // Nova tentativa segura: com o armazenamento restabelecido, a
    // exclusão funciona (a lista foi recarregada após a falha).
    vi.restoreAllMocks()
    await user.click(deleteButton())
    expect(
      await screen.findByText(/Roteiro excluído com sucesso/),
    ).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBe('[]')
  })

  it('armazenamento indisponível: alerta explicativo e nenhuma afirmação de lista vazia', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('leitura bloqueada', 'SecurityError')
    })
    renderHome()

    expect(
      await screen.findByText(/Não foi possível acessar o armazenamento do navegador/),
    ).toBeInTheDocument()
    // Não informa que os registros inexistem quando não puderam ser lidos.
    expect(
      screen.queryByText(/Nenhum roteiro salvo ainda/),
    ).not.toBeInTheDocument()
    expect(
      within(savedSection()).queryByRole('button', { name: /Excluir roteiro/ }),
    ).not.toBeInTheDocument()
  })

  it('dados corrompidos (parcialmente válidos): recuperação explícita com confirmação e contagens', async () => {
    const user = userEvent.setup()
    const corruptedRaw = seedMain(
      JSON.stringify([buildHistoricalValidRecord(), { id: 'x', savedAt: 'ontem' }]),
    )
    renderHome()

    // Alerta de corrupção; o registro íntegro aparece só para consulta
    // (exclusão bloqueada enquanto a coleção está corrompida).
    expect(
      await screen.findByText(/não puderam ser validados/),
    ).toBeInTheDocument()
    expect(deleteButton()).toBeDisabled()

    await user.click(
      screen.getByRole('button', {
        name: 'Preservar cópia e recuperar registros válidos',
      }),
    )

    // Pré-visualização com as contagens antes da confirmação.
    expect(
      await screen.findByText(
        (content, element) =>
          element?.tagName === 'LI' &&
          content === '1 registro válido será recuperado.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        (content, element) =>
          element?.tagName === 'LI' &&
          content ===
            '1 registro ilegível permanecerá apenas na cópia de segurança.',
      ),
    ).toBeInTheDocument()
    // Nada mudou antes da confirmação.
    expect(localStorage.getItem(STORAGE_KEY)).toBe(corruptedRaw)
    expect(localStorage.getItem(CORRUPTED_BACKUP_KEY)).toBeNull()

    await user.click(
      screen.getByRole('button', { name: 'Confirmar recuperação' }),
    )

    expect(
      await screen.findByText(/Recuperação concluída e confirmada: 1 registro recuperado/),
    ).toBeInTheDocument()
    // Cópia bruta original preservada na quarentena; chave principal
    // gravada com o registro recuperado (id preservado).
    expect(localStorage.getItem(CORRUPTED_BACKUP_KEY)).toBe(corruptedRaw)
    const records = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '[]',
    ) as Array<{ id: string }>
    expect(records).toHaveLength(1)
    expect(records[0].id).toBe(HISTORICAL_LEGACY_ID)
    // O registro recuperado volta a ser operacional (exclusão habilitada).
    expect(deleteButton()).toBeEnabled()
  })

  it('recuperação bloqueada com quarentena ocupada por conteúdo diferente: ambas as chaves intactas', async () => {
    const user = userEvent.setup()
    const corruptedRaw = seedMain('não-é-json')
    const quarantineRaw = '{"outra":"cópia"}'
    localStorage.setItem(CORRUPTED_BACKUP_KEY, quarantineRaw)
    renderHome()

    await user.click(
      await screen.findByRole('button', {
        name: 'Preservar cópia e recuperar registros válidos',
      }),
    )
    await user.click(
      await screen.findByRole('button', { name: 'Confirmar recuperação' }),
    )

    expect(
      await screen.findByText(/Já existe uma cópia de segurança diferente na quarentena/),
    ).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(corruptedRaw)
    expect(localStorage.getItem(CORRUPTED_BACKUP_KEY)).toBe(quarantineRaw)
  })

  it('restauração da quarentena com a lista vazia: confirmação, registros na lista e cópia mantida', async () => {
    const user = userEvent.setup()
    const quarantineRaw = JSON.stringify([buildHistoricalValidRecord()])
    localStorage.setItem(CORRUPTED_BACKUP_KEY, quarantineRaw)
    renderHome()

    await user.click(
      await screen.findByRole('button', { name: 'Restaurar registros da cópia' }),
    )
    await user.click(
      await screen.findByRole('button', { name: 'Confirmar restauração' }),
    )

    expect(
      await screen.findByText(/Restauração concluída e confirmada: 1 registro restaurado/),
    ).toBeInTheDocument()
    expect(deleteButton()).toBeInTheDocument()
    // A quarentena é mantida após a restauração.
    expect(localStorage.getItem(CORRUPTED_BACKUP_KEY)).toBe(quarantineRaw)
  })

  it('descarte definitivo da quarentena: confirmação explícita e remoção confirmada', async () => {
    const user = userEvent.setup()
    localStorage.setItem(CORRUPTED_BACKUP_KEY, 'conteudo-bruto-qualquer')
    renderHome()

    await user.click(
      await screen.findByRole('button', {
        name: 'Descartar cópia definitivamente',
      }),
    )
    // Painel de decisão destrutiva acessível.
    expect(
      await screen.findByText(/O descarte é definitivo/),
    ).toBeInTheDocument()
    // Nada foi descartado antes da confirmação.
    expect(localStorage.getItem(CORRUPTED_BACKUP_KEY)).toBe(
      'conteudo-bruto-qualquer',
    )

    await user.click(
      screen.getByRole('button', { name: 'Confirmar descarte definitivo' }),
    )

    expect(
      await screen.findByText(/Cópia de segurança descartada definitivamente/),
    ).toBeInTheDocument()
    expect(localStorage.getItem(CORRUPTED_BACKUP_KEY)).toBeNull()
    expect(
      screen.queryByText(/Existe uma cópia de segurança/),
    ).not.toBeInTheDocument()
  })

  it('cancelamento do descarte da quarentena: cópia preservada', async () => {
    const user = userEvent.setup()
    localStorage.setItem(CORRUPTED_BACKUP_KEY, 'conteudo-bruto-qualquer')
    renderHome()

    await user.click(
      await screen.findByRole('button', {
        name: 'Descartar cópia definitivamente',
      }),
    )
    const discardPanel = (
      await screen.findByText(/O descarte é definitivo/)
    ).closest('div[role="alert"]') as HTMLElement
    await user.click(
      within(discardPanel).getByRole('button', { name: 'Cancelar' }),
    )

    expect(
      screen.queryByText(/O descarte é definitivo/),
    ).not.toBeInTheDocument()
    expect(localStorage.getItem(CORRUPTED_BACKUP_KEY)).toBe(
      'conteudo-bruto-qualquer',
    )
  })

  it('ação desatualizada na exclusão: operação cancelada sem alterar nenhuma chave', async () => {
    const user = userEvent.setup()
    seedMain(JSON.stringify([buildHistoricalValidRecord()]))
    renderHome()
    const button = await screen.findByRole('button', {
      name: 'Excluir roteiro de Florianópolis',
    })

    // Outra aba/janela alterou o armazenamento depois da leitura exibida.
    localStorage.setItem(STORAGE_KEY, '[]')
    await user.click(button)

    expect(
      await screen.findByText(/mudaram desde a última leitura/),
    ).toBeInTheDocument()
    // A operação não gravou nada: o conteúdo da outra aba permanece.
    expect(localStorage.getItem(STORAGE_KEY)).toBe('[]')
    // A lista foi recarregada e reflete o estado real.
    expect(
      within(savedSection()).getByText(/Nenhum roteiro salvo ainda/),
    ).toBeInTheDocument()
  })

  it('resultado incerto na exclusão: mensagem própria, sem repetição da gravação', async () => {
    const user = userEvent.setup()
    seedMain(JSON.stringify([buildHistoricalValidRecord()]))
    renderHome()
    const button = await screen.findByRole('button', {
      name: 'Excluir roteiro de Florianópolis',
    })

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

    await user.click(button)

    expect(
      await screen.findByText(
        'Não foi possível confirmar a operação. Recarregue os roteiros antes de tentar novamente.',
      ),
    ).toBeInTheDocument()
    expect(setSpy).toHaveBeenCalledTimes(1)
    expect(
      screen.queryByText(/Roteiro excluído com sucesso/),
    ).not.toBeInTheDocument()
  })

  it('coleção com IDs duplicados: consulta bloqueada, sem ações individuais e sem falsa lista vazia', async () => {
    const { payload } = buildDuplicateIdsPayload()
    seedMain(JSON.stringify(payload))
    renderHome()

    expect(
      await screen.findByText(/não puderam ser validados/),
    ).toBeInTheDocument()
    // Nenhum integrante do grupo duplicado é exposto, nem para consulta.
    expect(
      within(savedSection()).queryByRole('button', { name: /Excluir roteiro/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(/Nenhum roteiro salvo ainda/),
    ).not.toBeInTheDocument()
  })

  it('navegação: abrir um roteiro salvo entrega o registro à aplicação', async () => {
    const user = userEvent.setup()
    seedMain(JSON.stringify([buildHistoricalValidRecord()]))
    const { onOpenSaved } = renderHome()

    await user.click(
      within(savedSection()).getByRole('button', { name: 'Abrir' }),
    )

    expect(onOpenSaved).toHaveBeenCalledTimes(1)
    expect(onOpenSaved).toHaveBeenCalledWith(
      expect.objectContaining({ id: HISTORICAL_LEGACY_ID }),
    )
  })
})
