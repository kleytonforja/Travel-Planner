import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App'

// Estes testes percorrem até 6 etapas do fluxo com user-event; medidos em 3-6 s sob carga (limite padrão: 5 s).
vi.setConfig({ testTimeout: 20000 })

type User = ReturnType<typeof userEvent.setup>

async function toBudget(user: User, destination = 'Lisboa', adults = 1) {
  render(<App />)
  await user.click(screen.getByRole('link', { name: 'Planejar minha viagem' }))
  const card = (await screen.findByRole('heading', { name: destination })).closest('article') as HTMLElement
  await user.click(within(card).getByRole('button', { name: 'Selecionar destino' }))
  await user.click(screen.getByRole('button', { name: 'Continuar para Datas' }))
  await user.click(screen.getByRole('radio', { name: /Ainda não defini as datas/ }))
  await user.click(screen.getByRole('button', { name: '7 dias' }))
  await user.click(screen.getByRole('button', { name: 'Continuar para Viajantes' }))
  for (let i = 1; i < adults; i += 1) await user.click(screen.getByRole('button', { name: 'Aumentar adultos' }))
  await user.click(screen.getByRole('button', { name: 'Continuar para Transporte' }))
  await user.click(screen.getByRole('button', { name: 'Continuar para Interesses' }))
  await user.click(screen.getByRole('button', { name: /^Cultura/ }))
  await user.click(screen.getByRole('button', { name: 'Continuar para Orçamento' }))
  await screen.findByRole('heading', { name: 'Quanto você pretende investir na viagem?' })
}

const styles = () => within(screen.getByRole('group', { name: 'Estilo da viagem' }))
const amountMode = () => within(screen.getByRole('group', { name: 'Orçamento (opcional)' }))
const basis = () => within(screen.getByRole('group', { name: 'Como você quer informar o valor?' }))
const pressed = (el: HTMLElement) => el.getAttribute('aria-pressed') === 'true'
const summary = () => screen.getByRole('region', { name: 'Resumo do planejamento' })
const legacy = () => screen.getByRole('button', { name: 'Continuar para Revisão' })
const field = () => screen.getByLabelText(/^Valor (total da viagem|por pessoa)/) as HTMLInputElement

