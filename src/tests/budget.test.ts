import { describe, expect, it } from 'vitest'

import {
  centsToInputValue,
  centsToMoney,
  computeBudget,
  DEFAULT_BUDGET,
  describeBudget,
  engineBudgetInput,
  isBudgetComplete,
  MAX_AMOUNT_CENTS,
  parseAmount,
  type BudgetDraft,
} from '../utils/budget'

const BRL = { code: 'BRL', symbol: 'R$', locale: 'pt-BR' }
const EUR = { code: 'EUR', symbol: '€', locale: 'pt-PT' }
const value = (amount: string, basis: BudgetDraft['basis'] = 'total'): BudgetDraft => ({
  ...DEFAULT_BUDGET,
  amountMode: 'value',
  basis,
  amount,
})

describe('parseAmount', () => {
  it.each([
    ['2500', 250000],
    ['2500,5', 250050],
    ['2500.50', 250050],
    ['0,01', 1],
    ['  1500,00 ', 150000],
    ['0.1', 10],
    ['0.29', 29], // 0.29 * 100 em ponto flutuante daria 28.999…
    ['19.99', 1999],
    ['10000000', MAX_AMOUNT_CENTS],
  ])('lê %j como %i centavos', (text, cents) => {
    expect(parseAmount(text)).toEqual({ status: 'valid', cents })
  })

  it('campo vazio não é erro', () => {
    expect(parseAmount('')).toEqual({ status: 'empty' })
    expect(parseAmount('   ')).toEqual({ status: 'empty' })
  })

  it.each(['-5', '-0', 'abc', '1e3', '1.234,56', '12,345', '1,', ',5', 'R$ 100', '1 000', '0', '0,00', '10000000,01', '99999999999'])(
    'rejeita %j',
    (text) => {
      expect(parseAmount(text).status).toBe('invalid')
    },
  )

  it('mensagem específica para negativo e zero', () => {
    expect(parseAmount('-5')).toMatchObject({ message: expect.stringContaining('negativo') })
    expect(parseAmount('0')).toMatchObject({ message: expect.stringContaining('maior que zero') })
  })
})

describe('computeBudget', () => {
  it('valor total é dividido entre todos os viajantes, arredondando para baixo', () => {
    expect(computeBudget(value('3000'), 3)).toEqual({ travelers: 3, totalCents: 300000, perPersonCents: 100000, rounded: false })
    const uneven = computeBudget(value('1000'), 3)
    expect(uneven).toEqual({ travelers: 3, totalCents: 100000, perPersonCents: 33333, rounded: true })
    // Nunca superestima: por pessoa × viajantes ≤ total.
    expect(uneven!.perPersonCents * 3).toBeLessThanOrEqual(uneven!.totalCents)
  })

  it('valor por pessoa é multiplicado sem arredondar', () => {
    expect(computeBudget(value('333,33', 'perPerson'), 3)).toEqual({
      travelers: 3,
      totalCents: 99999,
      perPersonCents: 33333,
      rounded: false,
    })
  })

  it('adultos, crianças e bebês contam igualmente (sem descontos): só o total de viajantes importa', () => {
    expect(computeBudget(value('900'), 3)!.perPersonCents).toBe(30000)
    expect(computeBudget(value('900'), 1)!.perPersonCents).toBe(90000)
    expect(computeBudget(value('900'), 20)!.perPersonCents).toBe(4500)
  })

  it('recalcula ao mudar a quantidade de viajantes', () => {
    expect(computeBudget(value('1200'), 2)!.perPersonCents).toBe(60000)
    expect(computeBudget(value('1200'), 4)!.perPersonCents).toBe(30000)
    expect(computeBudget(value('1200', 'perPerson'), 4)!.totalCents).toBe(480000)
  })

  it('sem valor utilizável devolve null', () => {
    expect(computeBudget(DEFAULT_BUDGET, 2)).toBeNull()
    expect(computeBudget(value(''), 2)).toBeNull()
    expect(computeBudget(value('abc'), 2)).toBeNull()
    expect(computeBudget({ ...value('100'), amountMode: 'undecided' }, 2)).toBeNull()
    expect(computeBudget(value('100'), 0)).toBeNull()
  })

  it('total máximo × 20 viajantes continua em inteiros seguros', () => {
    const figures = computeBudget(value('10000000', 'perPerson'), 20)!
    expect(Number.isSafeInteger(figures.totalCents)).toBe(true)
  })
})

describe('integração com o motor', () => {
  it('entrega ao formulário o valor por pessoa em texto aceito pelo campo numérico', () => {
    expect(engineBudgetInput(value('3000'), 3)).toBe('1000.00')
    expect(engineBudgetInput(value('1000'), 3)).toBe('333.33')
    expect(engineBudgetInput(value('250,5', 'perPerson'), 2)).toBe('250.50')
    expect(engineBudgetInput(value('0,05'), 20)).toBe('') // 0 centavo por pessoa: inutilizável
    expect(engineBudgetInput(DEFAULT_BUDGET, 2)).toBe('')
  })

  it('centsToInputValue preserva os zeros dos centavos', () => {
    expect(centsToInputValue(5)).toBe('0.05')
    expect(centsToInputValue(100)).toBe('1.00')
    expect(centsToInputValue(123456)).toBe('1234.56')
  })
})

describe('opcionalidade e descrição', () => {
  it('o orçamento é opcional: só texto inválido bloqueia', () => {
    expect(isBudgetComplete(DEFAULT_BUDGET)).toBe(true)
    expect(isBudgetComplete(value(''))).toBe(true)
    expect(isBudgetComplete(value('2500'))).toBe(true)
    expect(isBudgetComplete(value('-1'))).toBe(false)
    expect(isBudgetComplete({ ...value('-1'), amountMode: 'undecided' })).toBe(true)
  })

  it('o estilo padrão é Equilibrado', () => {
    expect(DEFAULT_BUDGET.style).toBe('equilibrado')
    expect(DEFAULT_BUDGET.amountMode).toBe('undecided')
  })

  it('formata na moeda do destino, sem conversão', () => {
    expect(centsToMoney(250000, BRL)).toContain('2.500,00')
    expect(centsToMoney(250000, BRL)).toContain('R$')
    expect(centsToMoney(250000, EUR)).toContain('€')
  })

  it('descreve o orçamento deixando clara a modalidade', () => {
    expect(describeBudget(DEFAULT_BUDGET, 2, BRL)).toBe('Equilibrado; valor não definido')
    expect(describeBudget(value('3000'), 3, BRL)).toMatch(/^Equilibrado; total de .*3\.000,00.* \(.*1\.000,00.* por pessoa\)$/)
    expect(describeBudget(value('1000'), 3, BRL)).toContain('cerca de')
    expect(describeBudget({ ...value('500', 'perPerson'), style: 'economico' }, 2, BRL)).toMatch(/^Econômico; .*500,00.* por pessoa \(total de .*1\.000,00.*\)$/)
  })
})
