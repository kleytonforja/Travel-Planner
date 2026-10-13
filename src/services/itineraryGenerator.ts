import type {
  Activity,
  Destination,
  Itinerary,
  ItineraryDay,
  ItineraryGenerationResult,
  PlanningInput,
  ScheduledActivity,
  ScheduledPeriod,
  TripPace,
} from '../types'
import { isValidBudgetValue } from './planningValidation'

/**
 * Gerador determinístico de roteiros (regra de negócio pura, fora da
 * interface — ver DECISIONS.md).
 *
 * Mesma entrada (`PlanningInput` + destino) produz sempre a mesma saída:
 * não há uso de aleatoriedade, data/hora atual ou estado externo.
 *
 * Modelo de agenda por dia (horários sugeridos, ilustrativos):
 *
 * - Manhã: 09:00–12:30
 * - Tarde: 14:00–18:30 (intervalo de almoço entre manhã e tarde)
 * - Noite: 19:00–23:00
 *
 * Cada atividade é alocada integralmente em um período, sem sobreposição.
 * Atividades longas (mais de 4,5 h) são tratadas como passeio de dia
 * inteiro, iniciados às 09:00 e empurrando o início dos períodos seguintes.
 *
 * Antes de alocar, o algoritmo verifica conflitos contra TODAS as
 * atividades já agendadas no dia, independentemente do período (os
 * cursores por período, sozinhos, não impediam que um passeio de dia
 * inteiro fosse inserido sobre uma atividade da tarde já posicionada —
 * correção TP-01).
 */

export const SLOT_WINDOWS: Record<ScheduledPeriod, { start: number; end: number }> = {
  manha: { start: 9 * 60, end: 12 * 60 + 30 },
  tarde: { start: 14 * 60, end: 18 * 60 + 30 },
  noite: { start: 19 * 60, end: 23 * 60 },
}

/** Intervalo sugerido entre atividades consecutivas no mesmo período. */
export const BUFFER_MINUTES = 30

/** Duração (em minutos) acima da qual a atividade vira "passeio de dia inteiro". */
export const FULL_DAY_THRESHOLD_MINUTES = 4.5 * 60

/**
 * Ritmo da viagem (M3): máximo de atividades por dia. `null` = sem limite adicional
 * (Intenso), que equivale ao comportamento do motor sem ritmo; as restrições de
 * duração, período, sobreposição e orçamento continuam valendo em todos os ritmos.
 * O ritmo NÃO indica esforço físico nem acessibilidade: só limita a quantidade.
 */
export const PACE_MAX_ACTIVITIES_PER_DAY: Record<TripPace, number | null> = {
  tranquilo: 2,
  equilibrado: 3,
  intenso: null,
}

/** Rótulos do ritmo para mensagens do motor. */
const PACE_LABELS: Record<TripPace, string> = {
  tranquilo: 'Tranquilo',
  equilibrado: 'Equilibrado',
  intenso: 'Intenso',
}

/** Fim do horário sugerido para passeios de dia inteiro iniciados pela manhã. */
const FULL_DAY_LATEST_END = SLOT_WINDOWS.tarde.end

const PERIOD_ORDER: ScheduledPeriod[] = ['manha', 'tarde', 'noite']

interface DayScheduleState {
  cursors: Record<ScheduledPeriod, number>
  activities: ScheduledActivity[]
}

function createDayState(): DayScheduleState {
  return {
    cursors: {
      manha: SLOT_WINDOWS.manha.start,
      tarde: SLOT_WINDOWS.tarde.start,
      noite: SLOT_WINDOWS.noite.start,
    },
    activities: [],
  }
}

/** Verifica, sem alterar a agenda, se a atividade caberia no dia (mesmas regras de `trySchedule`). */
function fitsInDay(day: DayScheduleState, activity: Activity): boolean {
  return candidatePeriods(activity).some((period) =>
    trySchedule({ cursors: { ...day.cursors }, activities: [...day.activities] }, activity, period) !== null,
  )
}

function durationMinutes(activity: Activity): number {
  return activity.durationHours * 60
}

function isFullDayActivity(activity: Activity): boolean {
  return durationMinutes(activity) > FULL_DAY_THRESHOLD_MINUTES
}

/**
 * Períodos candidatos para uma atividade, em ordem de preferência.
 * O período recomendado vem primeiro; os demais servem de alternativa
 * para não descartar a atividade quando o período ideal está cheio.
 */
