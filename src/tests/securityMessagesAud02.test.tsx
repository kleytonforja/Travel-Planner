import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App'
import { HomePage } from '../pages/HomePage'
import {
  CORRUPTED_BACKUP_KEY,
  STORAGE_KEY,
} from '../services/itineraryStorage'
import { buildHistoricalValidRecord } from './fixtures/savedItineraries'
import { driveWizardToReview } from './helpers/wizardDriver'
import {
  installWebLocksMock,
  uninstallWebLocksMock,
} from './helpers/webLocksMock'

/**
 * Testes de regressão do AUD-02 (docs/FINAL_AUDIT_FINDINGS.md):
 * mensagens de segurança precisam corresponder ao resultado REAL do
 * serviço de persistência.
 *
 * Causa raiz auditada (interface): o alerta genérico de indisponibilidade
 * afirmava "Nenhum dado foi alterado" sem considerar que uma escrita
 * anterior já havia ocorrido (resultado incerto). O alerta de
 * indisponibilidade orienta verificar os dados após restabelecer a
 * leitura, sem afirmar preservação a partir do estado local da página.
 *
 * Todos os cenários comparam o CONTEÚDO BRUTO das chaves antes e
 * depois. Dados sintéticos (fixtures geradas da base local).
 */

const ABSOLUTE_PRESERVATION_CLAIM = 'Nenhum dado foi alterado.'

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

