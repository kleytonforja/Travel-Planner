import { destinations } from '../data/destinations'
import type {
  Activity,
  InterestCategory,
  Itinerary,
  ItineraryDay,
  PlanningInput,
  SavedItinerary,
  ScheduledActivity,
  TravelStyle,
} from '../types'
import {
  FULL_DAY_THRESHOLD_MINUTES,
  PACE_MAX_ACTIVITIES_PER_DAY,
  SLOT_WINDOWS,
} from './itineraryGenerator'
import { isValidBudgetValue, isValidPace } from './planningValidation'

/**
 * Persistência de roteiros no LocalStorage (ver DECISIONS.md, D7, D14,
 * D21, D22 e o plano docs/PERSISTENCE_REMEDIATION_PLAN.md).
 *
 * Correções pós-auditoria:
 *
 * - TP-02: validação estrutural e semântica de cada registro — datas
 *   reais de calendário (sem normalizações como 30/02 ou 24:00),
 *   identificadores não vazios, destinos/dias/atividades coerentes,
 *   horários dentro das janelas do gerador e sem sobreposição
 *   (invariante TP-01), compatibilidade de estilo/interesses, atividades
 *   sem repetição e integridade financeira: igualdades (custo = soma
 *   das atividades, saldo = orçamento − custo, média = custo ÷ dias)
 *   com tolerância absoluta de 1e-6 e desigualdade custo ≤ orçamento
 *   ESTRITA, sem tolerância (correções AUD-03 e AUD-04 da auditoria
 *   independente final). A mesma validação é aplicada na leitura e
 *   antes de gravar um novo estado.
 * - TP-03: identidade separada de equivalência. Registros novos usam
 *   `crypto.randomUUID()`, confrontados com os IDs já existentes (limite
 *   de 10 tentativas; esgotamento ou indisponibilidade retorna erro, sem
 *   escrita e sem fallback inseguro). Planejamentos equivalentes são
 *   comparados diretamente pelos campos normalizados, sem hash em
 *   nenhuma decisão de persistência. A substituição de um equivalente
 *   exige confirmação explícita vinculada ao ID do alvo e ao conteúdo
 *   bruto observado.
 * - TP-04: operações seguras com UMA leitura de decisão por operação,
 *   novo estado construído e validado integralmente em memória, UM
 *   único setItem na chave principal e confirmação por releitura.
 *   Resultados distinguem sucesso confirmado, falha sem alteração e
 *   resultado incerto (sem repetição nem rollback automático). Nenhuma
 *   falha de leitura é convertida em lista vazia. As mutações são
 *   coordenadas entre abas pelo lock exclusivo Web Locks
 *   `travel-planner:storage:v1`; sem a API, as mutações são bloqueadas
 *   (não há fallback de escrita sem coordenação).
 * - TP-05: a leitura distingue armazenamento vazio, válido, corrompido
 *   (JSON ilegível, formato desconhecido, registros inválidos ou IDs
 *   duplicados — inclusive coleções parcialmente válidas) e
 *   indisponível. Escritas normais são bloqueadas em coleção corrompida.
 *   A recuperação é explícita: preserva o conteúdo bruto na quarentena
 *   (sem sobrescrever cópias diferentes, com confirmação da gravação do
 *   backup), recupera os registros válidos e nunca remove a chave
 *   principal antes de substituí-la.
 */

export const STORAGE_KEY = 'travel-planner:saved-itineraries:v1'

/**
 * Chave de quarentena: guarda o conteúdo bruto original preservado na
 * recuperação explícita, para que dados corrompidos nunca sejam perdidos
 * sem autorização do usuário.
 */
export const CORRUPTED_BACKUP_KEY = `${STORAGE_KEY}:quarentena`

/** Lock exclusivo (Web Locks) que coordena as mutações entre abas. */
export const STORAGE_LOCK_NAME = 'travel-planner:storage:v1'

/** Limite de tentativas para gerar um identificador único (TP-03). */
export const MAX_ID_GENERATION_ATTEMPTS = 10

const QUOTA_EXCEEDED_MESSAGE =
  'Não foi possível concluir a operação porque o armazenamento do navegador está cheio. Exclua roteiros salvos ou libere espaço e tente novamente. Os roteiros anteriores foram preservados.'
const STORAGE_UNAVAILABLE_MESSAGE =
  'Não foi possível acessar o armazenamento do navegador (indisponível ou bloqueado). Nenhuma alteração foi feita nos roteiros salvos.'
const ID_GENERATION_FAILED_MESSAGE =
  'Não foi possível gerar um identificador único para o roteiro neste navegador. Nenhuma alteração foi feita nos roteiros salvos.'
const AMBIGUOUS_EQUIVALENTS_MESSAGE =
  'Encontramos mais de um roteiro salvo equivalente a este planejamento, então a substituição automática foi bloqueada para não apagar o registro errado. Nenhuma alteração foi feita.'
const INVALID_ITINERARY_MESSAGE =
  'O roteiro não passou na validação interna de consistência e não foi salvo. Nenhuma alteração foi feita nos roteiros salvos.'
const REPLACE_NEEDS_CONFIRMATION_MESSAGE =
  'Já existe um roteiro salvo com este mesmo planejamento. Confirme a substituição para continuar.'
/** Mensagem própria do resultado incerto (texto definido pelo plano). */
const UNCERTAIN_RESULT_MESSAGE =
  'Não foi possível confirmar a operação. Recarregue os roteiros antes de tentar novamente.'
const STALE_ACTION_MESSAGE =
  'Os roteiros salvos mudaram desde a última leitura (outra aba ou janela pode ter alterado os dados). A operação foi cancelada por segurança. Recarregue os roteiros e tente novamente.'
const CORRUPTED_STORAGE_MESSAGE =
  'Os roteiros salvos contêm dados que não puderam ser validados. Para proteger esses dados, as alterações estão bloqueadas até a recuperação explícita na página inicial. Nenhuma alteração foi feita.'
const RECORD_NOT_FOUND_MESSAGE =
  'O roteiro selecionado não foi encontrado. A lista pode ter mudado — recarregue os roteiros e tente novamente. Nenhuma alteração foi feita.'
const LOCK_UNAVAILABLE_MESSAGE =
  'Este navegador não oferece a coordenação segura entre abas (Web Locks), então as alterações foram bloqueadas para proteger seus roteiros. A leitura e a exportação continuam disponíveis.'
const LOCK_ACQUISITION_FAILED_MESSAGE =
  'Não foi possível coordenar o acesso seguro ao armazenamento entre as abas do navegador. Nenhuma alteração foi feita. Tente novamente.'
const QUARANTINE_OCCUPIED_MESSAGE =
  'Já existe uma cópia de segurança diferente na quarentena. A operação foi interrompida para não sobrescrevê-la: baixe ou descarte a cópia existente e tente novamente. Nenhuma alteração foi feita nos roteiros.'
const QUARANTINE_UNAVAILABLE_MESSAGE =
  'Não foi possível acessar a cópia de segurança (quarentena). A operação foi interrompida e os dados originais não foram alterados.'
