/**
 * Perfil do grupo de viajantes (V1-T3.3).
 *
 * Só dados agregados: quantidades, faixas etárias opcionais das crianças,
 * perfil opcional e necessidades de acessibilidade opcionais. Nada de nomes,
 * documentos ou datas de nascimento, e nenhum viajante é cadastrado
 * individualmente. O motor de roteiros atual NÃO usa estes dados (V1-T3.7).
 */

/** Mínimo de adultos: toda viagem precisa de pelo menos um adulto responsável. */
export const MIN_ADULTS = 1

/**
 * Limite total de viajantes. Evita valores absurdos digitados por engano e
 * mantém o planejamento dentro do que o produto ilustra (grupos pequenos e
 * médios); grupos maiores exigem reservas e logística que estão fora do escopo.
 */
export const MAX_TRAVELERS = 20

export const CHILD_AGE_BANDS = [
  { id: '3-5', label: '3 a 5 anos' },
  { id: '6-11', label: '6 a 11 anos' },
  { id: '12-17', label: '12 a 17 anos' },
] as const

export type ChildAgeBand = (typeof CHILD_AGE_BANDS)[number]['id']

export const TRAVEL_PROFILES = [
  { id: 'individual', label: 'Individual', description: 'Viagem a sós.' },
  { id: 'casal', label: 'Casal', description: 'Viagem a dois.' },
  { id: 'familia', label: 'Família', description: 'Com crianças ou várias gerações.' },
  { id: 'amigos', label: 'Amigos', description: 'Grupo de amigos.' },
] as const

export type TravelProfile = (typeof TRAVEL_PROFILES)[number]['id']

export const ACCESSIBILITY_NEEDS = [
  { id: 'mobilidade', label: 'Mobilidade reduzida ou cadeira de rodas' },
  { id: 'caminhadas', label: 'Evitar escadas e longas caminhadas' },
  { id: 'visual', label: 'Deficiência visual' },
  { id: 'auditiva', label: 'Deficiência auditiva' },
] as const

export type AccessibilityNeed = (typeof ACCESSIBILITY_NEEDS)[number]['id']

export interface TravelersDraft {
  adults: number
  children: number
  /** Bebês (até 2 anos). */
  infants: number
  /** Crianças por faixa etária; opcional, a soma nunca passa de `children`. */
  childAges: Record<ChildAgeBand, number>
  /** Perfil escolhido pelo usuário; nunca inferido da composição. */
  profile: TravelProfile | null
  accessibility: AccessibilityNeed[]
}

export const EMPTY_AGES: Record<ChildAgeBand, number> = { '3-5': 0, '6-11': 0, '12-17': 0 }

export const DEFAULT_TRAVELERS: TravelersDraft = {
  adults: MIN_ADULTS,
  children: 0,
  infants: 0,
  childAges: EMPTY_AGES,
  profile: null,
  accessibility: [],
}

export function totalTravelers(t: TravelersDraft): number {
  return t.adults + t.children + t.infants
}

export function agedChildren(t: TravelersDraft): number {
  return CHILD_AGE_BANDS.reduce((sum, band) => sum + t.childAges[band.id], 0)
}

export type TravelerKind = 'adults' | 'children' | 'infants'

/** Limites atuais de cada contador, considerando as regras entre eles. */
export function travelerBounds(t: TravelersDraft, kind: TravelerKind): { min: number; max: number } {
  const others = totalTravelers(t) - t[kind]
  const room = MAX_TRAVELERS - others
  if (kind === 'adults') {
    return { min: MIN_ADULTS, max: Math.max(MIN_ADULTS, room) }
  }
  return { min: 0, max: Math.max(0, room) }
}

function isCount(value: number): boolean {
  return Number.isInteger(value) && value >= 0
}

/** Define um contador respeitando os limites; reduz as faixas se houver menos crianças. */
export function setTravelerCount(t: TravelersDraft, kind: TravelerKind, value: number): TravelersDraft {
  if (!Number.isFinite(value)) return t
  const { min, max } = travelerBounds(t, kind)
  const next = Math.min(max, Math.max(min, Math.trunc(value)))
  if (next === t[kind]) return t
  const updated = { ...t, [kind]: next }
  return kind === 'children' ? { ...updated, childAges: fitAges(updated.childAges, next) } : updated
}

function fitAges(ages: Record<ChildAgeBand, number>, children: number): Record<ChildAgeBand, number> {
  const fitted = { ...ages }
  let excess = CHILD_AGE_BANDS.reduce((sum, band) => sum + fitted[band.id], 0) - children
  for (const band of [...CHILD_AGE_BANDS].reverse()) {
    if (excess <= 0) break
    const cut = Math.min(excess, fitted[band.id])
    fitted[band.id] -= cut
    excess -= cut
  }
  return fitted
}

/** Define quantas crianças há em uma faixa; a soma das faixas não passa do total de crianças. */
export function setChildAge(t: TravelersDraft, band: ChildAgeBand, value: number): TravelersDraft {
  if (!Number.isFinite(value)) return t
  const room = t.children - (agedChildren(t) - t.childAges[band])
  const next = Math.min(Math.max(0, room), Math.max(0, Math.trunc(value)))
  if (next === t.childAges[band]) return t
  return { ...t, childAges: { ...t.childAges, [band]: next } }
}

export function toggleAccessibility(t: TravelersDraft, need: AccessibilityNeed): TravelersDraft {
  const has = t.accessibility.includes(need)
  const accessibility = has
    ? t.accessibility.filter((item) => item !== need)
    : ACCESSIBILITY_NEEDS.map((item) => item.id).filter((id) => id === need || t.accessibility.includes(id))
  return { ...t, accessibility }
}

/** Escolha de perfil alterna: clicar no perfil já escolhido o remove. */
export function setProfile(t: TravelersDraft, profile: TravelProfile | null): TravelersDraft {
  return { ...t, profile: t.profile === profile ? null : profile }
}

export function validateTravelers(t: TravelersDraft): { valid: true } | { valid: false; message: string } {
  if (![t.adults, t.children, t.infants].every(isCount)) {
    return { valid: false, message: 'As quantidades devem ser números inteiros, sem valores negativos.' }
  }
  if (t.adults < MIN_ADULTS) return { valid: false, message: 'Inclua pelo menos um adulto.' }
  if (totalTravelers(t) > MAX_TRAVELERS) {
    return { valid: false, message: `O planejador comporta até ${MAX_TRAVELERS} viajantes.` }
  }
  if (agedChildren(t) > t.children) {
    return { valid: false, message: 'As faixas etárias não podem somar mais que o número de crianças.' }
  }
  return { valid: true }
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}

/** Texto curto para resumos, por exemplo "2 adultos, 1 criança". */
export function describeTravelers(t: TravelersDraft): string {
  const parts = [plural(t.adults, 'adulto', 'adultos')]
  if (t.children > 0) parts.push(plural(t.children, 'criança', 'crianças'))
  if (t.infants > 0) parts.push(plural(t.infants, 'bebê', 'bebês'))
  return parts.join(', ')
}
