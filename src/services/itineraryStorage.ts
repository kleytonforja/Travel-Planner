import type { Itinerary, PlanningInput, SavedItinerary } from '../types'

/**
 * Persistência de roteiros no LocalStorage (ver DECISIONS.md, D7).
 *
 * A leitura valida a estrutura dos dados e descarta entradas inválidas ou
 * corrompidas, sem quebrar a aplicação. A chave é versionada para permitir
 * evolução futura do formato.
 */

export const STORAGE_KEY = 'travel-planner:saved-itineraries:v1'

/**
 * Gera um identificador determinístico para o planejamento (hash djb2).
 * Salvar o mesmo planejamento duas vezes substitui o registro anterior.
 */
export function buildItineraryId(input: PlanningInput): string {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isValidPlanningInput(value: unknown): value is PlanningInput {
  if (!isRecord(value)) return false
  return (
    typeof value.destinationId === 'string' &&
    typeof value.days === 'number' &&
    Array.isArray(value.interests) &&
    typeof value.style === 'string' &&
    typeof value.budget === 'number'
  )
}

/** Verificação estrutural mínima de um roteiro salvo. */
export function isSavedItinerary(value: unknown): value is SavedItinerary {
  if (!isRecord(value)) return false
  if (typeof value.id !== 'string' || typeof value.savedAt !== 'string') {
    return false
  }
  const itinerary = value.itinerary
  if (!isRecord(itinerary)) return false
  if (!isValidPlanningInput(itinerary.input)) return false
  if (!Array.isArray(itinerary.days) || !Array.isArray(itinerary.warnings)) {
    return false
  }
  const totals = itinerary.totals
  if (!isRecord(totals)) return false
  return (
    typeof totals.estimatedActivitiesCost === 'number' &&
    typeof totals.unallocatedBudget === 'number' &&
    typeof totals.averageCostPerDay === 'number'
  )
}

/**
 * Lê os roteiros salvos. Dados corrompidos (JSON inválido) ou entradas com
 * estrutura inesperada são descartados silenciosamente.
 */
export function loadSavedItineraries(): SavedItinerary[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isSavedItinerary)
  } catch {
    return []
  }
}

function persist(saved: SavedItinerary[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
}

/**
 * Salva (ou substitui, se o planejamento já foi salvo) um roteiro e
 * retorna o registro persistido.
 */
export function saveItinerary(itinerary: Itinerary): SavedItinerary {
  const record: SavedItinerary = {
    id: buildItineraryId(itinerary.input),
    savedAt: new Date().toISOString(),
    itinerary,
  }
  const others = loadSavedItineraries().filter((item) => item.id !== record.id)
  persist([record, ...others])
  return record
}

/** Remove um roteiro salvo pelo identificador. */
export function removeSavedItinerary(id: string): void {
  persist(loadSavedItineraries().filter((item) => item.id !== id))
}
