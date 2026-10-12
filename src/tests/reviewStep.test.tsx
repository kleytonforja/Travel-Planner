import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App'

// Estes testes percorrem as sete etapas com user-event; medidos em vários segundos sob carga.
vi.setConfig({ testTimeout: 20000 })

type User = ReturnType<typeof userEvent.setup>

interface Options {
  destination?: string
  adults?: number
  budget?: string | null
}

/** Percorre as etapas 1 a 6 e chega à revisão. */
async function toReview(user: User, { destination = 'Rio de Janeiro', adults = 2, budget = '1500' }: Options = {}) {
  render(<App />)
  await user.click(screen.getByRole('link', { name: 'Planejar minha viagem' }))
  const card = (await screen.findByRole('heading', { name: destination })).closest('article') as HTMLElement
  await user.click(within(card).getByRole('button', { name: 'Selecionar destino' }))
  await user.click(screen.getByRole('button', { name: 'Continuar para Datas' }))
  await user.click(screen.getByRole('radio', { name: /Ainda não defini as datas/ }))
  await user.click(screen.getByRole('button', { name: '5 dias' }))
  await user.click(screen.getByRole('button', { name: 'Continuar para Viajantes' }))
  for (let i = 1; i < adults; i += 1) await user.click(screen.getByRole('button', { name: 'Aumentar adultos' }))
  await user.click(screen.getByRole('button', { name: 'Continuar para Transporte' }))
  await user.click(screen.getByRole('button', { name: 'Avião' }))
  await user.click(screen.getByRole('button', { name: 'Caminhada' }))
  await user.click(screen.getByRole('button', { name: 'Continuar para Interesses' }))
  await user.click(screen.getByRole('button', { name: /^Cultura/ }))
  await user.click(screen.getByRole('button', { name: /^Natureza/ }))
  await user.click(screen.getByRole('button', { name: 'Continuar para Orçamento' }))
  if (budget !== null) {
    await user.click(screen.getByRole('button', { name: /^Informar um valor/ }))
    await user.click(screen.getByRole('button', { name: /^Valor por pessoa/ }))
    await user.type(screen.getByLabelText(/^Valor por pessoa/), budget)
  }
  await user.click(screen.getByRole('button', { name: 'Continuar para Revisão' }))
  await screen.findByRole('heading', { name: 'Sua viagem está quase pronta!' })
}

const card = (name: string) => screen.getByRole('region', { name })
const generate = () => screen.getByRole('button', { name: 'Gerar roteiro' })

