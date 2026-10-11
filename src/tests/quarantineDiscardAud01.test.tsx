import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HomePage } from '../pages/HomePage'
import {
  CORRUPTED_BACKUP_KEY,
  discardQuarantineCopy,
  recoverCorruptedStorage,
  STORAGE_KEY,
} from '../services/itineraryStorage'
import { buildHistoricalValidRecord } from './fixtures/savedItineraries'
import {
  installWebLocksMock,
  uninstallWebLocksMock,
} from './helpers/webLocksMock'

/**
 * Testes de regressão do AUD-01 (docs/FINAL_AUDIT_FINDINGS.md):
 * uma confirmação de descarte da quarentena, aberta para um conteúdo A,
 * não pode descartar um conteúdo diferente B.
 *
 * Causa raiz auditada (integração interface × serviço): a confirmação
 * era representada por um booleano; ao confirmar, a interface enviava
 * ao serviço o conteúdo ATUAL da quarentena (possivelmente atualizado
 * por uma recarga intermediária), substituindo implicitamente o alvo da
 * autorização. A correção vincula a confirmação ao conteúdo bruto exato
 * apresentado ao usuário na abertura do painel e invalida a autorização
 * quando uma releitura observa conteúdo diferente.
 *
 * Todos os cenários comparam o CONTEÚDO BRUTO das duas chaves antes e
 * depois. Dados sintéticos (fixtures geradas da base local).
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
}

function seedMain(raw: string): string {
  localStorage.setItem(STORAGE_KEY, raw)
  return raw
}

function readMainRaw(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

function readQuarantineRaw(): string | null {
  return localStorage.getItem(CORRUPTED_BACKUP_KEY)
}

async function openDiscardPanel(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    await screen.findByRole('button', {
      name: 'Descartar cópia definitivamente',
    }),
  )
  expect(await screen.findByText(/O descarte é definitivo/)).toBeInTheDocument()
}

describe('AUD-01 — descarte seguro da quarentena', () => {
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

  it('reproduz o cenário exato do AUD-01: confirmação antiga NÃO descarta a nova quarentena', async () => {
    const user = userEvent.setup()
    // 1. A chave principal contém um roteiro válido; a quarentena contém
    //    a cópia A.
    const validRecord = buildHistoricalValidRecord()
    const mainRaw = seedMain(JSON.stringify([validRecord]))
    const copyA = 'copia-A:conteudo-autorizado-original'
    localStorage.setItem(CORRUPTED_BACKUP_KEY, copyA)
    renderHome()

    // 2. Primeira sessão: abrir "Descartar cópia definitivamente",
    //    deixando o painel de confirmação aberto (autorização para A).
    await openDiscardPanel(user)

    // 3. Em outra sessão (serviço real), descartar A.
    const discardA = await discardQuarantineCopy(copyA)
    expect(discardA.ok).toBe(true)
    expect(readQuarantineRaw()).toBeNull()

    // 4. Em outra sessão: introduzir uma coleção parcialmente corrompida
    //    e recuperá-la pelo serviço. A recuperação cria a cópia B na
    //    quarentena e conserva o roteiro válido na principal — com o
    //    conteúdo bruto da principal BYTE A BYTE idêntico ao observado
    //    pela primeira sessão (a recuperação resserializa exatamente o
    //    registro válido preservado).
    const corruptedRaw = JSON.stringify([
      validRecord,
      { id: 'registro-ilegivel', savedAt: 'ontem' },
    ])
    localStorage.setItem(STORAGE_KEY, corruptedRaw)
    const recovery = await recoverCorruptedStorage(corruptedRaw)
    expect(recovery.ok).toBe(true)
    const copyB = readQuarantineRaw()
    expect(copyB).toBe(corruptedRaw)
    // B contém um registro inválido que permanece EXCLUSIVAMENTE no
    // backup após a recuperação (como no ensaio da auditoria).
    expect(readMainRaw()).toBe(mainRaw)

    // 5. Na primeira sessão, excluir o roteiro válido. A operação
    //    recarrega a quarentena para B.
    await user.click(
      screen.getByRole('button', { name: 'Excluir roteiro de Florianópolis' }),
    )
    expect(
      await screen.findByText(/Roteiro excluído com sucesso/),
    ).toBeInTheDocument()
    expect(readMainRaw()).toBe('[]')
    expect(readQuarantineRaw()).toBe(copyB)

    // 6. Tentar concluir o descarte pela confirmação aberta para A.
    //    Antes da correção, o painel permanecia aberto após a recarga e
    //    o clique enviava o conteúdo NOVO (B) ao serviço, apagando B —
    //    o clique condicional faz a falha pré-correção se manifestar
    //    como perda real de B. Após a correção, a recarga do passo 5
    //    invalida a confirmação: o painel fecha e nada é enviado.
    const confirmButton = screen.queryByRole('button', {
      name: 'Confirmar descarte definitivo',
    })
    if (confirmButton) {
      await user.click(confirmButton)
    }

    // Resultado correto: a autorização antiga foi cancelada; B permanece
    // integralmente preservada; a principal ficou com []; nenhuma
    // mensagem de sucesso da ação desatualizada.
    expect(readQuarantineRaw()).toBe(copyB)
    expect(readMainRaw()).toBe('[]')
    expect(
      screen.queryByText(/Cópia de segurança descartada definitivamente/),
    ).not.toBeInTheDocument()
  })

  it('descarte autorizado e válido: remove exatamente a cópia autorizada e preserva a principal', async () => {
    const user = userEvent.setup()
    const mainRaw = seedMain(JSON.stringify([buildHistoricalValidRecord()]))
    const copyA = 'copia-autorizada'
    localStorage.setItem(CORRUPTED_BACKUP_KEY, copyA)
    renderHome()

    await openDiscardPanel(user)
    // Nada muda antes da confirmação.
    expect(readQuarantineRaw()).toBe(copyA)
    expect(readMainRaw()).toBe(mainRaw)

    await user.click(
      screen.getByRole('button', { name: 'Confirmar descarte definitivo' }),
    )

    expect(
      await screen.findByText(/Cópia de segurança descartada definitivamente/),
    ).toBeInTheDocument()
    expect(readQuarantineRaw()).toBeNull()
    // A chave principal nunca é tocada pelo descarte da quarentena.
    expect(readMainRaw()).toBe(mainRaw)
  })

  it('descarte cancelado: nenhuma chave é alterada', async () => {
    const user = userEvent.setup()
    const mainRaw = seedMain(JSON.stringify([buildHistoricalValidRecord()]))
    const copyA = 'copia-preservada-no-cancelamento'
    localStorage.setItem(CORRUPTED_BACKUP_KEY, copyA)
    renderHome()

    await openDiscardPanel(user)
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(
      screen.queryByText(/O descarte é definitivo/),
    ).not.toBeInTheDocument()
    expect(readQuarantineRaw()).toBe(copyA)
    expect(readMainRaw()).toBe(mainRaw)
  })

  it('quarentena indisponível na confirmação: erro explícito, sem falso sucesso e sem alterações', async () => {
    const user = userEvent.setup()
    const mainRaw = seedMain(JSON.stringify([buildHistoricalValidRecord()]))
    const copyA = 'copia-inacessivel'
    localStorage.setItem(CORRUPTED_BACKUP_KEY, copyA)
    renderHome()

    await openDiscardPanel(user)

    const originalGet = Storage.prototype.getItem.bind(localStorage)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      if (key === CORRUPTED_BACKUP_KEY) {
        throw new DOMException('leitura bloqueada', 'SecurityError')
      }
      return originalGet(key)
    })
    await user.click(
      screen.getByRole('button', { name: 'Confirmar descarte definitivo' }),
    )

    expect(
      await screen.findByText(
        /Não foi possível acessar a cópia de segurança/,
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/Cópia de segurança descartada definitivamente/),
    ).not.toBeInTheDocument()

    // Com o acesso restabelecido, as duas chaves estão intactas.
    vi.restoreAllMocks()
    expect(readQuarantineRaw()).toBe(copyA)
    expect(readMainRaw()).toBe(mainRaw)
  })

  it('erro durante a remoção da cópia: falha explícita, cópia preservada exatamente e principal intacta', async () => {
    const user = userEvent.setup()
    const mainRaw = seedMain(JSON.stringify([buildHistoricalValidRecord()]))
    const copyA = 'copia-protegida-contra-falha'
    localStorage.setItem(CORRUPTED_BACKUP_KEY, copyA)
    renderHome()

    await openDiscardPanel(user)

    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('remoção bloqueada', 'UnknownError')
    })
    await user.click(
      screen.getByRole('button', { name: 'Confirmar descarte definitivo' }),
    )

    expect(
      await screen.findByText(/indisponível ou bloqueado/),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/Cópia de segurança descartada definitivamente/),
    ).not.toBeInTheDocument()

    vi.restoreAllMocks()
    expect(readQuarantineRaw()).toBe(copyA)
    expect(readMainRaw()).toBe(mainRaw)
  })

  it('confirmação reutilizada: após um descarte confirmado, uma nova cópia exige nova autorização explícita', async () => {
    const user = userEvent.setup()
    seedMain(JSON.stringify([buildHistoricalValidRecord()]))
    const copyA = 'copia-A-descartada'
    localStorage.setItem(CORRUPTED_BACKUP_KEY, copyA)
    renderHome()

    // Descarte autorizado e válido de A.
    await openDiscardPanel(user)
    await user.click(
      screen.getByRole('button', { name: 'Confirmar descarte definitivo' }),
    )
    expect(
      await screen.findByText(/Cópia de segurança descartada definitivamente/),
    ).toBeInTheDocument()
    expect(readQuarantineRaw()).toBeNull()

    // Outra aba cria uma nova cópia B; uma operação local (exclusão do
    // roteiro) recarrega o estado desta página.
    const copyB = 'copia-B-nova-e-diferente'
    localStorage.setItem(CORRUPTED_BACKUP_KEY, copyB)
    await user.click(
      screen.getByRole('button', { name: 'Excluir roteiro de Florianópolis' }),
    )
    expect(
      await screen.findByText(/Roteiro excluído com sucesso/),
    ).toBeInTheDocument()

    // B aparece na quarentena, mas NENHUMA confirmação herdada de A
    // permanece aberta: o painel de descarte está fechado e B intacta.
    expect(
      await screen.findByText(/Existe uma cópia de segurança/),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/O descarte é definitivo/),
    ).not.toBeInTheDocument()
    expect(readQuarantineRaw()).toBe(copyB)

    // Uma nova autorização explícita, capturada para B, funciona.
    await openDiscardPanel(user)
    await user.click(
      screen.getByRole('button', { name: 'Confirmar descarte definitivo' }),
    )
    expect(
      await screen.findByText(/Cópia de segurança descartada definitivamente/),
    ).toBeInTheDocument()
    expect(readQuarantineRaw()).toBeNull()
    expect(readMainRaw()).toBe('[]')
  })

  it('mudança entre duas abas sem recarga local: a confirmação envia o conteúdo autorizado (A) e o serviço cancela', async () => {
    const user = userEvent.setup()
    const mainRaw = seedMain(JSON.stringify([buildHistoricalValidRecord()]))
    const copyA = 'copia-A-autorizada-nesta-aba'
    localStorage.setItem(CORRUPTED_BACKUP_KEY, copyA)
    renderHome()

    await openDiscardPanel(user)

    // Outra aba substitui a quarentena SEM nenhuma operação (e portanto
    // sem recarga) nesta página.
    const copyB = 'copia-B-escrita-por-outra-aba'
    localStorage.setItem(CORRUPTED_BACKUP_KEY, copyB)

    await user.click(
      screen.getByRole('button', { name: 'Confirmar descarte definitivo' }),
    )

    // A interface enviou A (o conteúdo autorizado na abertura do
    // painel), não B; o serviço cancelou a ação desatualizada e B
    // permanece intacta.
    expect(
      await screen.findByText(/mudaram desde a última leitura/),
    ).toBeInTheDocument()
    expect(readQuarantineRaw()).toBe(copyB)
    expect(readMainRaw()).toBe(mainRaw)
    expect(
      screen.queryByText(/Cópia de segurança descartada definitivamente/),
    ).not.toBeInTheDocument()
  })

  it('confirmação reutilizada diretamente no serviço: uma autorização já consumida não descarta cópia nova', async () => {
    // Nível de serviço: reutilizar o MESMO conteúdo autorizado depois de
    // um descarte bem-sucedido não pode remover uma cópia nova e
    // diferente criada em seguida (ex.: por outra recuperação).
    const copyA = 'copia-A-servico'
    localStorage.setItem(CORRUPTED_BACKUP_KEY, copyA)
    const first = await discardQuarantineCopy(copyA)
    expect(first.ok).toBe(true)
    expect(readQuarantineRaw()).toBeNull()

    const copyB = 'copia-B-servico-nova'
    localStorage.setItem(CORRUPTED_BACKUP_KEY, copyB)

    const reused = await discardQuarantineCopy(copyA)
    expect(reused.ok).toBe(false)
    if (!reused.ok) {
      expect(reused.outcome).toBe('failure')
      expect(reused.message).toContain('mudaram desde a última leitura')
    }
    expect(readQuarantineRaw()).toBe(copyB)
    expect(readMainRaw()).toBeNull()
  })
})