function candidatePeriods(activity: Activity): ScheduledPeriod[] {
  if (isFullDayActivity(activity)) {
    // Passeios longos só podem começar pela manhã.
    return ['manha']
  }
  if (activity.recommendedPeriod !== 'qualquer') {
    return [
      activity.recommendedPeriod,
      ...PERIOD_ORDER.filter((period) => period !== activity.recommendedPeriod),
    ]
  }
  return PERIOD_ORDER
}

/**
 * Indica se o intervalo [start, end) conflita com alguma atividade já
 * agendada no dia, independentemente do período. Intervalos que apenas se
 * tocam (término de uma = início da outra) não configuram sobreposição.
 */
function hasScheduleConflict(
  day: DayScheduleState,
  start: number,
  end: number,
): boolean {
  return day.activities.some(
    (scheduled) =>
      start < scheduled.endMinutes && end > scheduled.startMinutes,
  )
}

/**
 * Tenta alocar a atividade no período indicado do dia. Retorna a atividade
 * agendada em caso de sucesso (atualizando os cursores do dia) ou `null`.
 */
function trySchedule(
  day: DayScheduleState,
  activity: Activity,
  period: ScheduledPeriod,
): ScheduledActivity | null {
  const window = SLOT_WINDOWS[period]
  const start = day.cursors[period]
  const end = start + durationMinutes(activity)

  // TP-01: nunca inserir em intervalo ocupado por outra atividade do
  // mesmo dia, ainda que em período diferente.
  if (hasScheduleConflict(day, start, end)) {
    return null
  }

  if (isFullDayActivity(activity)) {
    // Exige manhã livre e término até o fim da tarde.
    if (period !== 'manha' || start !== window.start || end > FULL_DAY_LATEST_END) {
      return null
    }
    day.cursors.manha = end
    day.cursors.tarde = Math.max(day.cursors.tarde, end + BUFFER_MINUTES)
  } else {
    if (end > window.end) {
      return null
    }
    day.cursors[period] = end + BUFFER_MINUTES
  }

  const scheduled: ScheduledActivity = {
    activity,
    period,
    startMinutes: start,
    endMinutes: end,
  }
  day.activities.push(scheduled)
  return scheduled
}

/** Quantidade de interesses do usuário atendidos pela atividade. */
function interestScore(activity: Activity, interests: PlanningInput['interests']): number {
  return activity.categories.filter((category) => interests.includes(category)).length
}

/**
 * Ordenação determinística: mais interesses atendidos primeiro; em caso de
 * empate, custo crescente (ou decrescente no estilo confortável) e, por fim,
 * id da atividade para desempate estável.
 */
function compareActivities(style: PlanningInput['style']) {
  return (a: Activity, b: Activity): number => {
    const byCost =
      style === 'confortavel'
        ? b.estimatedCost - a.estimatedCost
        : a.estimatedCost - b.estimatedCost
    return byCost === 0 ? a.id.localeCompare(b.id) : byCost
  }
}

function sortEligible(
  activities: Activity[],
  interests: PlanningInput['interests'],
  style: PlanningInput['style'],
): Activity[] {
  return [...activities].sort((a, b) => {
    const byScore = interestScore(b, interests) - interestScore(a, interests)
    if (byScore !== 0) return byScore
    return compareActivities(style)(a, b)
  })
}

/**
 * Gera um roteiro para o planejamento informado.
 *
 * Etapas: filtragem por interesses e estilo → ordenação determinística →
 * seleção respeitando o orçamento → distribuição pelos dias sem
 * sobreposição de horários. Atividades nunca são inventadas: se a base
 * não tiver opções suficientes, o resultado traz dias livres e avisos.
 */
