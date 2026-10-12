import { STYLE_LABELS } from '../data/labels'
import type { Currency, TravelStyle } from '../types'
import { formatCurrency } from './format'

/**
 * Orçamento e estilo financeiro (V1-T3.6).
 *
 * - Valores em CENTAVOS inteiros: nenhuma aritmética de ponto flutuante sobre
 *   dinheiro. O texto digitado é lido por regex, sem `parseFloat`.
 * - Moeda: a do destino no catálogo; não há conversão cambial.
 * - O motor usa `budget` como valor **por pessoa** (`PlanningInput.budget`).
 *   Valor total é dividido igualmente pelos viajantes, **arredondando para baixo
 *   ao centavo** (nunca superestima), e sem descontos presumidos para crianças
 *   ou bebês: todos contam como 1 participante.
 * - O orçamento é apenas um teto de seleção de atrações do motor (valores
 *   ilustrativos); não é dinheiro disponível para hospedagem, alimentação ou
 *   transporte, que o motor não calcula.
 */

export const TRAVEL_STYLE_OPTIONS = ['economico', 'equilibrado', 'confortavel'] as const satisfies readonly TravelStyle[]

export const DEFAULT_STYLE: TravelStyle = 'equilibrado'

/**
 * Limite provisório de entrada: 10.000.000,00 na moeda do destino. O motor só
 * exige valor > 0; o teto evita valores absurdos e mantém os centavos (e o total
 * multiplicado por até 20 viajantes) bem dentro dos inteiros seguros.
 */
export const MAX_AMOUNT_CENTS = 1_000_000_000

export type BudgetAmountMode = 'value' | 'undecided'
export type BudgetBasis = 'total' | 'perPerson'

export interface BudgetDraft {
  style: TravelStyle
  /** `undecided` = "Ainda não defini" (padrão): o orçamento é opcional. */
  amountMode: BudgetAmountMode
  /** Modalidade do valor informado. */
  basis: BudgetBasis
  /** Texto digitado ('' = vazio). */
  amount: string
}

export const DEFAULT_BUDGET: BudgetDraft = {
  style: DEFAULT_STYLE,
  amountMode: 'undecided',
  basis: 'total',
  amount: '',
}

export type AmountParse =
  | { status: 'empty' }
  | { status: 'valid'; cents: number }
  | { status: 'invalid'; message: string }

const AMOUNT_PATTERN = /^(\d{1,9})(?:[.,](\d{1,2}))?$/

/** Lê "1500", "1500,5", "1500.50" em centavos, sem ponto flutuante. */
export function parseAmount(text: string): AmountParse {
  const value = text.trim()
  if (value === '') return { status: 'empty' }
  if (value.startsWith('-')) return { status: 'invalid', message: 'O valor não pode ser negativo.' }
  const match = AMOUNT_PATTERN.exec(value)
  if (!match) {
    return {
      status: 'invalid',
      message: 'Use apenas números, com até 2 casas decimais (ex.: 2500 ou 2500,50).',
    }
  }
  const cents = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'))
  if (cents <= 0) return { status: 'invalid', message: 'Informe um valor maior que zero.' }
  if (cents > MAX_AMOUNT_CENTS) {
    return { status: 'invalid', message: 'O valor máximo aceito é 10.000.000,00.' }
  }
  return { status: 'valid', cents }
}

/** O orçamento é opcional: só bloqueia se houver texto inválido. */
export function isBudgetComplete(budget: BudgetDraft): boolean {
  return budget.amountMode === 'undecided' || parseAmount(budget.amount).status !== 'invalid'
}

export interface BudgetFigures {
  travelers: number
  totalCents: number
  /** Valor por pessoa em centavos (arredondado para baixo quando vem do total). */
  perPersonCents: number
  /** `true` quando a divisão do total não é exata (houve arredondamento para baixo). */
  rounded: boolean
}

/**
 * Valores equivalentes a partir do orçamento informado e do total de viajantes
 * (adultos + crianças + bebês, cada um contando 1). `null` sem valor válido.
 */
export function computeBudget(budget: BudgetDraft, travelers: number): BudgetFigures | null {
  if (budget.amountMode !== 'value' || !Number.isInteger(travelers) || travelers < 1) return null
  const parsed = parseAmount(budget.amount)
  if (parsed.status !== 'valid') return null
  if (budget.basis === 'perPerson') {
    return { travelers, totalCents: parsed.cents * travelers, perPersonCents: parsed.cents, rounded: false }
  }
  const perPersonCents = Math.floor(parsed.cents / travelers)
  return {
    travelers,
    totalCents: parsed.cents,
    perPersonCents,
    rounded: perPersonCents * travelers !== parsed.cents,
  }
}

export function centsToMoney(cents: number, currency: Currency): string {
  return formatCurrency(cents / 100, currency)
}

/** Texto decimal com ponto e 2 casas ("333.33") a partir de centavos inteiros. */
export function centsToInputValue(cents: number): string {
  const whole = Math.floor(cents / 100)
  const fraction = String(cents % 100).padStart(2, '0')
  return `${whole}.${fraction}`
}

export function describeBudget(budget: BudgetDraft, travelers: number, currency: Currency | null): string {
  const style = STYLE_LABELS[budget.style]
  const figures = currency ? computeBudget(budget, travelers) : null
  if (!figures || !currency) return `${style}; orçamento não informado`
  const per = centsToMoney(figures.perPersonCents, currency)
  const total = centsToMoney(figures.totalCents, currency)
  return budget.basis === 'total'
    ? `${style}; total de ${total} (${figures.rounded ? 'cerca de ' : ''}${per} por pessoa)`
    : `${style}; ${per} por pessoa (total de ${total})`
}
