import type { Currency } from '../types'

/**
 * Formata um valor monetário conforme a moeda e o locale declarados
 * pelo destino. Valores exibidos são ilustrativos.
 */
export function formatCurrency(value: number, currency: Currency): string {
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
  }).format(value)
}

/**
 * Converte minutos desde 00:00 em horário "HH:MM" (ex.: 540 → "09:00").
 * Horários exibidos são sugestões ilustrativas.
 */
export function formatMinutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/** Formata uma duração em horas (ex.: 3 → "3 h"; 1.5 → "1 h 30 min"). */
export function formatDuration(durationHours: number): string {
  const hours = Math.floor(durationHours)
  const minutes = Math.round((durationHours - hours) * 60)
  if (minutes === 0) return `${hours} h`
  if (hours === 0) return `${minutes} min`
  return `${hours} h ${minutes} min`
}

/** Formata uma data ISO para exibição em pt-BR (ex.: "10/10/2026, 14:30"). */
export function formatDateTime(isoDate: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(isoDate))
}
