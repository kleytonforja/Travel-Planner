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
  SLOT_WINDOWS,
} from './itineraryGenerator'

/**
 * Persistência de roteiros no LocalStorage (ver DECISIONS.md, D7, D14 e
 * o plano docs/PERSISTENCE_REMEDIATION_PLAN.md).
 *
 * Correções pós-auditoria:
 *
 * - TP-02: validação estrutural e semântica de cada registro — datas
 *   reais de calendário (sem normalizações como 30/02 ou 24:00),
 *   identificadores não vazios, destinos/dias/atividades coerentes,
 *   horários dentro das janelas do gerador e sem sobreposição
 *   (invariante TP-01), compatibilidade de estilo/interesses, atividades
 *   sem repetição e integridade financeira com tolerância absoluta de
 *   1e-6, incluindo rejeição de custo superior ao orçamento. A mesma
 *   validação é aplicada na leitura e antes de gravar um novo estado.
 * - TP-03: identidade separada de equivalência. Registros novos usam
 *   `crypto.randomUUID()`, confrontados com os IDs já existentes (limite
 *   de 10 tentativas; esgotamento ou indisponibilidade retorna erro, sem
 *   escrita e sem fallback inseguro). Planejamentos equivalentes são
 *   comparados diretamente pelos campos normalizados (destino, dias,
 *   estilo, orçamento exato e conjunto de interesses), sem hash em
 *   nenhuma decisão de persistência. IDs históricos válidos, inclusive
 *   os legados derivados de hash, são preservados.
 * - TP-04: operações tratam falhas de leitura/escrita (quota excedida,
 *   armazenamento indisponível) e as devolvem como resultado — nenhuma
 *   exceção é lançada para a interface e o estado anterior é preservado.
 * - TP-05: a leitura distingue armazenamento vazio, válido, corrompido
 *   (inclusive coleções com IDs duplicados) e indisponível. Dados
 *   ilegíveis nunca são sobrescritos silenciosamente na leitura; o
 *   descarte definitivo exige ação explícita do usuário.
 *
 * Dependências do próximo checkpoint (P2 — novo fluxo de gravação):
 * confirmação de substituição vinculada ao conteúdo observado, bloqueio
 * de escritas em coleções corrompidas, confirmação de gravação por
 * releitura, Web Locks e recuperação explícita da quarentena.
 */

export const STORAGE_KEY = 'travel-planner:saved-itineraries:v1'

/**
 * Chave de quarentena: recebe o payload ilegível antes de qualquer
 * sobrescrita, para que dados corrompidos nunca sejam perdidos sem
 * autorização do usuário.
 */
export const CORRUPTED_BACKUP_KEY = `${STORAGE_KEY}:quarentena`

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
    input.budget,
    [...input.interests].sort().join(','),
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
 * estilo, orçamento numérico exato (sem arredondamento) e o CONJUNTO de
 * interesses, independentemente da ordem. Comparação direta entre
 * campos, sem hash.
 */
