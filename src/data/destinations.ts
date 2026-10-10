import type { Destination } from '../types'

/**
 * Base local de destinos do Travel Planner.
 *
 * ATENÇÃO: custos e durações são valores ILUSTRATIVOS, definidos apenas
 * para fins de demonstração do MVP. Não representam cotações atuais,
 * horários oficiais ou disponibilidade real de serviços.
 */
export const destinations: Destination[] = [
  {
    id: 'florianopolis',
    name: 'Florianópolis',
    country: 'Brasil',
    currency: { code: 'BRL', symbol: 'R$', locale: 'pt-BR' },
    description:
      'Capital catarinense conhecida pelas praias, trilhas, lagoas e pela forte tradição açoriana na gastronomia e na cultura.',
    transportNote:
      'A ilha é extensa: considere agrupar atividades da mesma região no mesmo dia. O centro pode ser percorrido a pé; para praias e trilhas mais afastadas, avalie ônibus urbano, aplicativos de transporte ou carro alugado.',
    activities: [
      {
        id: 'fln-trilha-lagoinha-do-leste',
        name: 'Trilha da Lagoinha do Leste',
        description:
          'Caminhada por mata atlântica até uma das praias mais preservadas da ilha, com mirante panorâmico.',
        categories: ['natureza', 'aventura'],
        durationHours: 5,
        estimatedCost: 0,
        recommendedPeriod: 'manha',
        suitableStyles: ['economico', 'equilibrado'],
      },
      {
        id: 'fln-jurere-internacional',
        name: 'Praia de Jurerê Internacional',
        description:
          'Praia de águas calmas com estrutura de beach clubs e orla organizada.',
        categories: ['relaxamento'],
        durationHours: 4,
        estimatedCost: 50,
        recommendedPeriod: 'tarde',
        suitableStyles: ['equilibrado', 'confortavel'],
      },
      {
        id: 'fln-mercado-publico',
        name: 'Mercado Público de Florianópolis',
        description:
          'Mercado histórico no centro da cidade, com boxes de frutos do mar, artesanato e produtos locais.',
        categories: ['gastronomia', 'cultura'],
        durationHours: 2,
        estimatedCost: 60,
        recommendedPeriod: 'manha',
        suitableStyles: ['economico', 'equilibrado', 'confortavel'],
      },
      {
        id: 'fln-santo-antonio-de-lisboa',
        name: 'Santo Antônio de Lisboa',
        description:
          'Vila de origem açoriana à beira-mar, conhecida pelos restaurantes de ostras e pelo pôr do sol.',
        categories: ['cultura', 'gastronomia'],
        durationHours: 3,
        estimatedCost: 80,
        recommendedPeriod: 'tarde',
        suitableStyles: ['equilibrado', 'confortavel'],
      },
      {
        id: 'fln-ilha-do-campeche',
        name: 'Ilha do Campeche',
        description:
          'Travessia de barco até ilha com águas cristalinas, trilhas e sítios arqueológicos com inscrições rupestres.',
        categories: ['aventura', 'natureza'],
        durationHours: 6,
        estimatedCost: 250,
        recommendedPeriod: 'manha',
        suitableStyles: ['equilibrado', 'confortavel'],
      },
      {
        id: 'fln-lagoa-da-conceicao',
        name: 'Lagoa da Conceição',
        description:
          'Lagoa no centro da ilha com ciclovia, esportes aquáticos e cafés à beira da água.',
        categories: ['natureza', 'relaxamento'],
        durationHours: 3,
        estimatedCost: 30,
        recommendedPeriod: 'tarde',
        suitableStyles: ['economico', 'equilibrado', 'confortavel'],
      },
      {
        id: 'fln-noite-lagoa',
        name: 'Bares da Lagoa da Conceição',
        description:
          'Circuito de bares e música ao vivo no centrinho da Lagoa, ponto tradicional da vida noturna local.',
        categories: ['vida-noturna'],
        durationHours: 4,
        estimatedCost: 120,
        recommendedPeriod: 'noite',
        suitableStyles: ['equilibrado', 'confortavel'],
      },
      {
        id: 'fln-shopping-beiramar',
        name: 'Shopping Beiramar',
        description:
          'Centro de compras à beira da Baía Norte, com lojas de marcas nacionais e praça de alimentação.',
        categories: ['compras'],
        durationHours: 3,
        estimatedCost: 200,
        recommendedPeriod: 'qualquer',
        suitableStyles: ['equilibrado', 'confortavel'],
      },
      {
        id: 'fln-fortaleza-sao-jose',
        name: 'Fortaleza de São José da Ponta Grossa',
        description:
          'Fortificação do século XVIII com vista para o estreito entre a ilha e o continente.',
        categories: ['cultura'],
        durationHours: 2,
        estimatedCost: 15,
        recommendedPeriod: 'manha',
        suitableStyles: ['economico', 'equilibrado'],
      },
      {
        id: 'fln-passeio-escuna',
        name: 'Passeio de escuna pela Baía Sul',
        description:
          'Navegação com paradas para banho e vista panorâmica do centro histórico a partir do mar.',
        categories: ['relaxamento', 'natureza'],
        durationHours: 4,
        estimatedCost: 150,
        recommendedPeriod: 'tarde',
        suitableStyles: ['confortavel'],
      },
    ],
  },
  {
    id: 'rio-de-janeiro',
    name: 'Rio de Janeiro',
    country: 'Brasil',
    currency: { code: 'BRL', symbol: 'R$', locale: 'pt-BR' },
    description:
      'Cidade maravilhosa que combina praias icônicas, montanhas, patrimônios culturais e uma vida noturna intensa.',
    transportNote:
      'A orla da Zona Sul é bem atendida por metrô e pode ser explorada a pé ou de bicicleta. Para o centro histórico e atrações mais distantes, considere metrô, VLT ou aplicativos de transporte, evitando horários de pico.',
    activities: [
      {
        id: 'rio-cristo-redentor',
        name: 'Cristo Redentor',
        description:
          'Visita ao monumento no topo do Corcovado, com vista panorâmica da cidade.',
        categories: ['cultura'],
        durationHours: 3,
        estimatedCost: 100,
        recommendedPeriod: 'manha',
        suitableStyles: ['economico', 'equilibrado', 'confortavel'],
      },
      {
        id: 'rio-pao-de-acucar',
        name: 'Pão de Açúcar',
        description:
          'Subida de bondinho até o morro com vista para a Baía de Guanabara e para a orla carioca.',
        categories: ['natureza'],
        durationHours: 3,
        estimatedCost: 160,
        recommendedPeriod: 'tarde',
        suitableStyles: ['equilibrado', 'confortavel'],
      },
      {
        id: 'rio-praia-copacabana',
        name: 'Praia de Copacabana',
        description:
          'Manhã de praia na orla mais famosa do Brasil, com quiosques e calçadão para caminhada.',
        categories: ['relaxamento'],
        durationHours: 4,
        estimatedCost: 30,
        recommendedPeriod: 'manha',
        suitableStyles: ['economico', 'equilibrado', 'confortavel'],
      },
      {
        id: 'rio-museu-do-amanha',
        name: 'Museu do Amanhã',
        description:
          'Museu de ciências na Praça Mauá, com exposições interativas sobre sustentabilidade e futuro do planeta.',
        categories: ['cultura'],
        durationHours: 3,
        estimatedCost: 30,
        recommendedPeriod: 'tarde',
        suitableStyles: ['economico', 'equilibrado'],
      },
      {
        id: 'rio-trilha-dois-irmaos',
        name: 'Trilha do Morro Dois Irmãos',
        description:
          'Trilha de dificuldade moderada no Vidigal, com mirante de vista ampla para a Zona Sul.',
        categories: ['aventura', 'natureza'],
        durationHours: 4,
        estimatedCost: 60,
        recommendedPeriod: 'manha',
        suitableStyles: ['economico', 'equilibrado'],
      },
      {
        id: 'rio-feira-ipanema',
        name: 'Feira Hippie de Ipanema',
        description:
          'Feira de artesanato, arte e moda na Praça General Osório, tradicional aos domingos.',
        categories: ['compras'],
        durationHours: 2,
        estimatedCost: 100,
        recommendedPeriod: 'qualquer',
        suitableStyles: ['economico', 'equilibrado'],
      },
      {
        id: 'rio-confeitaria-colombo',
        name: 'Confeitaria Colombo',
        description:
          'Café histórico de 1894 no centro da cidade, com salões decorados e doces tradicionais.',
        categories: ['gastronomia', 'cultura'],
        durationHours: 2,
        estimatedCost: 90,
        recommendedPeriod: 'tarde',
        suitableStyles: ['equilibrado', 'confortavel'],
      },
      {
        id: 'rio-lapa',
        name: 'Noite na Lapa',
        description:
          'Circuito de bares, casas de samba e música ao vivo no boêmio bairro da Lapa.',
        categories: ['vida-noturna'],
        durationHours: 4,
        estimatedCost: 130,
        recommendedPeriod: 'noite',
        suitableStyles: ['equilibrado', 'confortavel'],
      },
      {
        id: 'rio-jardim-botanico',
        name: 'Jardim Botânico',
        description:
          'Parque fundado em 1808 com coleções de plantas tropicais, orquidário e alamedas de palmeiras imperiais.',
        categories: ['natureza', 'relaxamento'],
        durationHours: 3,
        estimatedCost: 60,
        recommendedPeriod: 'manha',
        suitableStyles: ['economico', 'equilibrado', 'confortavel'],
      },
      {
        id: 'rio-santa-teresa-selaron',
        name: 'Santa Teresa e Escadaria Selarón',
        description:
          'Passeio pelo bairro histórico de ladeiras e ateliês, incluindo a famosa escadaria de azulejos.',
        categories: ['cultura'],
        durationHours: 3,
        estimatedCost: 40,
        recommendedPeriod: 'tarde',
        suitableStyles: ['economico', 'equilibrado'],
      },
    ],
  },
  {
    id: 'lisboa',
    name: 'Lisboa',
    country: 'Portugal',
    currency: { code: 'EUR', symbol: '€', locale: 'pt-PT' },
    description:
      'Capital portuguesa de colinas, miradouros e elétricos, com rica herança marítima, gastronomia marcante e bairros históricos.',
    transportNote:
      'O centro histórico é compacto e caminhável, mas tem muitas ladeiras: calçado confortável ajuda. Metrô, elétricos e trens urbanos cobrem as regiões mais afastadas; para Sintra, considere o trem a partir do centro de Lisboa.',
    activities: [
      {
        id: 'lis-torre-de-belem',
        name: 'Torre de Belém',
        description:
          'Fortaleza manuelina às margens do Tejo, símbolo da era dos descobrimentos portugueses.',
        categories: ['cultura'],
        durationHours: 2,
        estimatedCost: 10,
        recommendedPeriod: 'manha',
        suitableStyles: ['economico', 'equilibrado', 'confortavel'],
      },
      {
        id: 'lis-mosteiro-jeronimos',
        name: 'Mosteiro dos Jerónimos',
        description:
          'Mosteiro do século XVI com claustro ornamentado, Patrimônio Mundial da UNESCO.',
        categories: ['cultura'],
        durationHours: 2,
        estimatedCost: 12,
        recommendedPeriod: 'manha',
        suitableStyles: ['economico', 'equilibrado', 'confortavel'],
      },
      {
        id: 'lis-pasteis-de-belem',
        name: 'Pastéis de Belém',
        description:
          'Degustação dos tradicionais pastéis de nata na confeitaria original, fundada em 1837.',
        categories: ['gastronomia'],
        durationHours: 1,
        estimatedCost: 8,
        recommendedPeriod: 'qualquer',
        suitableStyles: ['economico', 'equilibrado', 'confortavel'],
      },
      {
        id: 'lis-alfama-santa-luzia',
        name: 'Alfama e Miradouro de Santa Luzia',
        description:
          'Caminhada pelas ruelas do bairro mais antigo de Lisboa, com parada no miradouro de azulejos.',
        categories: ['cultura', 'relaxamento'],
        durationHours: 3,
        estimatedCost: 0,
        recommendedPeriod: 'tarde',
        suitableStyles: ['economico', 'equilibrado'],
      },
      {
        id: 'lis-castelo-sao-jorge',
        name: 'Castelo de São Jorge',
        description:
          'Castelo medieval no topo da colina, com muralhas e vista panorâmica sobre a cidade e o Tejo.',
        categories: ['cultura'],
        durationHours: 2,
        estimatedCost: 15,
        recommendedPeriod: 'manha',
        suitableStyles: ['economico', 'equilibrado'],
      },
      {
        id: 'lis-oceanario',
        name: 'Oceanário de Lisboa',
        description:
          'Um dos maiores aquários da Europa, localizado no Parque das Nações.',
        categories: ['natureza'],
        durationHours: 3,
        estimatedCost: 25,
        recommendedPeriod: 'tarde',
        suitableStyles: ['equilibrado', 'confortavel'],
      },
      {
        id: 'lis-bairro-alto',
        name: 'Noite no Bairro Alto',
        description:
          'Bairro boêmio com dezenas de bares e casas de fado nas ruas estreitas do centro.',
        categories: ['vida-noturna'],
        durationHours: 4,
        estimatedCost: 40,
        recommendedPeriod: 'noite',
        suitableStyles: ['equilibrado', 'confortavel'],
      },
      {
        id: 'lis-lx-factory',
        name: 'LX Factory',
        description:
          'Antiga zona industrial transformada em polo criativo, com lojas de design, livrarias e cafés.',
        categories: ['compras', 'cultura'],
        durationHours: 3,
        estimatedCost: 50,
        recommendedPeriod: 'tarde',
        suitableStyles: ['equilibrado', 'confortavel'],
      },
      {
        id: 'lis-sintra-palacio-pena',
        name: 'Bate-volta a Sintra (Palácio da Pena)',
        description:
          'Dia dedicado ao palácio romântico e às serras de Sintra, vila histórica próxima a Lisboa.',
        categories: ['cultura', 'natureza', 'aventura'],
        durationHours: 8,
        estimatedCost: 60,
        recommendedPeriod: 'manha',
        suitableStyles: ['equilibrado', 'confortavel'],
      },
      {
        id: 'lis-time-out-market',
        name: 'Time Out Market',
        description:
          'Mercado gastronômico no Cais do Sodré que reúne quiosques de chefs e pratos típicos portugueses.',
        categories: ['gastronomia'],
        durationHours: 2,
        estimatedCost: 35,
        recommendedPeriod: 'qualquer',
        suitableStyles: ['equilibrado', 'confortavel'],
      },
    ],
  },
]
