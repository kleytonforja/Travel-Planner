import { Bus, CalendarDays, MapPin, Sparkles, Wallet } from 'lucide-react'

import { INTEREST_LABELS, STYLE_LABELS } from '../data/labels'
import type { Destination, Itinerary } from '../types'
import { formatCurrency } from '../utils/format'

interface ItinerarySummaryProps {
  itinerary: Itinerary
  destination: Destination
}

/**
 * Seção A da página de resultado: resumo da viagem com destino, duração,
 * estilo, interesses, orçamento informado e orientações de transporte.
 */
export function ItinerarySummary({
  itinerary,
  destination,
}: ItinerarySummaryProps) {
  const { input } = itinerary

  return (
    <section aria-labelledby="resumo-viagem">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white sm:px-8">
          <p className="flex items-center gap-2 text-sm font-medium text-white">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {destination.country}
          </p>
          <h2
            id="resumo-viagem"
            className="mt-1 text-3xl font-bold tracking-tight"
          >
            {destination.name}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white">
            {destination.description}
          </p>
        </div>

        <dl className="grid gap-4 px-6 py-6 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          <div className="flex items-start gap-3">
            <CalendarDays
              className="mt-0.5 h-5 w-5 text-blue-600"
              aria-hidden="true"
            />
            <div>
              <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Duração
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                {input.days} {input.days === 1 ? 'dia' : 'dias'}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Sparkles
              className="mt-0.5 h-5 w-5 text-blue-600"
              aria-hidden="true"
            />
            <div>
              <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Estilo
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                {STYLE_LABELS[input.style]}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Wallet
              className="mt-0.5 h-5 w-5 text-blue-600"
              aria-hidden="true"
            />
            <div>
              <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                {input.budget === undefined ? 'Orçamento' : 'Orçamento informado'}
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                {input.budget === undefined ? (
                  'Orçamento não informado'
                ) : (
                  <>
                    {formatCurrency(input.budget, destination.currency)}
                    <span className="block text-xs font-normal text-slate-500">
                      por pessoa, em {destination.currency.code}
                    </span>
                  </>
                )}
              </dd>
            </div>
          </div>

          <div>
            <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Interesses
            </dt>
            <dd className="mt-1.5 flex flex-wrap gap-1.5">
              {input.interests.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                >
                  {INTEREST_LABELS[interest]}
                </span>
              ))}
            </dd>
          </div>
        </dl>

        <div className="border-t border-slate-200 bg-slate-50 px-6 py-5 sm:px-8">
          <p className="flex items-start gap-3 text-sm text-slate-600">
            <Bus
              className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
              aria-hidden="true"
            />
            <span>
              <strong className="font-semibold text-slate-900">
                Orientações de transporte (gerais e ilustrativas):
              </strong>{' '}
              {destination.transportNote}
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}
