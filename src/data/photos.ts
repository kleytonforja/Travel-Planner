/**
 * Fotografias da home e seus créditos.
 *
 * Todas vêm do Unsplash, licenciadas sob a Unsplash License (uso livre,
 * inclusive comercial, sem exigência legal de atribuição — o crédito é dado
 * por cortesia e transparência). A verificação da origem, do fotógrafo e da
 * licença de cada imagem está registrada em `docs/IMAGE_CREDITS.md`.
 *
 * Os arquivos ficam em `public/images/` (WebP otimizado, recortado/redimensionado
 * a partir do original) e respeitam o caminho base do Vite.
 */

export interface PhotoCredit {
  photographer: string
  photographerUrl: string
  /** Página da fotografia no Unsplash. */
  sourceUrl: string
}

export interface Photo {
  /** Versão menor (largura em `smallWidth`) e maior (largura em `largeWidth`). */
  small: string
  large: string
  smallWidth: number
  largeWidth: number
  /** Dimensões da versão maior, para reservar o espaço e evitar deslocamento de layout. */
  width: number
  height: number
  alt: string
  credit: PhotoCredit
}

const imagePath = (file: string) => `${import.meta.env.BASE_URL}images/${file}`

export const HERO_PHOTO: Photo = {
  small: imagePath('hero/rio-de-janeiro-hero-960.webp'),
  large: imagePath('hero/rio-de-janeiro-hero-1920.webp'),
  smallWidth: 960,
  largeWidth: 1920,
  width: 1920,
  height: 1280,
  alt: 'Pôr do sol sobre a cidade do Rio de Janeiro e a Baía de Guanabara, com o Pão de Açúcar ao fundo',
  credit: {
    photographer: 'Mauro Lima',
    photographerUrl: 'https://unsplash.com/@limamauro23',
    sourceUrl: 'https://unsplash.com/photos/gcj__gzMick',
  },
}

/** Fotografias dos destinos da base local, por identificador de destino. */
export const DESTINATION_PHOTOS: Record<string, Photo> = {
  florianopolis: {
    small: imagePath('destinations/florianopolis-640.webp'),
    large: imagePath('destinations/florianopolis-1200.webp'),
    smallWidth: 640,
    largeWidth: 1200,
    width: 1200,
    height: 675,
    alt: 'Passarela de uma ponte suspensa em Florianópolis, com torre de aço e céu azul',
    credit: {
      photographer: 'Henrique Pereira',
      photographerUrl: 'https://unsplash.com/@henrique_f',
      sourceUrl: 'https://unsplash.com/photos/TtM_u4bX_2s',
    },
  },
  'rio-de-janeiro': {
    small: imagePath('destinations/rio-de-janeiro-640.webp'),
    large: imagePath('destinations/rio-de-janeiro-1200.webp'),
    smallWidth: 640,
    largeWidth: 1200,
    width: 1200,
    height: 675,
    alt: 'Vista aérea da Baía de Guanabara, com o Pão de Açúcar e a cidade do Rio de Janeiro',
    credit: {
      photographer: 'Lucas Campoi',
      photographerUrl: 'https://unsplash.com/@campoilucas',
      sourceUrl: 'https://unsplash.com/photos/pHnzdSAEkRM',
    },
  },
  lisboa: {
    small: imagePath('destinations/lisboa-640.webp'),
    large: imagePath('destinations/lisboa-1200.webp'),
    smallWidth: 640,
    largeWidth: 1200,
    width: 1200,
    height: 675,
    alt: 'Elétrico amarelo e azul em uma rua histórica de Lisboa, com calçada portuguesa',
    credit: {
      photographer: 'Sarah Markstaller',
      photographerUrl: 'https://unsplash.com/@sarahmarkstaller',
      sourceUrl: 'https://unsplash.com/photos/a-yellow-tram-travels-down-a-street-in-lisbon-r_ShROkN3E8',
    },
  },
}