const QUARANTINE_PRESERVE_FAILED_MESSAGE =
  'Não foi possível preservar a cópia de segurança na quarentena, então a operação foi interrompida. Os dados originais não foram alterados.'
const QUARANTINE_EMPTY_MESSAGE =
  'Não há cópia de segurança na quarentena. O conteúdo pode ter mudado — recarregue a página e tente novamente. Nenhuma alteração foi feita.'
const RESTORE_BLOCKED_NON_EMPTY_MESSAGE =
  'A restauração só é permitida quando não há roteiros ativos. Existem roteiros salvos, então a operação foi bloqueada. Baixe a cópia de segurança se quiser conservá-la fora do navegador.'
const RESTORE_BLOCKED_CORRUPTED_MESSAGE =
  'A restauração foi bloqueada porque os dados atuais dos roteiros salvos precisam de recuperação primeiro. Recupere os roteiros atuais antes de restaurar a cópia de segurança.'

const KNOWN_DESTINATION_IDS: ReadonlySet<string> = new Set(
  destinations.map((destination) => destination.id),
)

const INTEREST_CATEGORIES: readonly InterestCategory[] = [
  'gastronomia',
  'natureza',
  'cultura',
  'aventura',
  'compras',
  'relaxamento',
  'vida-noturna',
]

const TRAVEL_STYLES: readonly TravelStyle[] = [
  'economico',
  'equilibrado',
  'confortavel',
]

const SCHEDULED_PERIODS = ['manha', 'tarde', 'noite'] as const
const DAY_PERIODS = [...SCHEDULED_PERIODS, 'qualquer'] as const

const MINUTES_IN_A_DAY = 24 * 60

/**
 * Tolerância ABSOLUTA das relações financeiras e da coerência entre
 * duração e intervalo de horários (1e-6). Não é multiplicada pelo
 * tamanho dos valores, não autoriza saldo negativo nem transforma
 * valores não finitos em válidos.
 */
const EPSILON = 1e-6

const ISO_DATE_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/

/**
 * Impressão digital determinística do planejamento (hash djb2).
 *
 * NÃO participa de nenhuma decisão de persistência (TP-03): identidade
 * de registros usa UUID e equivalência usa comparação direta de campos
 * (`arePlanningsEquivalent`). Seu único uso restante é compor o nome do
 * arquivo na exportação de um roteiro ainda não salvo — o que não
 * concede identidade nem autorização para substituição.
 */
export function buildPlanningFingerprint(input: PlanningInput): string {
  const raw = [
    input.destinationId,
    input.days,
    input.style,
    input.budget === undefined ? 'sem-orcamento' : input.budget,
    [...input.interests].sort().join(','),
    ...(input.pace === undefined ? [] : [input.pace]),
  ].join('|')

  let hash = 5381
  for (let index = 0; index < raw.length; index += 1) {
    hash = ((hash << 5) + hash + raw.charCodeAt(index)) >>> 0
  }
  return `roteiro-${hash.toString(16)}`
}

/**
 * Equivalência de planejamentos (TP-03): dois planejamentos são
 * equivalentes somente quando coincidem destino, quantidade de dias,
 * estilo, orçamento numérico exato (sem arredondamento; ausente só equivale a
 * ausente), ritmo (ausente só equivale a ausente) e o CONJUNTO de interesses,
 * independentemente da ordem. Comparação direta entre
 * campos, sem hash.
 */
export function arePlanningsEquivalent(
  a: PlanningInput,
  b: PlanningInput,
): boolean {
  if (a.destinationId !== b.destinationId) return false
  if (a.days !== b.days) return false
  if (a.style !== b.style) return false
  // Orçamento exato; ausente só equivale a ausente (nunca a um valor).
  if (a.budget !== b.budget) return false
  // Ritmo: ausente só equivale a ausente (nunca a 'intenso' explícito).
  if (a.pace !== b.pace) return false
  const aInterests = new Set(a.interests)
  const bInterests = new Set(b.interests)
  if (aInterests.size !== bInterests.size) return false
  for (const interest of aInterests) {
    if (!bInterests.has(interest)) return false
  }
  return true
}

/**
 * Gera um identificador único para um novo registro, confrontando cada
 * candidato com os IDs já existentes na coleção. Usa exclusivamente
 * `crypto.randomUUID()` (sem fallback baseado em horário/Math.random):
 * esgotamento das tentativas ou indisponibilidade da API retorna `null`,
 * e a operação de escrita é abortada (TP-03).
 */
function createUniqueRecordId(existingIds: ReadonlySet<string>): string | null {
  if (
    typeof crypto === 'undefined' ||
    typeof crypto.randomUUID !== 'function'
  ) {
    return null
  }
  for (let attempt = 0; attempt < MAX_ID_GENERATION_ATTEMPTS; attempt += 1) {
    const candidate = `roteiro-${crypto.randomUUID()}`
    if (!existingIds.has(candidate)) {
      return candidate
    }
  }
  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

/** String não vazia nem composta apenas de espaços. */
function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/** Igualdade com tolerância absoluta de 1e-6 (ver EPSILON). */
function approxEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= EPSILON
}

/**
 * Data ISO 8601 (UTC) semanticamente válida: os componentes originais
 * devem coincidir com os componentes UTC resultantes, rejeitando
 * normalizações indevidas como 30/02, 31/04, 29/02 em ano não bissexto
 * e horário 24:00.
 */
function isValidISODate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = ISO_DATE_PATTERN.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6])
  // Fração de 1–3 dígitos: ".5" equivale a 500 ms.
  const millis = match[7] ? Number(match[7].padEnd(3, '0')) : 0

  if (month < 1 || month > 12 || day < 1 || day > 31) return false
  if (hour > 23 || minute > 59 || second > 59) return false

  const parsed = new Date(Date.UTC(year, month - 1, day, hour, minute, second, millis))
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day &&
    parsed.getUTCHours() === hour &&
    parsed.getUTCMinutes() === minute &&
    parsed.getUTCSeconds() === second &&
    parsed.getUTCMilliseconds() === millis
  )
}

function isValidPlanningInput(value: unknown): value is PlanningInput {
  if (!isRecord(value)) return false
  return (
    typeof value.destinationId === 'string' &&
    KNOWN_DESTINATION_IDS.has(value.destinationId) &&
    Number.isInteger(value.days) &&
    (value.days as number) >= 1 &&
    (value.days as number) <= 14 &&
    Array.isArray(value.interests) &&
    value.interests.length > 0 &&
    value.interests.every((item) =>
      (INTEREST_CATEGORIES as readonly unknown[]).includes(item),
    ) &&
    (TRAVEL_STYLES as readonly unknown[]).includes(value.style) &&
    // Contrato v2: orçamento ausente (propriedade omitida) ou número finito > 0.
    // `null`, 0, negativos e não finitos são inválidos.
    (value.budget === undefined || isValidBudgetValue(value.budget)) &&
    // Ritmo ausente ou um dos três valores conhecidos.
    (value.pace === undefined || isValidPace(value.pace))
  )
}

