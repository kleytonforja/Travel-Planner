import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App'

// Estes testes percorrem até 6 etapas do fluxo com user-event; medidos em 3-6 s sob carga (limite padrão: 5 s).
vi.setConfig({ testTimeout: 20000 })

type User = ReturnType<typeof userEvent.setup>

async function toTravelers(user: User, destination = 'Lisboa') {
  render(<App />)
  await user.click(screen.getByRole('link', { name: 'Planejar minha viagem' }))
  const card = (await screen.findByRole('heading', { name: destination })).closest('article') as HTMLElement
  await user.click(within(card).getByRole('button', { name: 'Selecionar destino' }))
  await user.click(screen.getByRole('button', { name: 'Continuar para Datas' }))
  await user.click(screen.getByRole('radio', { name: /Ainda não defini as datas/ }))
  await user.click(screen.getByRole('button', { name: '7 dias' }))
  await user.click(screen.getByRole('button', { name: 'Continuar para Viajantes' }))
  await screen.findByRole('heading', { name: 'Quem vai viajar com você?' })
}

const more = (label: string) => screen.getByRole('button', { name: `Aumentar ${label}` })
const less = (label: string) => screen.getByRole('button', { name: `Diminuir ${label}` })
const value = (label: string) => screen.getByLabelText(new RegExp(`^${label}: `)).textContent
const summary = () => screen.getByRole('region', { name: 'Resumo do planejamento' })

