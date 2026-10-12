import { destinations } from '../data/destinations'
import type {
  Activity,
  Destination,
  InterestCategory,
  Itinerary,
  ItineraryDay,
  ScheduledActivity,
  ScheduledPeriod,
  TravelStyle,
} from '../types'
import { EXPORT_SCHEMA_VERSION, RECOVERY_EXPORT_FORMAT } from './itineraryExport'
import { validateSavedItinerary } from './itineraryStorage'

/**
 * Importação de roteiros JSON exportados pelo Travel Planner (somente
 * leitura, reconstrução e validação).
 *
 * O texto de entrada é tratado como NÃO CONFIÁVEL. O serviço:
 * - não acessa o armazenamento, não gera identificadores e não define
 *   `savedAt` (isso pertence à futura gravação);
 * - lê apenas propriedades PRÓPRIAS e conhecidas e monta objetos novos
 *   (nada do arquivo é espalhado/mesclado), o que impede poluição de
 *   protótipos e descarta campos extras;
 * - reconstrói atividades a partir do catálogo atual e rejeita qualquer
 *   divergência com ele, em vez de tentar adaptá-las;
 * - delega a validação semântica ao validador do armazenamento
 *   (`validateSavedItinerary`), a mesma aplicada na leitura e na gravação.
 */

/** Tamanho máximo do arquivo, em bytes UTF-8. */
export const IMPORT_MAX_FILE_BYTES = 256 * 1024
/** Quantidade máxima de avisos aceitos. */
export const IMPORT_MAX_WARNINGS = 50
/** Tamanho máximo de cada aviso, em caracteres. */
export const IMPORT_MAX_WARNING_LENGTH = 500

const EXPORT_APP_NAME = 'Travel Planner'
const MAX_TRIP_DAYS = 14
const MAX_INTERESTS = 20
const MAX_DETAILS = 10
const MAX_ECHOED_TEXT = 80

/**
 * Valores fixos usados SOMENTE para invocar o validador. Não são
 * retornados nem persistidos: o serviço não gera identificadores reais.
 */
const VALIDATION_PLACEHOLDER_ID = 'validacao-de-importacao'
const VALIDATION_PLACEHOLDER_SAVED_AT = '1970-01-01T00:00:00.000Z'

export type ImportFailureCode =
  | 'invalid-json'
  | 'too-large'
  | 'not-an-export'
  | 'recovery-envelope'
  | 'unsupported-version'
  | 'invalid-structure'
  | 'unknown-destination'
  | 'unknown-activity'
  | 'catalog-mismatch'
  | 'invalid-schedule'
  | 'invalid-warnings'
  | 'validation-failed'

export type ItineraryImportResult =
  | { ok: true; itinerary: Itinerary }
  | { ok: false; code: ImportFailureCode; message: string; details: string[] }

const FAILURE_MESSAGES: Record<ImportFailureCode, string> = {
  'invalid-json': 'O arquivo não contém um JSON válido.',
  'too-large': `O arquivo é maior que o limite de ${IMPORT_MAX_FILE_BYTES / 1024} KB.`,
  'not-an-export':
    'O arquivo não parece ser um roteiro exportado pelo Travel Planner.',
  'recovery-envelope':
    'Este arquivo é uma cópia de segurança de recuperação do armazenamento, não um roteiro exportado. Ele não pode ser importado aqui; use as opções de recuperação da página inicial.',
  'unsupported-version': `A versão do arquivo não é suportada. Esta versão do Travel Planner importa apenas arquivos da versão ${EXPORT_SCHEMA_VERSION}.`,
  'invalid-structure':
    'O arquivo está incompleto ou fora do formato esperado de um roteiro exportado.',
  'unknown-destination':
    'O destino do arquivo não existe na base atual do Travel Planner.',
  'unknown-activity':
    'Uma atividade do arquivo não existe na base atual para este destino.',
  'catalog-mismatch':
    'O arquivo diverge da base atual (dados do destino ou de uma atividade mudaram desde a exportação). Por segurança, ele não foi importado.',
  'invalid-schedule': 'O arquivo contém um período ou horário inválido.',
  'invalid-warnings':
    'Os avisos do arquivo excedem os limites seguros ou têm conteúdo inválido.',
  'validation-failed':
    'O arquivo não passou na validação de consistência do roteiro.',
}

