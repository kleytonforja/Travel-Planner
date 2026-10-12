import { describe, expect, it } from 'vitest'

import { buildPlanningInput } from '../components/planning/planningAdapter'
import { EMPTY_DRAFT, type PlanningDraft } from '../components/planning/planningSteps'
import { generateItinerary } from '../services/itineraryGenerator'
import { DEFAULT_BUDGET } from '../utils/budget'
import { DEFAULT_TRAVELERS } from '../utils/travelers'

const complete = (patch: Partial<PlanningDraft> = {}): PlanningDraft => ({
  ...EMPTY_DRAFT,
  destinationId: 'rio-de-janeiro',
  dateMode: 'duration',
  durationDays: 5,
  interests: ['cultura', 'natureza'],
  budget: { ...DEFAULT_BUDGET, amountMode: 'value', basis: 'perPerson', amount: '1500' },
  ...patch,
})

describe('buildPlanningInput', () => {
  it('converte o rascunho no contrato do motor (valor por pessoa direto)', () => {
    const result = buildPlanningInput(complete())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.input).toEqual({
      destinationId: 'rio-de-janeiro',
      days: 5,
      interests: ['cultura', 'natureza'],
      style: 'equilibrado',
      budget: 1500,
    })
    expect(result.destination.id).toBe('rio-de-janeiro')
  })

  it('valor total vira valor por pessoa em centavos, arredondando para baixo', () => {
    const three = { ...DEFAULT_TRAVELERS, adults: 2, children: 1 }
    const result = buildPlanningInput(
      complete({ travelers: three, budget: { ...DEFAULT_BUDGET, amountMode: 'value', basis: 'total', amount: '1000' } }),
    )
    expect(result.ok && result.input.budget).toBe(333.33)
  })

  it('a duração vem das datas quando o modo é "datas"', () => {
    const result = buildPlanningInput(complete({ dateMode: 'dates', startDate: '2999-01-10', endDate: '2999-01-13' }))
    expect(result.ok && result.input.days).toBe(4)
  })

  it('usa o estilo financeiro escolhido', () => {
    const result = buildPlanningInput(complete({ budget: { ...DEFAULT_BUDGET, style: 'economico', amountMode: 'value', basis: 'perPerson', amount: '800' } }))
    expect(result.ok && result.input.style).toBe('economico')
  })

  it('sem orçamento bloqueia em vez de inventar valor', () => {
    for (const budget of [DEFAULT_BUDGET, { ...DEFAULT_BUDGET, amountMode: 'value' as const, amount: '' }]) {
      const result = buildPlanningInput(complete({ budget }))
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.issues).toEqual([{ step: 'orcamento', message: expect.stringContaining('Informe um orçamento') }])
    }
  })

  it('orçamento inválido ou pequeno demais é apontado na etapa de orçamento', () => {
    const bad = buildPlanningInput(complete({ budget: { ...DEFAULT_BUDGET, amountMode: 'value', basis: 'perPerson', amount: '-5' } }))
    expect(!bad.ok && bad.issues[0]).toMatchObject({ step: 'orcamento', message: expect.stringContaining('Corrija') })
    const tiny = buildPlanningInput(
      complete({
        travelers: { ...DEFAULT_TRAVELERS, adults: 20 },
        budget: { ...DEFAULT_BUDGET, amountMode: 'value', basis: 'total', amount: '0,05' },
      }),
    )
    expect(tiny.ok).toBe(false)
  })

  it('estados incompletos apontam a etapa certa', () => {
    const empty = buildPlanningInput(EMPTY_DRAFT)
    expect(empty.ok).toBe(false)
    if (empty.ok) return
    expect(empty.issues.map((issue) => issue.step).sort()).toEqual(['datas', 'destino', 'interesses', 'orcamento'])

    const noDays = buildPlanningInput(complete({ dateMode: 'dates', startDate: '', endDate: '' }))
    expect(!noDays.ok && noDays.issues.map((i) => i.step)).toEqual(['datas'])
    const noInterest = buildPlanningInput(complete({ interests: [] }))
    expect(!noInterest.ok && noInterest.issues.map((i) => i.step)).toEqual(['interesses'])
    const noDestination = buildPlanningInput(complete({ destinationId: '' }))
    expect(!noDestination.ok && noDestination.issues.map((i) => i.step)).toEqual(['destino'])
  })

  it('não leva transporte, ritmo, perfil nem acessibilidade ao motor (contrato inalterado)', () => {
    const result = buildPlanningInput(
      complete({ pace: 'intenso', transport: { arrival: 'aviao', origin: 'Curitiba', local: ['taxi-app'] } }),
    )
    expect(result.ok && Object.keys(result.input).sort()).toEqual(['budget', 'days', 'destinationId', 'interests', 'style'])
  })

  it('o roteiro gerado é idêntico ao do formulário tradicional para a mesma entrada', () => {
    const result = buildPlanningInput(complete())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const viaAdapter = generateItinerary(result.input, result.destination)
    const direct = generateItinerary({ ...result.input }, result.destination)
    expect(viaAdapter).toEqual(direct)
    expect(viaAdapter.ok).toBe(true)
  })
})