describe('Etapa 3 — Viajantes', () => {
  beforeEach(() => {
    localStorage.clear()
    Element.prototype.scrollIntoView = vi.fn()
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  })

  it('apresenta a pergunta, a etapa 3 de 7 e 1 adulto como padrão', async () => {
    const user = userEvent.setup()
    await toTravelers(user)
    expect(screen.getByRole('heading', { name: 'Quem vai viajar com você?' })).toHaveFocus()
    expect(screen.getByText('Etapa 3 de 7')).toBeInTheDocument()
    const items = within(screen.getByRole('list', { name: 'Progresso do planejamento' })).getAllByRole('listitem')
    expect(items[2]).toHaveAttribute('aria-current', 'step')
    expect(value('Adultos')).toBe('1')
    expect(value('Crianças')).toBe('0')
    expect(value('Bebês')).toBe('0')
    expect(less('adultos')).toBeDisabled()
    expect(less('crianças')).toBeDisabled()
    expect(summary()).toHaveTextContent('Viajantes: 1 adulto')
    // A etapa 4 existe: o avanço é "Continuar para Transporte"; o fallback só aparece na última etapa disponível.
    expect(screen.getByRole('button', { name: 'Continuar para Transporte' })).toBeEnabled()
    expect(screen.getByText(/ainda não\s+personalizam atrações nem custos/)).toBeInTheDocument()
  })

  it('altera quantidades com mouse e respeita os limites', async () => {
    const user = userEvent.setup()
    await toTravelers(user)
    await user.click(more('adultos'))
    await user.click(more('crianças'))
    await user.click(more('crianças'))
    await user.click(more('bebês'))
    expect(value('Adultos')).toBe('2')
    expect(value('Crianças')).toBe('2')
    expect(value('Bebês')).toBe('1')
    expect(summary()).toHaveTextContent('Viajantes: 2 adultos, 2 crianças, 1 bebê')
    expect(screen.getByText(/Total: 5 viajantes/)).toBeInTheDocument()

    // Sem regra de um adulto por bebê: pode haver mais bebês que adultos.
    await user.click(more('bebês'))
    await user.click(more('bebês'))
    expect(value('Bebês')).toBe('3')
    expect(more('bebês')).toBeEnabled()
    await user.click(less('adultos'))
    expect(value('Adultos')).toBe('1')
    expect(less('adultos')).toBeDisabled() // ainda precisa de pelo menos 1 adulto
    expect(screen.queryByRole('alert')).toBeNull()
    await user.click(less('bebês'))
    await user.click(less('bebês'))
    await user.click(less('bebês'))
    expect(less('bebês')).toBeDisabled()
    expect(value('Bebês')).toBe('0')
  })

  it('o total máximo é respeitado', async () => {
    const user = userEvent.setup()
    await toTravelers(user)
    for (let i = 0; i < 25; i += 1) {
      if (!(more('adultos') as HTMLButtonElement).disabled) await user.click(more('adultos'))
    }
    expect(value('Adultos')).toBe('20')
    expect(more('adultos')).toBeDisabled()
    expect(more('crianças')).toBeDisabled()
    expect(screen.getByText(/Total: 20 viajantes/)).toBeInTheDocument()
  })

  it('faixas etárias de crianças são opcionais e limitadas ao número de crianças', async () => {
    const user = userEvent.setup()
    await toTravelers(user)
    expect(screen.queryByText('Faixas etárias das crianças (opcional)')).toBeNull()
    await user.click(more('crianças'))
    await user.click(more('crianças'))
    expect(screen.getByText('Faixas etárias das crianças (opcional)')).toBeInTheDocument()
    await user.click(more('3 a 5 anos'))
    await user.click(more('6 a 11 anos'))
    expect(more('12 a 17 anos')).toBeDisabled()
    expect(more('3 a 5 anos')).toBeDisabled()
    await user.click(less('crianças'))
    expect(value('3 a 5 anos')! + value('6 a 11 anos')!).not.toBe('11')
    await user.click(less('crianças'))
    expect(screen.queryByText('Faixas etárias das crianças (opcional)')).toBeNull()
    // Sem nomes, documentos ou datas de nascimento.
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('perfil é opcional, nunca inferido e pode ser removido', async () => {
    const user = userEvent.setup()
    await toTravelers(user)
    const profiles = ['Individual', 'Casal', 'Família', 'Amigos']
    for (const name of profiles) {
      expect(screen.getByRole('button', { name: new RegExp(`^${name}`) })).toHaveAttribute('aria-pressed', 'false')
    }
    await user.click(more('adultos'))
    await user.click(more('crianças'))
    for (const name of profiles) {
      expect(screen.getByRole('button', { name: new RegExp(`^${name}`) })).toHaveAttribute('aria-pressed', 'false')
    }
    const friends = screen.getByRole('button', { name: /^Amigos/ })
    await user.click(friends)
    expect(friends).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: /^Casal/ }))
    expect(friends).toHaveAttribute('aria-pressed', 'false')
    await user.click(screen.getByRole('button', { name: /^Casal/ }))
    expect(screen.getByRole('button', { name: /^Casal/ })).toHaveAttribute('aria-pressed', 'false')
  })

  it('perfil usa o padrão visual dos demais cards: check só no selecionado, estado acessível e foco visível', async () => {
    const user = userEvent.setup()
    await toTravelers(user)
    const profile = (name: RegExp) => screen.getByRole('button', { name })
    // Nenhum check quando nada está selecionado (os contadores e demais controles não usam o check).
    expect(screen.queryAllByTestId('selected-check')).toHaveLength(0)
    const family = profile(/^Família/)
    expect(family).toHaveClass('focus-ring-on-dark', 'min-h-14', 'border-line-strong', 'bg-surface')
    await user.click(family)
    expect(family).toHaveAttribute('aria-pressed', 'true')
    expect(family).toHaveClass('border-2', 'border-brand-600', 'bg-brand-100')
    expect(within(family).getByTestId('selected-check')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getAllByTestId('selected-check')).toHaveLength(1)
    expect(family).toHaveAccessibleName(/^Família/) // o check não altera o nome
    // Seleção única: trocar move o check; clicar de novo remove.
    await user.click(profile(/^Amigos/))
    expect(within(family).queryByTestId('selected-check')).toBeNull()
    expect(screen.getAllByTestId('selected-check')).toHaveLength(1)
    await user.click(profile(/^Amigos/))
    expect(screen.queryAllByTestId('selected-check')).toHaveLength(0)
    // As quatro opções seguem presentes, com descrição acessível.
    for (const name of ['Individual', 'Casal', 'Família', 'Amigos']) {
      expect(profile(new RegExp(`^${name}`))).toBeInTheDocument()
    }
    expect(family).toHaveAccessibleName(/crianças ou várias gerações/)
  })

  it('o perfil já escolhido é preservado ao voltar, avançar e editar etapas anteriores', async () => {
    const user = userEvent.setup()
    await toTravelers(user)
    await user.click(screen.getByRole('button', { name: /^Casal/ }))
    await user.click(screen.getByRole('button', { name: 'Voltar para Datas' }))
    await user.click(screen.getByRole('button', { name: '10 dias' }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Viajantes' }))
    const couple = screen.getByRole('button', { name: /^Casal/ })
    expect(couple).toHaveAttribute('aria-pressed', 'true')
    expect(within(couple).getByTestId('selected-check')).toBeInTheDocument()
  })

  it('funciona pelo teclado: Tab, Enter e Espaço', async () => {
    const user = userEvent.setup()
    await toTravelers(user)
    more('adultos').focus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(value('Adultos')).toBe('3')
    await user.tab()
    // Depois de "Aumentar adultos" vem "Diminuir crianças" (desabilitado é pulado) e então "Aumentar crianças".
    expect(more('crianças')).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(value('Crianças')).toBe('1')

    const familia = screen.getByRole('button', { name: /^Família/ })
    familia.focus()
    await user.keyboard(' ')
    expect(familia).toHaveAttribute('aria-pressed', 'true')

    const visual = screen.getByRole('checkbox', { name: 'Deficiência visual' })
    visual.focus()
    await user.keyboard(' ')
    expect(visual).toBeChecked()
  })

  it('acessibilidade e mobilidade: necessidades opcionais independentes', async () => {
    const user = userEvent.setup()
    await toTravelers(user)
    const group = screen.getByRole('group', { name: /Acessibilidade e mobilidade/ })
    const boxes = within(group).getAllByRole('checkbox')
    expect(boxes).toHaveLength(4)
    boxes.forEach((box) => expect(box).not.toBeChecked())
    await user.click(screen.getByRole('checkbox', { name: /Mobilidade reduzida/ }))
    await user.click(screen.getByRole('checkbox', { name: 'Deficiência auditiva' }))
    expect(screen.getByRole('checkbox', { name: /Mobilidade reduzida/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Deficiência auditiva' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Deficiência visual' })).not.toBeChecked()
  })

  it('preserva tudo ao voltar, alterar datas e destino, e retornar', async () => {
    const user = userEvent.setup()
    await toTravelers(user)
    await user.click(more('adultos'))
    await user.click(more('crianças'))
    await user.click(more('6 a 11 anos'))
    await user.click(more('bebês'))
    await user.click(screen.getByRole('button', { name: /^Família/ }))
    await user.click(screen.getByRole('checkbox', { name: /Evitar escadas/ }))

    // Volta às datas e altera.
    await user.click(screen.getByRole('button', { name: 'Voltar para Datas' }))
    expect(await screen.findByRole('heading', { name: 'Quando começa sua aventura?' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: '10 dias' }))
    // Volta ao destino e troca.
    await user.click(screen.getByRole('button', { name: 'Voltar para Destino' }))
    const rio = (await screen.findByRole('heading', { name: 'Rio de Janeiro' })).closest('article') as HTMLElement
    await user.click(within(rio).getByRole('button', { name: 'Selecionar destino' }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Datas' }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Viajantes' }))

    expect(value('Adultos')).toBe('2')
    expect(value('Crianças')).toBe('1')
    expect(value('Bebês')).toBe('1')
    expect(value('6 a 11 anos')).toBe('1')
    expect(screen.getByRole('button', { name: /^Família/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('checkbox', { name: /Evitar escadas/ })).toBeChecked()
    expect(summary()).toHaveTextContent('Destino selecionado: Rio de Janeiro')
    expect(summary()).toHaveTextContent('Duração: 10 dias')
    expect(summary()).toHaveTextContent('Viajantes: 2 adultos, 1 criança, 1 bebê')
  })

  it('o resumo só mostra viajantes depois que a etapa foi visitada, e mantém ao voltar', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('link', { name: 'Planejar minha viagem' }))
    expect(summary()).not.toHaveTextContent('Viajantes')
    const card = (await screen.findByRole('heading', { name: 'Lisboa' })).closest('article') as HTMLElement
    await user.click(within(card).getByRole('button', { name: 'Selecionar destino' }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Datas' }))
    expect(summary()).not.toHaveTextContent('Viajantes')
    await user.click(screen.getByRole('radio', { name: /Ainda não defini/ }))
    await user.click(screen.getByRole('button', { name: '5 dias' }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Viajantes' }))
    await user.click(screen.getByRole('button', { name: 'Voltar para Datas' }))
    expect(summary()).toHaveTextContent('Viajantes: 1 adulto')
  })

  it('o grupo e o restante do planejamento chegam à revisão e nada vai ao armazenamento', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const user = userEvent.setup()
    await toTravelers(user, 'Rio de Janeiro')
    await user.click(more('adultos'))
    await user.click(screen.getByRole('button', { name: 'Continuar para Transporte' }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Interesses' }))
    await user.click(screen.getByRole('button', { name: /^Cultura/ }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Orçamento' }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Revisão' }))
    expect(screen.getByRole('region', { name: 'Viajantes' })).toHaveTextContent('2 adultos')
    expect(screen.getByRole('region', { name: 'Destino' })).toHaveTextContent('Rio de Janeiro')
    expect(screen.getByRole('region', { name: 'Datas e duração' })).toHaveTextContent('7 dias')
    expect(setItem).not.toHaveBeenCalled()
    expect(localStorage.length).toBe(0)
  })

})
