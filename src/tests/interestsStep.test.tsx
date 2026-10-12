import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App'
import { INTEREST_LABELS } from '../data/labels'
import { describeInterests, INTEREST_OPTIONS, toggleInterest } from '../utils/interests'

type User = ReturnType<typeof userEvent.setup>

async function toInterests(user: User, destination = 'Lisboa') {
  render(<App />)
  await user.click(screen.getByRole('link', { name: 'Planejar minha viagem' }))
  const card = (await screen.findByRole('heading', { name: destination })).closest('article') as HTMLElement
  await user.click(within(card).getByRole('button', { name: 'Selecionar destino' }))
  await user.click(screen.getByRole('button', { name: 'Continuar para Datas' }))
  await user.click(screen.getByRole('radio', { name: /Ainda não defini as datas/ }))
  await user.click(screen.getByRole('button', { name: '7 dias' }))
  await user.click(screen.getByRole('button', { name: 'Continuar para Viajantes' }))
  await user.click(screen.getByRole('button', { name: 'Continuar para Transporte' }))
  await user.click(screen.getByRole('button', { name: 'Continuar para Interesses' }))
  await screen.findByRole('heading', { name: 'Que experiências você gostaria de viver?' })
}

const interests = () => within(screen.getByRole('group', { name: 'Seus interesses' }))
const pace = () => within(screen.getByRole('group', { name: 'Ritmo da viagem' }))
const pressed = (el: HTMLElement) => el.getAttribute('aria-pressed') === 'true'
const summary = () => screen.getByRole('region', { name: 'Resumo do planejamento' })
const next = () => screen.getByRole('button', { name: 'Continuar com o formulário tradicional' })

describe('interests util', () => {
  it('oferece somente as categorias reconhecidas pelo catálogo', () => {
    expect(INTEREST_OPTIONS).toEqual(Object.keys(INTEREST_LABELS))
    expect(INTEREST_OPTIONS).toHaveLength(7)
  })

  it('alterna mantendo a ordem do catálogo e as demais escolhas', () => {
    let t = toggleInterest([], 'vida-noturna')
    t = toggleInterest(t, 'cultura')
    t = toggleInterest(t, 'gastronomia')
    expect(t).toEqual(['gastronomia', 'cultura', 'vida-noturna'])
    expect(toggleInterest(t, 'cultura')).toEqual(['gastronomia', 'vida-noturna'])
  })

  it('descreve interesses e ritmo', () => {
    expect(describeInterests([], 'equilibrado')).toBe('nenhum selecionado; ritmo equilibrado')
    expect(describeInterests(['cultura', 'natureza'], 'intenso')).toBe('Cultura, Natureza; ritmo intenso')
  })
})

