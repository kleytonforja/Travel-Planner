import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App'
import * as generator from '../services/itineraryGenerator'

vi.setConfig({ testTimeout: 20000 })

// Falha controlada do motor: o resto do módulo permanece real.
vi.mock('../services/itineraryGenerator', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/itineraryGenerator')>()
  return { ...actual, generateItinerary: vi.fn(actual.generateItinerary) }
})

describe('Revisão — erro de geração', () => {
  beforeEach(() => {
    localStorage.clear()
    Element.prototype.scrollIntoView = vi.fn()
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  })

  it('mostra a mensagem do motor e mantém todas as escolhas para uma nova tentativa', async () => {
    vi.mocked(generator.generateItinerary).mockReturnValueOnce({
      ok: false,
      message: 'Não encontramos atividades compatíveis (simulado).',
    })
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('link', { name: 'Planejar minha viagem' }))
    const rio = (await screen.findByRole('heading', { name: 'Rio de Janeiro' })).closest('article') as HTMLElement
    await user.click(within(rio).getByRole('button', { name: 'Selecionar destino' }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Datas' }))
    await user.click(screen.getByRole('radio', { name: /Ainda não defini as datas/ }))
    await user.click(screen.getByRole('button', { name: '3 dias' }))
    for (const name of ['Viajantes', 'Transporte', 'Interesses']) {
      await user.click(screen.getByRole('button', { name: `Continuar para ${name}` }))
    }
    await user.click(screen.getByRole('button', { name: /^Cultura/ }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Orçamento' }))
    await user.click(screen.getByRole('button', { name: /^Informar um valor/ }))
    await user.click(screen.getByRole('button', { name: /^Valor por pessoa/ }))
    await user.type(screen.getByLabelText(/^Valor por pessoa/), '1200')
    await user.click(screen.getByRole('button', { name: 'Continuar para Revisão' }))

    await user.click(screen.getByRole('button', { name: 'Gerar roteiro' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Não encontramos atividades compatíveis (simulado).')
    // Continua na revisão, com tudo preservado.
    expect(screen.getByRole('heading', { name: 'Sua viagem está quase pronta!' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Interesses' })).toHaveTextContent('Cultura')
    expect(screen.getByRole('region', { name: 'Destino' })).toHaveTextContent('Rio de Janeiro')
    expect(screen.getByRole('button', { name: 'Gerar roteiro' })).toBeEnabled()

    // Nova tentativa (agora o motor real responde) gera o roteiro.
    await user.click(screen.getByRole('button', { name: 'Gerar roteiro' }))
    expect(await screen.findByRole('button', { name: 'Salvar roteiro' })).toBeInTheDocument()
  })
})