function isValidActivity(value: unknown): value is Activity {
  if (!isRecord(value)) return false
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.description) &&
    Array.isArray(value.categories) &&
    value.categories.length > 0 &&
    value.categories.every((item) =>
      (INTEREST_CATEGORIES as readonly unknown[]).includes(item),
    ) &&
    isFiniteNumber(value.durationHours) &&
    value.durationHours > 0 &&
    isFiniteNumber(value.estimatedCost) &&
    value.estimatedCost >= 0 &&
    (DAY_PERIODS as readonly unknown[]).includes(value.recommendedPeriod) &&
    Array.isArray(value.suitableStyles) &&
    value.suitableStyles.length > 0 &&
    value.suitableStyles.every((item) =>
      (TRAVEL_STYLES as readonly unknown[]).includes(item),
    )
  )
}

/**
 * Respeito às janelas de horário do gerador (SLOT_WINDOWS), mantida a
 * exceção existente para passeio longo (mais de 4,5 h) iniciado às
 * 09:00, que pode se estender até o fim da tarde.
 */
function respectsScheduleWindows(item: ScheduledActivity): boolean {
  const durationMinutes = item.activity.durationHours * 60
  if (durationMinutes > FULL_DAY_THRESHOLD_MINUTES) {
    return (
      item.period === 'manha' &&
      item.startMinutes === SLOT_WINDOWS.manha.start &&
      item.endMinutes <= SLOT_WINDOWS.tarde.end
    )
  }
  const window = SLOT_WINDOWS[item.period]
  return (
    item.startMinutes >= window.start && item.endMinutes <= window.end
  )
}

function validateScheduledActivity(
  value: unknown,
  reasons: string[],
): value is ScheduledActivity {
  if (!isRecord(value) || !isValidActivity(value.activity)) {
    reasons.push('atividade com campos obrigatórios incompletos ou inválidos')
    return false
  }
  if (!(SCHEDULED_PERIODS as readonly unknown[]).includes(value.period)) {
    reasons.push('atividade agendada em período desconhecido')
    return false
  }
  if (
    !Number.isInteger(value.startMinutes) ||
    !Number.isInteger(value.endMinutes)
  ) {
    reasons.push('horários da atividade não são minutos inteiros')
    return false
  }
  const start = value.startMinutes as number
  const end = value.endMinutes as number
  if (start < 0 || end > MINUTES_IN_A_DAY || start >= end) {
    reasons.push('horários da atividade fora do dia ou com início após o término')
    return false
  }
  // Coerência entre o horário agendado e a duração declarada da atividade.
  if (!approxEqual(end - start, value.activity.durationHours * 60)) {
    reasons.push('horário agendado incompatível com a duração da atividade')
    return false
  }
  const scheduled: ScheduledActivity = {
    activity: value.activity,
    period: value.period as ScheduledActivity['period'],
    startMinutes: start,
    endMinutes: end,
  }
  if (!respectsScheduleWindows(scheduled)) {
    reasons.push('horário da atividade fora das janelas de período do roteiro')
    return false
  }
  return true
}

function validateItineraryDay(
  value: unknown,
  expectedDayNumber: number,
  reasons: string[],
): value is ItineraryDay {
  if (!isRecord(value)) {
    reasons.push(`dia ${expectedDayNumber} com estrutura inválida`)
    return false
  }
  if (value.dayNumber !== expectedDayNumber) {
    reasons.push(`dias fora de sequência (esperado dia ${expectedDayNumber})`)
    return false
  }
  if (!Array.isArray(value.activities)) {
    reasons.push(`dia ${expectedDayNumber} sem lista de atividades`)
    return false
  }
  const activities: ScheduledActivity[] = []
  for (const item of value.activities) {
    if (!validateScheduledActivity(item, reasons)) return false
    activities.push(item)
  }
  // Invariante do gerador (TP-01): sem sobreposição dentro do dia.
  // Intervalos que apenas se tocam não configuram sobreposição.
  const ordered = [...activities].sort((a, b) => a.startMinutes - b.startMinutes)
  for (let index = 1; index < ordered.length; index += 1) {
    if (ordered[index].startMinutes < ordered[index - 1].endMinutes) {
      reasons.push(`dia ${expectedDayNumber} com horários sobrepostos`)
      return false
    }
  }
  return true
}

/** Resultado da validação de um registro persistido, com motivos. */
export interface ItineraryValidationResult {
  ok: boolean
  /** Motivos da rejeição, em pt-BR (vazio quando o registro é válido). */
  reasons: string[]
}

/**
 * Validação estrutural e semântica de um roteiro salvo (TP-02), usada na
 * leitura e antes de gravar um novo estado. Qualquer inconsistência —
 * data impossível, identificador vazio, dia fora de sequência, atividade
 * incompleta/repetida/incompatível, horário fora das janelas ou
 * sobreposto, categoria desconhecida ou total financeiro que não fecha —
 * torna o registro inválido, e ele não é renderizado.
 *
 * Nomes, descrições, preços e durações históricos NÃO são comparados
 * com o catálogo atual: registros antigos legítimos permanecem válidos.
 */
