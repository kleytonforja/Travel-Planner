import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App'

/**
 * Etapa 2 do planejamento progressivo (V1-T3.2): datas e duração.
 * O relógio é fixado em 12/10/2026 (somente `Date`) para tornar determinística
 * a regra "início não pode ser anterior a hoje".
 */

const NOW = new Date(2026, 9, 12, 12, 0, 0)

// Estes testes percorrem até 6 etapas do fluxo com user-event; medidos em 3-6 s sob carga (limite padrão: 5 s).
vi.setConfig({ testTimeout: 20000 })

type User = ReturnType<typeof userEvent.setup>

async function toDatesStep(user: User, destination = 'Lisboa') {
  render(<App />)
  await user.click(screen.getByRole('link', { name: 'Planejar minha viagem' }))
  const card = (await screen.findByRole('heading', { name: destination })).closest('article') as HTMLElement
  await user.click(within(card).getByRole('button', { name: 'Selecionar destino' }))
  await user.click(screen.getByRole('button', { name: 'Continuar para Datas' }))
  await screen.findByRole('heading', { name: 'Quando começa sua aventura?' })
}

const radio = (name: RegExp) => screen.getByRole('radio', { name })
const startInput = () => screen.getByLabelText('Data de início') as HTMLInputElement
const endInput = () => screen.getByLabelText('Data de término') as HTMLInputElement
const customInput = () => screen.getByLabelText('Outra duração (dias)') as HTMLInputElement
const summary = () => screen.getByRole('region', { name: 'Resumo do planejamento' })
const legacyButton = () => screen.getByRole('button', { name: 'Continuar para Viajantes' })

function setDates(start: string, end: string) {
  fireEvent.change(startInput(), { target: { value: start } })
  fireEvent.change(endInput(), { target: { value: end } })
}

