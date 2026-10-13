/**
 * Fotografias das atrações do Rio de Janeiro (M5.3), de Florianópolis e de Lisboa (M5.5) e seus créditos.
 *
 * Todas vêm do Wikimedia Commons, cada uma sob a licença registrada na página do próprio arquivo
 * (CC0, CC BY 2.0/3.0/4.0, CC BY-SA 3.0, 3.0 DE ou 4.0); só a CC0 dispensa atribuição (o crédito é dado
 * mesmo assim). As versões em `public/images/activities/` são recortes quadrados convertidos para WebP
 * (480 e 960 px), sem outra edição; nas licenças BY-SA, essas versões derivadas permanecem sob a mesma
 * licença. Verificação por arquivo e pendências: `docs/IMAGE_CREDITS.md`. Não houve revisão jurídica.
 *
 * A chave é o identificador da atração no catálogo; atrações sem entrada (Feira Hippie de Ipanema, Bares
 * da Lagoa, Passeio de escuna, Pastéis de Belém, LX Factory e Time Out Market) continuam com o
 * placeholder. Nada disso é gravado nos roteiros salvos nem no JSON.
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
const CC0 = 'https://creativecommons.org/publicdomain/zero/1.0/'
const BY2 = 'https://creativecommons.org/licenses/by/2.0/'
const BY3 = 'https://creativecommons.org/licenses/by/3.0/'
const BY4 = 'https://creativecommons.org/licenses/by/4.0/'
const BYSA3 = 'https://creativecommons.org/licenses/by-sa/3.0/'
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

  // Florianópolis (M5.5)
  'fln-trilha-lagoinha-do-leste': photo(
    'fln-trilha-lagoinha-do-leste',
    'Praia da Lagoinha do Leste vista do alto da trilha, com bromélias em primeiro plano e a enseada ao fundo',
    'Papa Pic',
    'Praia_da_Lagoinha_do_Leste,_Florian%C3%B3polis.jpg',
    'CC0',
    CC0,
  ),
  'fln-jurere-internacional': photo(
    'fln-jurere-internacional',
    'Praia de Jurerê Internacional vista do alto, com a faixa de areia e o mar (a imagem não mostra os beach clubs)',
    'Rafael Bernardino Mattei',
    'Praia_de_Jurer%C3%AA_Internacional.JPG',
    'CC BY-SA 3.0',
    BYSA3,
  ),
  'fln-mercado-publico': photo(
    'fln-mercado-publico',
    'Fachada do Mercado Público de Florianópolis, com as duas torres e o pátio calçado à frente',
    'Rodrigo Soldon',
    'Mercado_P%C3%BAblico_de_Florian%C3%B3polis_(3887553534).jpg',
    'CC BY 2.0',
    BY2,
  ),
  'fln-santo-antonio-de-lisboa': photo(
    'fln-santo-antonio-de-lisboa',
    'Pedras na orla de Santo Antônio de Lisboa, com a baía ao fundo (a imagem mostra a orla, não o casario nem as ostras)',
    'Simone Balster',
    'Santo_Antonio_de_Lisboa,_Florian%C3%B3polis_06.jpg',
    'CC BY-SA 4.0',
    BYSA4,
  ),
  'fln-ilha-do-campeche': photo(
    'fln-ilha-do-campeche',
    'Ilha do Campeche vista do mar, com a mata e a faixa de areia da ilha ao fundo',
    'Rodrigo Soldon',
    'Ilha_do_Campeche_(3444645238).jpg',
    'CC BY 2.0',
    BY2,
  ),
  'fln-lagoa-da-conceicao': photo(
    'fln-lagoa-da-conceicao',
    'Barco atracado em um trapiche na Lagoa da Conceição, com morros ao fundo',
    'Josue Marinho',
    'Florian%C3%B3polis_SC_Brasil_-_Lagoa_da_Concei%C3%A7%C3%A3o_-_panoramio.jpg',
    'CC BY 3.0',
    BY3,
  ),
  'fln-shopping-beiramar': photo(
    'fln-shopping-beiramar',
    'Fachada do Shopping Beiramar à noite, com decoração natalina iluminada',
    'Rachmaninoff',
    'Fachada_Beiramar_dez_2016.jpg',
    'CC BY-SA 4.0',
    BYSA4,
  ),
  'fln-fortaleza-sao-jose': photo(
    'fln-fortaleza-sao-jose',
    'Muralhas de pedra e edificações da Fortaleza de São José da Ponta Grossa',
    'Luiz Pantoja',
    'Fortaleza_de_S%C3%A3o_Jos%C3%A9_da_Ponta_Grossa_SC_(3950234623).jpg',
    'CC BY 2.0',
    BY2,
  ),

  // Lisboa (M5.5)
  'lis-torre-de-belem': photo(
    'lis-torre-de-belem',
    'Torre de Belém, em Lisboa, vista do lado do rio sob o céu azul',
    'Ingo Mehling',
    'Torre_de_Belem_-_Outside.jpg',
    'CC BY-SA 4.0',
    BYSA4,
  ),
  'lis-mosteiro-jeronimos': photo(
    'lis-mosteiro-jeronimos',
    'Claustro do Mosteiro dos Jerónimos, com galerias em estilo manuelino e pátio gramado',
    'Jakub Hałun',
    'Cloister_of_the_Jer%C3%B3nimos_Monastery_in_Bel%C3%A9m,_Lisbon,_20250604_1309_9188.jpg',
    'CC BY 4.0',
    BY4,
  ),
  'lis-alfama-santa-luzia': photo(
    'lis-alfama-santa-luzia',
    'Telhados de Alfama e o rio Tejo vistos do Miradouro de Santa Luzia',
    'Dale Cruse',
    'Miradouro_de_Santa_Luzia_View_over_Alfama,_Lisbon_(54733651122).jpg',
    'CC BY 4.0',
    BY4,
  ),
  'lis-castelo-sao-jorge': photo(
    'lis-castelo-sao-jorge',
    'Torre e muralhas do Castelo de São Jorge, em Lisboa, sob o céu azul',
    'Berthold Werner',
    'Lisbon_Castelo_de_S%C3%A3o_Jorge_BW_2018-10-03_11-13-09.jpg',
    'CC BY-SA 4.0',
    BYSA4,
  ),
  'lis-oceanario': photo(
    'lis-oceanario',
    'Tanque central do Oceanário de Lisboa, com peixes e a silhueta de um visitante de braços abertos',
    'Sonse',
    'The_size_of_Lisbon_Oceanarium.jpg',
    'CC BY 2.0',
    BY2,
  ),
  'lis-bairro-alto': photo(
    'lis-bairro-alto',
    'Rua do Bairro Alto ao anoitecer, com prédios iluminados (a imagem mostra a rua, não bares nem casas de fado)',
    'Jorge Franganillo',
    'Lisboa_Bairro_Alto_(53893930842).jpg',
    'CC BY 2.0',
    BY2,
  ),
  'lis-sintra-palacio-pena': photo(
    'lis-sintra-palacio-pena',
    'Muralhas e torres amarelas do Palácio da Pena, em Sintra',
    'Jakub Hałun',
    'Pena_Palace,_Sintra,_Portugal,_20250606_1036_0001.jpg',
    'CC BY 4.0',
    BY4,
  ),
}
