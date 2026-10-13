import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App'
import { DESTINATION_PHOTOS } from '../data/photos'
import { driveWizardToReview } from './helpers/wizardDriver'

// Estes testes percorrem as sete etapas com user-event; medidos em vários segundos sob carga.
vi.setConfig({ testTimeout: 20000 })

const region = (name: string) => screen.getByRole('region', { name })

describe('Revisão — modelo Híbrido Tabi (M4.4)', () => {
  beforeEach(() => {
    localStorage.clear()
    Element.prototype.scrollIntoView = vi.fn()
  })

  it.each([
    ['Florianópolis', 'florianopolis'],
    ['Rio de Janeiro', 'rio-de-janeiro'],
    ['Lisboa', 'lisboa'],
  ])('o cabeçalho mostra a fotografia correta, o nome e a duração de %s', async (name) => {
    const user = userEvent.setup()
    render(<App />)
    await driveWizardToReview(user, { destination: name, days: 4, budgetPerPerson: null })
    const header = region('Destino')
    expect(within(header).getByRole('heading', { name })).toBeInTheDocument()
    expect(header).toHaveTextContent('4 dias')
    const photo = within(header).getByRole('img')
    const expected = Object.values(DESTINATION_PHOTOS).find((item) => photo.getAttribute('alt') === item.alt)
    expect(expected).toBeDefined()
    expect(photo.getAttribute('src')).toBe(expected?.large)
    expect(photo).toHaveAttribute('loading', 'eager')
  })

  it('se a fotografia falhar, o cabeçalho usa a ilustração original, sem foto falsa', async () => {
    const user = userEvent.setup()
    render(<App />)
    await driveWizardToReview(user, { destination: 'Lisboa', days: 2, budgetPerPerson: null })
    const header = region('Destino')
    fireEvent.error(within(header).getByRole('img'))
    expect(header.querySelector('img')).toBeNull()
    expect(within(header).getByRole('heading', { name: 'Lisboa' })).toBeInTheDocument()
  })

  it('mostra todos os grupos, cada um com seu botão Editar, e não repete o resumo', async () => {
    const user = userEvent.setup()
    render(<App />)
    await driveWizardToReview(user, { destination: 'Lisboa', days: 3, interests: ['Cultura'], budgetPerPerson: '400' })
    for (const title of [
      'Datas e duração',
      'Viajantes',
      'Transporte até o destino',
      'Deslocamentos locais',
      'Interesses',
      'Ritmo da viagem',
      'Estilo e orçamento',
    ]) {
      expect(within(region(title)).getByRole('button', { name: `Editar ${title}` })).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: 'Editar Destino' })).toBeInTheDocument()
    expect(region('Estilo e orçamento')).toHaveTextContent(/400/)
    expect(screen.queryByRole('region', { name: 'Resumo do planejamento' })).toBeNull()
  })

  it('há uma única ação "Gerar meu roteiro", na barra de navegação', async () => {
    const user = userEvent.setup()
    render(<App />)
    await driveWizardToReview(user, { days: 2, budgetPerPerson: null })
    const buttons = screen.getAllByRole('button', { name: 'Gerar meu roteiro' })
    expect(buttons).toHaveLength(1)
    expect(screen.getByTestId('barra-navegacao')).toContainElement(buttons[0])
    expect(screen.queryByRole('button', { name: 'Gerar roteiro' })).toBeNull()
  })

  it('o aviso essencial fica visível e o detalhe abre e fecha pelo teclado', async () => {
    const user = userEvent.setup()
    render(<App />)
    await driveWizardToReview(user, { days: 2, budgetPerPerson: null })
    const note = screen.getByRole('complementary', { name: 'O que o gerador utiliza' })
    expect(note).toHaveTextContent('Valores de atrações são estimativas ilustrativas')
    const toggle = within(note).getByRole('button', { name: /O que será usado na geração do roteiro/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    toggle.focus()
    await user.keyboard('{Enter}')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard(' ')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('o teclado alcança Editar e Gerar, e Enter em Editar volta à etapa certa', async () => {
    const user = userEvent.setup()
    render(<App />)
    await driveWizardToReview(user, { days: 2, interests: ['Cultura'], budgetPerPerson: null })
    const edit = screen.getByRole('button', { name: 'Editar Interesses' })
    edit.focus()
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('heading', { name: 'Que experiências você gostaria de viver?' })).toHaveFocus()
    expect(screen.getByRole('button', { name: /^Cultura/ })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Voltar para a revisão' }))
    const generate = await screen.findByRole('button', { name: 'Gerar meu roteiro' })
    generate.focus()
    expect(generate).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('button', { name: 'Salvar roteiro' })).toBeInTheDocument()
  })
})
