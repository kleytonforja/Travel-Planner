import type { DayPeriod, InterestCategory, TravelStyle } from '../types'

/**
 * Rótulos em português brasileiro para os valores de domínio.
 * Centralizados aqui para manter a interface consistente.
 */

export const INTEREST_LABELS: Record<InterestCategory, string> = {
  gastronomia: 'Gastronomia',
  natureza: 'Natureza',
  cultura: 'Cultura',
  aventura: 'Aventura',
  compras: 'Compras',
  relaxamento: 'Relaxamento',
  'vida-noturna': 'Vida noturna',
}

export const STYLE_LABELS: Record<TravelStyle, string> = {
  economico: 'Econômico',
  equilibrado: 'Equilibrado',
  confortavel: 'Confortável',
}

export const STYLE_DESCRIPTIONS: Record<TravelStyle, string> = {
  economico: 'Prioriza atividades gratuitas ou de baixo custo.',
  equilibrado: 'Combina atrações gratuitas e pagas com equilíbrio.',
  confortavel: 'Inclui experiências premium e maior comodidade.',
}

export const PERIOD_LABELS: Record<DayPeriod, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
  qualquer: 'Qualquer período',
}
