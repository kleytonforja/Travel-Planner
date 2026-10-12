import { MAX_DAYS, MIN_DAYS } from '../services/planningValidation'

/**
 * Datas e duração da viagem (etapa 2 do planejamento progressivo).
 *
 * As datas são tratadas como DIAS DE CALENDÁRIO no formato `AAAA-MM-DD`,
 * sem horário nem fuso: a conversão para número de dia usa `Date.UTC`, então
 * mudanças de horário de verão e o fuso do navegador não alteram a contagem.
 * A duração é inclusiva (início e término contam): de 12/01 a 19/01 são 8 dias.
 * O limite de dias é o do validador do motor (`MIN_DAYS` a `MAX_DAYS`).
 */

export { MAX_DAYS, MIN_DAYS }

const MS_PER_DAY = 86_400_000
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Número de dias desde 1970-01-01 para uma data de calendário válida; senão `null`. */
export function toDayNumber(value: string): number | null {
  const match = ISO_DATE.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const time = Date.UTC(year, month - 1, day)
  const date = new Date(time)
  // Rejeita datas inexistentes (30/02, 31/04, 29/02 em ano não bissexto...).
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }
  return time / MS_PER_DAY
}

/** Data de hoje (calendário local do usuário) como `AAAA-MM-DD`. */
export function todayISO(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

/** Quantidade inclusiva de dias entre duas datas válidas; `null` se inválidas ou invertidas. */
export function countTripDays(start: string, end: string): number | null {
  const first = toDayNumber(start)
  const last = toDayNumber(end)
  if (first === null || last === null || last < first) return null
  return last - first + 1
}

export type DatesValidation =
  /** Falta preencher alguma das datas (sem mensagem de erro). */
  | { status: 'incomplete' }
  | { status: 'invalid'; field: 'start' | 'end' | 'range'; message: string }
  | { status: 'valid'; days: number }

/** Valida o intervalo de datas informado e calcula a duração. */
export function validateTripDates(
  start: string,
  end: string,
  today: string = todayISO(),
): DatesValidation {
  if (start === '' || end === '') return { status: 'incomplete' }

  const first = toDayNumber(start)
  if (first === null) {
    return { status: 'invalid', field: 'start', message: 'A data de início não é uma data válida.' }
  }
  const last = toDayNumber(end)
  if (last === null) {
    return { status: 'invalid', field: 'end', message: 'A data de término não é uma data válida.' }
  }
  const todayNumber = toDayNumber(today)
  if (todayNumber !== null && first < todayNumber) {
    return {
      status: 'invalid',
      field: 'start',
      message: 'A data de início não pode ser anterior a hoje.',
    }
  }
  if (last < first) {
    return {
      status: 'invalid',
      field: 'end',
      message: 'A data de término deve ser igual ou posterior à data de início.',
    }
  }
  const days = last - first + 1
  if (days > MAX_DAYS) {
    return {
      status: 'invalid',
      field: 'range',
      message: `A viagem teria ${days} dias. O limite atual do planejador é de ${MAX_DAYS} dias.`,
    }
  }
  return { status: 'valid', days }
}

/** Duração em dias válida para o motor (inteiro de `MIN_DAYS` a `MAX_DAYS`). */
export function isValidDuration(value: number | null): value is number {
  return (
    value !== null &&
    Number.isInteger(value) &&
    value >= MIN_DAYS &&
    value <= MAX_DAYS
  )
}

/** Interpreta o texto de uma duração personalizada; `null` se não for um inteiro válido. */
export function parseDurationInput(text: string): number | null {
  if (!/^\d{1,3}$/.test(text.trim())) return null
  const value = Number(text.trim())
  return isValidDuration(value) ? value : null
}

/** Ex.: "seg., 12/01" (dia da semana calculado em UTC, sem deslocamento de fuso). */
export function formatShortDate(value: string): string {
  const dayNumber = toDayNumber(value)
  if (dayNumber === null) return value
  return new Date(dayNumber * MS_PER_DAY).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  })
}