describe('Etapa 2 — Datas e duração', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    Element.prototype.scrollIntoView = vi.fn()
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('apresenta a etapa 2 de 7, a pergunta e os dois cards, ainda sem escolha', async () => {
    const user = userEvent.setup()
    await toDatesStep(user)

    expect(screen.getByText('Etapa 2 de 7')).toBeInTheDocument()
    const items = within(screen.getByRole('list', { name: 'Progresso do planejamento' })).getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Destino (concluída)')
    expect(items[1]).toHaveAttribute('aria-current', 'step')
    expect(items[1]).toHaveTextContent('Datas (etapa atual)')

    const a = radio(/Já tenho as datas/)
    const b = radio(/Ainda não defini as datas/)
    expect(a).not.toBeChecked()
    expect(b).not.toBeChecked()
    expect(screen.queryByLabelText('Data de início')).toBeNull()
    // O avanço para a etapa 3 só libera com a duração válida.
    expect(legacyButton()).toBeDisabled()
    expect(screen.getByText('Informe uma duração válida (de 1 a 14 dias) para continuar.')).toBeInTheDocument()
  })

  it('opção A: calcula a duração a partir das datas e libera o avanço', async () => {
    const user = userEvent.setup()
    await toDatesStep(user)
    await user.click(radio(/Já tenho as datas/))

    expect(startInput()).toHaveAttribute('min', '2026-10-12')
    setDates('2026-10-20', '2026-10-27')

    expect(screen.getByRole('status')).toHaveTextContent(/Duração: 8 dias/)
    expect(screen.getByRole('status').textContent).toMatch(/20\/10.*27\/10/)
    expect(summary()).toHaveTextContent('Duração: 8 dias')
    expect(legacyButton()).toBeEnabled()
    expect(endInput()).toHaveAttribute('min', '2026-10-20')
  })

  it('opção A: mesmo dia conta como 1 dia; virada de mês e de ano é calculada em calendário', async () => {
    const user = userEvent.setup()
    await toDatesStep(user)
    await user.click(radio(/Já tenho as datas/))

    setDates('2026-10-15', '2026-10-15')
    expect(screen.getByRole('status')).toHaveTextContent(/Duração: 1 dia/)
    setDates('2026-12-30', '2027-01-02')
    expect(screen.getByRole('status')).toHaveTextContent(/Duração: 4 dias/)
    setDates('2026-10-30', '2026-11-02')
    expect(screen.getByRole('status')).toHaveTextContent(/Duração: 4 dias/)
  })

  it('opção A: datas inválidas mostram alerta, marcam o campo e bloqueiam o avanço', async () => {
    const user = userEvent.setup()
    await toDatesStep(user)
    await user.click(radio(/Já tenho as datas/))

    // Término antes do início.
    setDates('2026-10-20', '2026-10-19')
    expect(screen.getByRole('alert')).toHaveTextContent('igual ou posterior à data de início')
    expect(endInput()).toHaveAttribute('aria-invalid', 'true')
    expect(startInput()).toHaveAttribute('aria-invalid', 'false')
    expect(legacyButton()).toBeDisabled()
    expect(summary()).not.toHaveTextContent('Duração')

    // Início no passado.
    setDates('2026-10-11', '2026-10-15')
    expect(screen.getByRole('alert')).toHaveTextContent('anterior a hoje')
    expect(startInput()).toHaveAttribute('aria-invalid', 'true')
    expect(legacyButton()).toBeDisabled()

    // Acima do limite do motor (15 dias).
    setDates('2026-10-12', '2026-10-26')
    expect(screen.getByRole('alert')).toHaveTextContent('A viagem teria 15 dias')
    expect(screen.getByRole('alert')).toHaveTextContent('limite atual do planejador é de 14 dias')
    expect(legacyButton()).toBeDisabled()

    // Corrigido: o alerta some e o avanço é liberado.
    setDates('2026-10-12', '2026-10-25')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent(/Duração: 14 dias/)
    expect(legacyButton()).toBeEnabled()
  })

  it('opção A: com só uma data preenchida não há erro, mas não há avanço', async () => {
    const user = userEvent.setup()
    await toDatesStep(user)
    await user.click(radio(/Já tenho as datas/))
    fireEvent.change(startInput(), { target: { value: '2026-10-20' } })
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByText(/Informe as duas datas/)).toBeInTheDocument()
    expect(legacyButton()).toBeDisabled()
  })

  it('opção B: atalhos de 3, 5, 7, 10 e 14 dias definem a duração', async () => {
    const user = userEvent.setup()
    await toDatesStep(user)
    await user.click(radio(/Ainda não defini as datas/))

    const group = screen.getByRole('group', { name: 'Duração rápida' })
    expect(within(group).getAllByRole('button').map((b) => b.textContent)).toEqual([
      '3 dias',
      '5 dias',
      '7 dias',
      '10 dias',
      '14 dias',
    ])
    await user.click(within(group).getByRole('button', { name: '7 dias' }))
    expect(within(group).getByRole('button', { name: '7 dias' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(group).getByRole('button', { name: '5 dias' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('status')).toHaveTextContent('Duração: 7 dias.')
    expect(summary()).toHaveTextContent('Duração: 7 dias')
    expect(legacyButton()).toBeEnabled()

    await user.click(within(group).getByRole('button', { name: '14 dias' }))
    expect(summary()).toHaveTextContent('Duração: 14 dias')
  })

  it('opção B: duração personalizada de 1 a 14 dias, com validação', async () => {
    const user = userEvent.setup()
    await toDatesStep(user)
    await user.click(radio(/Ainda não defini as datas/))

    expect(customInput()).toHaveAttribute('min', '1')
    expect(customInput()).toHaveAttribute('max', '14')

    await user.type(customInput(), '12')
    expect(screen.getByRole('status')).toHaveTextContent('Duração: 12 dias.')
    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0)
    expect(legacyButton()).toBeEnabled()

    await user.clear(customInput())
    await user.type(customInput(), '15')
    expect(screen.getByRole('alert')).toHaveTextContent('entre 1 e 14 dias')
    expect(customInput()).toHaveAttribute('aria-invalid', 'true')
    expect(legacyButton()).toBeDisabled()

    await user.clear(customInput())
    await user.type(customInput(), '0')
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(legacyButton()).toBeDisabled()

    await user.clear(customInput())
    await user.type(customInput(), '3.5')
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(legacyButton()).toBeDisabled()

    await user.clear(customInput())
    expect(screen.queryByRole('alert')).toBeNull()
    expect(legacyButton()).toBeDisabled()
    // Um atalho recupera a duração válida.
    await user.click(screen.getByRole('button', { name: '10 dias' }))
    expect(legacyButton()).toBeEnabled()
    expect(customInput()).toHaveValue(null)
  })

  it('alternar entre os dois modos preserva o que foi informado em cada um', async () => {
    const user = userEvent.setup()
    await toDatesStep(user)

    await user.click(radio(/Já tenho as datas/))
    setDates('2026-10-20', '2026-10-27')
    expect(summary()).toHaveTextContent('Duração: 8 dias')

    await user.click(radio(/Ainda não defini as datas/))
    // Sem duração escolhida no modo B ainda: o resumo não usa as datas do modo A.
    expect(summary()).not.toHaveTextContent('Duração')
    expect(legacyButton()).toBeDisabled()
    await user.click(screen.getByRole('button', { name: '5 dias' }))
    expect(summary()).toHaveTextContent('Duração: 5 dias')

    await user.click(radio(/Já tenho as datas/))
    expect(startInput()).toHaveValue('2026-10-20')
    expect(endInput()).toHaveValue('2026-10-27')
    expect(summary()).toHaveTextContent('Duração: 8 dias')

    await user.click(radio(/Ainda não defini as datas/))
    expect(screen.getByRole('button', { name: '5 dias' })).toHaveAttribute('aria-pressed', 'true')
    expect(summary()).toHaveTextContent('Duração: 5 dias')
  })

  it('o card selecionado fica destacado e os modos funcionam pelo teclado', async () => {
    const user = userEvent.setup()
    await toDatesStep(user)
    const a = radio(/Já tenho as datas/)
    const b = radio(/Ainda não defini as datas/)

    a.focus()
    await user.keyboard(' ')
    expect(a).toBeChecked()
    expect(a.nextElementSibling).toHaveClass('peer-checked:border-brand-600')
    await user.keyboard('{ArrowDown}')
    expect(b).toBeChecked()
    expect(a).not.toBeChecked()
    expect(screen.getByRole('group', { name: 'Duração rápida' })).toBeInTheDocument()
  })

  it('Voltar para Destino preserva destino, modo e valores; ao retornar tudo continua lá', async () => {
    const user = userEvent.setup()
    await toDatesStep(user)
    await user.click(radio(/Já tenho as datas/))
    setDates('2026-10-20', '2026-10-27')

    await user.click(screen.getByRole('button', { name: 'Voltar para Destino' }))
    const heading = await screen.findByRole('heading', { name: 'Para onde vamos viajar?' })
    expect(heading).toHaveFocus()
    expect(screen.getByText('Etapa 1 de 7')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Lisboa' }).closest('article')).toHaveClass('border-brand-600')
    // O resumo continua mostrando destino e duração.
    expect(summary()).toHaveTextContent('Destino selecionado: Lisboa')
    expect(summary()).toHaveTextContent('Duração: 8 dias')

    await user.click(screen.getByRole('button', { name: 'Continuar para Datas' }))
    expect(await screen.findByRole('heading', { name: 'Quando começa sua aventura?' })).toHaveFocus()
    expect(radio(/Já tenho as datas/)).toBeChecked()
    expect(startInput()).toHaveValue('2026-10-20')
    expect(endInput()).toHaveValue('2026-10-27')
  })

  it('trocar o destino na etapa 1 mantém as datas já escolhidas', async () => {
    const user = userEvent.setup()
    await toDatesStep(user)
    await user.click(radio(/Ainda não defini as datas/))
    await user.click(screen.getByRole('button', { name: '7 dias' }))

    await user.click(screen.getByRole('button', { name: 'Voltar para Destino' }))
    const rio = (await screen.findByRole('heading', { name: 'Rio de Janeiro' })).closest('article') as HTMLElement
    await user.click(within(rio).getByRole('button', { name: 'Selecionar destino' }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Datas' }))

    expect(screen.getByRole('button', { name: '7 dias' })).toHaveAttribute('aria-pressed', 'true')
    expect(summary()).toHaveTextContent('Destino selecionado: Rio de Janeiro')
    expect(summary()).toHaveTextContent('Duração: 7 dias')
  })

  it('o rascunho sobrevive a uma ida à home e ao retorno ao planejamento na mesma sessão', async () => {
    const user = userEvent.setup()
    await toDatesStep(user)
    await user.click(radio(/Já tenho as datas/))
    setDates('2026-10-20', '2026-10-27')

    await user.click(screen.getByRole('button', { name: 'Voltar para o início' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Viagens incríveis começam com boas escolhas.')

    await user.click(screen.getByRole('link', { name: 'Planejar minha viagem' }))
    await user.click(await screen.findByRole('button', { name: 'Continuar para Datas' }))
    expect(radio(/Já tenho as datas/)).toBeChecked()
    expect(startInput()).toHaveValue('2026-10-20')
    expect(endInput()).toHaveValue('2026-10-27')
  })

  it('a duração calculada pelas datas chega à revisão', async () => {
    const user = userEvent.setup()
    await toDatesStep(user, 'Rio de Janeiro')
    await user.click(radio(/Já tenho as datas/))
    setDates('2026-10-20', '2026-10-22')
    await user.click(legacyButton())
    await user.click(screen.getByRole('button', { name: 'Continuar para Transporte' }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Interesses' }))
    await user.click(screen.getByRole('button', { name: /^Cultura/ }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Orçamento' }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Revisão' }))

    const dates = screen.getByRole('region', { name: 'Datas e duração' })
    expect(dates).toHaveTextContent('3 dias')
    expect(dates).toHaveTextContent(/20\/10.*22\/10/)
    expect(screen.getByRole('region', { name: 'Destino' })).toHaveTextContent('Rio de Janeiro')
  })

  it('não grava rascunho no armazenamento e não oferece etapas futuras como funcionais', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const user = userEvent.setup()
    await toDatesStep(user)
    await user.click(radio(/Já tenho as datas/))
    setDates('2026-10-20', '2026-10-27')
    await user.click(radio(/Ainda não defini as datas/))
    await user.click(screen.getByRole('button', { name: '5 dias' }))

    expect(setItem).not.toHaveBeenCalled()
    expect(localStorage.length).toBe(0)
    expect(screen.queryByRole('button', { name: /Transporte|Interesses|Orçamento|Revisão/ })).toBeNull()
    const progress = screen.getByRole('list', { name: 'Progresso do planejamento' })
    expect(within(progress).queryByRole('button')).toBeNull()
    expect(within(progress).queryByRole('link')).toBeNull()
  })
})