export function validateSavedItinerary(value: unknown): ItineraryValidationResult {
  const reasons: string[] = []

  if (!isRecord(value)) {
    return { ok: false, reasons: ['registro sem estrutura de objeto'] }
  }
  if (!isNonBlankString(value.id)) {
    reasons.push('identificador vazio ou composto apenas de espaços')
  }
  if (!isValidISODate(value.savedAt)) {
    reasons.push('data de salvamento inválida ou inexistente no calendário')
  }

  const itinerary = value.itinerary
  if (!isRecord(itinerary)) {
    reasons.push('roteiro ausente ou com estrutura inválida')
    return { ok: false, reasons }
  }
  if (!isValidPlanningInput(itinerary.input)) {
    reasons.push(
      'planejamento inválido (destino, dias, interesses, estilo ou orçamento)',
    )
    return { ok: false, reasons }
  }
  if (!Array.isArray(itinerary.days)) {
    reasons.push('lista de dias ausente ou inválida')
    return { ok: false, reasons }
  }

  const input = itinerary.input
  const budget = input.budget
  if (itinerary.days.length !== input.days) {
    reasons.push('quantidade de dias diferente do planejamento')
    return { ok: false, reasons }
  }

  const days: ItineraryDay[] = []
  const seenActivityIds = new Set<string>()
  for (let index = 0; index < itinerary.days.length; index += 1) {
    const day = itinerary.days[index]
    if (!validateItineraryDay(day, index + 1, reasons)) {
      return { ok: false, reasons }
    }
    // Ritmo (M3): o roteiro gerado com ritmo nunca excede o limite diário dele.
    const paceCap = input.pace === undefined ? null : PACE_MAX_ACTIVITIES_PER_DAY[input.pace]
    if (paceCap !== null && day.activities.length > paceCap) {
      reasons.push(`dia ${index + 1} excede o limite de ${paceCap} atividades do ritmo ${input.pace}`)
    }
    for (const item of day.activities) {
      // A mesma atividade não pode se repetir no roteiro.
      if (seenActivityIds.has(item.activity.id)) {
        reasons.push(`atividade "${item.activity.id}" repetida no roteiro`)
      }
      seenActivityIds.add(item.activity.id)
      // Compatibilidade: a atividade precisa atender ao estilo e a pelo
      // menos um interesse do planejamento.
      if (!item.activity.suitableStyles.includes(input.style)) {
        reasons.push(
          `atividade "${item.activity.id}" incompatível com o estilo do planejamento`,
        )
      }
      if (
        !item.activity.categories.some((category) =>
          input.interests.includes(category),
        )
      ) {
        reasons.push(
          `atividade "${item.activity.id}" não atende a nenhum interesse do planejamento`,
        )
      }
    }
    days.push(day)
  }
  if (reasons.length > 0) {
    return { ok: false, reasons }
  }

  if (
    !Array.isArray(itinerary.warnings) ||
    !itinerary.warnings.every((warning) => typeof warning === 'string')
  ) {
    reasons.push('lista de avisos inválida')
  }

  const totals = itinerary.totals
  if (!isRecord(totals)) {
    reasons.push('resumo financeiro ausente ou inválido')
    return { ok: false, reasons }
  }
  const estimated = totals.estimatedActivitiesCost
  const unallocated = totals.unallocatedBudget
  const average = totals.averageCostPerDay
  // Contrato v2: o saldo existe se, e somente se, existe orçamento. Orçamento
  // presente exige saldo finito e não negativo; orçamento ausente exige saldo
  // omitido (nunca 0, null ou qualquer valor).
  const balanceInvalid =
    budget === undefined
      ? unallocated !== undefined
      : !isFiniteNumber(unallocated) || unallocated < 0
  if (
    !isFiniteNumber(estimated) ||
    estimated < 0 ||
    balanceInvalid ||
    !isFiniteNumber(average) ||
    average < 0
  ) {
    if (!isFiniteNumber(estimated) || estimated < 0) {
      reasons.push('custo estimado das atividades inválido')
    }
    if (budget === undefined) {
      if (unallocated !== undefined) {
        reasons.push('saldo não alocado presente sem orçamento informado')
      }
    } else if (unallocated === undefined) {
      reasons.push('saldo não alocado ausente com orçamento informado')
    } else if (!isFiniteNumber(unallocated) || unallocated < 0) {
      // A tolerância não autoriza saldo negativo.
      reasons.push('saldo não alocado inválido ou negativo')
    }
    if (!isFiniteNumber(average) || average < 0) {
      reasons.push('custo médio por dia inválido')
    }
    return { ok: false, reasons }
  }

  // Consistência financeira: os totais devem fechar com as atividades
  // agendadas e com o orçamento. As relações de igualdade (custo = soma
  // das atividades, saldo = orçamento − custo, média = custo ÷ dias)
  // usam tolerância ABSOLUTA de 1e-6; a desigualdade custo ≤ orçamento
  // é ESTRITA, sem tolerância (correções AUD-03 e AUD-04).
  const scheduledCost = days.reduce(
    (total, day) =>
      total +
      day.activities.reduce((sum, item) => sum + item.activity.estimatedCost, 0),
    0,
  )
  if (!Number.isFinite(scheduledCost)) {
    reasons.push('soma dos custos das atividades não é finita')
    return { ok: false, reasons }
  }
  if (!approxEqual(estimated, scheduledCost)) {
    reasons.push('custo estimado não corresponde às atividades agendadas')
  }
  // Correção AUD-03: comparação ESTRITA de custo contra orçamento. A
  // tolerância absoluta de 1e-6 aplica-se somente às relações que a
  // admitem; ela não autoriza custo acima do orçamento, por menor que
  // seja a diferença (plano, seção 5: "Rejeitar custo superior ao
  // orçamento").
  if (budget !== undefined && estimated > budget) {
    reasons.push('custo estimado superior ao orçamento informado')
  }
  // Correção AUD-04: o saldo é comparado DIRETAMENTE com
  // orçamento − custo (tolerância absoluta de 1e-6). A verificação
  // anterior (custo + saldo ≈ orçamento) absorvia discrepâncias pela
  // precisão numérica com valores grandes — ex.: com orçamento = custo
  // = 1e16, um saldo declarado de 1 era aceito, embora o calculado
  // fosse 0. A subtração de dois valores finitos não negativos do
  // orçamento/custo é sempre finita, e a não negatividade do saldo já
  // foi verificada acima.
  if (budget !== undefined && !approxEqual(unallocated as number, budget - estimated)) {
    reasons.push('saldo não alocado inconsistente com orçamento e custo')
  }
  if (!approxEqual(average, estimated / input.days)) {
    reasons.push('custo médio por dia inconsistente com custo e duração')
  }

  return { ok: reasons.length === 0, reasons }
}

/** Guarda de tipo: o registro é um roteiro salvo válido (TP-02). */
export function isSavedItinerary(value: unknown): value is SavedItinerary {
  return validateSavedItinerary(value).ok
}

/* ------------------------------------------------------------------ */
/* Leitura                                                             */
/* ------------------------------------------------------------------ */

/** Situação do armazenamento na leitura (TP-05). */
export type StorageLoadStatus = 'ok' | 'empty' | 'corrupted' | 'unavailable'

/** Motivos de rejeição de um registro descartado na leitura. */
export interface RecordRejection {
  /** Posição do registro no array persistido. */
  index: number
  /** Identificador do registro, quando legível. */
  id: string | null
  /** Motivos da rejeição, em pt-BR. */
  reasons: string[]
}

export interface StorageLoadResult {
  status: StorageLoadStatus
  /**
   * Conteúdo bruto observado da chave principal nesta leitura (null
   * quando a chave está ausente ou o acesso falhou). É o vínculo das
   * confirmações e da proteção contra ações desatualizadas: mutações
   * que dependem desta leitura devem recebê-lo de volta.
   */
  raw: string | null
  /**
   * Registros válidos para consulta. Em coleções corrompidas por IDs
   * duplicados, nenhum registro é exposto (não há ações individuais
   * seguras para o grupo); em coleções parcialmente válidas, apenas os
   * registros íntegros são expostos.
   */
  records: SavedItinerary[]
  /** Quantidade de registros rejeitados pela validação. */
  discardedCount: number
  /** Motivos de rejeição de cada registro descartado. */
  rejections: RecordRejection[]
  /**
   * IDs que aparecem mais de uma vez na coleção. IDs duplicados tornam a
   * coleção corrompida (TP-03): nenhum integrante do grupo duplicado é
   * exposto para ações individuais.
   */
  duplicateIds: string[]
}

type RawPayload =
  | { status: 'unavailable' }
  | { status: 'empty' }
  | { status: 'found'; raw: string }

/**
 * Lê o conteúdo bruto da chave principal UMA vez. Uma string vazia
 * armazenada é conteúdo presente (será classificado como corrompido na
 * interpretação), não ausência de dados.
 */
