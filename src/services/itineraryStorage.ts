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

/**
 * Persistência de roteiros no LocalStorage (ver DECISIONS.md, D7 e D14).
 *
 * Correções pós-auditoria:
 *
 * - TP-02: a leitura valida cada registro de forma estrutural E semântica
 *   (datas, identificadores, destinos, dias, atividades, horários,
 *   categorias, valores financeiros e consistência entre totais).
 *   Registros inválidos nunca são entregues à interface.
 * - TP-03: a identidade do registro salvo é um identificador único,
 *   independente do planejamento. A comparação de planejamentos
 *   equivalentes usa a impressão digital (`buildPlanningFingerprint`),
 *   sem substituir roteiros diferentes por colisão de hash.
 * - TP-04: toda operação trata falhas de leitura/escrita (quota excedida,
 *   armazenamento indisponível) e as devolve como resultado — nenhuma
 *   exceção é lançada para a interface e o estado anterior é preservado.
 * - TP-05: a leitura distingue armazenamento vazio, válido, corrompido e
 *   indisponível. Dados ilegíveis nunca são sobrescritos silenciosamente:
 *   escritas os movem antes para uma chave de quarentena, e o descarte
 *   definitivo exige ação explícita do usuário (sem migração destrutiva
 *   automática).
 */

export const STORAGE_KEY = 'travel-planner:saved-itineraries:v1'

/**
 * Chave de quarentena: recebe o payload ilegível antes de qualquer
 * sobrescrita, para que dados corrompidos nunca sejam perdidos sem
 * autorização do usuário.
 */
export const CORRUPTED_BACKUP_KEY = `${STORAGE_KEY}:quarentena`

const QUOTA_EXCEEDED_MESSAGE =
  'Não foi possível concluir a operação porque o armazenamento do navegador está cheio. Exclua roteiros salvos ou libere espaço e tente novamente. Os roteiros anteriores foram preservados.'
const STORAGE_UNAVAILABLE_MESSAGE =
  'Não foi possível acessar o armazenamento do navegador (indisponível ou bloqueado). Nenhuma alteração foi feita nos roteiros salvos.'

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
const EPSILON = 1e-6

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/

