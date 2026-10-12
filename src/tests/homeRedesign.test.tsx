import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { destinations } from '../data/destinations'
import { INTEREST_LABELS } from '../data/labels'
import { DESTINATION_PHOTOS, HERO_PHOTO } from '../data/photos'
import { HomePage } from '../pages/HomePage'
import { STORAGE_KEY } from '../services/itineraryStorage'
import type { InterestCategory } from '../types'
import { buildHistoricalValidRecord } from './fixtures/savedItineraries'
import {
  installWebLocksMock,
  uninstallWebLocksMock,
} from './helpers/webLocksMock'

/**
 * Nova home (V1-T2): estrutura da referência visual, destinos com
 * ilustração e indicadores de categoria, e preservação das ações existentes.
 */

// Em produção a base é /Travel-Planner/ (conferida no Chromium); nos testes vem do Vite.
const BASE = import.meta.env.BASE_URL

function renderHome() {
  const onOpenSaved = vi.fn()
  const onStartPlanning = vi.fn()
  render(<HomePage onOpenSaved={onOpenSaved} onStartPlanning={onStartPlanning} />)
  return { onOpenSaved, onStartPlanning }
}

describe('Nova home — estrutura e acessibilidade', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    uninstallWebLocksMock()
    vi.restoreAllMocks()
  })

  it('exibe cabeçalho escuro com navegação e o hero com mensagem e chamadas para ação', () => {
    renderHome()

    const nav = screen.getByRole('navigation', { name: 'Navegação principal' })
    for (const [label, href] of [
      ['Planejar', '#planejar'],
      ['Roteiros salvos', '#roteiros-salvos'],
      ['Destinos', '#destinos'],
      ['Como funciona', '#como-funciona'],
    ]) {
      expect(within(nav).getByRole('link', { name: label })).toHaveAttribute('href', href)
    }
    expect(screen.getByRole('banner')).toHaveClass('bg-night-950')

    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent('Viagens incríveis começam com boas escolhas.')
    expect(screen.getByRole('link', { name: 'Planejar minha viagem' })).toHaveAttribute('href', '#planejar')
    expect(screen.getByRole('link', { name: 'Explorar destinos' })).toHaveAttribute('href', '#destinos')
  })

  it('os destaques do hero descrevem apenas recursos que existem', () => {
    renderHome()
    const hero = document.getElementById('inicio')!
    expect(hero).toHaveTextContent('Roteiro por dia')
    expect(hero).toHaveTextContent('Estimativa de custos')
    expect(hero).toHaveTextContent('Exportar e importar')
    expect(hero).toHaveTextContent('Dados no navegador')
    // Recursos futuros da referência não são prometidos.
    expect(hero).not.toHaveTextContent(/mapa|offline|fotos|rotas/i)
  })

  it('o hero usa a fotografia priorizada, com dimensões declaradas, texto alternativo e caminho derivado da base do Vite', () => {
    renderHome()
    const hero = document.getElementById('inicio')!
    const photo = within(hero).getByRole('img', { name: HERO_PHOTO.alt })
    expect(photo).toHaveAttribute('fetchpriority', 'high')
    expect(photo).not.toHaveAttribute('loading', 'lazy')
    expect(photo).toHaveAttribute('width', '1920')
    expect(photo).toHaveAttribute('height', '1280')
    expect(photo.getAttribute('src')).toBe(`${BASE}images/hero/rio-de-janeiro-hero-1920.webp`)
    expect(photo.getAttribute('srcset')).toContain(`${BASE}images/hero/rio-de-janeiro-hero-960.webp 960w`)
    expect(photo.getAttribute('srcset')).toContain('rio-de-janeiro-hero-1920.webp 1920w')
  })

  it('se a fotografia do hero falhar, a ilustração original entra como substituta (decorativa)', () => {
    renderHome()
    const hero = document.getElementById('inicio')!
    fireEvent.error(within(hero).getByRole('img', { name: HERO_PHOTO.alt }))
    expect(within(hero).queryByRole('img')).toBeNull()
    expect(hero.querySelectorAll('svg[aria-hidden="true"]').length).toBeGreaterThan(0)
  })

  it('o painel "Destinos em destaque" lista os destinos da base com fotografia, atrações e categorias', () => {
    renderHome()
    const section = screen.getByRole('region', { name: 'Destinos em destaque' })
    expect(section).toHaveAttribute('id', 'destinos')
    expect(within(section).getAllByRole('article')).toHaveLength(destinations.length)

    for (const destination of destinations) {
      const card = within(section).getByRole('heading', { name: destination.name }).closest('article')!
      // Fotografia com texto alternativo, carregamento preguiçoso e proporção reservada.
      const photo = within(card).getByRole('img', { name: DESTINATION_PHOTOS[destination.id].alt })
      expect(photo).toHaveAttribute('loading', 'lazy')
      expect(photo).toHaveAttribute('width', '1200')
      expect(photo).toHaveAttribute('height', '675')
      expect(photo.getAttribute('src')).toBe(`${BASE}images/destinations/${destination.id}-1200.webp`)
      expect(photo.getAttribute('srcset')).toContain(`${destination.id}-640.webp 640w`)
      // Informações básicas do catálogo.
      expect(card).toHaveTextContent(destination.country)
      expect(card).toHaveTextContent(`${destination.currency.code} (${destination.currency.symbol})`)
      expect(card).toHaveTextContent(`${destination.activities.length} atrações`)
      // Indicadores coloridos de categoria, com nome acessível.
      const categories = [
        ...new Set(destination.activities.flatMap((a) => a.categories as InterestCategory[])),
      ]
      const list = within(card).getByRole('list', {
        name: `Categorias disponíveis em ${destination.name}`,
      })
      for (const category of categories) {
        expect(within(list).getByRole('img', { name: INTEREST_LABELS[category] })).toBeInTheDocument()
      }
    }
    expect(section).toHaveTextContent('valores ilustrativos')
    expect(section).toHaveTextContent('fotografias são do Unsplash')
  })

  it('se a fotografia de um destino falhar, o card exibe a ilustração original com texto alternativo', () => {
    renderHome()
    const section = screen.getByRole('region', { name: 'Destinos em destaque' })
    const card = within(section).getByRole('heading', { name: 'Lisboa' }).closest('article')!
    fireEvent.error(within(card).getByRole('img', { name: DESTINATION_PHOTOS.lisboa.alt }))
    expect(within(card).getByRole('img', { name: 'Ilustração de Lisboa' })).toBeInTheDocument()
    // Os demais cards continuam com fotografia.
    const rio = within(section).getByRole('heading', { name: 'Rio de Janeiro' }).closest('article')!
    expect(within(rio).getByRole('img', { name: DESTINATION_PHOTOS['rio-de-janeiro'].alt })).toBeInTheDocument()
  })

  it('todas as fotografias têm crédito com fotógrafo e página de origem, exibidos no rodapé', () => {
    renderHome()
    const footer = screen.getByRole('contentinfo')
    for (const photo of [HERO_PHOTO, ...Object.values(DESTINATION_PHOTOS)]) {
      const link = within(footer).getByRole('link', { name: photo.credit.photographer })
      expect(link).toHaveAttribute('href', photo.credit.sourceUrl)
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(photo.credit.photographerUrl.startsWith('https://unsplash.com/@')).toBe(true)
    }
    expect(within(footer).getByRole('link', { name: 'Unsplash' })).toHaveAttribute('href', 'https://unsplash.com/license')
  })

  it('a ordem da página segue a referência: hero, destinos, formulário e roteiros salvos', () => {
    renderHome()
    const ids = ['inicio', 'destinos', 'planejar', 'roteiros-salvos', 'importar-roteiro', 'como-funciona']
    const positions = ids.map((id) => {
      const element = document.getElementById(id)
      expect(element, id).not.toBeNull()
      return element!
    })
    for (let index = 1; index < positions.length; index += 1) {
      expect(
        positions[index - 1].compareDocumentPosition(positions[index]) &
          Node.DOCUMENT_POSITION_FOLLOWING,
        `${ids[index - 1]} antes de ${ids[index]}`,
      ).toBeTruthy()
    }
  })
})