function readRawPayload(): RawPayload {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === null ? { status: 'empty' } : { status: 'found', raw }
  } catch {
    return { status: 'unavailable' }
  }
}

function emptyLoadResult(status: StorageLoadStatus, raw: string | null): StorageLoadResult {
  return { status, raw, records: [], discardedCount: 0, rejections: [], duplicateIds: [] }
}

function extractRecordId(value: unknown): string | null {
  if (isRecord(value) && typeof value.id === 'string' && value.id.length > 0) {
    return value.id
  }
  return null
}

/**
 * Interpreta o conteúdo bruto da chave principal (função pura). Uma
 * coleção parcialmente válida é classificada como `corrupted`, mesmo
 * que alguns registros possam ser exibidos para consulta.
 */
function interpretStoredPayload(raw: string): StorageLoadResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return emptyLoadResult('corrupted', raw)
  }
  if (!Array.isArray(parsed)) {
    // Conteúdo legível, mas não é uma lista de roteiros: formato
    // desconhecido é corrompido — nunca interpretado por tentativa.
    return emptyLoadResult('corrupted', raw)
  }
  if (parsed.length === 0) {
    return emptyLoadResult('empty', raw)
  }

  const records: SavedItinerary[] = []
  const rejections: RecordRejection[] = []
  parsed.forEach((item, index) => {
    if (isSavedItinerary(item)) {
      records.push(item)
    } else {
      rejections.push({
        index,
        id: extractRecordId(item),
        reasons: validateSavedItinerary(item).reasons,
      })
    }
  })

  // Unicidade dos IDs na coleção: duplicados tornam a coleção
  // corrompida e nenhum registro é exposto para ações individuais.
  const idCounts = new Map<string, number>()
  for (const record of records) {
    idCounts.set(record.id, (idCounts.get(record.id) ?? 0) + 1)
  }
  const duplicateIds = [...idCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => id)
  if (duplicateIds.length > 0) {
    return {
      status: 'corrupted',
      raw,
      records: [],
      discardedCount: 0,
      rejections,
      duplicateIds,
    }
  }

  if (rejections.length > 0) {
    // Coleção parcialmente válida: corrompida, com os registros
    // íntegros disponíveis apenas para consulta.
    return {
      status: 'corrupted',
      raw,
      records,
      discardedCount: rejections.length,
      rejections,
      duplicateIds: [],
    }
  }

  return {
    status: 'ok',
    raw,
    records,
    discardedCount: 0,
    rejections: [],
    duplicateIds: [],
  }
}

/**
 * Lê os roteiros salvos, distinguindo armazenamento vazio, válido,
 * corrompido e indisponível. A leitura nunca migra, regrava, remove nem
 * corrige automaticamente os dados armazenados, e nenhuma falha de
 * leitura é convertida em lista vazia utilizável para gravação.
 */
export function loadSavedItineraries(): StorageLoadResult {
  const payload = readRawPayload()
  if (payload.status === 'unavailable') {
    return emptyLoadResult('unavailable', null)
  }
  if (payload.status === 'empty') {
    return emptyLoadResult('empty', null)
  }
  return interpretStoredPayload(payload.raw)
}

/* ------------------------------------------------------------------ */
/* Quarentena (leitura)                                                */
/* ------------------------------------------------------------------ */

export type QuarantineLoadResult =
  | { status: 'empty' }
  | { status: 'occupied'; raw: string }
  | { status: 'unavailable' }

/**
 * Lê a chave de quarentena sem alterá-la. Uma string vazia armazenada
 * conta como cópia ocupada (bloqueia novas preservações de conteúdo
 * diferente).
 */
export function loadQuarantine(): QuarantineLoadResult {
  try {
    const raw = localStorage.getItem(CORRUPTED_BACKUP_KEY)
    return raw === null ? { status: 'empty' } : { status: 'occupied', raw }
  } catch {
    return { status: 'unavailable' }
  }
}

/* ------------------------------------------------------------------ */
/* Primitivas das mutações seguras                                     */
/* ------------------------------------------------------------------ */

/** Resultado comum das mutações: sucesso confirmado, falha ou incerto. */
export type MutationOutcome =
  | { ok: true }
  | { ok: false; outcome: 'failure'; message: string }
  | { ok: false; outcome: 'uncertain'; message: string }

function failure(message: string): { ok: false; outcome: 'failure'; message: string } {
  return { ok: false, outcome: 'failure', message }
}

/**
 * Resultado incerto: a escrita retornou, mas a leitura de confirmação
 * falhou ou encontrou outro conteúdo. Nunca repetir a escrita nem
 * restaurar um snapshot antigo automaticamente.
 */
function uncertain(): { ok: false; outcome: 'uncertain'; message: string } {
  return { ok: false, outcome: 'uncertain', message: UNCERTAIN_RESULT_MESSAGE }
}

function isQuotaExceeded(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  )
}

function storageErrorMessage(error: unknown): string {
  return isQuotaExceeded(error) ? QUOTA_EXCEEDED_MESSAGE : STORAGE_UNAVAILABLE_MESSAGE
}

type LockRequest = <T>(name: string, callback: () => T | Promise<T>) => Promise<T>

/**
 * Acesso à API nativa Web Locks, com detecção de disponibilidade. Sem
 * fallback de escrita sem coordenação: a ausência da API bloqueia as
 * mutações.
 */
function getLockRequest(): LockRequest | null {
  if (typeof navigator === 'undefined') return null
  const locks = (navigator as { locks?: { request?: unknown } }).locks
  if (!locks || typeof locks.request !== 'function') return null
  const request = locks.request as (
    this: unknown,
    name: string,
    callback: () => unknown,
  ) => Promise<unknown>
  return <T,>(name: string, callback: () => T | Promise<T>) =>
    request.call(locks, name, callback) as Promise<T>
}

/**
 * Executa uma mutação sob o lock exclusivo `travel-planner:storage:v1`.
 * Na ausência da API ou se a aquisição falhar, a mutação é bloqueada
 * com mensagem explicativa (leitura e exportação permanecem utilizáveis).
 */
async function withStorageLock<R>(
  operation: () => R,
): Promise<R | { ok: false; outcome: 'failure'; message: string }> {
  const request = getLockRequest()
  if (!request) {
    return failure(LOCK_UNAVAILABLE_MESSAGE)
  }
  try {
    return await request(STORAGE_LOCK_NAME, operation)
  } catch {
    return failure(LOCK_ACQUISITION_FAILED_MESSAGE)
  }
}

type DecisionRead =
  | { ok: true; raw: string | null; load: StorageLoadResult }
  | { ok: false; outcome: 'failure'; message: string }

/**
 * A ÚNICA leitura de decisão de cada mutação: lê o conteúdo bruto uma
 * vez e interpreta exatamente esse conteúdo. Indisponibilidade bloqueia
 * a mutação — nunca é convertida em lista vazia.
 */
