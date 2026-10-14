import { act, render, screen } from '@testing-library/react'
import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { destinations } from '../data/destinations'
import { HERO_FALLBACK_PHOTO, HERO_PHOTOS } from '../data/heroPhotos'
import { HEADER_PHOTOS } from '../data/headerPhotos'
import {
  getCurrentHeroPhoto,
  HERO_LAST_KEY,
  pickHeroPhoto,
  readLastHeroId,
  reportHeroPhotoFailure,
  resetHeroPhotoForTests,
  subscribeHeroPhoto,
  writeLastHeroId,
} from '../utils/heroPhoto'
import { useHeroPhoto } from '../utils/useHeroPhoto'

const publicFile = (url: string) => join(process.cwd(), 'public', url.replace(/^\/?(Travel-Planner\/)?/, ''))

describe('Hero dinâmica — biblioteca (M7.2)', () => {
  it('traz Rio (Corcovado), Florianópolis (ponte) e Lisboa (bonde atual), com identificadores únicos', () => {
    expect(HERO_PHOTOS.map((photo) => photo.id)).toEqual(['rio-de-janeiro-corcovado', 'florianopolis-ponte', 'lisboa-bonde'])
    expect(new Set(HERO_PHOTOS.map((photo) => photo.id)).size).toBe(HERO_PHOTOS.length)
    const ids = new Set(destinations.map((item) => item.id))
    for (const photo of HERO_PHOTOS) expect(ids.has(photo.destinationId), photo.id).toBe(true)
  })

  it('os arquivos existem, são leves e cada foto tem alt, autor, fonte, licença com link e alterações', () => {
    for (const photo of [...HERO_PHOTOS, HERO_FALLBACK_PHOTO]) {
      for (const url of [photo.small, photo.large]) expect(existsSync(publicFile(url)), url).toBe(true)
      expect(statSync(publicFile(photo.small)).size, `${photo.id} 960`).toBeLessThan(120 * 1024)
      expect(statSync(publicFile(photo.large)).size, `${photo.id} 1920`).toBeLessThan(260 * 1024)
      expect(photo.alt.length).toBeGreaterThan(20)
      expect(photo.author).not.toBe('')
      expect(photo.sourceUrl).toMatch(/^https:\/\/(commons\.wikimedia\.org|unsplash\.com)\//)
      expect(photo.license.url).toMatch(/^https:\/\//)
      expect(photo.changes).toMatch(/WebP/)
      expect(photo.objectPosition).toMatch(/^\d+% \d+%$/)
    }
  })

  it('Rio e Florianópolis compartilham a atribuição com os cabeçalhos dos roteiros (mesma foto, mesmo crédito)', () => {
    for (const [heroId, destinationId] of [['rio-de-janeiro-corcovado', 'rio-de-janeiro'], ['florianopolis-ponte', 'florianopolis']] as const) {
      const hero = HERO_PHOTOS.find((photo) => photo.id === heroId)!
      const header = HEADER_PHOTOS[destinationId]
      expect(hero.author).toBe(header.author)
      expect(hero.sourceUrl).toBe(header.sourceUrl)
      expect(hero.license).toEqual(header.license)
    }
  })

  it('a foto anterior da Hero só serve de substituta técnica (não está na biblioteca)', () => {
    expect(HERO_PHOTOS.some((photo) => photo.id === HERO_FALLBACK_PHOTO.id)).toBe(false)
    expect(HERO_FALLBACK_PHOTO.author).toBe('Mauro Lima')
  })
})

describe('Hero dinâmica — seleção', () => {
  it('nunca repete a foto anterior quando há outra opção, qualquer que seja o sorteio', () => {
    for (const last of HERO_PHOTOS.map((photo) => photo.id)) {
      for (const random of [0, 0.25, 0.5, 0.75, 0.999999]) {
        expect(pickHeroPhoto(HERO_PHOTOS, last, () => random).id).not.toBe(last)
      }
    }
  })

  it('sem foto anterior (ou com id desconhecido) sorteia entre todas', () => {
    expect(pickHeroPhoto(HERO_PHOTOS, null, () => 0).id).toBe(HERO_PHOTOS[0].id)
    expect(pickHeroPhoto(HERO_PHOTOS, null, () => 0.999999).id).toBe(HERO_PHOTOS[2].id)
    expect(pickHeroPhoto(HERO_PHOTOS, 'inexistente', () => 0.5).id).toBe(HERO_PHOTOS[1].id)
  })

  it('com uma única foto repete (não há alternativa); sem fotos, usa a substituta', () => {
    expect(pickHeroPhoto([HERO_PHOTOS[0]], HERO_PHOTOS[0].id).id).toBe(HERO_PHOTOS[0].id)
    expect(pickHeroPhoto([], null)).toBe(HERO_FALLBACK_PHOTO)
  })

  it('o sorteio cobre todas as fotos ao longo de várias visitas (distribuição não trava em uma)', () => {
    const seen = new Set<string>()
    let last: string | null = null
    for (let visit = 0; visit < 60; visit += 1) {
      const photo = pickHeroPhoto(HERO_PHOTOS, last)
      seen.add(photo.id)
      last = photo.id
    }
    expect(seen.size).toBe(HERO_PHOTOS.length)
  })
})

describe('Hero dinâmica — visita, armazenamento e falha', () => {
  beforeEach(() => {
    localStorage.clear()
    resetHeroPhotoForTests()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('a foto é escolhida uma vez por visita e se mantém durante toda a navegação', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    const first = getCurrentHeroPhoto()
    random.mockReturnValue(0.99)
    expect(getCurrentHeroPhoto()).toBe(first)
    expect(getCurrentHeroPhoto()).toBe(first)
    expect(random).toHaveBeenCalledTimes(1)
  })

  it('registra a última foto e a próxima visita não a repete', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const visit1 = getCurrentHeroPhoto()
    expect(localStorage.getItem(HERO_LAST_KEY)).toBe(visit1.id)
    resetHeroPhotoForTests() // nova visita (novo carregamento da página)
    const visit2 = getCurrentHeroPhoto()
    expect(visit2.id).not.toBe(visit1.id)
    resetHeroPhotoForTests()
    expect(getCurrentHeroPhoto().id).not.toBe(visit2.id)
  })

  it('não depende do localStorage: leitura e escrita com erro não quebram e a Hero ainda escolhe uma foto', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    expect(readLastHeroId()).toBeNull()
    expect(() => writeLastHeroId('x')).not.toThrow()
    expect(HERO_PHOTOS.map((photo) => photo.id)).toContain(getCurrentHeroPhoto().id)
  })

  it('sem armazenamento (nulo), leitura e escrita são inofensivas', () => {
    expect(readLastHeroId(null)).toBeNull()
    expect(() => writeLastHeroId('x', null)).not.toThrow()
  })

  it('a falha da foto escolhida troca para a substituta, avisa quem assina e só ocorre uma vez', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const chosen = getCurrentHeroPhoto()
    expect(chosen.id).not.toBe(HERO_FALLBACK_PHOTO.id)
    const listener = vi.fn()
    const unsubscribe = subscribeHeroPhoto(listener)
    reportHeroPhotoFailure()
    expect(getCurrentHeroPhoto()).toBe(HERO_FALLBACK_PHOTO)
    expect(listener).toHaveBeenCalledTimes(1)
    reportHeroPhotoFailure()
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('o hook acompanha a troca para a substituta (a imagem e o crédito usam a mesma fonte)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    function Probe() {
      return <p data-testid="probe">{useHeroPhoto().id}</p>
    }
    render(<Probe />)
    expect(screen.getByTestId('probe')).toHaveTextContent(HERO_PHOTOS[0].id)
    act(() => reportHeroPhotoFailure())
    expect(screen.getByTestId('probe')).toHaveTextContent(HERO_FALLBACK_PHOTO.id)
  })
})
