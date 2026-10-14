/**
 * Biblioteca de fotografias da Hero da home (M7.2).
 *
 * Uma delas é escolhida a cada nova visita (carregamento da página), sem repetir a anterior — ver
 * `src/utils/heroPhoto.ts`. Para incluir um destino novo basta acrescentar uma entrada em `HERO_PHOTOS`
 * (com os WebP de 960 e 1920 px em `public/images/hero`); nenhum componente muda.
 *
 * Rio e Florianópolis vêm do Wikimedia Commons (as mesmas dos cabeçalhos dos roteiros, atribuição
 * compartilhada em `headerPhotos.ts`); Lisboa vem do Unsplash (a mesma do card da home, em versão maior).
 * `HERO_FALLBACK_PHOTO` é a fotografia anterior da Hero (Rio ao pôr do sol, Unsplash), mantida só como
 * substituta técnica quando a escolhida não carrega; se ela também falhar, entra a ilustração original.
 * Procedência, licenças e pendências: `docs/IMAGE_CREDITS.md` (sem revisão jurídica).
 */

import {
  FLORIANOPOLIS_PONTE_ATTRIBUTION,
  RIO_CORCOVADO_ATTRIBUTION,
  unsplashAttribution,
  type PhotoAttribution,
} from './headerPhotos'
import { DESTINATION_PHOTOS, HERO_PHOTO } from './photos'

export interface HeroPhotoEntry extends PhotoAttribution {
  /** Identificador estável (também é o que se guarda como "última foto"). */
  id: string
  destinationId: string
  /** WebP de 960 e 1920 px de largura. */
  small: string
  large: string
  smallWidth: number
  largeWidth: number
  /** Dimensões da versão maior (proporção reservada). */
  width: number
  height: number
  alt: string
  /** Enquadramento da foto na Hero (CSS `object-position`). */
  objectPosition: string
}

const imagePath = (file: string) => `${import.meta.env.BASE_URL}images/hero/${file}`

export const HERO_PHOTOS: readonly HeroPhotoEntry[] = [
  {
    id: 'rio-de-janeiro-corcovado',
    destinationId: 'rio-de-janeiro',
    ...RIO_CORCOVADO_ATTRIBUTION,
    small: imagePath('rio-de-janeiro-corcovado-960.webp'),
    large: imagePath('rio-de-janeiro-corcovado-1920.webp'),
    smallWidth: 960,
    largeWidth: 1920,
    width: 1920,
    height: 1080,
    alt: 'Vista aérea da estátua do Cristo Redentor no alto do Corcovado, com o Pão de Açúcar, a Baía de Guanabara e a cidade do Rio de Janeiro ao fundo',
    objectPosition: '60% 40%',
  },
  {
    id: 'florianopolis-ponte',
    destinationId: 'florianopolis',
    ...FLORIANOPOLIS_PONTE_ATTRIBUTION,
    small: imagePath('florianopolis-ponte-960.webp'),
    large: imagePath('florianopolis-ponte-1920.webp'),
    smallWidth: 960,
    largeWidth: 1920,
    width: 1920,
    height: 1080,
    alt: 'Ponte Hercílio Luz iluminada ao crepúsculo, sob um céu roxo, com as luzes da cidade refletidas na baía',
    objectPosition: '60% 60%',
  },
  {
    id: 'lisboa-bonde',
    destinationId: 'lisboa',
    ...unsplashAttribution(DESTINATION_PHOTOS.lisboa),
    small: imagePath('lisboa-bonde-960.webp'),
    large: imagePath('lisboa-bonde-1920.webp'),
    smallWidth: 960,
    largeWidth: 1920,
    width: 1920,
    height: 1080,
    alt: DESTINATION_PHOTOS.lisboa.alt,
    objectPosition: '60% 50%',
  },
]

/** Fotografia anterior da Hero, usada só se a escolhida falhar ao carregar. */
export const HERO_FALLBACK_PHOTO: HeroPhotoEntry = {
  id: 'rio-de-janeiro-por-do-sol',
  destinationId: 'rio-de-janeiro',
  author: HERO_PHOTO.credit.photographer,
  sourceName: 'Unsplash',
  sourceUrl: HERO_PHOTO.credit.sourceUrl,
  license: { name: 'Unsplash License', url: 'https://unsplash.com/license' },
  changes: 'Recortada e convertida para WebP.',
  small: HERO_PHOTO.small,
  large: HERO_PHOTO.large,
  smallWidth: HERO_PHOTO.smallWidth,
  largeWidth: HERO_PHOTO.largeWidth,
  width: HERO_PHOTO.width,
  height: HERO_PHOTO.height,
  alt: HERO_PHOTO.alt,
  objectPosition: '60% 40%',
}