function readForDecision(): DecisionRead {
  const payload = readRawPayload()
  if (payload.status === 'unavailable') {
    return failure(STORAGE_UNAVAILABLE_MESSAGE)
  }
  if (payload.status === 'empty') {
    return { ok: true, raw: null, load: emptyLoadResult('empty', null) }
  }
  return { ok: true, raw: payload.raw, load: interpretStoredPayload(payload.raw) }
}

/**
 * Executa UM único setItem na chave principal e confirma a gravação por
 * releitura, exigindo igualdade exata com o texto gravado. É proibido
 * removeItem na chave principal: excluir o último roteiro grava `[]`.
 */
function writePrimaryWithConfirmation(serialized: string): MutationOutcome {
  try {
    localStorage.setItem(STORAGE_KEY, serialized)
  } catch (error) {
    // Falha sem alteração da chave principal.
    return failure(storageErrorMessage(error))
  }
  let confirmed: string | null
  try {
    confirmed = localStorage.getItem(STORAGE_KEY)
  } catch {
    return uncertain()
  }
  return confirmed === serialized ? { ok: true } : uncertain()
}

/** Validação do estado completo antes de gravar: registros válidos e IDs únicos. */
function isValidCollection(records: readonly SavedItinerary[]): boolean {
  const ids = new Set<string>()
  for (const record of records) {
    if (!isSavedItinerary(record) || ids.has(record.id)) return false
    ids.add(record.id)
  }
  return true
}

type QuarantinePreserveResult =
  | { ok: true; outcome: 'created' | 'reused' }
  | { ok: false; message: string }

/**
 * Preservação não destrutiva na quarentena: guarda o conteúdo bruto
 * original, sem filtrar nem reserializar. Reutiliza a cópia existente
 * quando é exatamente igual; bloqueia quando há cópia diferente
 * (inclusive string vazia); qualquer falha de leitura, escrita ou
 * confirmação interrompe a operação ANTES de tocar a chave principal.
 */
function preserveInQuarantine(raw: string): QuarantinePreserveResult {
  let existing: string | null
  try {
    existing = localStorage.getItem(CORRUPTED_BACKUP_KEY)
  } catch {
    return { ok: false, message: QUARANTINE_UNAVAILABLE_MESSAGE }
  }
  if (existing !== null) {
    if (existing === raw) return { ok: true, outcome: 'reused' }
    return { ok: false, message: QUARANTINE_OCCUPIED_MESSAGE }
  }
  try {
    localStorage.setItem(CORRUPTED_BACKUP_KEY, raw)
  } catch (error) {
    return {
      ok: false,
      message: isQuotaExceeded(error)
        ? QUOTA_EXCEEDED_MESSAGE
        : QUARANTINE_PRESERVE_FAILED_MESSAGE,
    }
  }
  // Confirmação da gravação do backup por releitura com igualdade exata.
  // Se a confirmação falhar, a cópia pode permanecer na quarentena: ela
  // não é limpa automaticamente e a chave principal não é alterada.
  let confirmed: string | null
  try {
    confirmed = localStorage.getItem(CORRUPTED_BACKUP_KEY)
  } catch {
    return { ok: false, message: QUARANTINE_PRESERVE_FAILED_MESSAGE }
  }
  if (confirmed !== raw) {
    return { ok: false, message: QUARANTINE_PRESERVE_FAILED_MESSAGE }
  }
  return { ok: true, outcome: 'created' }
}

/* ------------------------------------------------------------------ */
/* Salvamento (com confirmação de substituição)                        */
/* ------------------------------------------------------------------ */

/**
 * Vínculo de uma confirmação de substituição: o alvo (com o resumo
 * exibido ao usuário) e o conteúdo bruto observado quando a confirmação
 * foi solicitada. Se o armazenamento mudar desde então, a operação é
 * cancelada e exige nova análise.
 */
export interface ReplaceConfirmation {
  /** ID do registro que será substituído (o ID é preservado). */
  targetId: string
  /** Conteúdo bruto da chave principal observado na solicitação. */
  expectedRaw: string
  /** Resumo do alvo exibido na confirmação (destino, dias e data). */
  target: { destinationId: string; days: number; savedAt: string }
}

export type SaveItineraryResult =
  | { ok: true; record: SavedItinerary }
  | {
      ok: false
      outcome: 'needs-confirmation'
      message: string
      confirmation: ReplaceConfirmation
    }
  | { ok: false; outcome: 'failure'; message: string }
  | { ok: false; outcome: 'uncertain'; message: string }

/**
 * Salva um roteiro sob o lock exclusivo, com uma leitura de decisão,
 * construção e validação integral do novo estado em memória, um único
 * setItem e confirmação por releitura.
 *
 * - Sem planejamento equivalente: acrescenta registro com UUID único.
 * - Exatamente um equivalente: NÃO substitui automaticamente — retorna
 *   `needs-confirmation` com o vínculo (id do alvo + conteúdo bruto
 *   observado). A substituição confirmada preserva o id do alvo e
 *   substitui somente esse registro.
 * - Mais de um equivalente: bloqueado (ambiguidade), sem escolha
 *   automática.
 * - Coleção corrompida: escrita bloqueada (sem limpeza automática nem
 *   quarentena como efeito colateral) — a recuperação é explícita.
 */
export async function saveItinerary(
  itinerary: Itinerary,
  confirmation?: ReplaceConfirmation,
): Promise<SaveItineraryResult> {
  return withStorageLock((): SaveItineraryResult => {
    const decision = readForDecision()
    if (!decision.ok) return decision
    const { raw, load } = decision

    if (load.status === 'corrupted') {
      return failure(CORRUPTED_STORAGE_MESSAGE)
    }
    const records = load.records

    let id: string
    if (confirmation) {
      // Substituição confirmada: revalidar o vínculo com o conteúdo
      // observado. Conteúdo mudou desde a confirmação → cancelar.
      if (raw === null || raw !== confirmation.expectedRaw) {
        return failure(STALE_ACTION_MESSAGE)
      }
      const target = records.find((item) => item.id === confirmation.targetId)
      if (!target) return failure(STALE_ACTION_MESSAGE)
      id = target.id
    } else {
      const equivalents = records.filter((item) =>
        arePlanningsEquivalent(item.itinerary.input, itinerary.input),
      )
      if (equivalents.length > 1) {
        // Ambiguidade: nenhuma escolha automática entre equivalentes.
        return failure(AMBIGUOUS_EQUIVALENTS_MESSAGE)
      }
      if (equivalents.length === 1) {
        const target = equivalents[0]
        return {
          ok: false,
          outcome: 'needs-confirmation',
          message: REPLACE_NEEDS_CONFIRMATION_MESSAGE,
          confirmation: {
            targetId: target.id,
            // equivalents não vazio ⇒ a chave principal tem conteúdo.
            expectedRaw: raw ?? '[]',
            target: {
              destinationId: target.itinerary.input.destinationId,
              days: target.itinerary.input.days,
              savedAt: target.savedAt,
            },
          },
        }
      }
      const newId = createUniqueRecordId(new Set(records.map((item) => item.id)))
      if (newId === null) {
        return failure(ID_GENERATION_FAILED_MESSAGE)
      }
      id = newId
    }

    const record: SavedItinerary = {
      id,
      savedAt: new Date().toISOString(),
      itinerary,
    }

    // A mesma validação da leitura é aplicada ao novo registro e ao
    // estado completo antes de gravar (TP-02).
    if (!isSavedItinerary(record)) {
      return failure(INVALID_ITINERARY_MESSAGE)
    }
    const others = records.filter((item) => item.id !== record.id)
    const nextState = [record, ...others]
    if (!isValidCollection(nextState)) {
      return failure(INVALID_ITINERARY_MESSAGE)
    }

    const write = writePrimaryWithConfirmation(JSON.stringify(nextState))
    if (!write.ok) return write
    return { ok: true, record }
  })
}

