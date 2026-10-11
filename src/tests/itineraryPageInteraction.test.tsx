import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ItineraryPage } from '../pages/ItineraryPage'
import {
  CORRUPTED_BACKUP_KEY,
  STORAGE_KEY,
} from '../services/itineraryStorage'
import type { PlanningInput } from '../types'
import {
  buildHistoricalValidRecord,
  buildItineraryFromInput,
  HISTORICAL_LEGACY_ID,
} from './fixtures/savedItineraries'
import {
  installWebLocksMock,
  uninstallWebLocksMock,
} from './helpers/webLocksMock'

/**
 * Testes de interação da página do roteiro (checkpoint P3 do plano de
 * remediação de persistência): o salvamento assíncrono exibe somente
 * resultados reais do serviço — sucesso apenas após confirmação por
 * releitura, falha sem falso sucesso, resultado incerto com a mensagem
 * fixa do plano e confirmação de substituição vinculada ao alvo.
 *
 * Todos os dados são sintéticos (fixtures geradas da base local).
 */

const SAMPLE_INPUT: PlanningInput = {
  destinationId: 'florianopolis',
  days: 2,
  interests: ['natureza', 'gastronomia'],
  style: 'equilibrado',
  budget: 500,
}

function renderPage(saved: Parameters<typeof ItineraryPage>[0]['saved'] = null) {
  const onNewPlanning = vi.fn()
  render(
    <ItineraryPage
      itinerary={buildItineraryFromInput(SAMPLE_INPUT)}
      saved={saved}
      onNewPlanning={onNewPlanning}
    />,
  )
  return { onNewPlanning }
}

function seedStorage(records: unknown[]): string {
  const raw = JSON.stringify(records)
  localStorage.setItem(STORAGE_KEY, raw)
  return raw
}

function readStoredRecords(): Array<{ id: string; savedAt: string }> {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === null) return []
  return JSON.parse(raw) as Array<{ id: string; savedAt: string }>
}

