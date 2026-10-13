import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App'
import { STORAGE_KEY } from '../services/itineraryStorage'
import { buildHistoricalValidRecord } from './fixtures/savedItineraries'
import { driveWizardToReview } from './helpers/wizardDriver'
import { installWebLocksMock, uninstallWebLocksMock } from './helpers/webLocksMock'

// Cada teste percorre as sete etapas; o limite padrão de 5 s é curto sob carga.
vi.setConfig({ testTimeout: 20000 })

const INTERESTS = ['Cultura', 'Natureza', 'Gastronomia', 'Relaxamento', 'Compras']

/** Fluxo completo com o ritmo escolhido: o resultado mostra o ritmo e respeita o limite diário. */
describe('Ritmo no fluxo completo', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
    Element.prototype.scrollIntoView = vi.fn()
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  })

  afterEach(() => {
    uninstallWebLocksMock()
    vi.restoreAllMocks()
  })

  it.each([
    ['Tranquilo', 2],
    ['Equilibrado', 3],
    ['Intenso', Infinity],
  ])('%s: o resultado informa o ritmo e nenhum dia passa de %s atividades', async (pace, cap) => {
    const user = userEvent.setup()
    render(<App />)
    await driveWizardToReview(user, { destination: 'Lisboa', days: 1, interests: INTERESTS, style: 'Econômico', pace, budgetPerPerson: null })
    expect(screen.getByRole('region', { name: 'Ritmo da viagem' })).toHaveTextContent(pace)
    await user.click(screen.getByRole('button', { name: 'Gerar roteiro' }))
    await screen.findByRole('button', { name: 'Salvar roteiro' })

    // O resumo da viagem apresenta o ritmo utilizado e o limite.
    const summary = screen.getByText('Ritmo').closest('div') as HTMLElement
    expect(summary).toHaveTextContent(pace)
    // Cabeçalho do único dia: "N atividades · custo".
    const day = screen.getByRole('heading', { name: 'Dia 1' }).closest('article') as HTMLElement
    const itemCount = Number(/^(\d+) atividades?/.exec(within(day).getByText(/atividades? ·/).textContent ?? '')?.[1])
    expect(itemCount).toBeLessThanOrEqual(cap)
    if (pace !== 'Intenso') {
      expect(screen.getByText(/de fora pelo ritmo/)).toHaveTextContent(`ritmo ${pace}`)
    } else {
      expect(screen.queryByText(/de fora pelo ritmo/)).toBeNull()
    }
  })

  it('salva com o ritmo, reabre e mantém o ritmo e o resumo', async () => {
    const user = userEvent.setup()
    render(<App />)
    await driveWizardToReview(user, { destination: 'Lisboa', days: 3, interests: ['Cultura', 'Gastronomia'], pace: 'Tranquilo' })
    await user.click(screen.getByRole('button', { name: 'Gerar roteiro' }))
    await user.click(await screen.findByRole('button', { name: 'Salvar roteiro' }))
    await screen.findByText('Roteiro salvo neste navegador')
    await waitFor(() => expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull())
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')[0].itinerary.input.pace).toBe('tranquilo')

    cleanup()
    render(<App />)
    await user.click(within(screen.getByRole('region', { name: 'Meus roteiros salvos' })).getByRole('button', { name: 'Abrir' }))
    await screen.findByRole('button', { name: 'Exportar JSON' })
    expect(screen.getByText('Ritmo').closest('div')).toHaveTextContent('Tranquilo')
  })

  it('um roteiro antigo (sem ritmo) é aberto sem exibir ritmo algum', async () => {
    const user = userEvent.setup()
    localStorage.setItem(STORAGE_KEY, JSON.stringify([buildHistoricalValidRecord()]))
    render(<App />)
    await user.click(within(screen.getByRole('region', { name: 'Meus roteiros salvos' })).getByRole('button', { name: 'Abrir' }))
    await screen.findByRole('region', { name: 'Resumo financeiro' })
    expect(screen.queryByText('Ritmo')).toBeNull()
    expect(screen.queryByText(/pelo ritmo/)).toBeNull()
  })

  it('os textos do ritmo não prometem esforço físico nem acessibilidade', async () => {
    const user = userEvent.setup()
    render(<App />)
    await driveWizardToReview(user, { destination: 'Lisboa', days: 2, interests: ['Cultura'], pace: 'Intenso' })
    expect(screen.getByRole('region', { name: 'Ritmo da viagem' })).toHaveTextContent('Sem limite adicional de atividades por dia')
    const note = screen.getByRole('complementary', { name: 'O que o gerador utiliza' })
    expect(note).toHaveTextContent(/não indica esforço físico nem acessibilidade/)
  })
})
