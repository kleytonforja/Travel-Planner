import { describe, expect, it } from 'vitest'

import { destinations } from '../data/destinations'
import {
  BUFFER_MINUTES,
  generateItinerary,
  SLOT_WINDOWS,
} from '../services/itineraryGenerator'
import type {
  Destination,
  InterestCategory,
  Itinerary,
  PlanningInput,
  TravelStyle,
} from '../types'

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
      expect(estimatedActivitiesCost + (unallocatedBudget as number)).toBeCloseTo(budget)
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
      input.budget as number,
    )
    expect(itinerary.totals.unallocatedBudget).toBe(
      (input.budget as number) - itinerary.totals.estimatedActivitiesCost,
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

describe('TP-01 — regressão: sobreposição entre passeio de dia inteiro e atividade já agendada', () => {
  // Cenário reproduzido pela auditoria independente: Florianópolis,
  // 2 dias, interesse Natureza, estilo Equilibrado, orçamento R$ 300.
  // Antes da correção, o dia 2 exibia Ilha do Campeche (09:00–15:00)
  // sobreposta à Lagoa da Conceição (14:00–17:00), com 1 h de conflito.
  const auditInput = makeInput({
    destinationId: 'florianopolis',
    days: 2,
    interests: ['natureza'],
    style: 'equilibrado',
    budget: 300,
  })

  function expectDayWithoutOverlap(itinerary: Itinerary) {
    for (const day of itinerary.days) {
      const ordered = [...day.activities].sort(
        (a, b) => a.startMinutes - b.startMinutes,
      )
      for (let index = 1; index < ordered.length; index += 1) {
        expect(
          ordered[index].startMinutes,
          `${ordered[index].activity.name} sobrepõe ${ordered[index - 1].activity.name} no dia ${day.dayNumber}`,
        ).toBeGreaterThanOrEqual(ordered[index - 1].endMinutes)
      }
    }
  }

  it('reproduz o cenário da auditoria sem sobreposição de horários', () => {
    const itinerary = generate(auditInput)
    expectDayWithoutOverlap(itinerary)

    const campeche = scheduledItems(itinerary).find(
      (item) => item.activity.id === 'fln-ilha-do-campeche',
    )
    const lagoa = scheduledItems(itinerary).find(
      (item) => item.activity.id === 'fln-lagoa-da-conceicao',
    )
    expect(lagoa).toBeDefined()
    if (campeche && lagoa) {
      const overlaps =
        campeche.day === lagoa.day &&
        campeche.startMinutes < lagoa.endMinutes &&
        campeche.endMinutes > lagoa.startMinutes
      expect(
        overlaps,
        'Ilha do Campeche não pode sobrepor a Lagoa da Conceição',
      ).toBe(false)
    }
  })

  it('deixa de fora (com aviso) o passeio de dia inteiro que não cabe sem sobreposição', () => {
    // No cenário da auditoria, a Ilha do Campeche não encontra dia com
    // intervalo livre e deve virar aviso, nunca sobreposição.
    const itinerary = generate(auditInput)
    expect(
      scheduledItems(itinerary).some(
        (item) => item.activity.id === 'fln-ilha-do-campeche',
      ),
    ).toBe(false)
    expect(
      itinerary.warnings.some((warning) => warning.includes('não coube')),
    ).toBe(true)
  })

  it('atividade longa seguida de atividade da tarde mantém a pausa de 30 minutos', () => {
    // Florianópolis: Trilha da Lagoinha do Leste (5 h) no dia 1 e
    // Lagoa da Conceição (3 h, tarde) em sequência no mesmo dia.
    const itinerary = generate(
      makeInput({
        destinationId: 'florianopolis',
        interests: ['aventura', 'natureza'],
        style: 'equilibrado',
        days: 2,
        budget: 1000,
      }),
    )
    const trilha = scheduledItems(itinerary).find(
      (item) => item.activity.id === 'fln-trilha-lagoinha-do-leste',
    )
    const lagoa = scheduledItems(itinerary).find(
      (item) => item.activity.id === 'fln-lagoa-da-conceicao',
    )
    expect(trilha).toBeDefined()
    expect(lagoa).toBeDefined()
    expect(lagoa!.day).toBe(trilha!.day)
    expect(lagoa!.startMinutes).toBeGreaterThanOrEqual(
      trilha!.endMinutes + BUFFER_MINUTES,
    )
    expectDayWithoutOverlap(itinerary)
  })

  it('agenda atividades curtas em sequência no mesmo período, respeitando pausa e limite da janela', () => {
    // Lisboa: Pastéis de Belém (1 h) e Time Out Market (2 h), ambos
    // "qualquer" — caem na manhã do único dia.
    const itinerary = generate(
      makeInput({
        destinationId: 'lisboa',
        interests: ['gastronomia'],
        style: 'equilibrado',
        days: 1,
        budget: 200,
      }),
    )
    const items = scheduledItems(itinerary)
    expect(items).toHaveLength(2)
    const ordered = [...items].sort((a, b) => a.startMinutes - b.startMinutes)
    expect(ordered[0].period).toBe('manha')
    expect(ordered[1].period).toBe('manha')
    // Pausa de 30 minutos entre atividades consecutivas.
    expect(ordered[1].startMinutes).toBe(ordered[0].endMinutes + BUFFER_MINUTES)
    // Limite da janela: terminar exatamente no fim da manhã (12:30) é
    // aceito — o limite é inclusivo.
    expect(ordered[1].endMinutes).toBe(SLOT_WINDOWS.manha.end)
    expectDayWithoutOverlap(itinerary)
  })

  it('distribui atividades por manhã, tarde e noite no mesmo dia, cada uma dentro da sua janela', () => {
    const itinerary = generate(
      makeInput({
        interests: ['cultura', 'gastronomia', 'vida-noturna'],
        style: 'equilibrado',
        days: 1,
        budget: 1000,
      }),
    )
    const items = scheduledItems(itinerary)
    const periods = new Set(items.map((item) => item.period))
    expect(periods).toEqual(new Set(['manha', 'tarde', 'noite']))
    for (const item of items) {
      const window = SLOT_WINDOWS[item.period]
      expect(
        item.startMinutes,
        `${item.activity.name} começa antes da janela de ${item.period}`,
      ).toBeGreaterThanOrEqual(window.start)
      expect(
        item.endMinutes,
        `${item.activity.name} termina depois da janela de ${item.period}`,
      ).toBeLessThanOrEqual(window.end)
    }
    expectDayWithoutOverlap(itinerary)
  })

  it('mantém dias sem atividades quando faltam opções, sem quebrar a agenda', () => {
    // Rio: apenas uma atividade de compras para o estilo econômico.
    const itinerary = generate(
      makeInput({ interests: ['compras'], style: 'economico', days: 5 }),
    )
    expect(itinerary.days).toHaveLength(5)
    const emptyDays = itinerary.days.filter(
      (day) => day.activities.length === 0,
    )
    expect(emptyDays).toHaveLength(4)
    expect(
      itinerary.warnings.some((warning) =>
        warning.includes('sem atividades sugeridas'),
      ),
    ).toBe(true)
    expectDayWithoutOverlap(itinerary)
  })

  it('nunca gera sobreposição: varredura por destinos, estilos, interesses, dias e orçamentos', () => {
    const interestSets: InterestCategory[][] = [
      ['natureza'],
      ['cultura'],
      ['gastronomia', 'cultura'],
      ['aventura', 'natureza', 'relaxamento'],
      [
        'gastronomia',
        'natureza',
        'cultura',
        'aventura',
        'compras',
        'relaxamento',
        'vida-noturna',
      ],
    ]
    const styles: TravelStyle[] = ['economico', 'equilibrado', 'confortavel']
    for (const destination of destinations) {
      for (const style of styles) {
        for (const interests of interestSets) {
          for (const days of [1, 2, 3, 7]) {
            for (const budget of [50, 300, 1000, 100000]) {
              const result = generateItinerary(
                makeInput({
                  destinationId: destination.id,
                  style,
                  interests,
                  days,
                  budget,
                }),
                destination,
              )
              if (!result.ok) continue
              expectDayWithoutOverlap(result.itinerary)
            }
          }
        }
      }
    }
  })
})
