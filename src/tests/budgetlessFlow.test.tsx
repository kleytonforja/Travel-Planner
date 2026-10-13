import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App'
import { STORAGE_KEY } from '../services/itineraryStorage'
import { buildHistoricalValidRecord } from './fixtures/savedItineraries'
import { driveWizardToReview } from './helpers/wizardDriver'
import { installWebLocksMock, uninstallWebLocksMock } from './helpers/webLocksMock'

// Percorre as sete etapas, salva e reabre: o limite padrão de 5 s é curto sob carga.
vi.setConfig({ testTimeout: 20000 })

/**
 * Fluxo completo sem orçamento (M2.5): revisão → geração → resultado → salvar →
 * reabrir. O resultado mostra "Orçamento não informado", custo e média, e nenhum saldo.
 */
describe('Fluxo sem orçamento', () => {
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

  it('gera sem orçamento, mostra o resultado sem saldo, salva e reabre o roteiro salvo', async () => {
    const user = userEvent.setup()
    render(<App />)
    await driveWizardToReview(user, { destination: 'Lisboa', days: 3, interests: ['Cultura', 'Gastronomia'], budgetPerPerson: null })

    expect(screen.getByRole('region', { name: 'Estilo e orçamento' })).toHaveTextContent(/orçamento não informado/i)
    await user.click(screen.getByRole('button', { name: 'Gerar meu roteiro' }))

    // Resultado: sem orçamento e sem saldo; custos ilustrativos visíveis.
    expect(await screen.findByRole('button', { name: 'Salvar roteiro' })).toBeInTheDocument()
    const financial = screen.getByRole('region', { name: 'Resumo financeiro' })
    expect(financial).toHaveTextContent('Orçamento não informado')
    expect(financial).toHaveTextContent('Custo estimado das atividades')
    expect(financial).toHaveTextContent('Custo médio das atividades por dia')
    expect(financial).not.toHaveTextContent(/saldo não alocado/i)
    expect(financial).not.toHaveTextContent(/ilimitado/i)
    expect(screen.queryByText(/orçamento informado limitou|orçamento.*insuficiente/i)).toBeNull()
    expect(screen.getAllByText('Orçamento não informado').length).toBeGreaterThanOrEqual(2)

    await user.click(screen.getByRole('button', { name: 'Salvar roteiro' }))
    await screen.findByText('Roteiro salvo neste navegador')
    await waitFor(() => expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull())
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].itinerary.input).not.toHaveProperty('budget')
    expect(stored[0].itinerary.totals).not.toHaveProperty('unallocatedBudget')

    // "Fecha e reabre": nova montagem da aplicação, abrindo o roteiro salvo.
    cleanup()
    render(<App />)
    const saved = screen.getByRole('region', { name: 'Meus roteiros salvos' })
    await user.click(within(saved).getByRole('button', { name: 'Abrir' }))
    const reopened = await screen.findByRole('region', { name: 'Resumo financeiro' })
    expect(reopened).toHaveTextContent('Orçamento não informado')
    expect(reopened).not.toHaveTextContent(/saldo não alocado/i)
    expect(screen.getByRole('button', { name: 'Exportar JSON' })).toBeInTheDocument()
  })

  it('com orçamento o resultado continua como antes: orçamento informado e saldo', async () => {
    const user = userEvent.setup()
    render(<App />)
    await driveWizardToReview(user, { destination: 'Lisboa', days: 3, interests: ['Cultura'], budgetPerPerson: '400' })
    await user.click(screen.getByRole('button', { name: 'Gerar meu roteiro' }))
    const financial = await screen.findByRole('region', { name: 'Resumo financeiro' })
    expect(financial).toHaveTextContent('Orçamento informado')
    expect(financial).toHaveTextContent('Saldo não alocado')
    expect(financial).not.toHaveTextContent('Orçamento não informado')
  })

  it('um roteiro antigo (com orçamento e saldo, sem ritmo) permanece apresentável', async () => {
    const user = userEvent.setup()
    localStorage.setItem(STORAGE_KEY, JSON.stringify([buildHistoricalValidRecord()]))
    render(<App />)
    const saved = screen.getByRole('region', { name: 'Meus roteiros salvos' })
    await user.click(within(saved).getByRole('button', { name: 'Abrir' }))
    const financial = await screen.findByRole('region', { name: 'Resumo financeiro' })
    expect(financial).toHaveTextContent('Orçamento informado')
    expect(financial).toHaveTextContent('Saldo não alocado')
    expect(financial).toHaveTextContent('Custo estimado das atividades')
  })
})
