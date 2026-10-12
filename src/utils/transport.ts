/**
 * Preferências de transporte (V1-T3.4).
 *
 * São apenas preferências declaradas: não há cálculo de rotas, distâncias ou
 * tarifas, nem integração externa, e o motor de roteiros atual não as usa
 * (integração prevista para o V1-T3.7). A cidade de origem é texto livre do
 * usuário e NÃO é uma localização verificada.
 */

export const ARRIVAL_MODES = [
  { id: 'carro', label: 'Carro próprio' },
  { id: 'aviao', label: 'Avião' },
  { id: 'onibus', label: 'Ônibus' },
  { id: 'trem', label: 'Trem' },
  { id: 'indefinido', label: 'Ainda não decidi' },
] as const

export type ArrivalMode = (typeof ARRIVAL_MODES)[number]['id']

export const LOCAL_MODES = [
  { id: 'carro-proprio', label: 'Carro próprio' },
  { id: 'carro-alugado', label: 'Carro alugado' },
  { id: 'taxi-app', label: 'Táxi ou aplicativo' },
  { id: 'publico', label: 'Transporte público' },
  { id: 'caminhada', label: 'Caminhada' },
  { id: 'combinacao', label: 'Combinação de transportes' },
  { id: 'indefinido', label: 'Ainda não decidi' },
] as const

export type LocalMode = (typeof LOCAL_MODES)[number]['id']

/** Tamanho máximo da cidade de origem (nomes de cidades cabem com folga). */
export const MAX_ORIGIN_LENGTH = 80

export interface TransportDraft {
  /** Como chegará ao destino (escolha única; `null` = não escolhido). */
  arrival: ArrivalMode | null
  /** Cidade de origem, texto livre e opcional ('' = não informada). */
  origin: string
  /** Deslocamentos locais (escolha múltipla; 'indefinido' é exclusivo). */
  local: LocalMode[]
}

export const DEFAULT_TRANSPORT: TransportDraft = { arrival: null, origin: '', local: [] }

/** Escolha única: clicar de novo na opção marcada a desmarca. */
export function chooseArrival(t: TransportDraft, mode: ArrivalMode): TransportDraft {
  return { ...t, arrival: t.arrival === mode ? null : mode }
}

/**
 * Alterna um deslocamento local. "Ainda não decidi" é exclusivo: ao marcá-lo,
 * os demais saem; ao marcar qualquer outro, ele sai. A ordem segue o catálogo.
 */
export function toggleLocal(t: TransportDraft, mode: LocalMode): TransportDraft {
  if (t.local.includes(mode)) return { ...t, local: t.local.filter((item) => item !== mode) }
  if (mode === 'indefinido') return { ...t, local: ['indefinido'] }
  const wanted = new Set<LocalMode>([...t.local.filter((item) => item !== 'indefinido'), mode])
  return { ...t, local: LOCAL_MODES.map((item) => item.id).filter((id) => wanted.has(id)) }
}

/** Letras (inclusive acentuadas), espaços, hífen, apóstrofo, ponto e vírgula. */
const ORIGIN_PATTERN = /^[\p{L}][\p{L}\p{M} .,'’-]*$/u

export type OriginValidation = { status: 'empty' } | { status: 'valid'; value: string } | { status: 'invalid'; message: string }

export function validateOrigin(text: string): OriginValidation {
  const value = text.trim().replace(/\s+/g, ' ')
  if (value === '') return { status: 'empty' }
  if (value.length < 2) return { status: 'invalid', message: 'Informe o nome da cidade com pelo menos 2 letras.' }
  if (value.length > MAX_ORIGIN_LENGTH) {
    return { status: 'invalid', message: `Use no máximo ${MAX_ORIGIN_LENGTH} caracteres.` }
  }
  if (!ORIGIN_PATTERN.test(value)) {
    return { status: 'invalid', message: 'Use apenas letras, espaços, hífen, apóstrofo, ponto ou vírgula.' }
  }
  return { status: 'valid', value }
}

/** A etapa só exige que a origem, se informada, seja válida; as demais escolhas são opcionais. */
export function isTransportComplete(t: TransportDraft): boolean {
  return validateOrigin(t.origin).status !== 'invalid'
}

export function describeTransport(t: TransportDraft): string {
  const arrival = ARRIVAL_MODES.find((item) => item.id === t.arrival)
  const origin = validateOrigin(t.origin)
  const parts: string[] = []
  if (arrival) {
    parts.push(
      `${arrival.label}${origin.status === 'valid' ? ` (saindo de ${origin.value})` : ''}`,
    )
  } else if (origin.status === 'valid') {
    parts.push(`saindo de ${origin.value}`)
  }
  const local = LOCAL_MODES.filter((item) => t.local.includes(item.id)).map((item) => item.label)
  if (local.length > 0) parts.push(`local: ${local.join(', ')}`)
  return parts.length > 0 ? parts.join('; ') : 'ainda não definido'
}