export function generateItinerary(
  input: PlanningInput,
  destination: Destination,
): ItineraryGenerationResult {
  // Orçamento presente precisa ser um número finito > 0 (contrato v2). A AUSÊNCIA
  // (propriedade omitida) é válida e significa "sem teto financeiro informado".
  const budget = input.budget
  if (budget !== undefined && !isValidBudgetValue(budget)) {
    return {
      ok: false,
      message: 'O orçamento informado é inválido: use um valor numérico maior que zero ou não informe orçamento.',
    }
  }

  const eligible = destination.activities.filter(
    (activity) =>
      activity.suitableStyles.includes(input.style) &&
      activity.categories.some((category) => input.interests.includes(category)),
  )

  if (eligible.length === 0) {
    return {
      ok: false,
      message:
        'Não encontramos atividades compatíveis com os interesses e o estilo selecionados para este destino. Tente ajustar as preferências.',
    }
  }

  const sorted = sortEligible(eligible, input.interests, input.style)

  // Seleção gananciosa respeitando o orçamento (atividades gratuitas sempre cabem).
  // Sem orçamento informado não há teto: nenhuma atividade elegível é descartada por custo
  // (nada de valor fictício nem Infinity como substituto).
  const selected: Activity[] = []
  let selectedCost = 0
  let skippedByBudget = 0
  for (const activity of sorted) {
    if (budget === undefined || selectedCost + activity.estimatedCost <= budget) {
      selected.push(activity)
      selectedCost += activity.estimatedCost
    } else {
      skippedByBudget += 1
    }
  }

  if (selected.length === 0) {
    return {
      ok: false,
      message:
        'O orçamento informado não é suficiente para as atividades compatíveis com o seu perfil neste destino. Considere aumentar o orçamento ou ajustar as preferências.',
    }
  }

  // Distribuição pelos dias: prioriza o dia com menos atividades para
  // equilibrar a agenda; em caso de empate, o dia mais cedo.
  const dayStates = Array.from({ length: input.days }, () => createDayState())
  const unplaced: Activity[] = []
  // Atividades que ficaram de fora só por causa do limite do ritmo.
  const paceCap = input.pace === undefined ? null : PACE_MAX_ACTIVITIES_PER_DAY[input.pace]
  let skippedByPace = 0

  for (const activity of selected) {
    const daysByLoad = [...dayStates.keys()]
      .sort(
        (a, b) =>
          dayStates[a].activities.length - dayStates[b].activities.length || a - b,
      )
      // O limite do ritmo só retira dias já cheios: a atividade é distribuída entre
      // os dias disponíveis antes de ser descartada por ritmo.
      .filter((dayIndex) => paceCap === null || dayStates[dayIndex].activities.length < paceCap)
    let placed = false
    for (const dayIndex of daysByLoad) {
      for (const period of candidatePeriods(activity)) {
        if (trySchedule(dayStates[dayIndex], activity, period)) {
          placed = true
          break
        }
      }
      if (placed) break
    }
    if (!placed) {
      // Não coube em nenhum dia disponível. Se caberia em um dia que já atingiu o limite do
      // ritmo, o que a deixou de fora foi o ritmo; do contrário, foi a agenda.
      const fitsWithoutPaceLimit = dayStates.some(
        (state, index) => !daysByLoad.includes(index) && fitsInDay(state, activity),
      )
      if (fitsWithoutPaceLimit) skippedByPace += 1
      else unplaced.push(activity)
    }
  }

  const days: ItineraryDay[] = dayStates.map((state, index) => ({
    dayNumber: index + 1,
    activities: [...state.activities].sort(
      (a, b) => a.startMinutes - b.startMinutes,
    ),
  }))

  const scheduledCost = days.reduce(
    (total, day) =>
      total + day.activities.reduce((sum, item) => sum + item.activity.estimatedCost, 0),
    0,
  )

  const warnings: string[] = []
  if (skippedByBudget > 0) {
    warnings.push(
      `O orçamento informado limitou a inclusão de ${skippedByBudget} ${skippedByBudget === 1 ? 'atividade compatível' : 'atividades compatíveis'}.`,
    )
  }
  if (skippedByPace > 0 && input.pace !== undefined && paceCap !== null) {
    warnings.push(
      `${skippedByPace} ${skippedByPace === 1 ? 'atividade compatível ficou' : 'atividades compatíveis ficaram'} de fora pelo ritmo ${PACE_LABELS[input.pace]} (máximo de ${paceCap} atividades por dia). Escolha o ritmo Intenso ou mais dias para incluí-${skippedByPace === 1 ? 'la' : 'las'}.`,
    )
  }
  if (unplaced.length > 0) {
    warnings.push(
      `${unplaced.length} ${unplaced.length === 1 ? 'atividade compatível não coube' : 'atividades compatíveis não couberam'} na agenda sugerida e ${unplaced.length === 1 ? 'foi deixada de fora' : 'foram deixadas de fora'}.`,
    )
  }
  const emptyDays = days.filter((day) => day.activities.length === 0).length
  if (emptyDays > 0) {
    warnings.push(
      `Há ${emptyDays} ${emptyDays === 1 ? 'dia sem atividades sugeridas' : 'dias sem atividades sugeridas'} por falta de opções compatíveis na base local. Aproveite o tempo livre para explorar o destino por conta própria.`,
    )
  }

  const itinerary: Itinerary = {
    input,
    days,
    totals: {
      estimatedActivitiesCost: scheduledCost,
      // Sem orçamento não existe saldo: a propriedade é omitida (nunca 0).
      ...(budget === undefined ? {} : { unallocatedBudget: budget - scheduledCost }),
      averageCostPerDay: scheduledCost / input.days,
    },
    warnings,
  }

  return { ok: true, itinerary }
}