/** Interrompe a leitura com um código de rejeição (uso interno). */
class ImportRejection extends Error {
  code: ImportFailureCode
  details: string[]

  constructor(code: ImportFailureCode, details: string[] = []) {
    super(code)
    this.code = code
    this.details = details
  }
}

function reject(code: ImportFailureCode, details: string[] = []): never {
  throw new ImportRejection(code, details)
}

type PlainObject = Record<string, unknown>

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Lê SOMENTE propriedades próprias: um Object.prototype adulterado por
 * outro código não pode suprir campos ausentes do arquivo.
 */
function own(object: PlainObject, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(object, key) ? object[key] : undefined
}

function invalidField(path: string): never {
  return reject('invalid-structure', [`Campo ausente ou inválido: ${path}`])
}

function requireObject(parent: PlainObject, key: string, path: string): PlainObject {
  const value = own(parent, key)
  return isPlainObject(value) ? value : invalidField(path)
}

function requireArray(parent: PlainObject, key: string, path: string): unknown[] {
  const value = own(parent, key)
  return Array.isArray(value) ? value : invalidField(path)
}

function requireString(parent: PlainObject, key: string, path: string): string {
  const value = own(parent, key)
  return typeof value === 'string' ? value : invalidField(path)
}

function requireNumber(parent: PlainObject, key: string, path: string): number {
  const value = own(parent, key)
  return typeof value === 'number' && Number.isFinite(value) ? value : invalidField(path)
}

function requireInteger(parent: PlainObject, key: string, path: string): number {
  const value = requireNumber(parent, key, path)
  return Number.isInteger(value) ? value : invalidField(path)
}

function requireStringArray(parent: PlainObject, key: string, path: string): string[] {
  const value = requireArray(parent, key, path)
  if (!value.every((item): item is string => typeof item === 'string')) {
    return invalidField(path)
  }
  return value
}

/** Compara nomes ignorando diferenças de normalização Unicode. */
function sameText(a: string, b: string): boolean {
  return a.normalize('NFC') === b.normalize('NFC')
}

/** Trecho do texto do arquivo seguro para citar em mensagens. */
function echo(text: string): string {
  // eslint-disable-next-line no-control-regex
  const clean = text.replace(/[\u0000-\u001f\u007f]/g, ' ').trim()
  return clean.length > MAX_ECHOED_TEXT ? `${clean.slice(0, MAX_ECHOED_TEXT)}…` : clean
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  const left = new Set(a)
  const right = new Set(b)
  if (left.size !== right.size || left.size !== a.length || right.size !== b.length) {
    return false
  }
  for (const item of left) {
    if (!right.has(item)) return false
  }
  return true
}

const SCHEDULED_PERIODS: readonly ScheduledPeriod[] = ['manha', 'tarde', 'noite']

const TIME_RANGE_PATTERN = /^(\d{2}):(\d{2}) [–-] (\d{2}):(\d{2})$/

function toMinutes(hours: number, minutes: number): number | null {
  if (minutes > 59 || hours > 24 || (hours === 24 && minutes !== 0)) return null
  return hours * 60 + minutes
}

/** Interpreta "HH:MM – HH:MM" (travessão ou hífen) em minutos desde 00:00. */
function parseTimeRange(value: string): { start: number; end: number } | null {
  const match = TIME_RANGE_PATTERN.exec(value)
  if (!match) return null
  const start = toMinutes(Number(match[1]), Number(match[2]))
  const end = toMinutes(Number(match[3]), Number(match[4]))
  return start === null || end === null ? null : { start, end }
}

// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/

function readWarnings(root: PlainObject): string[] {
  const warnings = requireArray(root, 'avisos', 'avisos')
  if (warnings.length > IMPORT_MAX_WARNINGS) {
    reject('invalid-warnings', [
      `Mais de ${IMPORT_MAX_WARNINGS} avisos (${warnings.length}).`,
    ])
  }
  const accepted: string[] = []
  for (const warning of warnings) {
    if (typeof warning !== 'string' || warning.trim().length === 0) {
      reject('invalid-warnings', ['Aviso vazio ou que não é texto.'])
    }
    if (warning.length > IMPORT_MAX_WARNING_LENGTH) {
      reject('invalid-warnings', [
        `Aviso com mais de ${IMPORT_MAX_WARNING_LENGTH} caracteres.`,
      ])
    }
    if (CONTROL_CHARACTERS.test(warning)) {
      reject('invalid-warnings', ['Aviso com caracteres de controle.'])
    }
    accepted.push(warning)
  }
  return accepted
}

