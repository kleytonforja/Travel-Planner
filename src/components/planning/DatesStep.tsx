import { CalendarDays, Hourglass } from 'lucide-react'
import { useId, useState } from 'react'

import {
  formatShortDate,
  isValidDuration,
  MAX_DAYS,
  MIN_DAYS,
  parseDurationInput,
  todayISO,
  validateTripDates,
} from '../../utils/tripDates'
import type { DateMode, StepProps } from './planningSteps'

const QUICK_DURATIONS = [3, 5, 7, 10, 14] as const

const MODE_OPTIONS: ReadonlyArray<{
  mode: DateMode
  title: string
  description: string
  icon: typeof CalendarDays
}> = [
  {
    mode: 'dates',
    title: 'Já tenho as datas',
    description: 'Informe o início e o término; calculamos a duração para você.',
    icon: CalendarDays,
  },
  {
    mode: 'duration',
    title: 'Ainda não defini as datas',
    description: 'Escolha apenas quantos dias a viagem deve ter.',
    icon: Hourglass,
  },
]

const INPUT_CLASS =
  'mt-1 w-full rounded-control border bg-surface px-3 py-2.5 text-sm text-ink focus-ring'

function pluralDays(days: number): string {
  return `${days} ${days === 1 ? 'dia' : 'dias'}`
}

/**
 * Etapa 2 do planejamento progressivo: "Quando começa sua aventura?".
 * Dois caminhos: datas exatas (duração calculada sem erros de fuso) ou apenas
 * a quantidade de dias (atalhos e valor personalizado, de 1 a 14 dias). As
 * escolhas dos dois caminhos ficam no rascunho e não se perdem ao alternar.
 */
export function DatesStep({ draft, onDraftChange }: StepProps) {
  const groupId = useId()
  const [customText, setCustomText] = useState(() =>
    draft.durationDays !== null && !QUICK_DURATIONS.some((value) => value === draft.durationDays)
      ? String(draft.durationDays)
      : '',
  )

  const today = todayISO()
  const validation = validateTripDates(draft.startDate, draft.endDate, today)
  const customInvalid = customText.trim() !== '' && parseDurationInput(customText) === null

  function changeCustom(text: string) {
    setCustomText(text)
    onDraftChange({ durationDays: parseDurationInput(text) })
  }

  function pickQuick(value: number) {
    setCustomText('')
    onDraftChange({ durationDays: value })
  }

  return (
    <section aria-labelledby="etapa-datas-titulo">
      <h1 id="etapa-datas-titulo" className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Quando começa sua aventura?
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-night-ink">
        Informe as datas da viagem ou, se ainda não decidiu, escolha só a duração.
      </p>

      <fieldset className="mt-6">
        <legend className="sr-only">Como você quer informar a duração?</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {MODE_OPTIONS.map((option) => (
            <label key={option.mode} className="cursor-pointer">
              <input
                type="radio"
                name={groupId}
                value={option.mode}
                checked={draft.dateMode === option.mode}
                onChange={() => onDraftChange({ dateMode: option.mode })}
                className="peer sr-only"
              />
              <span className="flex h-full items-start gap-4 rounded-card-lg border-2 border-transparent bg-surface p-5 shadow-card transition-colors hover:bg-surface-muted peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-brand-100 text-brand-700">
                  <option.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-base font-semibold text-ink">{option.title}</span>
                  <span className="mt-1 block text-sm text-ink-muted">{option.description}</span>
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {draft.dateMode === 'dates' && (
        <div className="mt-6 rounded-card-lg bg-surface p-5 text-ink shadow-card">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="data-inicio" className="text-sm font-semibold text-ink">
                Data de início
              </label>
              <input
                id="data-inicio"
                type="date"
                min={today}
                value={draft.startDate}
                onChange={(event) => onDraftChange({ startDate: event.target.value })}
                aria-invalid={validation.status === 'invalid' && validation.field === 'start'}
                aria-describedby="datas-resultado"
                className={`${INPUT_CLASS} ${validation.status === 'invalid' && validation.field === 'start' ? 'border-red-600' : 'border-line-strong'}`}
              />
            </div>
            <div>
              <label htmlFor="data-termino" className="text-sm font-semibold text-ink">
                Data de término
              </label>
              <input
                id="data-termino"
                type="date"
                min={draft.startDate || today}
                value={draft.endDate}
                onChange={(event) => onDraftChange({ endDate: event.target.value })}
                aria-invalid={
                  validation.status === 'invalid' &&
                  (validation.field === 'end' || validation.field === 'range')
                }
                aria-describedby="datas-resultado"
                className={`${INPUT_CLASS} ${validation.status === 'invalid' && (validation.field === 'end' || validation.field === 'range') ? 'border-red-600' : 'border-line-strong'}`}
              />
            </div>
          </div>

          <div id="datas-resultado" className="mt-4 min-h-6 text-sm">
            {validation.status === 'invalid' && (
              <p role="alert" className="font-medium text-red-700">
                {validation.message}
              </p>
            )}
            {validation.status === 'valid' && (
              <p role="status" className="font-semibold text-ink">
                Duração: {pluralDays(validation.days)} ({formatShortDate(draft.startDate)} a{' '}
                {formatShortDate(draft.endDate)}). O término conta como um dia da viagem.
              </p>
            )}
            {validation.status === 'incomplete' && (
              <p className="text-ink-muted">
                Informe as duas datas para calcular a duração (de {MIN_DAYS} a {MAX_DAYS} dias).
              </p>
            )}
          </div>
        </div>
      )}

      {draft.dateMode === 'duration' && (
        <div className="mt-6 rounded-card-lg bg-surface p-5 text-ink shadow-card">
          <p id="duracao-rapida" className="text-sm font-semibold text-ink">
            Duração rápida
          </p>
          <div role="group" aria-labelledby="duracao-rapida" className="mt-2 flex flex-wrap gap-2">
            {QUICK_DURATIONS.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={draft.durationDays === value}
                onClick={() => pickQuick(value)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-ring ${
                  draft.durationDays === value
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-sunken text-ink ring-1 ring-line-strong hover:bg-line'
                }`}
              >
                {value} dias
              </button>
            ))}
          </div>

          <div className="mt-4 max-w-xs">
            <label htmlFor="duracao-personalizada" className="text-sm font-semibold text-ink">
              Outra duração (dias)
            </label>
            <input
              id="duracao-personalizada"
              type="number"
              inputMode="numeric"
              min={MIN_DAYS}
              max={MAX_DAYS}
              step={1}
              value={customText}
              onChange={(event) => changeCustom(event.target.value)}
              aria-invalid={customInvalid}
              aria-describedby="duracao-ajuda"
              className={`${INPUT_CLASS} ${customInvalid ? 'border-red-600' : 'border-line-strong'}`}
            />
          </div>

          <div id="duracao-ajuda" className="mt-3 min-h-6 text-sm">
            {customInvalid ? (
              <p role="alert" className="font-medium text-red-700">
                Informe uma duração inteira entre {MIN_DAYS} e {MAX_DAYS} dias.
              </p>
            ) : isValidDuration(draft.durationDays) ? (
              <p role="status" className="font-semibold text-ink">
                Duração: {pluralDays(draft.durationDays)}.
              </p>
            ) : (
              <p className="text-ink-muted">
                De {MIN_DAYS} a {MAX_DAYS} dias (limite atual do planejador).
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
