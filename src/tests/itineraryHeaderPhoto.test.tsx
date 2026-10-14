import { fireEvent, render, screen, within } from '@testing-library/react'
import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { ItinerarySummary } from '../components/ItinerarySummary'
import { destinations } from '../data/destinations'
import { HEADER_PHOTOS } from '../data/headerPhotos'
import type { Destination, PlanningInput } from '../types'
import { buildItineraryFromInput } from './fixtures/savedItineraries'

const dest = (id: string) => destinations.find((item) => item.id === id)!
const publicFile = (url: string) => join(process.cwd(), 'public', url.replace(/^\/?(Travel-Planner\/)?/, ''))

function renderHeader(destination: Destination, extra: Partial<PlanningInput> = {}) {
  const input: PlanningInput = { destinationId: destination.id, days: 3, interests: ['cultura'], style: 'equilibrado', budget: 500, ...extra }
  const itinerary = buildItineraryFromInput(input)
  return render(<ItinerarySummary itinerary={itinerary} destination={destination} />)
}

describe('Cabeçalho fotográfico do roteiro (M7)', () => {
  it.each([
    ['rio-de-janeiro', 'Cristo Redentor', 'Artyominc', 'CC BY-SA 3.0'],
    ['florianopolis', 'Ponte Hercílio Luz', 'Rodneycruz', 'CC BY-SA 4.0'],
    ['lisboa', 'Elétrico', 'Sarah Markstaller', 'Unsplash License'],
  ])('%s mostra a fotografia correta, o nome, o país e os créditos', (id, altPart, author, license) => {
    renderHeader(dest(id))
    const img = screen.getByRole('img')
    expect(img.getAttribute('alt')).toContain(altPart)
    expect(img.getAttribute('src')).toBe(HEADER_PHOTOS[id].small)
    expect(screen.getByRole('heading', { name: dest(id).name })).toBeInTheDocument()
    expect(screen.getByText(dest(id).country)).toBeInTheDocument()
    const credit = screen.getByTestId('header-photo-credit')
    expect(credit).toHaveTextContent(`Foto: ${author}`)
    expect(within(credit).getByRole('link', { name: license })).toHaveAttribute('href', HEADER_PHOTOS[id].license.url)
    expect(within(credit).getByRole('link', { name: HEADER_PHOTOS[id].sourceName })).toHaveAttribute('href', HEADER_PHOTOS[id].sourceUrl)
    expect(credit).toHaveTextContent(/WebP/)
  })

  it('a imagem tem tamanho reservado, srcSet, carregamento prioritário e o degradê é decorativo', () => {
    const { container } = renderHeader(dest('rio-de-janeiro'))
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('width', '1200')
    expect(img).toHaveAttribute('height', '675')
    expect(img.getAttribute('srcset')).toMatch(/640w.*1200w/)
    expect(img).toHaveAttribute('loading', 'eager')
    expect(img.parentElement?.className).toMatch(/h-44/)
    expect(container.querySelector('[aria-hidden="true"].bg-gradient-to-t')).not.toBeNull()
  })

  it('preserva abaixo da fotografia duração, estilo, ritmo, orçamento e interesses', () => {
    renderHeader(dest('rio-de-janeiro'), { pace: 'tranquilo' })
    for (const label of ['Duração', 'Estilo', 'Ritmo', 'Orçamento informado', 'Interesses']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    expect(screen.getByText('3 dias')).toBeInTheDocument()
  })

  it('sem fotografia no mapa, mantém o cabeçalho azul, sem imagem nem crédito', () => {
    const futuro: Destination = { ...dest('lisboa'), id: 'destino-futuro', name: 'Destino Futuro' }
    const { container } = renderHeader(futuro, { destinationId: 'lisboa' })
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.queryByTestId('header-photo-credit')).toBeNull()
    expect(container.querySelector('.from-blue-600')).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Destino Futuro' })).toBeInTheDocument()
  })

  it('se a fotografia falhar ao carregar, volta ao cabeçalho azul', () => {
    const { container } = renderHeader(dest('florianopolis'))
    fireEvent.error(screen.getByRole('img'))
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.queryByTestId('header-photo-credit')).toBeNull()
    expect(container.querySelector('.from-blue-600')).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Florianópolis' })).toBeInTheDocument()
  })

  it('os arquivos existem, são leves e todo ID do mapa é de um destino do catálogo', () => {
    const ids = new Set(destinations.map((item) => item.id))
    for (const [id, photo] of Object.entries(HEADER_PHOTOS)) {
      expect(ids.has(id), id).toBe(true)
      for (const url of [photo.small, photo.large]) expect(existsSync(publicFile(url)), url).toBe(true)
      expect(statSync(publicFile(photo.small)).size, `${id} small`).toBeLessThan(90 * 1024)
      expect(statSync(publicFile(photo.large)).size, `${id} large`).toBeLessThan(310 * 1024)
      expect(photo.alt.length).toBeGreaterThan(20)
      expect(photo.license.url).toMatch(/^https:\/\//)
    }
    expect(Object.keys(HEADER_PHOTOS).sort()).toEqual(['florianopolis', 'lisboa', 'rio-de-janeiro'])
  })
})
