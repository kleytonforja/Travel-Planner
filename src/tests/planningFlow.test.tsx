import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentType } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App'
import { DestinationStep } from '../components/planning/DestinationStep'
import { PlanningFlow } from '../components/planning/PlanningFlow'
import {
  EMPTY_DRAFT,
  isStepImplemented,
  PLANNING_STEPS,
  type StepProps,
  type StepRegistry,
} from '../components/planning/planningSteps'
import { STEP_REGISTRY } from '../components/planning/stepRegistry'
import { destinations } from '../data/destinations'
import { DESTINATION_PHOTOS } from '../data/photos'

/**
 * Planejamento progressivo (V1-T3.1): estrutura de sete etapas, indicador de
 * progresso e etapa de destino, integrados à navegação do aplicativo.
 */

const scrollIntoView = vi.fn()

function openPlanning() {
  render(<App />)
  return userEvent.setup()
}

async function goToPlanning(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('link', { name: 'Planejar minha viagem' }))
  await screen.findByRole('heading', { name: 'Para onde vamos viajar?' })
}

const cards = () => screen.getAllByRole('article')
const cardOf = (name: string) =>
  screen.getByRole('heading', { name }).closest('article') as HTMLElement

describe('Planejamento progressivo — estrutura', () => {
  it('declara as sete etapas previstas, na ordem', () => {
    expect(PLANNING_STEPS.map((step) => step.label)).toEqual([
      'Destino',
      'Datas',
      'Viajantes',
      'Transporte',
      'Interesses',
      'Orçamento',
      'Revisão',
    ])
    expect(new Set(PLANNING_STEPS.map((step) => step.id)).size).toBe(7)
  })

  it('as sete etapas do planejamento estão implementadas', () => {
    expect(isStepImplemented('revisao', STEP_REGISTRY)).toBe(true)
    expect(isStepImplemented('orcamento', STEP_REGISTRY)).toBe(true)
    expect(Object.keys(STEP_REGISTRY)).toEqual(['destino', 'datas', 'viajantes', 'transporte', 'interesses', 'orcamento', 'revisao'])
    expect(isStepImplemented('interesses', STEP_REGISTRY)).toBe(true)
    expect(isStepImplemented('transporte', STEP_REGISTRY)).toBe(true)
    expect(isStepImplemented('viajantes', STEP_REGISTRY)).toBe(true)
    expect(isStepImplemented('destino', STEP_REGISTRY)).toBe(true)
    expect(isStepImplemented('datas', STEP_REGISTRY)).toBe(true)
    expect(PLANNING_STEPS.every((step) => isStepImplemented(step.id, STEP_REGISTRY))).toBe(true)
  })

  it('aceita novas etapas pelo registro, sem reescrever o fluxo', () => {
    const Dates: ComponentType<StepProps> = () => <p>Etapa de datas (teste)</p>
    const onlyDestination: StepRegistry = { destino: DestinationStep }
    const withDates: StepRegistry = { destino: DestinationStep, datas: Dates }
    const onDraftChange = vi.fn()
    const { rerender } = render(
      <PlanningFlow
        draft={EMPTY_DRAFT}
        onDraftChange={onDraftChange}
        registry={onlyDestination}
      />,
    )
    // Sem a etapa seguinte registrada, aparece o aviso e não há "Continuar".
    expect(screen.getByRole('complementary', { name: 'Próximas etapas' })).toHaveTextContent(
      'Datas, Viajantes, Transporte, Interesses, Orçamento, Revisão',
    )
    expect(screen.queryByRole('button', { name: /^Continuar para/ })).toBeNull()
    rerender(
      <PlanningFlow
        draft={EMPTY_DRAFT}
        onDraftChange={onDraftChange}
        registry={withDates}
      />,
    )
    // Com a etapa seguinte registrada, o aviso some e surge "Continuar para Datas".
    expect(screen.queryByRole('complementary', { name: 'Próximas etapas' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Continuar para Datas' })).toBeDisabled()
  })
})

describe('Planejamento progressivo — navegação e etapa de destino', () => {
  beforeEach(() => {
    localStorage.clear()
    Element.prototype.scrollIntoView = scrollIntoView
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  })

  afterEach(() => {
    scrollIntoView.mockClear()
    vi.restoreAllMocks()
  })

  it('o botão principal do hero abre o planejamento, com indicador de sete etapas', async () => {
    const user = openPlanning()
    await goToPlanning(user)

    const list = screen.getByRole('list', { name: 'Progresso do planejamento' })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(7)
    expect(items[0]).toHaveAttribute('aria-current', 'step')
    expect(items[0]).toHaveTextContent('Destino (etapa atual)')
    expect(items[1]).toHaveTextContent('Datas (pendente)')
    expect(items[6]).toHaveTextContent('Revisão (pendente)')
    expect(screen.getByText('Etapa 1 de 7')).toBeInTheDocument()
    // O indicador é apenas informativo: nenhum controle falso.
    expect(within(list).queryByRole('button')).toBeNull()
    expect(within(list).queryByRole('link')).toBeNull()
  })

  it('apresenta a pergunta, a pesquisa e os cards fotográficos com categorias', async () => {
    const user = openPlanning()
    await goToPlanning(user)

    expect(screen.getByRole('searchbox', { name: 'Buscar destino' })).toBeInTheDocument()
    expect(cards()).toHaveLength(3)
    for (const destination of destinations) {
      const card = cardOf(destination.name)
      expect(within(card).getByRole('img', { name: DESTINATION_PHOTOS[destination.id].alt })).toBeInTheDocument()
      expect(card).toHaveTextContent(destination.country)
      expect(card).toHaveTextContent(`${destination.activities.length} atrações`)
      expect(
        within(card).getByRole('list', { name: `Categorias disponíveis em ${destination.name}` }),
      ).toBeInTheDocument()
    }
    expect(screen.getByRole('status')).toHaveTextContent('3 destinos encontrados.')
  })

  it('pesquisa e filtra os destinos com retorno acessível', async () => {
    const user = openPlanning()
    await goToPlanning(user)
    const search = screen.getByRole('searchbox', { name: 'Buscar destino' })

    await user.type(search, 'LISBOA')
    expect(cards()).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent('1 destino encontrado.')
    expect(within(cards()[0]).getByRole('heading', { name: 'Lisboa' })).toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'xyz')
    expect(screen.queryAllByRole('article')).toHaveLength(0)
    expect(screen.getByRole('status')).toHaveTextContent('Nenhum destino encontrado para a sua busca.')

    await user.click(screen.getByRole('button', { name: 'Limpar pesquisa e filtros' }))
    expect(cards()).toHaveLength(3)
    expect(search).toHaveValue('')
  })

  it('os filtros por país e categoria usam aria-pressed e podem ser combinados com a pesquisa', async () => {
    const user = openPlanning()
    await goToPlanning(user)
    const group = screen.getByRole('group', { name: 'Filtrar destinos' })
    const todos = within(group).getByRole('button', { name: 'Todos' })
    const portugal = within(group).getByRole('button', { name: 'Portugal' })
    const brasil = within(group).getByRole('button', { name: 'Brasil' })
    expect(todos).toHaveAttribute('aria-pressed', 'true')

    await user.click(portugal)
    expect(portugal).toHaveAttribute('aria-pressed', 'true')
    expect(todos).toHaveAttribute('aria-pressed', 'false')
    expect(cards()).toHaveLength(1)

    await user.click(brasil)
    expect(cards()).toHaveLength(2)
    await user.type(screen.getByRole('searchbox'), 'rio')
    expect(cards()).toHaveLength(1)
    expect(within(cards()[0]).getByRole('heading', { name: 'Rio de Janeiro' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Limpar pesquisa e filtros' }))
    expect(todos).toHaveAttribute('aria-pressed', 'true')
    expect(cards()).toHaveLength(3)
  })

  it('diferencia os filtros de localização dos de categoria e informa que eles filtram destinos', async () => {
    const user = openPlanning()
    await goToPlanning(user)

    const location = screen.getByRole('group', { name: 'Localização' })
    const category = screen.getByRole('group', { name: 'Categorias dos destinos' })
    expect(within(location).getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Todos',
      'Brasil',
      'Portugal',
    ])
    const categoryLabels = within(category).getAllByRole('button').map((b) => b.textContent)
    expect(categoryLabels).toContain('Cultura')
    expect(categoryLabels).toContain('Vida noturna')
    expect(categoryLabels).not.toContain('Brasil')
    // Ícones diferentes por grupo, decorativos para leitores de tela.
    expect(location.querySelectorAll('button svg').length).toBe(3)
    for (const button of within(category).getAllByRole('button')) {
      expect(button.querySelector('span[aria-hidden="true"] svg')).not.toBeNull()
    }
    expect(screen.getByText(/Estes controles apenas filtram os destinos listados abaixo/)).toBeInTheDocument()
    expect(screen.getByText(/interesses de viagem serão escolhidos em uma etapa própria/)).toBeInTheDocument()
  })

  it('os filtros não são seleção múltipla de interesses: escolher outro substitui o anterior', async () => {
    const user = openPlanning()
    await goToPlanning(user)
    const cultura = within(screen.getByRole('group', { name: 'Categorias dos destinos' })).getByRole('button', { name: 'Cultura' })
    const natureza = within(screen.getByRole('group', { name: 'Categorias dos destinos' })).getByRole('button', { name: 'Natureza' })
    await user.click(cultura)
    await user.click(natureza)
    expect(cultura).toHaveAttribute('aria-pressed', 'false')
    expect(natureza).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1)
    // Filtrar não seleciona destino nem altera o rascunho.
    expect(screen.queryByRole('button', { name: 'Destino selecionado' })).toBeNull()
  })

  it('seleciona por mouse e por teclado (Enter e Espaço) e destaca o destino escolhido', async () => {
    const user = openPlanning()
    await goToPlanning(user)

    await user.click(within(cardOf('Florianópolis')).getByRole('button', { name: 'Selecionar destino' }))
    expect(within(cardOf('Florianópolis')).getByRole('button', { name: 'Destino selecionado' })).toBeInTheDocument()
    expect(cardOf('Florianópolis')).toHaveClass('border-brand-600')
    expect(screen.getByRole('region', { name: 'Resumo do planejamento' })).toHaveTextContent(
      'Destino selecionado: Florianópolis',
    )

    const rio = within(cardOf('Rio de Janeiro')).getByRole('button', { name: 'Selecionar destino' })
    rio.focus()
    await user.keyboard('{Enter}')
    expect(cardOf('Rio de Janeiro')).toHaveClass('border-brand-600')
    // Somente um destino fica selecionado.
    expect(cardOf('Florianópolis')).not.toHaveClass('border-brand-600')

    const lisboa = within(cardOf('Lisboa')).getByRole('button', { name: 'Selecionar destino' })
    lisboa.focus()
    await user.keyboard(' ')
    expect(cardOf('Lisboa')).toHaveClass('border-brand-600')
    expect(screen.getByRole('region', { name: 'Resumo do planejamento' })).toHaveTextContent(
      'Destino selecionado: Lisboa',
    )
  })

  it('sem destino, "Continuar para Datas" fica desabilitado e explicado', async () => {
    const user = openPlanning()
    await goToPlanning(user)
    const next = screen.getByRole('button', { name: 'Continuar para Datas' })
    expect(next).toBeDisabled()
    expect(screen.getByText('Selecione um destino para continuar.')).toBeInTheDocument()
    // O formulário tradicional só é oferecido depois da última etapa disponível.
    expect(screen.queryByRole('button', { name: 'Continuar com o formulário tradicional' })).toBeNull()

    await user.click(within(cardOf('Lisboa')).getByRole('button', { name: 'Selecionar destino' }))
    expect(next).toBeEnabled()
    expect(screen.queryByText('Selecione um destino para continuar.')).toBeNull()
  })

  it('não oferece controles de etapas inexistentes', { timeout: 20000 }, async () => {
    const user = openPlanning()
    await goToPlanning(user)
    // Etapa 1: só existe o avanço para a etapa 2, que está implementada.
    expect(screen.getAllByRole('button', { name: /^Continuar para/ }).map((b) => b.textContent)).toEqual(['Continuar para Datas'])
    expect(screen.queryByRole('complementary', { name: 'Próximas etapas' })).toBeNull()

    await user.click(within(cardOf('Lisboa')).getByRole('button', { name: 'Selecionar destino' }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Datas' }))
    await screen.findByRole('heading', { name: 'Quando começa sua aventura?' })
    expect(screen.getAllByRole('button', { name: /^Continuar para/ }).map((b) => b.textContent)).toEqual(['Continuar para Viajantes'])
    await user.click(screen.getByRole('radio', { name: /Ainda não defini as datas/ }))
    await user.click(screen.getByRole('button', { name: '5 dias' }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Viajantes' }))
    await screen.findByRole('heading', { name: 'Quem vai viajar com você?' })
    expect(screen.getAllByRole('button', { name: /^Continuar para/ }).map((b) => b.textContent)).toEqual(['Continuar para Transporte'])
    await user.click(screen.getByRole('button', { name: 'Continuar para Transporte' }))
    await screen.findByRole('heading', { name: 'Como você pretende viajar?' })
    expect(screen.getAllByRole('button', { name: /^Continuar para/ }).map((b) => b.textContent)).toEqual(['Continuar para Interesses'])
    await user.click(screen.getByRole('button', { name: 'Continuar para Interesses' }))
    await screen.findByRole('heading', { name: 'Que experiências você gostaria de viver?' })
    await user.click(screen.getByRole('button', { name: /^Cultura/ }))
    expect(screen.getAllByRole('button', { name: /^Continuar para/ }).map((b) => b.textContent)).toEqual(['Continuar para Orçamento'])
    await user.click(screen.getByRole('button', { name: 'Continuar para Orçamento' }))
    await screen.findByRole('heading', { name: 'Quanto você pretende investir na viagem?' })
    expect(screen.getAllByRole('button', { name: /^Continuar para/ }).map((b) => b.textContent)).toEqual(['Continuar para Revisão'])
    await user.click(screen.getByRole('button', { name: 'Continuar para Revisão' }))
    await screen.findByRole('heading', { name: 'Sua viagem está quase pronta!' })
    // Etapa 7: última etapa; não há avanço, aviso de etapas pendentes nem formulário antigo.
    expect(screen.queryByRole('button', { name: /^Continuar para/ })).toBeNull()
    expect(screen.queryByRole('complementary', { name: 'Próximas etapas' })).toBeNull()
    expect(screen.queryByText(/formulário tradicional/i)).toBeNull()
    expect(screen.getByRole('button', { name: 'Gerar roteiro' })).toBeDisabled()
  })

  it('preserva a seleção ao voltar para a home e ao retornar ao planejamento', async () => {
    const user = openPlanning()
    await goToPlanning(user)
    await user.click(within(cardOf('Lisboa')).getByRole('button', { name: 'Selecionar destino' }))

    await user.click(screen.getByRole('button', { name: 'Voltar para o início' }))
    // Home: cartão de Lisboa continua selecionado.
    const destinosHome = screen.getByRole('region', { name: 'Destinos em destaque' })
    expect(within(destinosHome).getByRole('button', { name: 'Destino selecionado' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Planejar minha viagem' }))
    await screen.findByRole('heading', { name: 'Para onde vamos viajar?' })
    expect(cardOf('Lisboa')).toHaveClass('border-brand-600')
    expect(within(cardOf('Lisboa')).getByRole('button', { name: 'Destino selecionado' })).toBeInTheDocument()
  })

  it('escolher um destino na home abre o planejamento com ele já selecionado', async () => {
    const user = openPlanning()
    const destinosHome = screen.getByRole('region', { name: 'Destinos em destaque' })
    await user.click(within(destinosHome).getAllByRole('button', { name: 'Planejar este destino' })[1])
    await screen.findByRole('heading', { name: 'Para onde vamos viajar?' })
    expect(cardOf('Rio de Janeiro')).toHaveClass('border-brand-600')
  })

  it('o logotipo do cabeçalho também volta para a home', async () => {
    const user = openPlanning()
    await goToPlanning(user)
    await user.click(screen.getByRole('link', { name: 'Travel Planner' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Viagens incríveis começam com boas escolhas.')
  })

  it('o planejamento é o único caminho: o formulário tradicional não existe mais e o roteiro sai da revisão', { timeout: 20000 }, async () => {
    const user = openPlanning()
    // Na home não há formulário nem campos de planejamento.
    expect(document.getElementById('destino')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Gerar roteiro' })).toBeNull()
    expect(screen.queryByText(/formulário tradicional/i)).toBeNull()
    await goToPlanning(user)
    await user.click(within(cardOf('Rio de Janeiro')).getByRole('button', { name: 'Selecionar destino' }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Datas' }))
    await user.click(screen.getByRole('radio', { name: /Ainda não defini as datas/ }))
    await user.click(screen.getByRole('button', { name: '5 dias' }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Viajantes' }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Transporte' }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Interesses' }))
    await user.click(screen.getByRole('button', { name: /^Cultura/ }))
    await user.click(screen.getByRole('button', { name: 'Continuar para Orçamento' }))
    await user.click(screen.getByRole('button', { name: /^Informar um valor/ }))
    await user.click(screen.getByRole('button', { name: /^Valor por pessoa/ }))
    await user.type(screen.getByLabelText(/^Valor por pessoa/), '800')
    await user.click(screen.getByRole('button', { name: 'Continuar para Revisão' }))
    await user.click(screen.getByRole('button', { name: 'Gerar roteiro' }))
    expect(await screen.findByRole('button', { name: 'Salvar roteiro' })).toBeInTheDocument()
  })
})