describe('Etapa 7 — Revisão e geração', () => {
  beforeEach(() => {
    localStorage.clear()
    Element.prototype.scrollIntoView = vi.fn()
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  })

  it('mostra a etapa 7 de 7 com um card para cada parte do planejamento', async () => {
    const user = userEvent.setup()
    await toReview(user)
    expect(screen.getByRole('heading', { name: 'Sua viagem está quase pronta!' })).toHaveFocus()
    expect(screen.getByText('Etapa 7 de 7')).toBeInTheDocument()
    expect(card('Destino')).toHaveTextContent('Rio de Janeiro')
    expect(within(card('Destino')).getByRole('img')).toBeInTheDocument()
    expect(card('Datas e duração')).toHaveTextContent('5 dias')
    expect(card('Datas e duração')).toHaveTextContent('Datas ainda não definidas')
    expect(card('Viajantes')).toHaveTextContent('2 adultos')
    expect(card('Transporte até o destino')).toHaveTextContent('Avião')
    expect(card('Deslocamentos locais')).toHaveTextContent('Caminhada')
    expect(card('Interesses')).toHaveTextContent('Natureza, Cultura')
    expect(card('Ritmo da viagem')).toHaveTextContent('Equilibrado')
    expect(card('Estilo e orçamento')).toHaveTextContent(/Equilibrado; .*1\.500,00.* por pessoa/)
    expect(generate()).toBeEnabled()
  })

  it('declara com honestidade o que o gerador usa e o que ainda não usa', async () => {
    const user = userEvent.setup()
    await toReview(user)
    const note = screen.getByRole('complementary', { name: 'O que o gerador utiliza' })
    expect(note).toHaveTextContent('Destino, duração em dias, interesses, estilo e orçamento por pessoa')
    expect(note).toHaveTextContent(/Ainda não influenciam o roteiro: datas exatas, composição dos viajantes, perfil, acessibilidade, transporte e ritmo/)
    expect(note).toHaveTextContent('não são salvas junto com o roteiro')
    expect(note).toHaveTextContent('estimativas ilustrativas')
  })

  it('"Editar" leva à etapa certa, preserva o resto e "Voltar para a revisão" retorna direto', async () => {
    const user = userEvent.setup()
    await toReview(user)
    await user.click(screen.getByRole('button', { name: 'Editar Viajantes' }))
    expect(await screen.findByRole('heading', { name: 'Quem vai viajar com você?' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Aumentar crianças' }))
    await user.click(screen.getByRole('button', { name: 'Voltar para a revisão' }))
    expect(await screen.findByRole('heading', { name: 'Sua viagem está quase pronta!' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Voltar para a revisão' })).toBeNull()
    expect(card('Viajantes')).toHaveTextContent('2 adultos, 1 criança')
    // O resto continua igual.
    expect(card('Destino')).toHaveTextContent('Rio de Janeiro')
    expect(card('Transporte até o destino')).toHaveTextContent('Avião')
    expect(card('Interesses')).toHaveTextContent('Natureza, Cultura')
    expect(card('Estilo e orçamento')).toHaveTextContent(/1\.500,00/)

    const sections: Array<[string, string]> = [
      ['Editar Destino', 'Para onde vamos viajar?'],
      ['Editar Datas e duração', 'Quando começa sua aventura?'],
      ['Editar Transporte até o destino', 'Como você pretende viajar?'],
      ['Editar Deslocamentos locais', 'Como você pretende viajar?'],
      ['Editar Interesses', 'Que experiências você gostaria de viver?'],
      ['Editar Ritmo da viagem', 'Que experiências você gostaria de viver?'],
      ['Editar Estilo e orçamento', 'Quanto você pretende investir na viagem?'],
    ]
    for (const [button, heading] of sections) {
      await user.click(screen.getByRole('button', { name: button }))
      expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Voltar para a revisão' }))
      await screen.findByRole('heading', { name: 'Sua viagem está quase pronta!' })
    }
  })

  it('alterar a duração e o orçamento na edição reflete na revisão', async () => {
    const user = userEvent.setup()
    await toReview(user)
    await user.click(screen.getByRole('button', { name: 'Editar Datas e duração' }))
    await user.click(screen.getByRole('button', { name: '7 dias' }))
    await user.click(screen.getByRole('button', { name: 'Voltar para a revisão' }))
    expect(card('Datas e duração')).toHaveTextContent('7 dias')

    await user.click(screen.getByRole('button', { name: 'Editar Estilo e orçamento' }))
    await user.click(screen.getByRole('button', { name: /^Valor total da viagem/ }))
    await user.clear(screen.getByLabelText(/^Valor total da viagem/))
    await user.type(screen.getByLabelText(/^Valor total da viagem/), '1000')
    await user.click(screen.getByRole('button', { name: 'Voltar para a revisão' }))
    expect(card('Estilo e orçamento')).toHaveTextContent(/total de .*1\.000,00.*500,00.* por pessoa/)
    expect(screen.getByRole('complementary', { name: 'O que o gerador utiliza' })).toHaveTextContent(/500,00.*dividido igualmente/)
  })

  it('gera o roteiro direto pelo fluxo e abre a página de resultado atual', async () => {
    const user = userEvent.setup()
    await toReview(user)
    await user.click(generate())
    expect(await screen.findByRole('button', { name: 'Salvar roteiro' })).toBeInTheDocument()
    // O roteiro reflete 5 dias (o motor recebeu a duração do fluxo).
    expect(screen.getAllByText(/^Dia \d/).length).toBeGreaterThanOrEqual(5)
    // Salvar e exportar usam o serviço existente, sem alteração (verificados no Chromium).
    expect(screen.getByRole('button', { name: /Exportar/ })).toBeInTheDocument()
  })

  it('sem orçamento a revisão permite gerar, mostra "Orçamento não informado" e não inventa saldo', async () => {
    const user = userEvent.setup()
    await toReview(user, { budget: null })
    expect(card('Estilo e orçamento')).toHaveTextContent('Orçamento não informado')
    expect(card('Estilo e orçamento')).not.toHaveTextContent(/R\$|€|saldo/i)
    expect(generate()).toBeEnabled()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByRole('complementary', { name: 'O que o gerador utiliza' })).toHaveTextContent(/Sem orçamento informado, o roteiro não tem teto de custo/)
    await user.click(generate())
    expect(await screen.findByRole('button', { name: 'Salvar roteiro' })).toBeInTheDocument()
    expect(screen.getAllByText('Orçamento não informado').length).toBeGreaterThanOrEqual(2) // resumo da viagem e resumo financeiro
    expect(screen.queryByText('Saldo não alocado')).toBeNull()
    expect(screen.getAllByText(/Custo estimado das atividades/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/ilimitado/i)).toBeNull()
  })

  it('orçamento digitado e inválido continua bloqueando a geração, com atalho de correção', async () => {
    const user = userEvent.setup()
    await toReview(user, { budget: null })
    await user.click(screen.getByRole('button', { name: 'Editar Estilo e orçamento' }))
    await user.click(screen.getByRole('button', { name: /^Informar um valor/ }))
    await user.click(screen.getByRole('button', { name: /^Valor por pessoa/ }))
    await user.type(screen.getByLabelText(/^Valor por pessoa/), '0')
    // O próprio passo bloqueia o avanço, mas a revisão acessível por "Voltar para a revisão" também recusa.
    await user.click(screen.getByRole('button', { name: 'Voltar para a revisão' }))
    expect(generate()).toBeDisabled()
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Corrija o valor do orçamento')
    await user.click(within(alert).getByRole('button', { name: 'Corrigir' }))
    await user.clear(screen.getByLabelText(/^Valor por pessoa/))
    await user.type(screen.getByLabelText(/^Valor por pessoa/), '900')
    await user.click(screen.getByRole('button', { name: 'Voltar para a revisão' }))
    expect(generate()).toBeEnabled()
  })

  it('volta pela navegação padrão e preserva tudo', async () => {
    const user = userEvent.setup()
    await toReview(user)
    await user.click(screen.getByRole('button', { name: 'Voltar para Orçamento' }))
    expect(screen.getByLabelText(/^Valor por pessoa/)).toHaveValue('1500')
    await user.click(screen.getByRole('button', { name: 'Continuar para Revisão' }))
    expect(card('Estilo e orçamento')).toHaveTextContent(/1\.500,00/)
  })

  it('não há mais acesso ao formulário tradicional', async () => {
    const user = userEvent.setup()
    await toReview(user)
    expect(screen.queryByText(/formulário tradicional/i)).toBeNull()
    expect(screen.queryByRole('button', { name: /formulário tradicional/i })).toBeNull()
    expect(document.getElementById('destino')).toBeNull()
  })

  it('nada é gravado no armazenamento antes de salvar o roteiro', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const user = userEvent.setup()
    await toReview(user)
    expect(setItem).not.toHaveBeenCalled()
  })
})