describe('Etapa 5 — Interesses e ritmo', () => {
  beforeEach(() => {
    localStorage.clear()
    Element.prototype.scrollIntoView = vi.fn()
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  })

  it('apresenta a etapa 5 de 7, os sete interesses e Equilibrado como ritmo padrão', async () => {
    const user = userEvent.setup()
    await toInterests(user)
    expect(screen.getByRole('heading', { name: 'Que experiências você gostaria de viver?' })).toHaveFocus()
    expect(screen.getByText('Etapa 5 de 7')).toBeInTheDocument()
    expect(interests().getAllByRole('button')).toHaveLength(7)
    expect(interests().getAllByRole('button').filter(pressed)).toHaveLength(0)
    expect(pace().getAllByRole('button').map((b) => b.textContent?.split('.')[0])).toEqual([
      expect.stringContaining('Tranquilo'),
      expect.stringContaining('Equilibrado'),
      expect.stringContaining('Intenso'),
    ])
    expect(pressed(pace().getByRole('button', { name: /^Equilibrado/ }))).toBe(true)
    expect(screen.getByText('Nenhum interesse selecionado.')).toBeInTheDocument()
    expect(summary()).toHaveTextContent('Interesses: nenhum selecionado; ritmo equilibrado')
    // Etapa 6 não existe: só o fallback, bloqueado sem interesse.
    expect(screen.queryByRole('button', { name: /^Continuar para/ })).toBeNull()
    expect(next()).toBeDisabled()
    expect(screen.getByText('Selecione pelo menos um interesse para continuar.')).toBeInTheDocument()
    expect(screen.getByText(/o gerador ainda não ajusta o roteiro por ele/)).toBeInTheDocument()
  })

  it('seleciona vários interesses e remove um sem perder os outros', async () => {
    const user = userEvent.setup()
    await toInterests(user)
    await user.click(interests().getByRole('button', { name: /^Gastronomia/ }))
    await user.click(interests().getByRole('button', { name: /^Cultura/ }))
    await user.click(interests().getByRole('button', { name: /^Natureza/ }))
    expect(interests().getAllByRole('button').filter(pressed)).toHaveLength(3)
    expect(screen.getByText('3 interesses selecionados.')).toBeInTheDocument()
    expect(next()).toBeEnabled()

    await user.click(interests().getByRole('button', { name: /^Cultura/ }))
    expect(pressed(interests().getByRole('button', { name: /^Cultura/ }))).toBe(false)
    expect(pressed(interests().getByRole('button', { name: /^Gastronomia/ }))).toBe(true)
    expect(pressed(interests().getByRole('button', { name: /^Natureza/ }))).toBe(true)
    expect(screen.queryAllByTestId('selected-check')).toHaveLength(3) // 2 interesses + ritmo
    expect(summary()).toHaveTextContent('Interesses: Gastronomia, Natureza; ritmo equilibrado')

    await user.click(interests().getByRole('button', { name: /^Gastronomia/ }))
    await user.click(interests().getByRole('button', { name: /^Natureza/ }))
    expect(screen.getByText('Nenhum interesse selecionado.')).toBeInTheDocument()
    expect(next()).toBeDisabled()
  })

  it('o ritmo é escolha única e não pode ficar vazio', async () => {
    const user = userEvent.setup()
    await toInterests(user)
    const calm = pace().getByRole('button', { name: /^Tranquilo/ })
    const intense = pace().getByRole('button', { name: /^Intenso/ })
    await user.click(calm)
    expect(pressed(calm)).toBe(true)
    expect(pace().getAllByRole('button').filter(pressed)).toHaveLength(1)
    await user.click(intense)
    expect(pressed(intense)).toBe(true)
    expect(pressed(calm)).toBe(false)
    await user.click(intense) // clicar de novo não remove o ritmo
    expect(pace().getAllByRole('button').filter(pressed)).toHaveLength(1)
    expect(summary()).toHaveTextContent('ritmo intenso')
  })

  it('funciona pelo teclado: Tab, Enter e Espaço', async () => {
    const user = userEvent.setup()
    await toInterests(user)
    const gastro = interests().getByRole('button', { name: /^Gastronomia/ })
    gastro.focus()
    await user.keyboard('{Enter}')
    expect(pressed(gastro)).toBe(true)
    await user.tab()
    expect(interests().getByRole('button', { name: /^Natureza/ })).toHaveFocus()
    await user.keyboard(' ')
    expect(pressed(interests().getByRole('button', { name: /^Natureza/ }))).toBe(true)
    const intense = pace().getByRole('button', { name: /^Intenso/ })
    intense.focus()
    await user.keyboard(' ')
    expect(pressed(intense)).toBe(true)
  })

  it('preserva tudo ao voltar, alterar etapas anteriores e retornar', async () => {
    const user = userEvent.setup()
    await toInterests(user)
    await user.click(interests().getByRole('button', { name: /^Aventura/ }))
    await user.click(interests().getByRole('button', { name: /^Compras/ }))
    await user.click(pace().getByRole('button', { name: /^Tranquilo/ }))

    await user.click(screen.getByRole('button', { name: 'Voltar para Transporte' }))
    expect(await screen.findByRole('heading', { name: 'Como você pretende viajar?' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Avião' }))
    await user.click(screen.getByRole('button', { name: 'Voltar para Viajantes' }))
    await user.click(screen.getByRole('button', { name: 'Aumentar adultos' }))
    await user.click(screen.getByRole('button', { name: 'Voltar para Datas' }))
    await user.click(screen.getByRole('button', { name: '10 dias' }))
    await user.click(screen.getByRole('button', { name: 'Voltar para Destino' }))
    const rio = (await screen.findByRole('heading', { name: 'Rio de Janeiro' })).closest('article') as HTMLElement
    await user.click(within(rio).getByRole('button', { name: 'Selecionar destino' }))
    for (const name of ['Datas', 'Viajantes', 'Transporte', 'Interesses']) {
      await user.click(screen.getByRole('button', { name: `Continuar para ${name}` }))
    }

    expect(pressed(interests().getByRole('button', { name: /^Aventura/ }))).toBe(true)
    expect(pressed(interests().getByRole('button', { name: /^Compras/ }))).toBe(true)
    expect(pressed(pace().getByRole('button', { name: /^Tranquilo/ }))).toBe(true)
    expect(summary()).toHaveTextContent('Destino selecionado: Rio de Janeiro')
    expect(summary()).toHaveTextContent('Duração: 10 dias')
    expect(summary()).toHaveTextContent('Viajantes: 2 adultos')
    expect(summary()).toHaveTextContent('Transporte: Avião')
    expect(summary()).toHaveTextContent('Interesses: Aventura, Compras; ritmo tranquilo')
  })

  it('o formulário tradicional já vem com os interesses escolhidos e gera o roteiro', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const user = userEvent.setup()
    await toInterests(user, 'Rio de Janeiro')
    await user.click(interests().getByRole('button', { name: /^Cultura/ }))
    await user.click(interests().getByRole('button', { name: /^Gastronomia/ }))
    await user.click(next())

    const legacy = within(screen.getByRole('group', { name: 'Interesses' }))
    expect(legacy.getByRole('checkbox', { name: 'Cultura' })).toBeChecked()
    expect(legacy.getByRole('checkbox', { name: 'Gastronomia' })).toBeChecked()
    expect(legacy.getByRole('checkbox', { name: 'Natureza' })).not.toBeChecked()
    expect((document.getElementById('destino') as HTMLSelectElement).value).toBe('rio-de-janeiro')
    expect((document.getElementById('duracao') as HTMLInputElement).value).toBe('7')
    expect(setItem).not.toHaveBeenCalled()

    await user.click(within(screen.getByRole('group', { name: 'Estilo de viagem' })).getByText('Equilibrado'))
    await user.type(document.getElementById('orcamento') as HTMLInputElement, '900')
    await user.click(screen.getByRole('button', { name: 'Gerar roteiro' }))
    expect(await screen.findByRole('button', { name: 'Salvar roteiro' })).toBeInTheDocument()
  })
})
