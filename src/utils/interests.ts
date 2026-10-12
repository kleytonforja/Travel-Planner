import { INTEREST_LABELS } from '../data/labels'
import type { InterestCategory } from '../types'

/**
 * Interesses e ritmo da viagem (V1-T3.5).
 *
 * Interesses: somente as categorias que o catálogo e o motor reconhecem
 * (`InterestCategory`); não existem subcategorias estruturadas nos dados.
 * Ritmo: preferência declarada. O motor de roteiros NÃO possui parâmetro de
 * ritmo (o `style` do motor é econômico/equilibrado/confortável, que trata de
 * custo), então o ritmo ainda não altera o roteiro (integração no V1-T3.7).
 */

/** Categorias oferecidas, na ordem do catálogo de rótulos. */
export const INTEREST_OPTIONS = Object.keys(INTEREST_LABELS) as InterestCategory[]

export const INTEREST_DESCRIPTIONS: Record<InterestCategory, string> = {
  gastronomia: 'Restaurantes, mercados e sabores locais.',
  natureza: 'Parques, praias e paisagens.',
  cultura: 'Museus, história e patrimônio.',
  aventura: 'Trilhas e atividades ao ar livre.',
  compras: 'Lojas, feiras e mercados.',
  relaxamento: 'Descanso e passeios leves.',
  'vida-noturna': 'Bares, música e programação à noite.',
}

export const TRIP_PACES = [
  { id: 'tranquilo', label: 'Tranquilo', description: 'Poucas atividades por dia, com tempo livre.' },
  { id: 'equilibrado', label: 'Equilibrado', description: 'Um meio-termo entre passeios e descanso.' },
  { id: 'intenso', label: 'Intenso', description: 'Aproveitar ao máximo cada dia.' },
] as const

export type TripPace = (typeof TRIP_PACES)[number]['id']

export const DEFAULT_PACE: TripPace = 'equilibrado'

/** Alterna um interesse mantendo a ordem do catálogo e as demais escolhas. */
export function toggleInterest(current: InterestCategory[], interest: InterestCategory): InterestCategory[] {
  if (current.includes(interest)) return current.filter((item) => item !== interest)
  const wanted = new Set([...current, interest])
  return INTEREST_OPTIONS.filter((item) => wanted.has(item))
}

/** O motor exige ao menos um interesse. */
export function hasInterests(interests: InterestCategory[]): boolean {
  return interests.length > 0
}

export function describeInterests(interests: InterestCategory[], pace: TripPace): string {
  const paceLabel = TRIP_PACES.find((item) => item.id === pace)?.label ?? ''
  const list = interests.length > 0 ? interests.map((item) => INTEREST_LABELS[item]).join(', ') : 'nenhum selecionado'
  return `${list}; ritmo ${paceLabel.toLowerCase()}`
}