function findDestination(name: string): Destination {
  const destination = destinations.find((item) => sameText(item.name, name))
  return destination ?? reject('unknown-destination', [`Destino: "${echo(name)}"`])
}

/** Cópia independente da atividade do catálogo (sem compartilhar referências). */
function copyActivity(activity: Activity): Activity {
  return {
    id: activity.id,
    name: activity.name,
    description: activity.description,
    categories: [...activity.categories],
    durationHours: activity.durationHours,
    estimatedCost: activity.estimatedCost,
    recommendedPeriod: activity.recommendedPeriod,
    suitableStyles: [...activity.suitableStyles],
  }
}

function readScheduledActivity(
  entry: unknown,
  destination: Destination,
  path: string,
): ScheduledActivity {
  if (!isPlainObject(entry)) return invalidField(path)

  const name = requireString(entry, 'nome', `${path}.nome`)
  const periodValue = own(entry, 'periodo')
  if (periodValue === undefined) return invalidField(`${path}.periodo`)
  const timeRange = requireString(entry, 'horarioSugerido', `${path}.horarioSugerido`)
  const durationHours = requireNumber(entry, 'duracaoHoras', `${path}.duracaoHoras`)
  const categories = requireStringArray(entry, 'categorias', `${path}.categorias`)
  const cost = requireNumber(
    entry,
    'custoEstimadoIlustrativo',
    `${path}.custoEstimadoIlustrativo`,
  )

  const activity = destination.activities.find((item) => sameText(item.name, name))
  if (!activity) {
    return reject('unknown-activity', [`Atividade: "${echo(name)}"`])
  }
  if (
    activity.durationHours !== durationHours ||
    activity.estimatedCost !== cost ||
    !sameSet(activity.categories, categories)
  ) {
    return reject('catalog-mismatch', [
      `Atividade "${echo(activity.name)}": duração, custo ou categorias diferem da base atual.`,
    ])
  }

  if (!(SCHEDULED_PERIODS as readonly unknown[]).includes(periodValue)) {
    return reject('invalid-schedule', [`Período inválido em ${path}.`])
  }
  const range = parseTimeRange(timeRange)
  if (!range) {
    return reject('invalid-schedule', [`Horário inválido em ${path}.`])
  }

  return {
    activity: copyActivity(activity),
    period: periodValue as ScheduledPeriod,
    startMinutes: range.start,
    endMinutes: range.end,
  }
}

