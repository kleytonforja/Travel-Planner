/**
 * Tipos de domínio do Travel Planner.
 *
 * Os valores monetários e durações presentes na base de dados são
 * ILUSTRATIVOS e não representam cotações, horários oficiais ou
 * disponibilidade real de serviços.
 */

/** Categorias de interesse disponíveis no formulário de planejamento. */
export type InterestCategory =
  | 'gastronomia'
  | 'natureza'
  | 'cultura'
  | 'aventura'
  | 'compras'
  | 'relaxamento'
  | 'vida-noturna'

/** Estilos de viagem selecionáveis. */
export type TravelStyle = 'economico' | 'equilibrado' | 'confortavel'

/** Ritmo da viagem (contrato v2; ainda não aplicado pelo motor). */
export type TripPace = 'tranquilo' | 'equilibrado' | 'intenso'

/** Período do dia recomendado para uma atividade. */
export type DayPeriod = 'manha' | 'tarde' | 'noite' | 'qualquer'

/** Moeda de um destino. */
export interface Currency {
  /** Código ISO 4217 (ex.: 'BRL', 'EUR'). */
  code: string
  /** Símbolo de exibição (ex.: 'R$', '€'). */
  symbol: string
  /** Locale usado na formatação (ex.: 'pt-BR', 'pt-PT'). */
  locale: string
}

/** Atividade turística vinculada a um destino. */
export interface Activity {
  id: string
  name: string
  description: string
  /** Categorias de interesse atendidas pela atividade. */
  categories: InterestCategory[]
  /** Duração estimada em horas (valor ilustrativo). */
  durationHours: number
  /** Custo estimado por pessoa, na moeda do destino (valor ilustrativo). */
  estimatedCost: number
  /** Período do dia recomendado. */
  recommendedPeriod: DayPeriod
  /** Estilos de viagem para os quais a atividade é adequada. */
  suitableStyles: TravelStyle[]
}

/** Destino cadastrado na base local. */
export interface Destination {
  id: string
  name: string
  country: string
  currency: Currency
  description: string
  /**
   * Orientação geral de transporte no destino (texto ilustrativo, sem
   * trajetos, linhas ou horários reais).
   */
  transportNote: string
  activities: Activity[]
}

/** Dados do formulário de planejamento, já validados em tipo. */
export interface PlanningInput {
  /** Identificador do destino selecionado. */
  destinationId: string
  /** Duração da viagem em dias (1 a 14). */
  days: number
  /** Interesses selecionados (ao menos um). */
  interests: InterestCategory[]
  /** Estilo de viagem. */
  style: TravelStyle
  /**
   * Orçamento total por pessoa, na moeda do destino (valor positivo).
   * Contrato v2: a ausência é representada pela propriedade OMITIDA (nunca
   * `null`, 0 ou valor fictício). A geração ainda exige o orçamento.
   */
  budget?: number
  /**
   * Ritmo da viagem (contrato v2). Omitido = gerado sem limite por dia (semântica
   * dos roteiros anteriores). Ainda não influencia a distribuição.
   */
  pace?: TripPace
}

/** Período efetivamente agendado (uma atividade sempre cai em um período concreto). */
export type ScheduledPeriod = Exclude<DayPeriod, 'qualquer'>

/** Atividade posicionada na agenda de um dia, com horário sugerido. */
export interface ScheduledActivity {
  activity: Activity
  /** Período em que a atividade foi alocada. */
  period: ScheduledPeriod
  /** Minutos desde 00:00 do início sugerido (horário ilustrativo). */
  startMinutes: number
  /** Minutos desde 00:00 do término sugerido (horário ilustrativo). */
  endMinutes: number
}

/** Agenda de um dia da viagem. */
export interface ItineraryDay {
  /** Número do dia na viagem (começa em 1). */
  dayNumber: number
  /** Atividades em ordem cronológica, sem sobreposição de horários. */
  activities: ScheduledActivity[]
}

/** Resumo financeiro do roteiro (apenas atividades; valores ilustrativos). */
export interface ItineraryTotals {
  /** Soma dos custos estimados das atividades agendadas. */
  estimatedActivitiesCost: number
  /**
   * Diferença entre o orçamento informado e o custo estimado das atividades.
   * Contrato v2: omitido quando não há orçamento (nunca 0).
   */
  unallocatedBudget?: number
  /** Custo médio estimado das atividades por dia de viagem. */
  averageCostPerDay: number
}

/** Roteiro gerado de forma determinística a partir de um PlanningInput. */
export interface Itinerary {
  /** Entrada de planejamento que originou o roteiro. */
  input: PlanningInput
  /** Agenda por dia (sempre com `input.days` dias, mesmo que alguns fiquem livres). */
  days: ItineraryDay[]
  totals: ItineraryTotals
  /** Avisos em pt-BR (ex.: atividades insuficientes, orçamento limitante). */
  warnings: string[]
}

/** Resultado da geração de roteiro: sucesso ou falha com mensagem clara. */
export type ItineraryGenerationResult =
  | { ok: true; itinerary: Itinerary }
  | { ok: false; message: string }

/** Roteiro persistido no LocalStorage. */
export interface SavedItinerary {
  /**
   * Identificador único do registro. Registros novos usam UUID
   * (`crypto.randomUUID()`); registros históricos conservam seus IDs
   * originais, inclusive os legados derivados de hash do formato v1.
   * O id NÃO é derivado do planejamento: equivalência entre
   * planejamentos é decidida por comparação direta de campos.
   */
  id: string
  /** Data/hora ISO em que o roteiro foi salvo. */
  savedAt: string
  itinerary: Itinerary
}