/* ------------------------------------------------------------------ */
/* Exclusão                                                            */
/* ------------------------------------------------------------------ */

/** Conteúdo observado na leitura que exibiu o alvo da ação. */
export interface ObservedContent {
  /** Conteúdo bruto da chave principal (null = chave ausente). */
  expectedRaw: string | null
}

export type RemoveItineraryResult = MutationOutcome

/**
 * Remove um roteiro salvo pelo identificador, vinculado ao conteúdo
 * bruto observado. A coleção precisa estar válida e com IDs únicos
 * (grupos com IDs duplicados não recebem ações individuais). Excluir o
 * último roteiro grava um array vazio — a chave principal nunca é
 * removida. A exclusão não aciona limpeza automática de corrupção.
 */
export async function removeSavedItinerary(
  id: string,
  observed: ObservedContent,
): Promise<RemoveItineraryResult> {
  return withStorageLock((): RemoveItineraryResult => {
    const decision = readForDecision()
    if (!decision.ok) return decision
    const { raw, load } = decision

    if (raw !== observed.expectedRaw) {
      return failure(STALE_ACTION_MESSAGE)
    }
    if (load.status === 'corrupted') {
      return failure(CORRUPTED_STORAGE_MESSAGE)
    }
    const target = load.records.find((item) => item.id === id)
    if (!target) {
      return failure(RECORD_NOT_FOUND_MESSAGE)
    }

    const nextState = load.records.filter((item) => item.id !== id)
    return writePrimaryWithConfirmation(JSON.stringify(nextState))
  })
}

/* ------------------------------------------------------------------ */
/* Recuperação explícita da chave principal                            */
/* ------------------------------------------------------------------ */

interface CorruptedAnalysis {
  /** Registros individualmente válidos (ignora a unicidade na coleção). */
  valid: SavedItinerary[]
  /** Registros que falharam na validação individual. */
  invalidCount: number
  /** IDs que aparecem mais de uma vez entre os registros válidos. */
  duplicatedIds: ReadonlySet<string>
}

/**
 * Análise individual dos registros de um payload corrompido, usada na
 * recuperação: separa os registros recuperáveis dos que permanecerão
 * apenas na cópia de segurança e identifica os grupos de IDs duplicados.
 */
function analyzeCorruptedPayload(raw: string): CorruptedAnalysis {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { valid: [], invalidCount: 0, duplicatedIds: new Set() }
  }
  if (!Array.isArray(parsed)) {
    return { valid: [], invalidCount: 0, duplicatedIds: new Set() }
  }
  const valid: SavedItinerary[] = []
  let invalidCount = 0
  for (const item of parsed) {
    if (isSavedItinerary(item)) {
      valid.push(item)
    } else {
      invalidCount += 1
    }
  }
  const idCounts = new Map<string, number>()
  for (const record of valid) {
    idCounts.set(record.id, (idCounts.get(record.id) ?? 0) + 1)
  }
  const duplicatedIds = new Set(
    [...idCounts.entries()].filter(([, count]) => count > 1).map(([id]) => id),
  )
  return { valid, invalidCount, duplicatedIds }
}

/**
 * Monta a coleção recuperada em memória: registros individualmente
 * válidos são preservados (id, savedAt e campos desconhecidos intactos)
 * e TODOS os integrantes de grupos com IDs duplicados recebem IDs novos
 * e distintos. Retorna null se a geração de IDs falhar (sem escrita).
 */
function buildRecoveredCollection(
  valid: readonly SavedItinerary[],
  duplicatedIds: ReadonlySet<string>,
): { records: SavedItinerary[]; idsFixedCount: number } | null {
  const usedIds = new Set(valid.map((record) => record.id))
  const records: SavedItinerary[] = []
  let idsFixedCount = 0
  for (const record of valid) {
    if (duplicatedIds.has(record.id)) {
      const newId = createUniqueRecordId(usedIds)
      if (newId === null) return null
      usedIds.add(newId)
      records.push({ ...record, id: newId })
      idsFixedCount += 1
    } else {
      records.push(record)
    }
  }
  return { records, idsFixedCount }
}

export type RecoveryPreview =
  | {
      status: 'corrupted'
      /** Conteúdo bruto observado — vínculo da confirmação. */
      raw: string
      /** Registros válidos que serão recuperados. */
      recoverableCount: number
      /** Registros ilegíveis que permanecerão apenas na cópia de segurança. */
      backupOnlyCount: number
      /** Registros que receberão novos IDs (grupos com IDs duplicados). */
      idsToFixCount: number
    }
  | { status: 'not-corrupted' }
  | { status: 'unavailable' }

/**
 * Pré-visualização somente de leitura da recuperação: informa quantos
 * registros serão recuperados, quantos permanecerão apenas no backup e
 * quantos IDs precisarão ser corrigidos. Não altera nenhuma chave.
 */
export function previewRecovery(): RecoveryPreview {
  const payload = readRawPayload()
  if (payload.status === 'unavailable') return { status: 'unavailable' }
  if (payload.status === 'empty') return { status: 'not-corrupted' }
  const load = interpretStoredPayload(payload.raw)
  if (load.status !== 'corrupted') return { status: 'not-corrupted' }
  const analysis = analyzeCorruptedPayload(payload.raw)
  return {
    status: 'corrupted',
    raw: payload.raw,
    recoverableCount: analysis.valid.length,
    backupOnlyCount: analysis.invalidCount,
    idsToFixCount: analysis.valid.filter((record) =>
      analysis.duplicatedIds.has(record.id),
    ).length,
  }
}

export type RecoverStorageResult =
  | {
      ok: true
      recoveredCount: number
      backupOnlyCount: number
      idsFixedCount: number
      /** Preservação comprovada: cópia criada agora ou reutilizada por ser idêntica. */
      backup: 'created' | 'reused'
    }
  | { ok: false; outcome: 'failure'; message: string }
  | { ok: false; outcome: 'uncertain'; message: string }

/**
 * Recuperação explícita "preservar cópia e recuperar registros válidos":
 *
 * 1. Revalida o conteúdo bruto observado e o estado corrompido (ações
 *    desatualizadas são canceladas sem alterar nenhuma chave).
 * 2. Constrói a coleção recuperada em memória (registros válidos
 *    preservados; IDs duplicados corrigidos com UUIDs novos).
 * 3. Cria ou confirma o backup na quarentena — se falhar, interrompe e
 *    preserva a chave principal.
 * 4. Grava a coleção recuperada diretamente sobre a chave principal com
 *    um único setItem (nunca removeItem antes de substituir).
 * 5. Confirma a gravação por releitura.
 *
 * Sem registros recuperáveis, a lista ativa fica vazia (`[]`) e o
 * conteúdo original permanece na quarentena.
 */
