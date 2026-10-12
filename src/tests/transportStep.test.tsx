import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App'

type User = ReturnType<typeof userEvent.setup>

async function toTransport(user: User, destination = 'Lisboa') {
  render(<App />)
  await user.click(screen.getByRole('link', { name: 'Planejar minha viagem' }))
  const card = (await screen.findByRole('heading', { name: destination })).closest('article') as HTMLElement
  await user.click(within(card).getByRole('button', { name: 'Selecionar destino' }))
  await user.click(screen.getByRole('button', { name: 'Continuar para Datas' }))
  await user.click(screen.getByRole('radio', { name: /Ainda não defini as datas/ }))
  await user.click(screen.getByRole('button', { name: '7 dias' }))
  await user.click(screen.getByRole('button', { name: 'Continuar para Viajantes' }))
  await user.click(screen.getByRole('button', { name: 'Aumentar adultos' }))
  await user.click(screen.getByRole('button', { name: 'Continuar para Transporte' }))
  await screen.findByRole('heading', { name: 'Como você pretende viajar?' })
}

const arrival = () => within(screen.getByRole('group', { name: 'Como você chegará ao destino?' }))
const local = () => within(screen.getByRole('group', { name: 'Como pretende se locomover durante a viagem?' }))
const origin = () => screen.getByLabelText('Cidade de origem (opcional)') as HTMLInputElement
const summary = () => screen.getByRole('region', { name: 'Resumo do planejamento' })
const pressed = (el: HTMLElement) => el.getAttribute('aria-pressed') === 'true'

