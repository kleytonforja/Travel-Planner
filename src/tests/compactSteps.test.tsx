import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App'
import { Disclosure } from '../components/ui/Disclosure'
import { driveWizardToReview } from './helpers/wizardDriver'

// Percorrem várias etapas com user-event; o limite padrão de 5 s é curto sob carga.
vi.setConfig({ testTimeout: 20000 })

type User = ReturnType<typeof userEvent.setup>

async function reach(user: User, step: 'Datas' | 'Viajantes' | 'Transporte' | 'Interesses' | 'Orçamento') {
  render(<App />)
  await user.click(screen.getByRole('link', { name: 'Planejar minha viagem' }))
  const card = (await screen.findByRole('heading', { name: 'Lisboa' })).closest('article') as HTMLElement
  await user.click(within(card).getByRole('button', { name: 'Selecionar destino' }))
  const order = ['Datas', 'Viajantes', 'Transporte', 'Interesses', 'Orçamento']
  for (const name of order) {
    await user.click(screen.getByRole('button', { name: `Continuar para ${name}` }))
    if (name === 'Datas') {
      await user.click(screen.getByRole('radio', { name: /Ainda não defini as datas/ }))
      await user.click(screen.getByRole('button', { name: '5 dias' }))
    }
    if (name === 'Interesses') await user.click(screen.getByRole('button', { name: /^Cultura/ }))
    if (name === step) return
  }
}

const summary = () => screen.getByRole('region', { name: 'Resumo do planejamento' })

describe('Disclosure', () => {
  it('abre e fecha com aria-expanded/aria-controls e mantém o conteúdo montado (nada é apagado)', async () => {
    const user = userEvent.setup()
    render(
      <Disclosure title="Opcional">
        <input aria-label="campo" defaultValue="valor" />
      </Disclosure>,
    )
    const button = screen.getByRole('button', { name: /Opcional/ })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    const panel = document.getElementById(button.getAttribute('aria-controls') as string) as HTMLElement
    expect(panel).toHaveAttribute('hidden')
    expect(screen.queryByRole('textbox', { name: 'campo' })).toBeNull() // fora da árvore de acessibilidade
    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('textbox', { name: 'campo' })).toHaveValue('valor')
    await user.clear(screen.getByRole('textbox', { name: 'campo' }))
    await user.type(screen.getByRole('textbox', { name: 'campo' }), 'novo')
    await user.click(button)
    expect(panel).toHaveAttribute('hidden')
    await user.click(button)
    expect(screen.getByRole('textbox', { name: 'campo' })).toHaveValue('novo') // o texto digitado sobrevive ao recolher
  })

  it('abre sozinho com defaultOpen e funciona por teclado', async () => {
    const user = userEvent.setup()
    render(
      <Disclosure title="Com dados" defaultOpen>
        <p>conteúdo</p>
      </Disclosure>,
    )
    const button = screen.getByRole('button', { name: /Com dados/ })
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(button).toHaveClass('min-h-11') // alvo de toque de 44 px
    await user.tab()
    expect(button).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(button).toHaveAttribute('aria-expanded', 'false')
    await user.keyboard(' ')
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('Destino compacto', () => {
  beforeEach(() => localStorage.clear())

  it('mantém a busca visível, recolhe os filtros e preserva o acesso aos três destinos', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('link', { name: 'Planejar minha viagem' }))
    await screen.findByRole('heading', { name: 'Para onde vamos viajar?' })
    expect(screen.getByRole('searchbox', { name: 'Buscar destino' })).toBeVisible()
    const filters = screen.getByRole('button', { name: 'Filtros' })
    expect(filters).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('group', { name: 'Filtrar destinos' })).toBeNull()
    expect(screen.getAllByRole('article')).toHaveLength(3)
    for (const name of ['Florianópolis', 'Rio de Janeiro', 'Lisboa']) {
      expect(screen.getByRole('heading', { name })).toBeVisible()
    }
    await user.click(filters)
    expect(screen.getByRole('group', { name: 'Filtrar destinos' })).toBeVisible()
  })

  it('os cards usam a variante compacta (foto mais baixa e descrição em até 2 linhas)', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('link', { name: 'Planejar minha viagem' }))
    const article = (await screen.findByRole('heading', { name: 'Lisboa' })).closest('article') as HTMLElement
    expect(article.querySelector('.aspect-\\[4\\/1\\]')).not.toBeNull()
    expect(article.querySelector('p.line-clamp-2')).not.toBeNull()
  })
})

