/**
 * Fotografias das atrações do Rio de Janeiro (M5.3) e seus créditos.
 *
 * Todas vêm do Wikimedia Commons, cada uma sob a licença registrada na página do próprio arquivo
 * (CC BY 2.0, CC BY-SA 3.0 DE ou CC BY-SA 4.0), todas com atribuição obrigatória. As versões em
 * `public/images/activities/` são recortes quadrados convertidos para WebP (480 e 960 px), sem outra
 * edição; nas licenças BY-SA, essas versões derivadas permanecem sob a mesma licença. Verificação por
 * arquivo e pendências: `docs/IMAGE_CREDITS.md`. Não houve revisão jurídica.
 *
 * A chave é o identificador da atração no catálogo; atrações sem entrada (por exemplo, a Feira Hippie
 * de Ipanema) continuam com o placeholder. Nada disso é gravado nos roteiros salvos nem no JSON.
 */

export interface ActivityPhotoCredit {
  author: string
  /** Página do arquivo no Wikimedia Commons (mostra autor, licença e histórico). */
  sourceUrl: string
  license: string
  licenseUrl: string
  /** Alterações feitas pelo projeto, exigidas pelas licenças CC. */
  changes: string
}

export interface ActivityPhoto {
  small: string
  large: string
  smallWidth: number
  largeWidth: number
  /** Dimensões da versão maior (proporção 1:1), para reservar o espaço. */
  width: number
  height: number
  /** Descreve só o que a imagem mostra (nem sempre a atividade em si). */
  alt: string
  credit: ActivityPhotoCredit
}

const imagePath = (file: string) => `${import.meta.env.BASE_URL}images/activities/${file}`
const CHANGES = 'Recortada em formato quadrado e convertida para WebP (480 e 960 px).'
const BY2 = 'https://creativecommons.org/licenses/by/2.0/'
const BYSA3DE = 'https://creativecommons.org/licenses/by-sa/3.0/de/'
const BYSA4 = 'https://creativecommons.org/licenses/by-sa/4.0/'
const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${file}`

function photo(
  id: string,
  alt: string,
  author: string,
  file: string,
  license: string,
  licenseUrl: string,
): ActivityPhoto {
  return {
    small: imagePath(`${id}-480.webp`),
    large: imagePath(`${id}-960.webp`),
    smallWidth: 480,
    largeWidth: 960,
    width: 960,
    height: 960,
    alt,
    credit: { author, sourceUrl: commons(file), license, licenseUrl, changes: CHANGES },
  }
}

export const ACTIVITY_PHOTOS: Record<string, ActivityPhoto> = {
  'rio-cristo-redentor': photo(
    'rio-cristo-redentor',
    'Estátua do Cristo Redentor, de braços abertos, contra o céu azul',
    'Arturdiasr',
    'Rio_de_Janeiro_-_Cristo_Redentor_01.jpg',
    'CC BY-SA 4.0',
    BYSA4,
  ),
  'rio-pao-de-acucar': photo(
    'rio-pao-de-acucar',
    'Vista do Pão de Açúcar e da Baía de Guanabara a partir do Corcovado',
    'Nico Kaiser',
    'P%C3%A3o_de_A%C3%A7%C3%BAcar_-_Rio_de_Janeiro,_Brasil.jpg',
    'CC BY 2.0',
    BY2,
  ),
  'rio-praia-copacabana': photo(
    'rio-praia-copacabana',
    'Vista aérea da praia de Copacabana e de sua orla, a partir do Pão de Açúcar',
    'chensiyuan',
    'Rio_de_janeiro_copacabana_beach_2010.JPG',
    'CC BY-SA 4.0',
    BYSA4,
  ),
  'rio-museu-do-amanha': photo(
    'rio-museu-do-amanha',
    'Vista aérea do Museu do Amanhã, no Píer Mauá, com a região central do Rio ao fundo',
    'Arne Müseler',
    'Museu_do_Amanh%C3%A3_rio.jpg',
    'CC BY-SA 3.0 DE',
    BYSA3DE,
  ),
  'rio-trilha-dois-irmaos': photo(
    'rio-trilha-dois-irmaos',
    'Morro Dois Irmãos visto do mar, sobre a praia do Vidigal (a imagem mostra o morro, não a trilha)',
    'Diego Baravelli',
    'Praia_do_Vidigal_%2B_Morro_Dois_Irm%C3%A3os_by_Diego_Baravelli.jpg',
    'CC BY-SA 4.0',
    BYSA4,
  ),
  'rio-confeitaria-colombo': photo(
    'rio-confeitaria-colombo',
    'Salão da Confeitaria Colombo, com espelhos, vitrines e balcões de madeira trabalhada',
    'Leandro Neumann Ciuffo',
    'Confeitaria_Colombo_(2)_(6738795079).jpg',
    'CC BY 2.0',
    BY2,
  ),
  'rio-lapa': photo(
    'rio-lapa',
    'Arcos da Lapa iluminados à noite, com pessoas na praça (a imagem mostra os Arcos, não bares ou shows)',
    'AlexandreLuizOliveira',
    'Arcos_da_Lapa_colorido.jpg',
    'CC BY-SA 4.0',
    BYSA4,
  ),
  'rio-jardim-botanico': photo(
    'rio-jardim-botanico',
    'Jardim Japonês do Jardim Botânico do Rio de Janeiro, com lago, ponte vermelha e palmeiras-imperiais',
    'LubovGorshkova',
    'Rio_de_Janeiro_Botanical_Garden_(001).jpg',
    'CC BY-SA 4.0',
    BYSA4,
  ),
  'rio-santa-teresa-selaron': photo(
    'rio-santa-teresa-selaron',
    'Detalhe do mosaico de azulejos coloridos da Escadaria Selarón, em Santa Teresa',
    'Collectif Les Enfants',
    'Escadaria_do_Selar%C3%B3n_(9603331584).jpg',
    'CC BY 2.0',
    BY2,
  ),
}
