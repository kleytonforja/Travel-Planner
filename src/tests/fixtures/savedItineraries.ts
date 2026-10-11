/**
 * Fixtures de registros persistidos para os testes de regressão da
 * remediação de persistência (docs/PERSISTENCE_REMEDIATION_PLAN.md).
 *
 * - Registros históricos válidos (formato v1, id legado derivado de
 *   hash, campos adicionais desconhecidos preservados).
 * - Registro histórico com sobreposição (cenário anterior à correção
 *   TP-01: válido em todos os demais aspectos).
 * - Coleção com IDs duplicados.
 * - Par de colisão: registro legado cujo id coincide com a impressão
 *   digital de um planejamento DIFERENTE do que ele contém.
 *
 * Nota sobre a colisão real da auditoria: o plano cita o fingerprint
 * "roteiro-2cd27b6e", mas não transcreve os dois planejamentos
 * completos (ambiguidade nº 9 do plano). A fixture de colisão reproduz
 * o MESMO MECANISMO com planejamentos gerados pela base local, sem
 * inventar os valores originais da auditoria.
 */

import { destinations } from '../../data/destinations'
import { generateItinerary } from '../../services/itineraryGenerator'
import { buildPlanningFingerprint } from '../../services/itineraryStorage'
import type {
  Activity,
  Itinerary,
  PlanningInput,
  SavedItinerary,
  ScheduledActivity,
} from '../../types'

function getActivity(destinationId: string, activityId: string): Activity {
  const destination = destinations.find((item) => item.id === destinationId)
  const activity = destination?.activities.find((item) => item.id === activityId)
  if (!activity) throw new Error(`atividade de fixture inexistente: ${activityId}`)
  return activity
}

/** Gera um roteiro válido a partir da base local (determinístico). */
export function buildItineraryFromInput(input: PlanningInput): Itinerary {
  const destination = destinations.find((item) => item.id === input.destinationId)
  if (!destination) throw new Error('destino de fixture inexistente')
  const result = generateItinerary(input, destination)
  if (!result.ok) throw new Error('falha ao gerar roteiro de fixture')
  return result.itinerary
}

/** Planejamento do registro histórico válido. */
export const HISTORICAL_VALID_INPUT: PlanningInput = {
  destinationId: 'florianopolis',
  days: 2,
  interests: ['natureza', 'gastronomia'],
  style: 'equilibrado',
  budget: 500,
}

/** Identificador legado no formato de hash do formato v1. */
export const HISTORICAL_LEGACY_ID = 'roteiro-a1b2c3d4'

/**
 * Registro histórico válido: id legado derivado de hash, data em ano
 * bissexto com fração de milissegundos, atividades dentro das janelas e
 * totais coerentes. Inclui um campo adicional desconhecido (`origem`),
 * que deve ser preservado na leitura.
 */
export function buildHistoricalValidRecord(): SavedItinerary {
  const mercado = getActivity('florianopolis', 'fln-mercado-publico')
  const lagoa = getActivity('florianopolis', 'fln-lagoa-da-conceicao')

  const scheduledMercado: ScheduledActivity = {
    activity: mercado,
    period: 'manha',
    startMinutes: 9 * 60,
    endMinutes: 11 * 60,
  }
  const scheduledLagoa: ScheduledActivity = {
    activity: lagoa,
    period: 'tarde',
    startMinutes: 14 * 60,
    endMinutes: 17 * 60,
  }

  const cost = mercado.estimatedCost + lagoa.estimatedCost
  return {
    id: HISTORICAL_LEGACY_ID,
    savedAt: '2024-02-29T12:00:00.500Z',
    itinerary: {
      input: { ...HISTORICAL_VALID_INPUT },
      days: [
        { dayNumber: 1, activities: [scheduledMercado] },
        { dayNumber: 2, activities: [scheduledLagoa] },
      ],
      totals: {
        estimatedActivitiesCost: cost,
        unallocatedBudget: HISTORICAL_VALID_INPUT.budget - cost,
        averageCostPerDay: cost / HISTORICAL_VALID_INPUT.days,
      },
      warnings: [],
    },
  }
}

/**
 * Registro histórico com sobreposição, reproduzindo o cenário da
 * auditoria anterior à correção TP-01 (Florianópolis, 2 dias, Natureza,
 * Equilibrado, R$ 300): Ilha do Campeche (09:00–15:00, passeio de dia
 * inteiro) sobreposta à Lagoa da Conceição (14:00–17:00). Todos os
 * demais aspectos são válidos — somente a regra de sobreposição o
 * rejeita.
 */
export function buildOverlappingHistoricalRecord(): SavedItinerary {
  const campeche = getActivity('florianopolis', 'fln-ilha-do-campeche')
  const lagoa = getActivity('florianopolis', 'fln-lagoa-da-conceicao')

  const input: PlanningInput = {
    destinationId: 'florianopolis',
    days: 2,
    interests: ['natureza'],
    style: 'equilibrado',
    budget: 300,
  }
  const cost = campeche.estimatedCost + lagoa.estimatedCost
  return {
    id: 'roteiro-legado-sobreposto',
    savedAt: '2025-11-02T18:45:00Z',
    itinerary: {
      input,
      days: [
        { dayNumber: 1, activities: [] },
        {
          dayNumber: 2,
          activities: [
            {
              activity: campeche,
              period: 'manha',
              startMinutes: 9 * 60,
              endMinutes: 15 * 60,
            },
            {
              activity: lagoa,
              period: 'tarde',
              startMinutes: 14 * 60,
              endMinutes: 17 * 60,
            },
          ],
        },
      ],
      totals: {
        estimatedActivitiesCost: cost,
        unallocatedBudget: input.budget - cost,
        averageCostPerDay: cost / input.days,
      },
      warnings: [],
    },
  }
}

/**
 * Coleção com dois registros individualmente válidos compartilhando o
 * mesmo identificador (IDs duplicados tornam a coleção corrompida).
 */
export function buildDuplicateIdsPayload(): {
  payload: unknown[]
  duplicateId: string
} {
  const first = buildHistoricalValidRecord()
  const secondItinerary = buildItineraryFromInput({
    destinationId: 'lisboa',
    days: 3,
    interests: ['cultura'],
    style: 'equilibrado',
    budget: 400,
  })
  const second: SavedItinerary = {
    id: first.id,
    savedAt: '2025-12-01T09:00:00Z',
    itinerary: secondItinerary,
  }
  return { payload: [first, second], duplicateId: first.id }
}

/**
 * Par de colisão: registro legado cujo id é a impressão digital do
 * planejamento B, mas que contém o roteiro do planejamento A — o efeito
 * da colisão de hash anterior à correção TP-03. Salvar o planejamento B
 * não pode tocar nesse registro.
 */
export function buildCollisionPair(): {
  legacyRecord: SavedItinerary
  collidingItinerary: Itinerary
} {
  const itineraryA = buildItineraryFromInput({
    destinationId: 'florianopolis',
    days: 3,
    interests: ['natureza', 'gastronomia'],
    style: 'equilibrado',
    budget: 2000,
  })
  const itineraryB = buildItineraryFromInput({
    destinationId: 'florianopolis',
    days: 5,
    interests: ['natureza', 'gastronomia'],
    style: 'equilibrado',
    budget: 2000,
  })
  return {
    legacyRecord: {
      id: buildPlanningFingerprint(itineraryB.input),
      savedAt: '2025-08-20T14:00:00Z',
      itinerary: itineraryA,
    },
    collidingItinerary: itineraryB,
  }
}
