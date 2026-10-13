import { fireEvent, render, screen, within } from '@testing-library/react'
import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { ActivityPhotoCredits } from '../components/ActivityPhotoCredits'
import { ItineraryDayCard } from '../components/ItineraryDayCard'
import { ACTIVITY_PHOTOS } from '../data/activityPhotos'
import { destinations } from '../data/destinations'
import type { Activity, ItineraryDay } from '../types'

const dest = (id: string) => destinations.find((item) => item.id === id)!
const rio = dest('rio-de-janeiro')
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

const SEM_FOTO: Record<string, string[]> = {
  'rio-de-janeiro': ['rio-feira-ipanema'],
  florianopolis: ['fln-noite-lagoa', 'fln-passeio-escuna'],
  lisboa: ['lis-pasteis-de-belem', 'lis-lx-factory', 'lis-time-out-market'],
}

describe('Fotografias das atrações (M5.3 e M5.5)', () => {
  it.each(Object.entries(SEM_FOTO))('%s: só as atrações previstas ficam com placeholder', (destinationId, esperadas) => {
    const destino = dest(destinationId)
    const semFoto = destino.activities.filter((item) => !ACTIVITY_PHOTOS[item.id]).map((item) => item.id)
    expect(semFoto).toEqual(esperadas)
    expect(destino.activities).toHaveLength(10)
  })

  it('toda entrada aponta para um ID existente do catálogo (24 fotos: 9 Rio, 8 Florianópolis, 7 Lisboa)', () => {
    const ids = new Set(destinations.flatMap((item) => item.activities.map((activity) => activity.id)))
    for (const id of Object.keys(ACTIVITY_PHOTOS)) expect(ids.has(id), id).toBe(true)
    expect(Object.keys(ACTIVITY_PHOTOS)).toHaveLength(24)
    expect(Object.keys(ACTIVITY_PHOTOS).filter((id) => id.startsWith('rio-'))).toHaveLength(9)
    expect(Object.keys(ACTIVITY_PHOTOS).filter((id) => id.startsWith('fln-'))).toHaveLength(8)
    expect(Object.keys(ACTIVITY_PHOTOS).filter((id) => id.startsWith('lis-'))).toHaveLength(7)
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
      expect(photo.credit.license).toMatch(/^(CC0|CC BY(-SA)? \d\.\d)/)
      expect(photo.credit.licenseUrl).toMatch(/^https:\/\/creativecommons\.org\/(licenses\/by(-sa)?|publicdomain\/zero)\//)
      expect(photo.credit.changes).toMatch(/Recortada.*WebP/)
    }
  })

  it('quando a imagem não mostra a atividade, o texto alternativo diz o que ela mostra', () => {
    expect(ACTIVITY_PHOTOS['rio-lapa'].alt).toMatch(/não bares ou shows/)
    expect(ACTIVITY_PHOTOS['rio-trilha-dois-irmaos'].alt).toMatch(/não a trilha/)
    expect(ACTIVITY_PHOTOS['fln-jurere-internacional'].alt).toMatch(/não mostra os beach clubs/)
    expect(ACTIVITY_PHOTOS['fln-santo-antonio-de-lisboa'].alt).toMatch(/não o casario nem as ostras/)
    expect(ACTIVITY_PHOTOS['lis-bairro-alto'].alt).toMatch(/não bares nem casas de fado/)
  })

  it('a licença CC0 e as CC BY/CC BY-SA aparecem com o texto e o link corretos', () => {
    expect(ACTIVITY_PHOTOS['fln-trilha-lagoinha-do-leste'].credit).toMatchObject({ license: 'CC0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' })
    expect(ACTIVITY_PHOTOS['fln-lagoa-da-conceicao'].credit).toMatchObject({ license: 'CC BY 3.0', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/' })
    expect(ACTIVITY_PHOTOS['lis-sintra-palacio-pena'].credit).toMatchObject({ license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/' })
    expect(ACTIVITY_PHOTOS['fln-jurere-internacional'].credit).toMatchObject({ license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/' })
    expect(ACTIVITY_PHOTOS['lis-torre-de-belem'].credit).toMatchObject({ license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' })
  })

  it('Florianópolis e Lisboa: fotos no card e placeholder nas atrações sem foto', () => {
    render(<ItineraryDayCard day={day('fln-ilha-do-campeche', 'fln-passeio-escuna', 'lis-torre-de-belem', 'lis-time-out-market')} currency={rio.currency} />)
    const areas = screen.getAllByTestId('activity-media')
    expect(areas.map((area) => area.querySelector('img') !== null)).toEqual([true, false, true, false])
    expect(within(areas[0]).getByRole('img')).toHaveAttribute('src', expect.stringContaining('fln-ilha-do-campeche-480.webp'))
    expect(within(areas[2]).getByRole('img')).toHaveAttribute('src', expect.stringContaining('lis-torre-de-belem-480.webp'))
    expect(areas[1]).toHaveAttribute('aria-hidden', 'true')
    expect(areas[3]).toHaveAttribute('aria-hidden', 'true')
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
    render(<ActivityPhotoCredits days={[day('rio-cristo-redentor', 'rio-feira-ipanema'), day('rio-cristo-redentor', 'rio-pao-de-acucar', 'fln-trilha-lagoinha-do-leste', 'lis-time-out-market')]} />)
    const section = screen.getByRole('region', { name: 'Créditos das fotografias' })
    const toggle = within(section).getByRole('button', { name: /Créditos das fotografias/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(within(section).getAllByRole('listitem')).toHaveLength(3)
    expect(section).toHaveTextContent('Arturdiasr')
    expect(section).toHaveTextContent('Nico Kaiser')
    expect(section).toHaveTextContent('Papa Pic')
    expect(within(section).getByRole('link', { name: 'CC0' })).toHaveAttribute('href', 'https://creativecommons.org/publicdomain/zero/1.0/')
    expect(section).not.toHaveTextContent('Feira Hippie')
    expect(section).not.toHaveTextContent('Time Out')
    expect(within(section).getByRole('link', { name: 'CC BY 2.0' })).toHaveAttribute('href', 'https://creativecommons.org/licenses/by/2.0/')
    expect(within(section).getAllByRole('link', { name: 'fonte' })).toHaveLength(3)
  })

  it('sem nenhuma foto no roteiro, não há seção de créditos', () => {
    const { container } = render(<ActivityPhotoCredits days={[day('rio-feira-ipanema'), day('fln-noite-lagoa', 'lis-lx-factory')]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