describe('AUD-02 — mensagens correspondentes ao estado real', () => {
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

  it('reproduz o cenário exato do AUD-02: escrita efetiva + leituras falhas NÃO podem afirmar "Nenhum dado foi alterado"', async () => {
    const user = userEvent.setup()
    // 1. A principal contém o último roteiro salvo.
    const mainBefore = JSON.stringify([buildHistoricalValidRecord()])
    localStorage.setItem(STORAGE_KEY, mainBefore)
    renderHome()

    // 2–4. Solicitar a exclusão; setItem grava [] na principal; a
    // leitura de confirmação falha; a releitura da interface também.
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
      if (key === STORAGE_KEY && written) {
        throw new DOMException('leitura bloqueada', 'SecurityError')
      }
      return originalGet(key)
    })

    await user.click(
      await screen.findByRole('button', {
        name: 'Excluir roteiro de Florianópolis',
      }),
    )

    // Resultado correto: mensagem de incerteza (texto fixo do plano)…
    expect(
      await screen.findByText(
        'Não foi possível confirmar a operação. Recarregue os roteiros antes de tentar novamente.',
      ),
    ).toBeInTheDocument()
    // …alerta de indisponibilidade da releitura…
    expect(
      screen.getByText(/Não foi possível acessar o armazenamento do navegador/),
    ).toBeInTheDocument()
    // …SEM a falsa afirmação de preservação: a escrita ocorreu.
    expect(
      screen.queryByText(new RegExp(ABSOLUTE_PRESERVATION_CLAIM.replace('.', '\\.'), 'u')),
    ).not.toBeInTheDocument()
    // Uma única escrita principal, sem repetição nem rollback.
    expect(setSpy).toHaveBeenCalledTimes(1)
    // Leitura de verificação com o acesso restabelecido.
    vi.restoreAllMocks()
    expect(readMainRaw()).toBe('[]')
    expect(readQuarantineRaw()).toBeNull()
    expect(
      screen.queryByText(/Roteiro excluído com sucesso/),
    ).not.toBeInTheDocument()
  })

  // Percorre as sete etapas do planejamento antes de salvar; o limite padrão de 5 s é curto sob carga.
  it('não afirma preservação ao voltar para HomePage após salvamento incerto pela App', { timeout: 20000 }, async () => {
    const user = userEvent.setup()
    const copyBefore = 'cópia anterior preservada'
    localStorage.setItem(STORAGE_KEY, '[]')
    localStorage.setItem(CORRUPTED_BACKUP_KEY, copyBefore)
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    render(<App />)

    await driveWizardToReview(user, {
      destination: 'Florianópolis',
      days: 1,
      interests: ['Cultura'],
      style: 'Econômico',
      budgetPerPerson: '100',
    })
    await user.click(screen.getByRole('button', { name: 'Gerar roteiro' }))

    // A escrita real ocorre; apenas a confirmação e as leituras seguintes falham.
    const originalSet = Storage.prototype.setItem.bind(localStorage)
    const originalGet = Storage.prototype.getItem.bind(localStorage)
    let written = false
    const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      originalSet(key, value)
      if (key === STORAGE_KEY) written = true
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === STORAGE_KEY && written) {
        throw new DOMException('leitura bloqueada após gravação', 'SecurityError')
      }
      return originalGet(key)
    })

    await user.click(screen.getByRole('button', { name: 'Salvar roteiro' }))
    expect(await screen.findByText(/Não foi possível confirmar a operação/)).toBeInTheDocument()
    const rawAfterSave = originalGet(STORAGE_KEY)
    const persisted = JSON.parse(rawAfterSave ?? 'null')
    expect(persisted).toHaveLength(1)
    expect(persisted[0].itinerary.input).toEqual({
      destinationId: 'florianopolis', days: 1, interests: ['cultura'],
      style: 'economico', budget: 100,
      pace: 'equilibrado', // padrão do fluxo, agora aplicado e gravado (M3)
    })

    await user.click(screen.getByRole('button', { name: 'Novo planejamento' }))
    expect(await screen.findByRole('heading', { name: 'Planeje sua viagem' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/não puderam ser exibidos/)
    expect(screen.getByRole('alert')).not.toHaveTextContent(ABSOLUTE_PRESERVATION_CLAIM)
    expect(screen.queryByText(/Nenhum roteiro salvo ainda/)).not.toBeInTheDocument()
    expect(setSpy).toHaveBeenCalledTimes(1)
    expect(originalGet(STORAGE_KEY)).toBe(rawAfterSave)
    expect(originalGet(CORRUPTED_BACKUP_KEY)).toBe(copyBefore)
  })

  it.each(['indisponível', 'divergente'])(
    'restauração com confirmação %s não afirma preservação após a escrita efetiva',
    async (confirmation) => {
      const user = userEvent.setup()
      const quarantineRaw = JSON.stringify([buildHistoricalValidRecord()])
      localStorage.setItem(STORAGE_KEY, '[]')
      localStorage.setItem(CORRUPTED_BACKUP_KEY, quarantineRaw)
      renderHome()

      await user.click(screen.getByRole('button', { name: 'Restaurar registros da cópia' }))

      const originalSet = Storage.prototype.setItem.bind(localStorage)
      const originalGet = Storage.prototype.getItem.bind(localStorage)
      let written = false
      let confirmationRead = false
      const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
        originalSet(key, value)
        if (key === STORAGE_KEY) written = true
      })
      const removeSpy = vi.spyOn(Storage.prototype, 'removeItem')
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
        if (key === STORAGE_KEY && written) {
          if (confirmation === 'indisponível' && !confirmationRead) {
            confirmationRead = true
            throw new DOMException('confirmação indisponível', 'SecurityError')
          }
          // A releitura exibe o painel de corrupção após a operação incerta.
          return 'conteudo-divergente'
        }
        return originalGet(key)
      })

      await user.click(screen.getByRole('button', { name: 'Confirmar restauração' }))

      expect(await screen.findByText(/Não foi possível confirmar a operação/)).toBeInTheDocument()
      expect(screen.getByText(/não puderam ser validados/)).toBeInTheDocument()
      expect(originalGet(STORAGE_KEY)).toBe(quarantineRaw)
      expect(originalGet(CORRUPTED_BACKUP_KEY)).toBe(quarantineRaw)
      expect(setSpy).toHaveBeenCalledTimes(1)
      expect(setSpy).toHaveBeenCalledWith(STORAGE_KEY, quarantineRaw)
      expect(removeSpy).not.toHaveBeenCalled()
      expect(screen.queryByText(/Restauração concluída e confirmada/)).not.toBeInTheDocument()
      expect(document.body).not.toHaveTextContent(/não foram alterados nem apagados|Nenhum dado foi alterado/i)
    },
  )

  it('carga inicial indisponível orienta verificação sem afirmar preservação', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('leitura bloqueada', 'SecurityError')
    })
    renderHome()

    // A indisponibilidade não permite concluir o estado real dos dados.
    expect(
      await screen.findByText(/Não foi possível acessar o armazenamento do navegador/),
    ).toBeInTheDocument()
    expect(screen.getByRole('alert')).not.toHaveTextContent(ABSOLUTE_PRESERVATION_CLAIM)
    expect(screen.getByRole('alert')).toHaveTextContent(/verifique o estado real dos dados/)
    // Leitura de verificação com o acesso restabelecido.
    vi.restoreAllMocks()
    expect(readMainRaw()).toBeNull()
    expect(readQuarantineRaw()).toBeNull()
  })

  it('falha de escrita (quota) seguida de leitura indisponível: alerta genérico sem afirmação absoluta', async () => {
    const user = userEvent.setup()
    const mainBefore = JSON.stringify([buildHistoricalValidRecord()])
    localStorage.setItem(STORAGE_KEY, mainBefore)
    renderHome()

    // A escrita falha por quota (a chave principal permanece intacta) e
    // a releitura seguinte falha — o alerta genérico de indisponibilidade
    // não pode afirmar ausência absoluta de alterações (uma operação foi
    // tentada; a mensagem do serviço já informa o resultado comprovado).
    let writeAttempted = false
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      writeAttempted = true
      throw new DOMException('quota esgotada', 'QuotaExceededError')
    })
    const originalGet = Storage.prototype.getItem.bind(localStorage)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      if (writeAttempted) {
        throw new DOMException('leitura bloqueada', 'SecurityError')
      }
      return originalGet(key)
    })

    await user.click(
      await screen.findByRole('button', {
        name: 'Excluir roteiro de Florianópolis',
      }),
    )

    // A mensagem do serviço informa a falha com a preservação comprovada
    // (a escrita lançou exceção antes de gravar).
    expect(
      await screen.findByText(/armazenamento do navegador está cheio/),
    ).toBeInTheDocument()
    // O alerta de indisponibilidade aparece SEM a afirmação absoluta —
    // ela não é mais necessária e não deve ser repetida sem evidência
    // direta do estado de ambas as chaves.
    expect(
      screen.getByText(/Não foi possível acessar o armazenamento do navegador/),
    ).toBeInTheDocument()
    const unavailableAlert = screen
      .getByText(/Não foi possível acessar o armazenamento do navegador/)
      .closest('p') as HTMLElement
    expect(unavailableAlert.textContent).not.toContain(
      ABSOLUTE_PRESERVATION_CLAIM,
    )

    // Conteúdo bruto preservado exatamente (falha anterior à escrita).
    vi.restoreAllMocks()
    expect(readMainRaw()).toBe(mainBefore)
    expect(readQuarantineRaw()).toBeNull()
  })

  it('falha no backup durante a recuperação: mensagem de falha de preservação, principal intacta e sem falso sucesso', async () => {
    const user = userEvent.setup()
    const corruptedRaw = JSON.stringify([
      buildHistoricalValidRecord(),
      { id: 'registro-ilegivel', savedAt: 'ontem' },
    ])
    localStorage.setItem(STORAGE_KEY, corruptedRaw)
    renderHome()

    await user.click(
      await screen.findByRole('button', {
        name: 'Preservar cópia e recuperar registros válidos',
      }),
    )

    // A gravação da cópia de segurança falha: a recuperação é
    // interrompida ANTES de tocar a chave principal.
    const originalSet = Storage.prototype.setItem.bind(localStorage)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
      (key: string, value: string) => {
        if (key === CORRUPTED_BACKUP_KEY) {
          throw new DOMException('escrita bloqueada', 'UnknownError')
        }
        originalSet(key, value)
      },
    )
    await user.click(
      screen.getByRole('button', { name: 'Confirmar recuperação' }),
    )

    // A mensagem corresponde ao estado real: o backup NÃO foi criado e
    // a recuperação NÃO aconteceu — nenhuma mensagem de sucesso.
    expect(
      await screen.findByText(/Não foi possível preservar a cópia de segurança/),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/Recuperação concluída e confirmada/),
    ).not.toBeInTheDocument()
    // Ambas as chaves exatamente como antes da tentativa.
    expect(readMainRaw()).toBe(corruptedRaw)
    expect(readQuarantineRaw()).toBeNull()
  })
})