export async function recoverCorruptedStorage(
  expectedRaw: string,
): Promise<RecoverStorageResult> {
  return withStorageLock((): RecoverStorageResult => {
    const decision = readForDecision()
    if (!decision.ok) return decision
    const { raw, load } = decision

    // Proteção contra ações desatualizadas: o conteúdo precisa ser
    // exatamente o exibido na confirmação e ainda estar corrompido.
    if (raw === null || raw !== expectedRaw) {
      return failure(STALE_ACTION_MESSAGE)
    }
    if (load.status !== 'corrupted') {
      return failure(STALE_ACTION_MESSAGE)
    }

    const analysis = analyzeCorruptedPayload(raw)
    const recovered = buildRecoveredCollection(analysis.valid, analysis.duplicatedIds)
    if (!recovered) {
      return failure(ID_GENERATION_FAILED_MESSAGE)
    }
    if (!isValidCollection(recovered.records)) {
      return failure(INVALID_ITINERARY_MESSAGE)
    }

    // Preservação não destrutiva ANTES de tocar a chave principal.
    const backup = preserveInQuarantine(raw)
    if (!backup.ok) {
      return failure(backup.message)
    }

    const write = writePrimaryWithConfirmation(JSON.stringify(recovered.records))
    if (!write.ok) return write
    return {
      ok: true,
      recoveredCount: recovered.records.length,
      backupOnlyCount: analysis.invalidCount,
      idsFixedCount: recovered.idsFixedCount,
      backup: backup.outcome,
    }
  })
}

/* ------------------------------------------------------------------ */
/* Quarentena: restauração e descarte definitivo                       */
/* ------------------------------------------------------------------ */

export type RestoreQuarantineResult =
  | { ok: true; restoredCount: number; idsFixedCount: number }
  | { ok: false; outcome: 'failure'; message: string }
  | { ok: false; outcome: 'uncertain'; message: string }

export type QuarantineRestorePreview =
  | {
      status: 'ready'
      /** Conteúdo bruto exato da cópia observada — vínculo da confirmação. */
      raw: string
      /** Registros individualmente válidos que serão restaurados. */
      restoreCount: number
      /** Registros que receberão novos IDs (grupos com IDs duplicados). */
      idsToFixCount: number
    }
  | { status: 'empty' }
  | { status: 'unavailable' }

/**
 * Pré-visualização somente de leitura da restauração da quarentena
 * (AUD-06): informa quantos registros serão restaurados e quantos
 * receberão novos identificadores (integrantes de grupos com IDs
 * duplicados), com o conteúdo bruto exato observado para vincular a
 * confirmação. Não altera nenhuma chave. A restauração em si continua
 * condicionada à chave principal vazia, revalidada no momento da
 * confirmação por `restoreQuarantineCopy`.
 */
export function previewQuarantineRestore(): QuarantineRestorePreview {
  let raw: string | null
  try {
    raw = localStorage.getItem(CORRUPTED_BACKUP_KEY)
  } catch {
    return { status: 'unavailable' }
  }
  if (raw === null) return { status: 'empty' }
  const analysis = analyzeCorruptedPayload(raw)
  return {
    status: 'ready',
    raw,
    restoreCount: analysis.valid.length,
    idsToFixCount: analysis.valid.filter((record) =>
      analysis.duplicatedIds.has(record.id),
    ).length,
  }
}

/**
 * Restaura os registros individualmente válidos da quarentena para a
 * chave principal, mediante confirmação vinculada ao conteúdo da
 * quarentena. Permitida SOMENTE quando a chave principal está vazia;
 * com roteiros ativos ou corrupção pendente, é bloqueada (a cópia pode
 * ser exportada). A quarentena é mantida após a restauração.
 */
export async function restoreQuarantineCopy(
  expectedRaw: string,
): Promise<RestoreQuarantineResult> {
  return withStorageLock((): RestoreQuarantineResult => {
    const decision = readForDecision()
    if (!decision.ok) return decision
    const { load } = decision

    if (load.status === 'corrupted') {
      return failure(RESTORE_BLOCKED_CORRUPTED_MESSAGE)
    }
    if (load.status !== 'empty') {
      return failure(RESTORE_BLOCKED_NON_EMPTY_MESSAGE)
    }

    let quarantineRaw: string | null
    try {
      quarantineRaw = localStorage.getItem(CORRUPTED_BACKUP_KEY)
    } catch {
      return failure(QUARANTINE_UNAVAILABLE_MESSAGE)
    }
    if (quarantineRaw === null) {
      return failure(QUARANTINE_EMPTY_MESSAGE)
    }
    if (quarantineRaw !== expectedRaw) {
      return failure(STALE_ACTION_MESSAGE)
    }

    const analysis = analyzeCorruptedPayload(quarantineRaw)
    const restored = buildRecoveredCollection(analysis.valid, analysis.duplicatedIds)
    if (!restored) {
      return failure(ID_GENERATION_FAILED_MESSAGE)
    }
    if (!isValidCollection(restored.records)) {
      return failure(INVALID_ITINERARY_MESSAGE)
    }

    const write = writePrimaryWithConfirmation(JSON.stringify(restored.records))
    if (!write.ok) return write
    return {
      ok: true,
      restoredCount: restored.records.length,
      idsFixedCount: restored.idsFixedCount,
    }
  })
}

export type DiscardQuarantineResult = MutationOutcome

/**
 * Descarte definitivo da cópia em quarentena, mediante confirmação
 * explícita vinculada ao conteúdo da própria quarentena. NÃO altera a
 * chave principal. Falha na remoção ou na confirmação retorna erro ou
 * resultado incerto — nunca falso sucesso.
 */
export async function discardQuarantineCopy(
  expectedRaw: string,
): Promise<DiscardQuarantineResult> {
  return withStorageLock((): DiscardQuarantineResult => {
    let current: string | null
    try {
      current = localStorage.getItem(CORRUPTED_BACKUP_KEY)
    } catch {
      return failure(QUARANTINE_UNAVAILABLE_MESSAGE)
    }
    if (current === null) {
      return failure(QUARANTINE_EMPTY_MESSAGE)
    }
    if (current !== expectedRaw) {
      return failure(STALE_ACTION_MESSAGE)
    }
    try {
      localStorage.removeItem(CORRUPTED_BACKUP_KEY)
    } catch (error) {
      return failure(storageErrorMessage(error))
    }
    // Confirmação por releitura: sucesso somente com evidência.
    let after: string | null
    try {
      after = localStorage.getItem(CORRUPTED_BACKUP_KEY)
    } catch {
      return uncertain()
    }
    return after === null ? { ok: true } : uncertain()
  })
}
