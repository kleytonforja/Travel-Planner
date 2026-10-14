/**
 * Fotografias do cabeçalho do roteiro (M7, M7.2), por identificador de destino.
 *
 * O cabeçalho (`ItinerarySummary`) consulta este mapa; destinos sem entrada continuam com o cabeçalho azul
 * original, então novos destinos podem ganhar foto só com uma entrada aqui (e os arquivos em `public/images`).
 * Rio de Janeiro (Corcovado) e Florianópolis (Ponte Hercílio Luz) vêm do Wikimedia Commons, recortadas em 16:9 e
 * convertidas para WebP; Lisboa reutiliza a fotografia do card da home (Unsplash, `src/data/photos.ts`).
 * As mesmas fotografias do Rio e de Florianópolis compõem a Hero da home (`src/data/heroPhotos.ts`), por isso a
 * atribuição fica em constantes compartilhadas. Procedência, licenças e pendências: `docs/IMAGE_CREDITS.md`
 * (sem revisão jurídica). Nada disso é gravado nos roteiros salvos nem no JSON.
 */

import { DESTINATION_PHOTOS, type Photo } from './photos'

/** Autoria, fonte, licença e alterações de uma fotografia (exigidas pelas licenças CC). */
export interface PhotoAttribution {
  author: string
  sourceName: 'Unsplash' | 'Wikimedia Commons'
  /** Página da fotografia na fonte (autor, licença e histórico). */
  sourceUrl: string
  license: { name: string; url: string }
  /** Alterações feitas pelo projeto e, quando houver, por terceiros no arquivo de origem. */
  changes: string
}

export interface HeaderPhoto extends PhotoAttribution {
  small: string
  large: string
  smallWidth: number
  largeWidth: number
  /** Dimensões da versão maior, para reservar o espaço. */
  width: number
  height: number
  /** Descreve só o que a imagem mostra. */
  alt: string
  /** Enquadramento dentro da faixa do cabeçalho (CSS `object-position`). */
  objectPosition: string
}

const UNSPLASH_LICENSE = { name: 'Unsplash License', url: 'https://unsplash.com/license' }

/**
 * Rio — "Christ on Corcovado mountain.JPG" (Commons). Autor na página: Artyominc, que enviou o arquivo em 2010 como
 * obra própria sob CC BY-SA 3.0 (e GFDL); a versão atual foi recortada, girada e corrigida por outro usuário do
 * Commons (Piisamson) e reenviada em 2012 (Chronus), mantendo a licença. O campo "fonte" da página cita "Artyom
 * Sharbatyan" por um modelo inexistente: o crédito exibido segue o campo "autor" (Artyominc).
 */
export const RIO_CORCOVADO_ATTRIBUTION: PhotoAttribution = {
  author: 'Artyominc',
  sourceName: 'Wikimedia Commons',
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:Christ_on_Corcovado_mountain.JPG',
  license: { name: 'CC BY-SA 3.0', url: 'https://creativecommons.org/licenses/by-sa/3.0/' },
  changes:
    'O arquivo do Commons já foi recortado e corrigido por outro usuário; aqui foi recortado em 16:9 e convertido para WebP, e a versão derivada permanece sob CC BY-SA 3.0.',
}

/** Florianópolis — "Cores após o pôr-do-sol.JPG" (Commons), obra própria de Rodneycruz (Wiki Loves Monuments 2015). */
export const FLORIANOPOLIS_PONTE_ATTRIBUTION: PhotoAttribution = {
  author: 'Rodneycruz',
  sourceName: 'Wikimedia Commons',
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:Cores_ap%C3%B3s_o_p%C3%B4r-do-sol.JPG',
  license: { name: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  changes: 'Recortada em 16:9 e convertida para WebP; a versão derivada permanece sob CC BY-SA 4.0.',
}

/** Lisboa — fotografia do card da home (Unsplash). */
export function unsplashAttribution(photo: Photo): PhotoAttribution {
  return {
    author: photo.credit.photographer,
    sourceName: 'Unsplash',
    sourceUrl: photo.credit.sourceUrl,
    license: UNSPLASH_LICENSE,
    changes: 'Recortada e convertida para WebP.',
  }
}

const imagePath = (file: string) => `${import.meta.env.BASE_URL}images/headers/${file}`

export const HEADER_PHOTOS: Record<string, HeaderPhoto> = {
  'rio-de-janeiro': {
    ...RIO_CORCOVADO_ATTRIBUTION,
    small: imagePath('rio-de-janeiro-corcovado-640.webp'),
    large: imagePath('rio-de-janeiro-corcovado-1200.webp'),
    smallWidth: 640,
    largeWidth: 1200,
    width: 1200,
    height: 675,
    alt: 'Vista aérea da estátua do Cristo Redentor no alto do Corcovado, com o Pão de Açúcar, a Baía de Guanabara e a cidade do Rio de Janeiro ao fundo',
    objectPosition: 'center 40%',
  },
  florianopolis: {
    ...FLORIANOPOLIS_PONTE_ATTRIBUTION,
    small: imagePath('florianopolis-ponte-640.webp'),
    large: imagePath('florianopolis-ponte-1200.webp'),
    smallWidth: 640,
    largeWidth: 1200,
    width: 1200,
    height: 675,
    alt: 'Ponte Hercílio Luz iluminada ao crepúsculo, sob um céu roxo, com as luzes da cidade refletidas na baía',
    objectPosition: 'center 62%',
  },
  lisboa: {
    ...unsplashAttribution(DESTINATION_PHOTOS.lisboa),
    small: DESTINATION_PHOTOS.lisboa.small,
    large: DESTINATION_PHOTOS.lisboa.large,
    smallWidth: DESTINATION_PHOTOS.lisboa.smallWidth,
    largeWidth: DESTINATION_PHOTOS.lisboa.largeWidth,
    width: DESTINATION_PHOTOS.lisboa.width,
    height: DESTINATION_PHOTOS.lisboa.height,
    alt: DESTINATION_PHOTOS.lisboa.alt,
    objectPosition: 'center 55%',
  },
}