export function arePlanningsEquivalent(
  a: PlanningInput,
  b: PlanningInput,
): boolean {
  if (a.destinationId !== b.destinationId) return false
  if (a.days !== b.days) return false
  if (a.style !== b.style) return false
  if (a.budget !== b.budget) return false
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
    isFiniteNumber(value.budget) &&
    value.budget > 0
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
  if (
    !isFiniteNumber(estimated) ||
    estimated < 0 ||
    !isFiniteNumber(unallocated) ||
    unallocated < 0 ||
    !isFiniteNumber(average) ||
    average < 0
  ) {
    if (!isFiniteNumber(estimated) || estimated < 0) {
      reasons.push('custo estimado das atividades inválido')
    }
    // A tolerância não autoriza saldo negativo.
    if (!isFiniteNumber(unallocated) || unallocated < 0) {
      reasons.push('saldo não alocado inválido ou negativo')
    }
    if (!isFiniteNumber(average) || average < 0) {
      reasons.push('custo médio por dia inválido')
    }
    return { ok: false, reasons }
  }

  // Consistência financeira (tolerância absoluta de 1e-6): os totais
  // devem fechar com as atividades agendadas e com o orçamento, e o
  // custo estimado nunca pode superar o orçamento informado.
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
  if (estimated - input.budget > EPSILON) {
    reasons.push('custo estimado superior ao orçamento informado')
  }
  if (!approxEqual(estimated + unallocated, input.budget)) {
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
  /** Apenas registros válidos — registros inválidos nunca são expostos. */
  records: SavedItinerary[]
  /** Quantidade de registros descartados por falha de validação. */
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

function readRawPayload(): RawPayload {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { status: 'found', raw } : { status: 'empty' }
  } catch {
    return { status: 'unavailable' }
  }
}

function emptyLoadResult(status: StorageLoadStatus): StorageLoadResult {
  return { status, records: [], discardedCount: 0, rejections: [], duplicateIds: [] }
}

function extractRecordId(value: unknown): string | null {
  if (isRecord(value) && typeof value.id === 'string' && value.id.length > 0) {
    return value.id
  }
  return null
}

/**
 * Lê os roteiros salvos, distinguindo armazenamento vazio, válido,
 * corrompido (JSON ilegível, formato inesperado ou IDs duplicados) e
 * indisponível. Dados corrompidos nunca são sobrescritos nem apagados
 * na leitura, e registros incompatíveis são preservados no armazenamento
 * (não são descartados automaticamente).
 */
export function loadSavedItineraries(): StorageLoadResult {
  const payload = readRawPayload()
  if (payload.status === 'unavailable') {
    return emptyLoadResult('unavailable')
  }
  if (payload.status === 'empty') {
    return emptyLoadResult('empty')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(payload.raw)
  } catch {
    return emptyLoadResult('corrupted')
  }
  if (!Array.isArray(parsed)) {
    // Conteúdo legível, mas não é uma lista de roteiros: tratar como
    // corrompido para não sobrescrever dados desconhecidos.
    return emptyLoadResult('corrupted')
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
      records: [],
      discardedCount: 0,
      rejections,
      duplicateIds,
    }
  }

  return {
    status: 'ok',
    records,
    discardedCount: rejections.length,
    rejections,
    duplicateIds: [],
  }
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

/**
 * Move o payload ilegível para a chave de quarentena e libera a chave
 * principal (melhor esforço: se a quarentena falhar, o conteúdo original
 * permanece intacto). Nada é apagado de forma destrutiva.
 */
function quarantineCorruptedPayload(raw: string): void {
  try {
    if (!localStorage.getItem(CORRUPTED_BACKUP_KEY)) {
      localStorage.setItem(CORRUPTED_BACKUP_KEY, raw)
    }
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Quarentena indisponível: os dados originais não foram tocados.
  }
}

export type SaveItineraryResult =
  | { ok: true; record: SavedItinerary }
  | { ok: false; message: string }

/**
 * Salva um roteiro e retorna o resultado da operação.
 *
 * Um planejamento equivalente (mesmos destino, dias, estilo, orçamento e
 * conjunto de interesses — ver `arePlanningsEquivalent`) substitui o
 * registro anterior preservando o identificador original, inclusive de
 * registros legados cujo id é o hash do formato v1. Planejamentos
 * diferentes geram registros novos com UUID único confrontado com os IDs
 * existentes: colisões de hash nunca substituem roteiros diferentes
 * (TP-03). Mais de um equivalente bloqueia a substituição automática.
 *
 * O novo estado é validado integralmente antes da escrita (TP-02). Se o
 * armazenamento estiver corrompido, o payload ilegível é movido para
 * quarentena antes da escrita (TP-05). Falhas são devolvidas como erro,
 * sem alterar os registros anteriores (TP-04).
 */
export function saveItinerary(itinerary: Itinerary): SaveItineraryResult {
  const payload = readRawPayload()
  if (payload.status === 'unavailable') {
    return { ok: false, message: STORAGE_UNAVAILABLE_MESSAGE }
  }

  let records: SavedItinerary[] = []
  if (payload.status === 'found') {
    const load = loadSavedItineraries()
    if (load.status === 'corrupted' || load.discardedCount > 0) {
      // Nunca sobrescrever silenciosamente dados ilegíveis ou registros
      // que serão descartados pela validação: o payload original vai para
      // a quarentena antes da escrita.
      quarantineCorruptedPayload(payload.raw)
    }
    records = load.records
  }

  const equivalents = records.filter((item) =>
    arePlanningsEquivalent(item.itinerary.input, itinerary.input),
  )

  let id: string
  if (equivalents.length > 1) {
    // Ambiguidade: nenhuma escolha automática entre equivalentes.
    return { ok: false, message: AMBIGUOUS_EQUIVALENTS_MESSAGE }
  }
  if (equivalents.length === 1) {
    // Substituição preservando o identificador original (inclusive o id
    // legado derivado de hash). A confirmação prévia do usuário,
    // vinculada ao conteúdo observado, chega no próximo checkpoint (P2).
    id = equivalents[0].id
  } else {
    const newId = createUniqueRecordId(new Set(records.map((item) => item.id)))
    if (newId === null) {
      return { ok: false, message: ID_GENERATION_FAILED_MESSAGE }
    }
    id = newId
  }

  const record: SavedItinerary = {
    id,
    savedAt: new Date().toISOString(),
    itinerary,
  }

  // A mesma validação da leitura é aplicada antes de gravar o novo
  // estado: um roteiro inconsistente nunca é persistido.
  if (!isSavedItinerary(record)) {
    return { ok: false, message: INVALID_ITINERARY_MESSAGE }
  }

  try {
    const others = records.filter((item) => item.id !== record.id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...others]))
  } catch (error) {
    return { ok: false, message: storageErrorMessage(error) }
  }
  return { ok: true, record }
}

export type RemoveItineraryResult = { ok: true } | { ok: false; message: string }

/**
 * Remove um roteiro salvo pelo identificador. Em caso de falha de
 * escrita, o armazenamento permanece como estava (TP-04).
 */
export function removeSavedItinerary(id: string): RemoveItineraryResult {
  const payload = readRawPayload()
  if (payload.status === 'unavailable') {
    return { ok: false, message: STORAGE_UNAVAILABLE_MESSAGE }
  }

  let records: SavedItinerary[] = []
  if (payload.status === 'found') {
    const load = loadSavedItineraries()
    if (load.status === 'corrupted' || load.discardedCount > 0) {
      quarantineCorruptedPayload(payload.raw)
    }
    records = load.records
  }

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(records.filter((item) => item.id !== id)),
    )
  } catch (error) {
    return { ok: false, message: storageErrorMessage(error) }
  }
  return { ok: true }
}

/**
 * Descarte explícito, autorizado pelo usuário, de dados ilegíveis
 * (TP-05). O conteúdo é movido para a chave de quarentena antes de
 * liberar a chave principal — não é uma migração destrutiva automática.
 */
export function discardCorruptedData(): RemoveItineraryResult {
  const payload = readRawPayload()
  if (payload.status === 'unavailable') {
    return { ok: false, message: STORAGE_UNAVAILABLE_MESSAGE }
  }
  if (payload.status === 'found') {
    quarantineCorruptedPayload(payload.raw)
  }
  return { ok: true }
}