describe('Nova home — ações preservadas', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    uninstallWebLocksMock()
    vi.restoreAllMocks()
  })

  it('escolher um destino marca o card e abre o planejamento progressivo', async () => {
    const user = userEvent.setup()
    const { onStartPlanning } = renderHome()
    const section = screen.getByRole('region', { name: 'Destinos em destaque' })

    await user.click(within(section).getAllByRole('button', { name: 'Planejar este destino' })[2])

    expect(onStartPlanning).toHaveBeenCalledTimes(1)
    expect(within(section).getByRole('button', { name: 'Destino selecionado' })).toBeInTheDocument()
    expect(within(section).getAllByRole('button', { name: 'Planejar este destino' })).toHaveLength(
      destinations.length - 1,
    )
  })

  it('a seção "Planeje sua viagem" substitui o formulário e inicia o planejamento', async () => {
    const user = userEvent.setup()
    const { onStartPlanning } = renderHome()
    const section = document.getElementById('planejar') as HTMLElement
    expect(within(section).getByRole('heading', { name: 'Planeje sua viagem' })).toBeInTheDocument()
    expect(document.getElementById('destino')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Gerar roteiro' })).toBeNull()
    await user.click(within(section).getByRole('button', { name: 'Começar o planejamento' }))
    expect(onStartPlanning).toHaveBeenCalledTimes(1)
  })

  it('os botões de destino são alcançáveis pelo teclado e acionáveis com Enter', async () => {
    const user = userEvent.setup()
    renderHome()
    const first = within(screen.getByRole('region', { name: 'Destinos em destaque' })).getAllByRole(
      'button',
      { name: 'Planejar este destino' },
    )[0]
    first.focus()
    expect(first).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(
      within(screen.getByRole('region', { name: 'Destinos em destaque' })).getByRole('button', {
        name: 'Destino selecionado',
      }),
    ).toBeInTheDocument()
  })

  it('o primeiro item focável é o link "Pular para o conteúdo"', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveFocus()
  })

  it('mantém roteiros salvos, importação e exclusão funcionando na nova ordem', async () => {
    const user = userEvent.setup()
    localStorage.setItem(STORAGE_KEY, JSON.stringify([buildHistoricalValidRecord()]))
    const { onOpenSaved } = renderHome()

    const saved = screen.getByRole('region', { name: 'Meus roteiros salvos' })
    expect(screen.getByRole('region', { name: 'Importar roteiro' })).toBeInTheDocument()

    await user.click(within(saved).getByRole('button', { name: 'Abrir' }))
    expect(onOpenSaved).toHaveBeenCalledTimes(1)

    await user.click(within(saved).getByRole('button', { name: 'Excluir roteiro de Florianópolis' }))
    expect(await screen.findByText(/Roteiro excluído com sucesso/)).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBe('[]')
  })
})
