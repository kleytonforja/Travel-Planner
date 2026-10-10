import { Clock, Tag } from 'lucide-react'

import { INTEREST_LABELS, PERIOD_LABELS } from '../data/labels'
import type { Currency, ItineraryDay, ScheduledPeriod } from '../types'
import { formatCurrency, formatDuration, formatMinutesToTime } from '../utils/format'

interface ItineraryDayCardProps {
  day: ItineraryDay
  currency: Currency
}

const PERIOD_BADGE_CLASS: Record<ScheduledPeriod, string> = {
  manha: 'bg-amber-50 text-amber-700',
  tarde: 'bg-sky-50 text-sky-700',
  noite: 'bg-indigo-50 text-indigo-700',
}

/**
 * Card de um dia do roteiro: atividades em ordem cronológica com horário
 * sugerido, duração, categorias e custo ilustrativo. Dias sem atividades
 * são exibidos como tempo livre (o gerador nunca inventa atividades).
 */
export function ItineraryDayCard({ day, currency }: ItineraryDayCardProps) {
  const dayCost = day.activities.reduce(
    (sum, item) => sum + item.activity.estimatedCost,
    0,
  )

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h3 className="text-base font-bold text-slate-900">
          Dia {day.dayNumber}
        </h3>
        <span className="text-xs text-slate-500">
          {day.activities.length === 0
            ? 'Sem atividades sugeridas'
            : `${day.activities.length} ${
                day.activities.length === 1 ? 'atividade' : 'atividades'
              } · ${formatCurrency(dayCost, currency)} (ilustrativo)`}
        </span>
      </header>

      {day.activities.length === 0 ? (
        <p className="flex flex-1 items-center px-5 py-6 text-sm text-slate-500">
          Dia livre — a base local não tem atividades compatíveis suficientes.
          Aproveite para explorar o destino por conta própria.
        </p>
      ) : (
        <ol className="flex-1 divide-y divide-slate-100">
          {day.activities.map((item) => (
            <li key={item.activity.id} className="px-5 py-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900">
                  <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {formatMinutesToTime(item.startMinutes)} –{' '}
                  {formatMinutesToTime(item.endMinutes)}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PERIOD_BADGE_CLASS[item.period]}`}
                >
                  {PERIOD_LABELS[item.period]}
                </span>
              </div>

              <p className="mt-1.5 text-sm font-semibold text-slate-900">
                {item.activity.name}
              </p>
              <p className="mt-0.5 text-sm text-slate-600">
                {item.activity.description}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                  {item.activity.categories
                    .map((category) => INTEREST_LABELS[category])
                    .join(', ')}
                </span>
                <span>Duração: {formatDuration(item.activity.durationHours)}</span>
                <span>
                  Custo ilustrativo:{' '}
                  {item.activity.estimatedCost === 0
                    ? 'gratuita'
                    : formatCurrency(item.activity.estimatedCost, currency)}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </article>
  )
}