describe('Viajantes: opcionais recolhíveis', () => {
  beforeEach(() => localStorage.clear())

  it('começam recolhidos, abrem sozinhos quando já têm dados e não perdem dados ao recolher', async () => {
    const user = userEvent.setup()
    await reach(user, 'Viajantes')
    const access = screen.getByRole('button', { name: /^Acessibilidade e mobilidade/ })
    expect(access).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('checkbox', { name: 'Deficiência visual' })).toBeNull()
    // Os contadores continuam sempre disponíveis.
    expect(screen.getByRole('button', { name: 'Aumentar adultos' })).toBeVisible()
    await user.click(access)
    await user.click(screen.getByRole('checkbox', { name: 'Deficiência visual' }))
    await user.click(access) // recolhe
    expect(screen.getByRole('button', { name: /^Acessibilidade e mobilidade/ })).toHaveTextContent('1 marcada(s)')

    // Faixas etárias: só existem com crianças; abrem sozinhas quando já informadas.
    await user.click(screen.getByRole('button', { name: 'Aumentar crianças' }))
    const ages = screen.getByRole('button', { name: /^Faixas etárias das crianças/ })
    expect(ages).toHaveAttribute('aria-expanded', 'false')
    await user.click(ages)
    await user.click(screen.getByRole('button', { name: 'Aumentar 6 a 11 anos' }))

    // Sai e volta: ambos abrem sozinhos (têm dados) e os valores continuam lá.
    await user.click(screen.getByRole('button', { name: 'Voltar para Datas' }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Viajantes' }))
    expect(screen.getByRole('button', { name: /^Acessibilidade e mobilidade/ })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('checkbox', { name: 'Deficiência visual' })).toBeChecked()
    expect(screen.getByRole('button', { name: /^Faixas etárias das crianças/ })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByLabelText('6 a 11 anos: 1')).toBeInTheDocument()
  })
})

describe('Transporte compacto', () => {
  beforeEach(() => localStorage.clear())

  it('cards compactos em duas colunas, nomes acessíveis preservados e origem recolhível', async () => {
    const user = userEvent.setup()
    await reach(user, 'Transporte')
    const arrival = within(screen.getByRole('group', { name: 'Como você chegará ao destino?' }))
    expect(arrival.getAllByRole('button').map((b) => b.textContent)).toEqual(['Carro próprio', 'Avião', 'Ônibus', 'Trem', 'Ainda não decidi'])
    arrival.getAllByRole('button').forEach((card) => expect(card).toHaveClass('min-h-14', 'py-2'))
    const grid = arrival.getAllByRole('button')[0].parentElement as HTMLElement
    expect(grid).toHaveClass('grid-cols-2')
    expect(within(screen.getByRole('group', { name: 'Como pretende se locomover durante a viagem?' })).getAllByRole('button')).toHaveLength(7)

    const origin = screen.getByRole('button', { name: 'Informar a cidade de origem (opcional)' })
    expect(origin).toHaveAttribute('aria-expanded', 'false')
    await user.click(origin)
    await user.type(screen.getByLabelText('Cidade de origem (opcional)'), 'Curitiba')
    await user.click(origin) // recolhe sem apagar
    expect(origin).toHaveTextContent('Curitiba')
    await user.click(screen.getByRole('button', { name: 'Voltar para Viajantes' }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Transporte' }))
    expect(screen.getByRole('button', { name: /^Informar a cidade de origem/ })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByLabelText('Cidade de origem (opcional)')).toHaveValue('Curitiba')
  })
})

describe('Interesses compactos', () => {
  beforeEach(() => localStorage.clear())

  it('interesses e ritmo usam cards compactos, com múltipla e única escolha preservadas', async () => {
    const user = userEvent.setup()
    await reach(user, 'Interesses')
    const interests = within(screen.getByRole('group', { name: 'Seus interesses' }))
    const pace = within(screen.getByRole('group', { name: 'Ritmo da viagem' }))
    interests.getAllByRole('button').forEach((card) => expect(card).toHaveClass('min-h-14', 'py-2'))
    pace.getAllByRole('button').forEach((card) => expect(card).toHaveClass('min-h-14', 'py-2'))
    await user.click(interests.getByRole('button', { name: /^Natureza/ }))
    expect(interests.getAllByRole('button').filter((b) => b.getAttribute('aria-pressed') === 'true')).toHaveLength(2) // Cultura + Natureza
    await user.click(pace.getByRole('button', { name: /^Intenso/ }))
    expect(pace.getAllByRole('button').filter((b) => b.getAttribute('aria-pressed') === 'true')).toHaveLength(1)
    // Pelo menos um interesse continua obrigatório.
    await user.click(interests.getByRole('button', { name: /^Cultura/ }))
    await user.click(interests.getByRole('button', { name: /^Natureza/ }))
    expect(screen.getByRole('button', { name: 'Continuar para Orçamento' })).toBeDisabled()
  })
})

describe('Orçamento: controle segmentado', () => {
  beforeEach(() => localStorage.clear())

  it('três segmentos (radio), campo só quando há valor, valor preservado ao alternar', async () => {
    const user = userEvent.setup()
    await reach(user, 'Orçamento')
    const group = within(screen.getByRole('group', { name: 'Orçamento (opcional)' }))
    expect(group.getAllByRole('radio').map((r) => r.closest('label')?.textContent)).toEqual(['Não informar', 'Por pessoa', 'Valor total'])
    expect(group.getByRole('radio', { name: 'Não informar' })).toBeChecked()
    expect(screen.queryByLabelText(/^Valor (total da viagem|por pessoa)/)).toBeNull()
    group.getAllByRole('radio').forEach((r) => expect(r.nextElementSibling).toHaveClass('min-h-11'))

    await user.click(group.getByRole('radio', { name: 'Por pessoa' }))
    await user.type(screen.getByLabelText(/^Valor por pessoa/), '800')
    await user.click(group.getByRole('radio', { name: 'Valor total' }))
    expect(screen.getByLabelText(/^Valor total da viagem/)).toHaveValue('800')
    await user.click(group.getByRole('radio', { name: 'Não informar' }))
    expect(screen.queryByLabelText(/^Valor (total da viagem|por pessoa)/)).toBeNull()
    await user.click(group.getByRole('radio', { name: 'Por pessoa' }))
    expect(screen.getByLabelText(/^Valor por pessoa/)).toHaveValue('800') // o texto foi preservado
    // Teclado: setas entre os segmentos.
    group.getByRole('radio', { name: 'Por pessoa' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(group.getByRole('radio', { name: 'Valor total' })).toBeChecked()
  })

  it('o estilo financeiro usa cards compactos em três colunas e segue de seleção única', async () => {
    const user = userEvent.setup()
    await reach(user, 'Orçamento')
    const style = within(screen.getByRole('group', { name: 'Estilo da viagem' }))
    const cards = style.getAllByRole('button')
    expect(cards).toHaveLength(3)
    cards.forEach((card) => expect(card).toHaveClass('min-h-14', 'py-2'))
    expect(cards[0].parentElement).toHaveClass('grid-cols-3')
    await user.click(style.getByRole('button', { name: /^Confortável/ }))
    expect(cards.filter((b) => b.getAttribute('aria-pressed') === 'true')).toHaveLength(1)
  })
})

describe('Resumo e barra de navegação', () => {
  beforeEach(() => localStorage.clear())

  it('o resumo das etapas 1 a 6 é uma única linha (até duas no celular), sem duplicar parágrafos', async () => {
    const user = userEvent.setup()
    await reach(user, 'Orçamento')
    const region = summary()
    expect(region.querySelectorAll('p')).toHaveLength(1)
    const line = region.querySelector('p') as HTMLElement
    expect(line).toHaveClass('line-clamp-2')
    expect(line.textContent).toContain('Destino selecionado: Lisboa')
    expect(line.textContent).toContain('Duração: 5 dias')
    expect(line.textContent).toContain('Interesses: Cultura')
    expect(line).toHaveAttribute('title', line.textContent as string)
  })

  it('a Revisão mantém o resumo anterior (um parágrafo por item)', async () => {
    const user = userEvent.setup()
    render(<App />)
    await driveWizardToReview(user, { destination: 'Lisboa', days: 2, interests: ['Cultura'], budgetPerPerson: null })
    expect(summary().querySelectorAll('p').length).toBeGreaterThan(3)
  })

  it('há uma única barra de navegação, fixa até 768 px, com um só par de botões', async () => {
    const user = userEvent.setup()
    await reach(user, 'Viajantes')
    const bars = screen.getAllByTestId('barra-navegacao')
    expect(bars).toHaveLength(1)
    expect(bars[0].className).toContain('max-[769px]:fixed')
    expect(bars[0].className).toContain('max-[769px]:bottom-0')
    expect(within(bars[0]).getAllByRole('button')).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: /^Continuar para/ })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: /^Voltar para (?!o início)/ })).toHaveLength(1)
    // Espaço reservado no fim do conteúdo, para a barra não cobrir campos.
    expect(bars[0].parentElement?.className).toContain('max-[769px]:pb-24')
  })

  it('a dica de validação fica dentro da barra (nunca encoberta) e o avanço é liberado ao corrigir', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('link', { name: 'Planejar minha viagem' }))
    await screen.findByRole('heading', { name: 'Para onde vamos viajar?' })
    const bar = screen.getByTestId('barra-navegacao')
    expect(within(bar).getByText('Selecione um destino para continuar.')).toBeInTheDocument()
    expect(within(bar).getByRole('button', { name: 'Continuar para Datas' })).toBeDisabled()
  })

  it('enquanto um campo de texto está em foco a barra deixa de ser fixa (teclado virtual) e volta ao sair', async () => {
    const user = userEvent.setup()
    await reach(user, 'Orçamento')
    await user.click(screen.getByRole('radio', { name: 'Por pessoa' }))
    const bar = () => screen.getByTestId('barra-navegacao')
    expect(bar().className).toContain('max-[769px]:fixed')
    await user.click(screen.getByLabelText(/^Valor por pessoa/))
    expect(bar().className).not.toContain('max-[769px]:fixed')
    await user.click(screen.getByRole('radio', { name: 'Não informar' }))
    // A volta à posição fixa é adiada alguns instantes (evita perder o clique durante o blur).
    expect(bar().className).not.toContain('max-[769px]:fixed')
    await waitFor(() => expect(bar().className).toContain('max-[769px]:fixed'))
  })

  it('a navegação por teclado alcança Voltar e Continuar e ativa com Enter', async () => {
    const user = userEvent.setup()
    await reach(user, 'Viajantes')
    const next = screen.getByRole('button', { name: 'Continuar para Transporte' })
    next.focus()
    expect(next).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('heading', { name: 'Como você pretende viajar?' })).toHaveFocus()
    const back = screen.getByRole('button', { name: 'Voltar para Viajantes' })
    back.focus()
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('heading', { name: 'Quem vai viajar com você?' })).toBeInTheDocument()
  })
})
