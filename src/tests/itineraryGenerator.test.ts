import { describe, expect, it } from 'vitest'

import { destinations } from '../data/destinations'
import {
  generateItinerary,
  SLOT_WINDOWS,
} from '../services/itineraryGenerator'
import type { Destination, Itinerary, PlanningInput } from '../types'

function getDestination(id: string): Destination {
  const destination = destinations.find((item) => item.id === id)
  if (!destination) throw new Error(`Destino de teste não encontrado: ${id}`)
  return destination
}

function makeInput(overrides: Partial<PlanningInput> = {}): PlanningInput {
  return {
    destinationId: 'rio-de-janeiro',
    days: 3,
    interests: ['cultura', 'natureza'],
    style: 'equilibrado',
    budget: 3000,
    ...overrides,
  }
}

function generate(input: PlanningInput): Itinerary {
  const result = generateItinerary(input, getDestination(input.destinationId))
  if (!result.ok) throw new Error(`Geração falhou inesperadamente: ${result.message}`)
  return result.itinerary
}

function scheduledItems(itinerary: Itinerary) {
  return itinerary.days.flatMap((day) =>
    day.activities.map((item) => ({ day: day.dayNumber, ...item })),
  )
}

describe('generateItinerary', () => {
  it('é determinístico: mesma entrada produz exatamente a mesma saída', () => {
    const input = makeInput()
    const destination = getDestination(input.destinationId)
    const first = generateItinerary(input, destination)
    const second = generateItinerary(input, destination)
    expect(first).toEqual(second)
  })

  it('sempre gera a quantidade de dias solicitada', () => {
    for (const days of [1, 5, 14]) {
      const itinerary = generate(makeInput({ days }))
      expect(itinerary.days).toHaveLength(days)
      expect(itinerary.days.map((day) => day.dayNumber)).toEqual(
        Array.from({ length: days }, (_, index) => index + 1),
      )
    }
  })

  it('só agenda atividades compatíveis com os interesses selecionados', () => {
    const input = makeInput({ interests: ['gastronomia'], days: 2 })
    const itinerary = generate(input)
    const items = scheduledItems(itinerary)
    expect(items.length).toBeGreaterThan(0)
    for (const item of items) {
      expect(
        item.activity.categories.some((category) =>
          input.interests.includes(category),
        ),
        `${item.activity.name} não atende aos interesses`,
      ).toBe(true)
    }
  })

  it('só agenda atividades adequadas ao estilo de viagem', () => {
    const input = makeInput({ style: 'economico' })
    const itinerary = generate(input)
    for (const item of scheduledItems(itinerary)) {
      expect(item.activity.suitableStyles).toContain('economico')
    }
  })

  it('não gera horários sobrepostos dentro de um mesmo dia', () => {
    const itinerary = generate(makeInput({ days: 4, budget: 10000 }))
    for (const day of itinerary.days) {
      const ordered = [...day.activities].sort(
        (a, b) => a.startMinutes - b.startMinutes,
      )
      for (let index = 1; index < ordered.length; index += 1) {
        expect(
          ordered[index].startMinutes,
          `${ordered[index].activity.name} sobrepõe ${ordered[index - 1].activity.name}`,
        ).toBeGreaterThanOrEqual(ordered[index - 1].endMinutes)
      }
    }
  })

  it('mantém os horários sugeridos dentro dos limites do dia (09:00–23:00)', () => {
    const itinerary = generate(makeInput({ days: 4, budget: 10000 }))
    for (const item of scheduledItems(itinerary)) {
      expect(item.startMinutes).toBeGreaterThanOrEqual(SLOT_WINDOWS.manha.start)
      expect(item.endMinutes).toBeLessThanOrEqual(SLOT_WINDOWS.noite.end)
      expect(item.endMinutes).toBeGreaterThan(item.startMinutes)
    }
  })

  it('aloca atividade noturna no período da noite quando há espaço', () => {
    const itinerary = generate(
      makeInput({ interests: ['vida-noturna'], days: 1 }),
    )
    const items = scheduledItems(itinerary)
    expect(items).toHaveLength(1)
    expect(items[0].period).toBe('noite')
    expect(items[0].startMinutes).toBe(SLOT_WINDOWS.noite.start)
  })

  it('distribui atividades por mais de um dia quando há opções suficientes', () => {
    const itinerary = generate(
      makeInput({
        interests: ['cultura', 'natureza', 'gastronomia', 'relaxamento'],
        days: 3,
        budget: 10000,
      }),
    )
    const daysWithActivities = itinerary.days.filter(
      (day) => day.activities.length > 0,
    )
    expect(daysWithActivities.length).toBeGreaterThan(1)
  })

  it('calcula o resumo financeiro com base apenas nas atividades agendadas', () => {
    // Cenário determinístico no Rio: 4 atividades de cultura
    // (30 + 40 + 90 + 100 = 260) cabem no orçamento de 1000.
    const itinerary = generate(
      makeInput({ interests: ['cultura'], days: 3, budget: 1000 }),
    )
    expect(itinerary.totals.estimatedActivitiesCost).toBe(260)
    expect(itinerary.totals.unallocatedBudget).toBe(740)
    expect(itinerary.totals.averageCostPerDay).toBeCloseTo(260 / 3)
  })

  it('mantém a invariante: custo estimado + saldo não alocado = orçamento', () => {
    for (const budget of [150, 1000, 5000]) {
      const itinerary = generate(makeInput({ budget }))
      const { estimatedActivitiesCost, unallocatedBudget } = itinerary.totals
      expect(estimatedActivitiesCost + unallocatedBudget).toBeCloseTo(budget)
      expect(unallocatedBudget).toBeGreaterThanOrEqual(0)
      expect(itinerary.totals.averageCostPerDay).toBeCloseTo(
        estimatedActivitiesCost / itinerary.input.days,
      )
    }
  })

  it('respeita o orçamento informado: custo estimado nunca o ultrapassa', () => {
    const input = makeInput({ budget: 150 })
    const itinerary = generate(input)
    expect(itinerary.totals.estimatedActivitiesCost).toBeLessThanOrEqual(
      input.budget,
    )
    expect(itinerary.totals.unallocatedBudget).toBe(
      input.budget - itinerary.totals.estimatedActivitiesCost,
    )
    expect(itinerary.totals.averageCostPerDay).toBeCloseTo(
      itinerary.totals.estimatedActivitiesCost / input.days,
    )
  })

  it('inclui atividades gratuitas mesmo com orçamento muito baixo', () => {
    // Florianópolis: Trilha da Lagoinha do Leste (natureza, custo 0).
    const itinerary = generate(
      makeInput({
        destinationId: 'florianopolis',
        interests: ['natureza'],
        style: 'economico',
        days: 2,
        budget: 10,
      }),
    )
    const items = scheduledItems(itinerary)
    expect(items.length).toBeGreaterThan(0)
    expect(itinerary.totals.estimatedActivitiesCost).toBeLessThanOrEqual(10)
    expect(
      items.some((item) => item.activity.estimatedCost === 0),
    ).toBe(true)
  })

  it('falha com mensagem clara quando o orçamento não cobre nenhuma atividade', () => {
    const result = generateItinerary(
      makeInput({ interests: ['vida-noturna'], style: 'confortavel', budget: 50 }),
      getDestination('rio-de-janeiro'),
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toContain('orçamento')
    }
  })

  it('falha com mensagem clara quando não há atividades compatíveis', () => {
    // Lisboa não tem atividade de compras para o estilo econômico.
    const result = generateItinerary(
      makeInput({
        destinationId: 'lisboa',
        interests: ['compras'],
        style: 'economico',
      }),
      getDestination('lisboa'),
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toBeTruthy()
    }
  })

  it('avisa quando faltam atividades para preencher todos os dias', () => {
    // Rio: apenas uma atividade de compras para o estilo econômico.
    const itinerary = generate(
      makeInput({ interests: ['compras'], style: 'economico', days: 5 }),
    )
    const emptyDays = itinerary.days.filter(
      (day) => day.activities.length === 0,
    )
    expect(emptyDays.length).toBeGreaterThan(0)
    expect(
      itinerary.warnings.some((warning) =>
        warning.includes('sem atividades sugeridas'),
      ),
    ).toBe(true)
  })

  it('avisa quando o orçamento limita a inclusão de atividades', () => {
    const itinerary = generate(makeInput({ budget: 150 }))
    expect(
      itinerary.warnings.some((warning) => warning.includes('orçamento')),
    ).toBe(true)
  })

  it('agenda passeio de dia inteiro começando às 09:00 sem sobrepor outros horários', () => {
    // Lisboa: bate-volta a Sintra tem 8 h de duração.
    const itinerary = generate(
      makeInput({
        destinationId: 'lisboa',
        interests: ['cultura', 'natureza', 'aventura'],
        style: 'confortavel',
        days: 3,
        budget: 10000,
      }),
    )
    const sintra = scheduledItems(itinerary).find(
      (item) => item.activity.id === 'lis-sintra-palacio-pena',
    )
    expect(sintra).toBeDefined()
    expect(sintra?.startMinutes).toBe(SLOT_WINDOWS.manha.start)
    expect(sintra?.endMinutes).toBe(SLOT_WINDOWS.manha.start + 8 * 60)

    const sameDay = itinerary.days[sintra!.day - 1].activities
    for (const item of sameDay) {
      if (item.activity.id === sintra!.activity.id) continue
      const overlaps =
        item.startMinutes < sintra!.endMinutes &&
        item.endMinutes > sintra!.startMinutes
      expect(overlaps, `${item.activity.name} sobrepõe o passeio a Sintra`).toBe(
        false,
      )
    }
  })
})
