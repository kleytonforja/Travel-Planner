import { fireEvent, render, screen, within } from '@testing-library/react'
import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { ActivityPhotoCredits } from '../components/ActivityPhotoCredits'
import { ItineraryDayCard } from '../components/ItineraryDayCard'
import { ACTIVITY_PHOTOS } from '../data/activityPhotos'
import { destinations } from '../data/destinations'
import type { Activity, ItineraryDay } from '../types'

const rio = destinations.find((item) => item.id === 'rio-de-janeiro')!
const allActivities = destinations.flatMap((item) => item.activities)
const byId = (id: string): Activity => allActivities.find((item) => item.id === id)!

const day = (...ids: string[]): ItineraryDay => ({
  dayNumber: 1,
  activities: ids.map((id, index) => ({
    activity: byId(id),
    period: 'manha',
    startMinutes: 540 + index * 180,
    endMinutes: 600 + index * 180,
  })),
})

const publicFile = (url: string) => join(process.cwd(), 'public', url.replace(/^\/?(Travel-Planner\/)?/, ''))

describe('Fotografias das atrações do Rio (M5.3)', () => {
  it('toda atração do Rio tem foto, exceto a Feira Hippie de Ipanema (placeholder)', () => {
    const semFoto = rio.activities.filter((item) => !ACTIVITY_PHOTOS[item.id]).map((item) => item.id)
    expect(semFoto).toEqual(['rio-feira-ipanema'])
    expect(rio.activities).toHaveLength(10)
  })

  it('toda entrada aponta para um ID existente do Rio; nenhum outro destino recebeu fotos', () => {
    const rioIds = new Set(rio.activities.map((item) => item.id))
    for (const id of Object.keys(ACTIVITY_PHOTOS)) expect(rioIds.has(id)).toBe(true)
    expect(Object.keys(ACTIVITY_PHOTOS)).toHaveLength(9)
  })

  it('os arquivos existem, seguem o ID no nome e são leves', () => {
    for (const [id, photo] of Object.entries(ACTIVITY_PHOTOS)) {
      expect(photo.small).toContain(`${id}-480.webp`)
      expect(photo.large).toContain(`${id}-960.webp`)
      const small = publicFile(photo.small)
      const large = publicFile(photo.large)
      expect(existsSync(small), small).toBe(true)
      expect(existsSync(large), large).toBe(true)
      expect(statSync(small).size, `${id} 480`).toBeLessThan(60 * 1024)
      expect(statSync(large).size, `${id} 960`).toBeLessThan(230 * 1024)
    }
  })

  it('cada foto traz texto alternativo, autor, fonte, licença com link e alterações', () => {
    for (const photo of Object.values(ACTIVITY_PHOTOS)) {
      expect(photo.alt.length).toBeGreaterThan(20)
      expect(photo.credit.author).not.toBe('')
      expect(photo.credit.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/)
      expect(photo.credit.license).toMatch(/^CC BY(-SA)? \d\.\d/)
      expect(photo.credit.licenseUrl).toMatch(/^https:\/\/creativecommons\.org\/licenses\/by(-sa)?\//)
      expect(photo.credit.changes).toMatch(/Recortada.*WebP/)
    }
  })

  it('Lapa e Dois Irmãos não afirmam mostrar a atividade', () => {
    expect(ACTIVITY_PHOTOS['rio-lapa'].alt).toMatch(/não bares ou shows/)
    expect(ACTIVITY_PHOTOS['rio-trilha-dois-irmaos'].alt).toMatch(/não a trilha/)
  })

  it('o card mostra a foto da atração com srcSet, tamanho reservado e carregamento lazy', () => {
    render(<ItineraryDayCard day={day('rio-cristo-redentor')} currency={rio.currency} />)
    const media = screen.getByTestId('activity-media')
    const img = within(media).getByRole('img', { name: ACTIVITY_PHOTOS['rio-cristo-redentor'].alt })
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAttribute('srcset', expect.stringContaining('480w'))
    expect(img).toHaveAttribute('srcset', expect.stringContaining('960w'))
    expect(img).toHaveAttribute('sizes', '(min-width: 640px) 80px, 56px')
    expect(img).toHaveAttribute('width', '960')
    expect(img).toHaveAttribute('height', '960')
    expect(media).not.toHaveAttribute('aria-hidden')
  })

  it('a Feira Hippie continua com o placeholder, sem imagem', () => {
    render(<ItineraryDayCard day={day('rio-feira-ipanema')} currency={rio.currency} />)
    const media = screen.getByTestId('activity-media')
    expect(media.querySelector('img')).toBeNull()
    expect(media).toHaveAttribute('aria-hidden', 'true')
  })

  it('se a imagem falhar ao carregar, volta ao placeholder anterior', () => {
    render(<ItineraryDayCard day={day('rio-lapa')} currency={rio.currency} />)
    const media = screen.getByTestId('activity-media')
    fireEvent.error(within(media).getByRole('img'))
    expect(media.querySelector('img')).toBeNull()
    expect(media).toHaveAttribute('aria-hidden', 'true')
  })

  it('os créditos listam cada foto exibida uma só vez, com links de fonte e licença', () => {
    render(<ActivityPhotoCredits days={[day('rio-cristo-redentor', 'rio-feira-ipanema'), day('rio-cristo-redentor', 'rio-pao-de-acucar')]} />)
    const section = screen.getByRole('region', { name: 'Créditos das fotografias' })
    const toggle = within(section).getByRole('button', { name: /Créditos das fotografias/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(within(section).getAllByRole('listitem')).toHaveLength(2)
    expect(section).toHaveTextContent('Arturdiasr')
    expect(section).toHaveTextContent('Nico Kaiser')
    expect(section).not.toHaveTextContent('Feira Hippie')
    expect(within(section).getByRole('link', { name: 'CC BY 2.0' })).toHaveAttribute('href', 'https://creativecommons.org/licenses/by/2.0/')
    expect(within(section).getAllByRole('link', { name: 'fonte' })).toHaveLength(2)
  })

  it('sem nenhuma foto no roteiro, não há seção de créditos', () => {
    const { container } = render(<ActivityPhotoCredits days={[day('rio-feira-ipanema'), day(destinations[0].activities[0].id)]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