describe('Etapa 6 — Orçamento', () => {
  beforeEach(() => {
    localStorage.clear()
    Element.prototype.scrollIntoView = vi.fn()
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  })

  it('apresenta a etapa 6 de 7, Equilibrado como padrão e orçamento "Ainda não defini"', async () => {
    const user = userEvent.setup()
    await toBudget(user)
    expect(screen.getByRole('heading', { name: 'Quanto você pretende investir na viagem?' })).toHaveFocus()
    expect(screen.getByText('Etapa 6 de 7')).toBeInTheDocument()
    expect(styles().getAllByRole('button').map((b) => b.textContent?.split(/[.A-Z]/)[0])).toHaveLength(3)
    expect(pressed(styles().getByRole('button', { name: /^Equilibrado/ }))).toBe(true)
    expect(styles().getAllByRole('button').filter(pressed)).toHaveLength(1)
    expect(pressed(amountMode().getByRole('button', { name: /^Ainda não defini/ }))).toBe(true)
    expect(screen.queryByLabelText(/^Valor/)).toBeNull()
    expect(summary()).toHaveTextContent('Orçamento: Equilibrado; orçamento não informado')
    // Opcional: segue sem valor para a revisão.
    expect(legacy()).toBeEnabled()
    expect(screen.getByText(/estimativas ilustrativas/)).toBeInTheDocument()
    expect(screen.getByText(/não representa dinheiro disponível/)).toBeInTheDocument()
    expect(screen.getByText(/hospedagem, alimentação e transporte\s+não são calculados/i)).toBeInTheDocument()
  })

  it('estilo é escolha única', async () => {
    const user = userEvent.setup()
    await toBudget(user)
    await user.click(styles().getByRole('button', { name: /^Econômico/ }))
    expect(pressed(styles().getByRole('button', { name: /^Econômico/ }))).toBe(true)
    expect(pressed(styles().getByRole('button', { name: /^Equilibrado/ }))).toBe(false)
    await user.click(styles().getByRole('button', { name: /^Confortável/ }))
    expect(styles().getAllByRole('button').filter(pressed)).toHaveLength(1)
    expect(summary()).toHaveTextContent('Orçamento: Confortável')
  })

  it('valor total: mostra a modalidade, a moeda do destino e o equivalente por pessoa', async () => {
    const user = userEvent.setup()
    await toBudget(user, 'Lisboa', 3)
    await user.click(amountMode().getByRole('button', { name: /^Informar um valor/ }))
    expect(pressed(basis().getByRole('button', { name: /^Valor total da viagem/ }))).toBe(true)
    expect(screen.getByLabelText('Valor total da viagem (EUR)')).toBeInTheDocument()
    await user.type(field(), '3000')
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(/Total de .*3.?000,00.* para 3 viajantes: .*1.?000,00.* por pessoa/)
    expect(status).not.toHaveTextContent('cerca de')
    expect(status.textContent).toContain('€')
    expect(summary()).toHaveTextContent(/Orçamento: Equilibrado; total de .*3.?000,00.*por pessoa/)
  })

  it('valor por pessoa: multiplica pelos viajantes; divisão inexata é arredondada para baixo e avisada', async () => {
    const user = userEvent.setup()
    await toBudget(user, 'Rio de Janeiro', 3)
    await user.click(amountMode().getByRole('button', { name: /^Informar um valor/ }))
    await user.click(basis().getByRole('button', { name: /^Valor por pessoa/ }))
    expect(screen.getByLabelText('Valor por pessoa (BRL)')).toBeInTheDocument()
    await user.type(field(), '500')
    expect(screen.getByRole('status')).toHaveTextContent(/500,00.* por pessoa, para 3 viajantes: total de .*1\.500,00/)
    expect(screen.getByRole('status').textContent).toContain('R$')

    await user.click(basis().getByRole('button', { name: /^Valor total da viagem/ }))
    await user.clear(field())
    await user.type(field(), '1000')
    expect(screen.getByRole('status')).toHaveTextContent(/cerca de .*333,33.* por pessoa/)
    expect(screen.getByText(/arredondada para baixo ao centavo/)).toBeInTheDocument()
    expect(screen.getByText(/sem descontos presumidos/)).toBeInTheDocument()
  })

  it('valores inválidos mostram alerta e bloqueiam; vazio e "Ainda não defini" não bloqueiam', async () => {
    const user = userEvent.setup()
    await toBudget(user)
    await user.click(amountMode().getByRole('button', { name: /^Informar um valor/ }))
    expect(legacy()).toBeEnabled() // vazio
    for (const [text, msg] of [
      ['-5', 'negativo'],
      ['abc', 'apenas números'],
      ['0', 'maior que zero'],
      ['12,345', 'apenas números'],
      ['99999999', 'máximo'],
    ]) {
      await user.clear(field())
      await user.type(field(), text)
      expect(screen.getByRole('alert')).toHaveTextContent(msg)
      expect(field()).toHaveAttribute('aria-invalid', 'true')
      expect(legacy()).toBeDisabled()
    }
    expect(screen.getByText('Corrija o valor do orçamento (ou escolha "Ainda não defini") para continuar.')).toBeInTheDocument()
    await user.click(amountMode().getByRole('button', { name: /^Ainda não defini/ }))
    expect(legacy()).toBeEnabled()
    await user.click(amountMode().getByRole('button', { name: /^Informar um valor/ }))
    expect(field()).toHaveValue('99999999') // o texto é preservado
    await user.clear(field())
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('valor pequeno demais para dividir entre os viajantes é sinalizado', async () => {
    const user = userEvent.setup()
    await toBudget(user, 'Lisboa', 3)
    await user.click(amountMode().getByRole('button', { name: /^Informar um valor/ }))
    await user.type(field(), '0,02')
    expect(screen.getByRole('alert')).toHaveTextContent('pequeno demais')
  })

  it('o total por pessoa acompanha a alteração da quantidade de viajantes', async () => {
    const user = userEvent.setup()
    await toBudget(user, 'Lisboa', 2)
    await user.click(amountMode().getByRole('button', { name: /^Informar um valor/ }))
    await user.type(field(), '1200')
    expect(screen.getByRole('status')).toHaveTextContent(/2 viajantes: .*600,00.* por pessoa/)

    await user.click(screen.getByRole('button', { name: 'Voltar para Interesses' }))
    await user.click(screen.getByRole('button', { name: 'Voltar para Transporte' }))
    await user.click(screen.getByRole('button', { name: 'Voltar para Viajantes' }))
    await user.click(screen.getByRole('button', { name: 'Aumentar crianças' }))
    await user.click(screen.getByRole('button', { name: 'Aumentar bebês' }))
    for (const name of ['Transporte', 'Interesses', 'Orçamento']) {
      await user.click(screen.getByRole('button', { name: `Continuar para ${name}` }))
    }
    expect(field()).toHaveValue('1200')
    expect(screen.getByRole('status')).toHaveTextContent(/4 viajantes: .*300,00.* por pessoa/)
  })

  it('alterar viajantes preserva a modalidade escolhida (por pessoa) e recalcula o total', async () => {
    const user = userEvent.setup()
    await toBudget(user, 'Lisboa', 2)
    await user.click(amountMode().getByRole('button', { name: /^Informar um valor/ }))
    await user.click(basis().getByRole('button', { name: /^Valor por pessoa/ }))
    await user.type(field(), '400')
    expect(screen.getByRole('status')).toHaveTextContent(/2 viajantes: total de .*800,00/)

    await user.click(screen.getByRole('button', { name: 'Voltar para Interesses' }))
    await user.click(screen.getByRole('button', { name: 'Voltar para Transporte' }))
    await user.click(screen.getByRole('button', { name: 'Voltar para Viajantes' }))
    await user.click(screen.getByRole('button', { name: 'Aumentar crianças' }))
    for (const name of ['Transporte', 'Interesses', 'Orçamento']) {
      await user.click(screen.getByRole('button', { name: `Continuar para ${name}` }))
    }
    expect(pressed(basis().getByRole('button', { name: /^Valor por pessoa/ }))).toBe(true)
    expect(pressed(basis().getByRole('button', { name: /^Valor total da viagem/ }))).toBe(false)
    expect(field()).toHaveValue('400')
    expect(screen.getByRole('status')).toHaveTextContent(/3 viajantes: total de .*1.?200,00/)
  })

  it('funciona pelo teclado e preserva tudo ao voltar e avançar', async () => {
    const user = userEvent.setup()
    await toBudget(user)
    const comfy = styles().getByRole('button', { name: /^Confortável/ })
    comfy.focus()
    await user.keyboard('{Enter}')
    expect(pressed(comfy)).toBe(true)
    const inform = amountMode().getByRole('button', { name: /^Informar um valor/ })
    inform.focus()
    await user.keyboard(' ')
    expect(pressed(inform)).toBe(true)
    await user.click(basis().getByRole('button', { name: /^Valor por pessoa/ }))
    await user.type(field(), '800,5')

    await user.click(screen.getByRole('button', { name: 'Voltar para Interesses' }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Orçamento' }))
    expect(pressed(styles().getByRole('button', { name: /^Confortável/ }))).toBe(true)
    expect(pressed(basis().getByRole('button', { name: /^Valor por pessoa/ }))).toBe(true)
    expect(field()).toHaveValue('800,5')
  })

  it('estilo e orçamento chegam à revisão já convertidos em valor por pessoa; nada vai ao armazenamento', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const user = userEvent.setup()
    await toBudget(user, 'Rio de Janeiro', 3)
    await user.click(styles().getByRole('button', { name: /^Econômico/ }))
    await user.click(amountMode().getByRole('button', { name: /^Informar um valor/ }))
    await user.type(field(), '1000')
    await user.click(legacy())

    const card = screen.getByRole('region', { name: 'Estilo e orçamento' })
    expect(card).toHaveTextContent('Econômico')
    expect(card).toHaveTextContent(/cerca de .*333,33.* por pessoa/)
    expect(screen.getByRole('region', { name: 'Datas e duração' })).toHaveTextContent('7 dias')
    expect(setItem).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Gerar roteiro' }))
    expect(await screen.findByRole('button', { name: 'Salvar roteiro' })).toBeInTheDocument()
  })

  it('sem orçamento definido a revisão permite gerar, sem alerta e sem saldo', async () => {
    const user = userEvent.setup()
    await toBudget(user)
    await user.click(legacy())
    expect(screen.getByRole('button', { name: 'Gerar roteiro' })).toBeEnabled()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByRole('region', { name: 'Estilo e orçamento' })).toHaveTextContent('Orçamento não informado')
    expect(screen.getByRole('region', { name: 'Estilo e orçamento' })).toHaveTextContent('Equilibrado')
  })

})