/**
 * Impressão digital determinística do planejamento (hash djb2), usada
 * apenas para COMPARAR planejamentos equivalentes — nunca como
 * identidade do registro salvo (correção TP-03, ver DECISIONS.md).
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

/** Identificador único do registro salvo (independe do planejamento). */
function createRecordId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return `roteiro-${crypto.randomUUID()}`
  }
  return `roteiro-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function approxEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= EPSILON * Math.max(1, Math.abs(a), Math.abs(b))
}

/** Data em formato ISO 8601 (UTC) e semanticamente válida. */
function isValidISODate(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    ISO_DATE_PATTERN.test(value) &&
    !Number.isNaN(Date.parse(value))
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

function isValidScheduledActivity(value: unknown): value is ScheduledActivity {
  if (!isRecord(value)) return false
  if (!isValidActivity(value.activity)) return false
  if (!(SCHEDULED_PERIODS as readonly unknown[]).includes(value.period)) {
    return false
  }
  if (
    !Number.isInteger(value.startMinutes) ||
    !Number.isInteger(value.endMinutes)
  ) {
    return false
  }
  const start = value.startMinutes as number
  const end = value.endMinutes as number
  if (start < 0 || end > MINUTES_IN_A_DAY || start >= end) return false
  // Coerência entre o horário agendado e a duração declarada da atividade.
  return approxEqual(end - start, value.activity.durationHours * 60)
}

function isValidItineraryDay(
  value: unknown,
  expectedDayNumber: number,
): value is ItineraryDay {
  if (!isRecord(value)) return false
  if (value.dayNumber !== expectedDayNumber) return false
  if (!Array.isArray(value.activities)) return false
  if (!value.activities.every(isValidScheduledActivity)) return false
  // Invariante do gerador (TP-01): sem sobreposição dentro do dia.
  const ordered = [...value.activities].sort(
    (a, b) => a.startMinutes - b.startMinutes,
  )
  for (let index = 1; index < ordered.length; index += 1) {
    if (ordered[index].startMinutes < ordered[index - 1].endMinutes) {
      return false
    }
  }
  return true
}

/**
 * Validação estrutural e semântica de um roteiro salvo (TP-02).
 * Qualquer inconsistência — data ilegível, dia vazio de estrutura,
 * horário incoerente, categoria desconhecida ou total financeiro que
 * não fecha — torna o registro inválido, e ele não é renderizado.
 */
export function isSavedItinerary(value: unknown): value is SavedItinerary {
  if (!isRecord(value)) return false
  if (!isNonEmptyString(value.id)) return false
  if (!isValidISODate(value.savedAt)) return false

  const itinerary = value.itinerary
  if (!isRecord(itinerary)) return false
  if (!isValidPlanningInput(itinerary.input)) return false
  if (!Array.isArray(itinerary.days)) return false

  const input = itinerary.input
  if (itinerary.days.length !== input.days) return false

  const days: ItineraryDay[] = []
  for (let index = 0; index < itinerary.days.length; index += 1) {
    const day = itinerary.days[index]
    if (!isValidItineraryDay(day, index + 1)) return false
    days.push(day)
  }

  if (
    !Array.isArray(itinerary.warnings) ||
    !itinerary.warnings.every((warning) => typeof warning === 'string')
  ) {
    return false
  }

  const totals = itinerary.totals
  if (!isRecord(totals)) return false
  if (
    !isFiniteNumber(totals.estimatedActivitiesCost) ||
    totals.estimatedActivitiesCost < 0 ||
    !isFiniteNumber(totals.unallocatedBudget) ||
    !isFiniteNumber(totals.averageCostPerDay)
  ) {
    return false
  }

  // Consistência financeira: totais devem fechar com as atividades
  // agendadas e com o orçamento informado.
  const scheduledCost = days.reduce(
    (total, day) =>
      total + day.activities.reduce((sum, item) => sum + item.activity.estimatedCost, 0),
    0,
  )
  if (!approxEqual(totals.estimatedActivitiesCost, scheduledCost)) return false
  if (
    !approxEqual(
      totals.estimatedActivitiesCost + totals.unallocatedBudget,
      input.budget,
    )
  ) {
    return false
  }
  return approxEqual(
    totals.averageCostPerDay,
    totals.estimatedActivitiesCost / input.days,
  )
}

/** Situação do armazenamento na leitura (TP-05). */
export type StorageLoadStatus = 'ok' | 'empty' | 'corrupted' | 'unavailable'

export interface StorageLoadResult {
  status: StorageLoadStatus
  /** Apenas registros válidos — registros inválidos nunca são expostos. */
  records: SavedItinerary[]
  /** Quantidade de registros descartados por falha de validação. */
  discardedCount: number
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

/**
 * Lê os roteiros salvos, distinguindo armazenamento vazio, válido,
 * corrompido (JSON ilegível ou formato inesperado) e indisponível.
 * Dados corrompidos nunca são sobrescritos nem apagados na leitura.
 */
export function loadSavedItineraries(): StorageLoadResult {
  const payload = readRawPayload()
  if (payload.status === 'unavailable') {
    return { status: 'unavailable', records: [], discardedCount: 0 }
  }
  if (payload.status === 'empty') {
    return { status: 'empty', records: [], discardedCount: 0 }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(payload.raw)
  } catch {
    return { status: 'corrupted', records: [], discardedCount: 0 }
  }
  if (!Array.isArray(parsed)) {
    // Conteúdo legível, mas não é uma lista de roteiros: tratar como
    // corrompido para não sobrescrever dados desconhecidos.
    return { status: 'corrupted', records: [], discardedCount: 0 }
  }

  const records = parsed.filter(isSavedItinerary)
  return {
    status: 'ok',
    records,
    discardedCount: parsed.length - records.length,
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
 * Um planejamento equivalente (mesma impressão digital) substitui o
 * registro anterior — preservando o identificador original, inclusive de
 * registros criados na versão anterior do formato. Planejamentos
 * diferentes geram registros novos com identificador único: colisões de
 * hash nunca substituem roteiros diferentes (TP-03).
 *
 * Se o armazenamento estiver corrompido, o payload ilegível é movido para
 * quarentena antes da escrita (TP-05). Falhas de escrita são devolvidas
 * como erro, sem alterar os registros anteriores (TP-04).
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

  const fingerprint = buildPlanningFingerprint(itinerary.input)
  const existing = records.find(
    (item) => buildPlanningFingerprint(item.itinerary.input) === fingerprint,
  )
  const record: SavedItinerary = {
    id: existing ? existing.id : createRecordId(),
    savedAt: new Date().toISOString(),
    itinerary,
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