describe('Etapa 4 — Transporte', () => {
  beforeEach(() => {
    localStorage.clear()
    Element.prototype.scrollIntoView = vi.fn()
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  })

  it('apresenta a etapa 4 de 7, as duas seções e nenhuma escolha prévia', async () => {
    const user = userEvent.setup()
    await toTransport(user)
    expect(screen.getByRole('heading', { name: 'Como você pretende viajar?' })).toHaveFocus()
    expect(screen.getByText('Etapa 4 de 7')).toBeInTheDocument()
    const items = within(screen.getByRole('list', { name: 'Progresso do planejamento' })).getAllByRole('listitem')
    expect(items[3]).toHaveAttribute('aria-current', 'step')
    expect(arrival().getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Carro próprio',
      'Avião',
      'Ônibus',
      'Trem',
      'Ainda não decidi',
    ])
    expect(local().getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Carro próprio',
      'Carro alugado',
      'Táxi ou aplicativo',
      'Transporte público',
      'Caminhada',
      'Combinação de transportes',
      'Ainda não decidi',
    ])
    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0)
    expect(origin()).toHaveValue('')
    expect(summary()).toHaveTextContent('Transporte: ainda não definido')
    expect(screen.getByText(/não geram\s+cálculos de rotas, distâncias ou tarifas/)).toBeInTheDocument()
    // Não há etapa 5: só o fallback.
    expect(screen.queryByRole('button', { name: /^Continuar para/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Continuar com o formulário tradicional' })).toBeEnabled()
  })

  it('transporte até o destino: escolha única que pode ser removida', async () => {
    const user = userEvent.setup()
    await toTransport(user)
    const plane = arrival().getByRole('button', { name: 'Avião' })
    const train = arrival().getByRole('button', { name: 'Trem' })
    await user.click(plane)
    expect(pressed(plane)).toBe(true)
    await user.click(train)
    expect(pressed(train)).toBe(true)
    expect(pressed(plane)).toBe(false)
    expect(arrival().getAllByRole('button').filter(pressed)).toHaveLength(1)
    await user.click(train)
    expect(arrival().getAllByRole('button').filter(pressed)).toHaveLength(0)
  })

  it('deslocamentos locais: seleção múltipla e "Ainda não decidi" exclusivo', async () => {
    const user = userEvent.setup()
    await toTransport(user)
    const walk = local().getByRole('button', { name: 'Caminhada' })
    const taxi = local().getByRole('button', { name: 'Táxi ou aplicativo' })
    const undecided = local().getByRole('button', { name: 'Ainda não decidi' })
    await user.click(walk)
    await user.click(taxi)
    expect(pressed(walk) && pressed(taxi)).toBe(true)
    await user.click(undecided)
    expect(pressed(undecided)).toBe(true)
    expect(pressed(walk) || pressed(taxi)).toBe(false)
    await user.click(taxi)
    expect(pressed(taxi)).toBe(true)
    expect(pressed(undecided)).toBe(false)
    await user.click(taxi)
    expect(local().getAllByRole('button').filter(pressed)).toHaveLength(0)
  })

  it('cidade de origem: validação de formato e tamanho; não bloqueia quando vazia', async () => {
    const user = userEvent.setup()
    await toTransport(user)
    const next = () => screen.getByRole('button', { name: 'Continuar com o formulário tradicional' })

    await user.type(origin(), 'Rio 2')
    expect(screen.getByRole('alert')).toHaveTextContent('Use apenas letras')
    expect(origin()).toHaveAttribute('aria-invalid', 'true')
    expect(next()).toBeDisabled()
    expect(summary()).not.toHaveTextContent('saindo de')

    await user.clear(origin())
    expect(screen.queryByRole('alert')).toBeNull()
    expect(next()).toBeEnabled()

    await user.type(origin(), 'A')
    expect(screen.getByRole('alert')).toHaveTextContent('pelo menos 2 letras')
    await user.clear(origin())
    await user.click(origin())
    await user.paste('a'.repeat(81))
    expect(screen.getByRole('alert')).toHaveTextContent('no máximo 80')
    expect(next()).toBeDisabled()

    await user.clear(origin())
    await user.type(origin(), '  São   Paulo ')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(next()).toBeEnabled()
    expect(summary()).toHaveTextContent('Transporte: saindo de São Paulo')
    expect(screen.getByText(/não é verificado/)).toBeInTheDocument()
  })

  it('seleção única e múltipla usam a mesma linguagem visual (um check por card marcado)', async () => {
    const user = userEvent.setup()
    await toTransport(user)
    const checks = () => screen.queryAllByTestId('selected-check').length
    expect(checks()).toBe(0)
    await user.click(arrival().getByRole('button', { name: 'Avião' }))
    expect(checks()).toBe(1)
    await user.click(arrival().getByRole('button', { name: 'Trem' }))
    expect(checks()).toBe(1)
    await user.click(local().getByRole('button', { name: 'Caminhada' }))
    await user.click(local().getByRole('button', { name: 'Táxi ou aplicativo' }))
    await user.click(local().getByRole('button', { name: 'Transporte público' }))
    expect(checks()).toBe(4)
    for (const name of ['Caminhada', 'Táxi ou aplicativo', 'Transporte público']) {
      const card = local().getByRole('button', { name })
      expect(card).toHaveClass('border-brand-600', 'bg-brand-100')
    }
    expect(local().getByRole('button', { name: 'Carro alugado' })).toHaveClass('bg-surface', 'border-line-strong')
    await user.click(arrival().getByRole('button', { name: 'Trem' }))
    expect(checks()).toBe(3)
  })

  it('funciona pelo teclado: Tab, Enter e Espaço nos cards', async () => {
    const user = userEvent.setup()
    await toTransport(user)
    const plane = arrival().getByRole('button', { name: 'Avião' })
    plane.focus()
    await user.keyboard('{Enter}')
    expect(pressed(plane)).toBe(true)
    await user.tab()
    expect(arrival().getByRole('button', { name: 'Ônibus' })).toHaveFocus()
    await user.keyboard(' ')
    expect(pressed(arrival().getByRole('button', { name: 'Ônibus' }))).toBe(true)
    const walk = local().getByRole('button', { name: 'Caminhada' })
    walk.focus()
    await user.keyboard(' ')
    expect(pressed(walk)).toBe(true)
  })

  it('preserva tudo ao voltar, alterar etapas anteriores e retornar', async () => {
    const user = userEvent.setup()
    await toTransport(user)
    await user.click(arrival().getByRole('button', { name: 'Ônibus' }))
    await user.type(origin(), 'Curitiba')
    await user.click(local().getByRole('button', { name: 'Transporte público' }))
    await user.click(local().getByRole('button', { name: 'Caminhada' }))
    expect(summary()).toHaveTextContent(
      'Transporte: Ônibus (saindo de Curitiba); local: Transporte público, Caminhada',
    )

    await user.click(screen.getByRole('button', { name: 'Voltar para Viajantes' }))
    expect(await screen.findByRole('heading', { name: 'Quem vai viajar com você?' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Aumentar crianças' }))
    await user.click(screen.getByRole('button', { name: 'Voltar para Datas' }))
    await user.click(screen.getByRole('button', { name: '10 dias' }))
    await user.click(screen.getByRole('button', { name: 'Voltar para Destino' }))
    const rio = (await screen.findByRole('heading', { name: 'Rio de Janeiro' })).closest('article') as HTMLElement
    await user.click(within(rio).getByRole('button', { name: 'Selecionar destino' }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Datas' }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Viajantes' }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Transporte' }))

    expect(pressed(arrival().getByRole('button', { name: 'Ônibus' }))).toBe(true)
    expect(origin()).toHaveValue('Curitiba')
    expect(pressed(local().getByRole('button', { name: 'Transporte público' }))).toBe(true)
    expect(pressed(local().getByRole('button', { name: 'Caminhada' }))).toBe(true)
    expect(summary()).toHaveTextContent('Destino selecionado: Rio de Janeiro')
    expect(summary()).toHaveTextContent('Duração: 10 dias')
    expect(summary()).toHaveTextContent('Viajantes: 2 adultos, 1 criança')

    // Alteração posterior.
    await user.click(arrival().getByRole('button', { name: 'Trem' }))
    expect(summary()).toHaveTextContent('Transporte: Trem (saindo de Curitiba)')
  })

  it('o formulário tradicional mantém destino e duração e nada vai ao armazenamento', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const user = userEvent.setup()
    await toTransport(user, 'Rio de Janeiro')
    await user.click(arrival().getByRole('button', { name: 'Avião' }))
    await user.type(origin(), 'Curitiba')
    await user.click(screen.getByRole('button', { name: 'Continuar com o formulário tradicional' }))
    expect((document.getElementById('destino') as HTMLSelectElement).value).toBe('rio-de-janeiro')
    expect((document.getElementById('duracao') as HTMLInputElement).value).toBe('7')
    expect(setItem).not.toHaveBeenCalled()
    expect(localStorage.length).toBe(0)
  })
})
