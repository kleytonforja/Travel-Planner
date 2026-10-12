import { describe, expect, it } from 'vitest'

import { destinations } from '../data/destinations'
import { INTEREST_LABELS } from '../data/labels'
import type { InterestCategory } from '../types'
import {
  ALL_FILTER,
  buildFilterOptions,
  destinationCategories,
  filterDestinations,
  filterKey,
  normalizeText,
} from '../utils/destinationSearch'

const names = (list: readonly { name: string }[]) => list.map((item) => item.name)

describe('normalizeText', () => {
  it('ignora acentos, caixa e espaços nas pontas', () => {
    expect(normalizeText('  Florianópolis ')).toBe('florianopolis')
    expect(normalizeText('SÃO JOSÉ')).toBe('sao jose')
    expect(normalizeText('Açúcar')).toBe('acucar')
  })
})

describe('filterDestinations', () => {
  it('pesquisa vazia ou só com espaços devolve todos os destinos', () => {
    expect(names(filterDestinations(destinations, ''))).toEqual(names(destinations))
    expect(filterDestinations(destinations, '   ')).toHaveLength(destinations.length)
  })

  it('encontra por nome, sem diferenciar acentos ou maiúsculas', () => {
    expect(names(filterDestinations(destinations, 'lisboa'))).toEqual(['Lisboa'])
    expect(names(filterDestinations(destinations, 'FLORIANOPOLIS'))).toEqual(['Florianópolis'])
    expect(names(filterDestinations(destinations, 'florianópolis'))).toEqual(['Florianópolis'])
  })

  it('encontra por país e por trecho do nome', () => {
    expect(names(filterDestinations(destinations, 'brasil'))).toEqual(['Florianópolis', 'Rio de Janeiro'])
    expect(names(filterDestinations(destinations, 'portug'))).toEqual(['Lisboa'])
    expect(names(filterDestinations(destinations, 'janeiro'))).toEqual(['Rio de Janeiro'])
  })

  it('exige todos os termos digitados', () => {
    expect(names(filterDestinations(destinations, 'rio brasil'))).toEqual(['Rio de Janeiro'])
    expect(filterDestinations(destinations, 'rio portugal')).toEqual([])
  })

  it('encontra pelas categorias das atividades do destino', () => {
    for (const destination of destinations) {
      for (const category of destinationCategories(destination)) {
        const found = filterDestinations(destinations, INTEREST_LABELS[category])
        expect(names(found)).toContain(destination.name)
      }
    }
  })

  it('devolve lista vazia quando nada corresponde', () => {
    expect(filterDestinations(destinations, 'xyzabc')).toEqual([])
  })

  it('aplica filtros de país e de categoria', () => {
    expect(names(filterDestinations(destinations, '', { kind: 'country', value: 'Portugal' }))).toEqual(['Lisboa'])
    expect(
      filterDestinations(destinations, '', { kind: 'country', value: 'Brasil' }),
    ).toHaveLength(2)
    const nightlife = filterDestinations(destinations, '', { kind: 'category', value: 'vida-noturna' })
    for (const destination of nightlife) {
      expect(destinationCategories(destination)).toContain('vida-noturna')
    }
    expect(nightlife.length).toBeGreaterThan(0)
  })

  it('combina pesquisa e filtro', () => {
    const result = filterDestinations(destinations, 'rio', { kind: 'country', value: 'Brasil' })
    expect(names(result)).toEqual(['Rio de Janeiro'])
    expect(filterDestinations(destinations, 'rio', { kind: 'country', value: 'Portugal' })).toEqual([])
  })

  it('não altera o catálogo nem duplica registros', () => {
    const before = JSON.stringify(destinations)
    const result = filterDestinations(destinations, 'lisboa')
    expect(result[0]).toBe(destinations.find((item) => item.id === 'lisboa'))
    expect(JSON.stringify(destinations)).toBe(before)
  })
})

describe('buildFilterOptions', () => {
  const options = buildFilterOptions(destinations)

  it('começa com "Todos" e inclui os países e as categorias existentes no catálogo', () => {
    expect(options[0]).toMatchObject({ label: 'Todos', key: 'all' })
    const labels = options.map((option) => option.label)
    expect(labels).toContain('Brasil')
    expect(labels).toContain('Portugal')
    const present = new Set<InterestCategory>(
      destinations.flatMap((destination) => destinationCategories(destination)),
    )
    for (const category of present) {
      expect(labels).toContain(INTEREST_LABELS[category])
    }
  })

  it('usa chaves únicas e coerentes com o filtro', () => {
    const keys = options.map((option) => option.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const option of options) {
      expect(filterKey(option.filter)).toBe(option.key)
    }
    expect(filterKey(ALL_FILTER)).toBe('all')
  })

  it('toda opção devolve ao menos um destino', () => {
    for (const option of options) {
      expect(filterDestinations(destinations, '', option.filter).length).toBeGreaterThan(0)
    }
  })
})