describe('ItineraryPage — interações de persistência (P3)', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
    // jsdom não implementa rolagem; stub silencioso.
    Object.defineProperty(window, 'scrollTo', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    })
  })

  afterEach(() => {
    uninstallWebLocksMock()
    vi.restoreAllMocks()
  })

  it('salva com sucesso e só exibe a confirmação após a gravação confirmada', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(
      screen.queryByText('Roteiro salvo neste navegador'),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /salvar roteiro/i }))

    expect(
      await screen.findByText('Roteiro salvo neste navegador'),
    ).toBeInTheDocument()
    // O botão de salvar é substituído pelo selo de sucesso confirmado.
    expect(
      screen.queryByRole('button', { name: /salvar roteiro/i }),
    ).not.toBeInTheDocument()
    expect(readStoredRecords()).toHaveLength(1)
  })

  it('falha ao salvar (quota excedida): alerta acessível, sem falso sucesso e sem alterar a chave', async () => {
    const user = userEvent.setup()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota esgotada', 'QuotaExceededError')
    })
    renderPage()

    await user.click(screen.getByRole('button', { name: /salvar roteiro/i }))

    expect(
      await screen.findByText(/armazenamento do navegador está cheio/),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Roteiro salvo neste navegador'),
    ).not.toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('armazenamento indisponível ao salvar: falha sem nenhuma tentativa de escrita', async () => {
    const user = userEvent.setup()
    const setSpy = vi.spyOn(Storage.prototype, 'setItem')
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('leitura bloqueada', 'SecurityError')
    })
    renderPage()

    await user.click(screen.getByRole('button', { name: /salvar roteiro/i }))

    expect(
      await screen.findByText(/Não foi possível acessar o armazenamento/),
    ).toBeInTheDocument()
    expect(setSpy).not.toHaveBeenCalled()
    expect(
      screen.queryByText('Roteiro salvo neste navegador'),
    ).not.toBeInTheDocument()
  })

  it('resultado incerto: escrita retornou, confirmação divergiu — mensagem própria e sem repetição', async () => {
    const user = userEvent.setup()
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
      // A releitura de confirmação encontra conteúdo divergente.
      if (key === STORAGE_KEY && written) return 'conteudo-divergente'
      return originalGet(key)
    })
    renderPage()

    await user.click(screen.getByRole('button', { name: /salvar roteiro/i }))

    expect(
      await screen.findByText(
        'Não foi possível confirmar a operação. Recarregue os roteiros antes de tentar novamente.',
      ),
    ).toBeInTheDocument()
    // Sem repetição automática da gravação e sem falso sucesso.
    expect(setSpy).toHaveBeenCalledTimes(1)
    expect(
      screen.queryByText('Roteiro salvo neste navegador'),
    ).not.toBeInTheDocument()
  })

  it('substituição com confirmação: informa o alvo, substitui somente ele e preserva o id', async () => {
    const user = userEvent.setup()
    // O planejamento da página é equivalente ao do registro histórico
    // (mesmos campos normalizados): salvar exige confirmação.
    seedStorage([buildHistoricalValidRecord()])
    renderPage()

    await user.click(screen.getByRole('button', { name: /salvar roteiro/i }))

    // Painel de confirmação acessível com o resumo do alvo.
    expect(await screen.findByText('Substituir roteiro salvo?')).toBeInTheDocument()
    const panel = screen
      .getByText('Substituir roteiro salvo?')
      .closest('div[role="alert"]')
    expect(panel).toHaveTextContent('Florianópolis')
    expect(panel).toHaveTextContent('2 dias')
    // Nada foi gravado antes da confirmação.
    expect(readStoredRecords()[0]?.id).toBe(HISTORICAL_LEGACY_ID)

    await user.click(
      screen.getByRole('button', { name: 'Confirmar substituição' }),
    )

    expect(
      await screen.findByText('Roteiro salvo neste navegador'),
    ).toBeInTheDocument()
    const records = readStoredRecords()
    expect(records).toHaveLength(1)
    expect(records[0].id).toBe(HISTORICAL_LEGACY_ID)
  })

  it('cancelamento da substituição: painel fechado e armazenamento intacto', async () => {
    const user = userEvent.setup()
    const rawBefore = seedStorage([buildHistoricalValidRecord()])
    renderPage()

    await user.click(screen.getByRole('button', { name: /salvar roteiro/i }))
    expect(await screen.findByText('Substituir roteiro salvo?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(
      screen.queryByText('Substituir roteiro salvo?'),
    ).not.toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(rawBefore)
    expect(
      screen.queryByText('Roteiro salvo neste navegador'),
    ).not.toBeInTheDocument()
  })

  it('salvamento bloqueado em coleção corrompida: mensagem explicativa, sem escrita', async () => {
    const user = userEvent.setup()
    const rawBefore = seedStorage([{ id: 'registro', savedAt: 'ontem' }])
    renderPage()

    await user.click(screen.getByRole('button', { name: /salvar roteiro/i }))

    expect(
      await screen.findByText(/dados que não puderam ser validados/),
    ).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(rawBefore)
    expect(localStorage.getItem(CORRUPTED_BACKUP_KEY)).toBeNull()
  })

  it('roteiro aberto dos salvos já exibe o selo e não oferece novo salvamento', () => {
    renderPage(buildHistoricalValidRecord())

    expect(
      screen.getByText('Roteiro salvo neste navegador'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /salvar roteiro/i }),
    ).not.toBeInTheDocument()
  })

  it('navegação: "Novo planejamento" retorna à página inicial', async () => {
    const user = userEvent.setup()
    const { onNewPlanning } = renderPage()

    await user.click(
      screen.getByRole('button', { name: /novo planejamento/i }),
    )

    expect(onNewPlanning).toHaveBeenCalledTimes(1)
  })

  it('exportação JSON: dispara o download do arquivo do roteiro', async () => {
    const user = userEvent.setup()
    const createObjectURL = vi.fn(() => 'blob:roteiro-falso')
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    })
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})
    renderPage()
    try {
      await user.click(screen.getByRole('button', { name: /exportar json/i }))

      expect(createObjectURL).toHaveBeenCalledTimes(1)
      expect(clickSpy).toHaveBeenCalledTimes(1)
      // A exportação não grava nada no armazenamento.
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    } finally {
      Reflect.deleteProperty(URL, 'createObjectURL')
      Reflect.deleteProperty(URL, 'revokeObjectURL')
    }
  })
})
