import type { Currency, ItineraryDay } from '../types'
import { formatCurrency } from '../utils/format'
import { ActivityCard } from './ActivityCard'

interface ItineraryDayCardProps {
  day: ItineraryDay
  currency: Currency
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
      <header className="flex items-center justify-between gap-3 rounded-t-2xl border-b border-slate-100 bg-slate-50 px-4 py-3 sm:px-5">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{day.dayNumber}</span>
          Dia {day.dayNumber}
        </h3>
        <span className="text-right text-xs text-slate-600">
          {day.activities.length === 0
            ? 'Sem atividades sugeridas'
            : `${day.activities.length} ${
                day.activities.length === 1 ? 'atividade' : 'atividades'
              } · ${formatCurrency(dayCost, currency)} (ilustrativo)`}
        </span>
      </header>

      {day.activities.length === 0 ? (
        <p className="flex flex-1 items-center px-4 py-5 text-sm text-slate-600 sm:px-5">
          Dia livre — a base local não tem atividades compatíveis suficientes.
          Aproveite para explorar o destino por conta própria.
        </p>
      ) : (
        <ol className="flex-1 divide-y divide-slate-100">
          {day.activities.map((item) => (
            <ActivityCard key={item.activity.id} item={item} currency={currency} />
          ))}
        </ol>
      )}
    </article>
  )
}