function readItinerary(root: PlainObject): Itinerary {
  const summary = requireObject(root, 'resumo', 'resumo')
  const destinationName = requireString(summary, 'destino', 'resumo.destino')
  const country = requireString(summary, 'pais', 'resumo.pais')
  const currencyCode = requireString(summary, 'moeda', 'resumo.moeda')
  const tripDays = requireInteger(summary, 'dias', 'resumo.dias')
  const style = requireString(summary, 'estilo', 'resumo.estilo')
  const interests = requireStringArray(summary, 'interesses', 'resumo.interesses')
  const budget = requireNumber(summary, 'orcamentoInformado', 'resumo.orcamentoInformado')

  const schedule = requireArray(root, 'roteiro', 'roteiro')
  const financial = requireObject(root, 'resumoFinanceiro', 'resumoFinanceiro')
  const financialBudget = requireNumber(
    financial,
    'orcamentoInformado',
    'resumoFinanceiro.orcamentoInformado',
  )
  const estimatedCost = requireNumber(
    financial,
    'custoEstimadoAtividades',
    'resumoFinanceiro.custoEstimadoAtividades',
  )
  const unallocated = requireNumber(
    financial,
    'saldoNaoAlocado',
    'resumoFinanceiro.saldoNaoAlocado',
  )
  const averageCost = requireNumber(
    financial,
    'custoMedioAtividadesPorDia',
    'resumoFinanceiro.custoMedioAtividadesPorDia',
  )
  const warnings = readWarnings(root)

  // Limites que evitam processar listas gigantescas antes da validação.
  if (schedule.length > MAX_TRIP_DAYS) {
    reject('validation-failed', [`Roteiro com mais de ${MAX_TRIP_DAYS} dias.`])
  }
  if (interests.length > MAX_INTERESTS || new Set(interests).size !== interests.length) {
    reject('validation-failed', ['Interesses repetidos ou em excesso.'])
  }
  if (financialBudget !== budget) {
    reject('validation-failed', [
      'O orçamento do resumo difere do orçamento do resumo financeiro.',
    ])
  }

  const destination = findDestination(destinationName)
  if (country !== destination.country || currencyCode !== destination.currency.code) {
    reject('catalog-mismatch', ['País ou moeda diferem do destino na base atual.'])
  }

  const days: ItineraryDay[] = schedule.map((entry, index) => {
    const path = `roteiro[${index}]`
    if (!isPlainObject(entry)) return invalidField(path)
    const dayNumber = requireInteger(entry, 'dia', `${path}.dia`)
    const entries = requireArray(entry, 'atividades', `${path}.atividades`)
    if (entries.length > destination.activities.length) {
      reject('validation-failed', [
        `Dia ${dayNumber} com mais atividades do que o catálogo do destino.`,
      ])
    }
    return {
      dayNumber,
      activities: entries.map((item, position) =>
        readScheduledActivity(item, destination, `${path}.atividades[${position}]`),
      ),
    }
  })

  // Os valores de estilo e interesses ainda não foram verificados: o
  // validador abaixo rejeita qualquer valor desconhecido antes de o
  // roteiro ser devolvido.
  return {
    input: {
      destinationId: destination.id,
      days: tripDays,
      interests: [...interests] as InterestCategory[],
      style: style as TravelStyle,
      budget,
    },
    days,
    totals: {
      estimatedActivitiesCost: estimatedCost,
      unallocatedBudget: unallocated,
      averageCostPerDay: averageCost,
    },
    warnings,
  }
}

function toFailure(error: ImportRejection): ItineraryImportResult {
  return {
    ok: false,
    code: error.code,
    message: FAILURE_MESSAGES[error.code],
    details: error.details.slice(0, MAX_DETAILS),
  }
}

/**
 * Lê, reconstrói e valida um roteiro a partir do texto de um arquivo
 * exportado. Nunca lança exceção: toda rejeição vem como resultado tipado.
 *
 * Em caso de sucesso devolve apenas o `Itinerary` (sem `id` e sem
 * `savedAt`); gravar, gerar identificador e decidir sobre duplicatas
 * continuam sendo responsabilidade do serviço de persistência.
 */
export function parseItineraryImport(input: string): ItineraryImportResult {
  try {
    if (typeof input !== 'string') reject('invalid-json')
    if (
      input.length > IMPORT_MAX_FILE_BYTES ||
      new TextEncoder().encode(input).length > IMPORT_MAX_FILE_BYTES
    ) {
      reject('too-large')
    }

    // Remove o BOM UTF-8 inicial, comum em arquivos salvos pelo Windows.
    const content = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input

    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      return reject('invalid-json')
    }

    if (!isPlainObject(parsed)) reject('not-an-export')
    if (own(parsed, 'formato') === RECOVERY_EXPORT_FORMAT) reject('recovery-envelope')
    if (own(parsed, 'app') !== EXPORT_APP_NAME) reject('not-an-export')
    if (own(parsed, 'schemaVersion') !== EXPORT_SCHEMA_VERSION) {
      reject('unsupported-version')
    }

    const itinerary = readItinerary(parsed)

    const validation = validateSavedItinerary({
      id: VALIDATION_PLACEHOLDER_ID,
      savedAt: VALIDATION_PLACEHOLDER_SAVED_AT,
      itinerary,
    })
    if (!validation.ok) {
      reject('validation-failed', validation.reasons)
    }

    return { ok: true, itinerary }
  } catch (error) {
    if (error instanceof ImportRejection) return toFailure(error)
    return toFailure(
      new ImportRejection('validation-failed', ['Falha inesperada ao processar o arquivo.']),
    )
  }
}
