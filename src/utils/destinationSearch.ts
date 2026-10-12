import { INTEREST_LABELS } from '../data/labels'
import type { Destination, InterestCategory } from '../types'

/**
 * Pesquisa e filtragem de destinos do catálogo local. Funções puras: usam
 * apenas os dados já existentes (nome, país, descrição e categorias das
 * atividades), sem duplicar registros.
 */

export type DestinationFilter =
  | { kind: 'all' }
  | { kind: 'country'; value: string }
  | { kind: 'category'; value: InterestCategory }

export interface FilterOption {
  /** Chave estável do filtro (usada como `key` e para comparação). */
  key: string
  label: string
  filter: DestinationFilter
}

export const ALL_FILTER: DestinationFilter = { kind: 'all' }

/** Minúsculas, sem acentos e sem espaços nas pontas. */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/** Categorias distintas das atividades de um destino, na ordem do rótulo oficial. */
export function destinationCategories(destination: Destination): InterestCategory[] {
  const present = new Set<InterestCategory>(
    destination.activities.flatMap((activity) => activity.categories),
  )
  return (Object.keys(INTEREST_LABELS) as InterestCategory[]).filter((category) =>
    present.has(category),
  )
}

export function filterKey(filter: DestinationFilter): string {
  return filter.kind === 'all' ? 'all' : `${filter.kind}:${filter.value}`
}

/** Opções de filtro derivadas do catálogo: "Todos", países e categorias existentes. */
export function buildFilterOptions(list: readonly Destination[]): FilterOption[] {
  const countries = [...new Set(list.map((destination) => destination.country))]
  const categories = (Object.keys(INTEREST_LABELS) as InterestCategory[]).filter(
    (category) => list.some((destination) => destinationCategories(destination).includes(category)),
  )
  const options: FilterOption[] = [{ key: 'all', label: 'Todos', filter: ALL_FILTER }]
  for (const country of countries) {
    const filter: DestinationFilter = { kind: 'country', value: country }
    options.push({ key: filterKey(filter), label: country, filter })
  }
  for (const category of categories) {
    const filter: DestinationFilter = { kind: 'category', value: category }
    options.push({ key: filterKey(filter), label: INTEREST_LABELS[category], filter })
  }
  return options
}

function matchesFilter(destination: Destination, filter: DestinationFilter): boolean {
  switch (filter.kind) {
    case 'all':
      return true
    case 'country':
      return destination.country === filter.value
    case 'category':
      return destinationCategories(destination).includes(filter.value)
  }
}

function searchableText(destination: Destination): string {
  return normalizeText(
    [
      destination.name,
      destination.country,
      destination.description,
      ...destinationCategories(destination).map((category) => INTEREST_LABELS[category]),
    ].join(' '),
  )
}

/**
 * Destinos que atendem ao filtro e à pesquisa. Todos os termos digitados
 * (separados por espaço) precisam aparecer, sem diferenciar maiúsculas nem
 * acentos. Pesquisa vazia retorna todos os destinos do filtro.
 */
export function filterDestinations(
  list: readonly Destination[],
  query: string,
  filter: DestinationFilter = ALL_FILTER,
): Destination[] {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean)
  return list.filter((destination) => {
    if (!matchesFilter(destination, filter)) return false
    if (terms.length === 0) return true
    const text = searchableText(destination)
    return terms.every((term) => text.includes(term))
  })
}
