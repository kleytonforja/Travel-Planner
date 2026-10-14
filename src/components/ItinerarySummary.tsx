import { Bus, CalendarDays, Gauge, MapPin, Sparkles, Wallet } from 'lucide-react'
import { useState } from 'react'

import { HEADER_PHOTOS } from '../data/headerPhotos'
import { INTEREST_LABELS, STYLE_LABELS } from '../data/labels'
import type { Destination, Itinerary } from '../types'
import { formatCurrency } from '../utils/format'
import { TRIP_PACES } from '../utils/interests'

function DestinationHeader({ destination }: { destination: Destination }) {
  const photo = HEADER_PHOTOS[destination.id]
  const [failed, setFailed] = useState(false)

  const title = (
    <>
      <p className="flex items-center gap-2 text-sm font-medium text-white">
        <MapPin className="h-4 w-4" aria-hidden="true" />
        {destination.country}
      </p>
      <h2 id="resumo-viagem" className="mt-1 text-3xl font-bold tracking-tight">
        {destination.name}
      </h2>
    </>
  )

  // Sem fotografia (ou se ela falhar): o cabeçalho azul original.
  if (!photo || failed) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white sm:px-8">
        {title}
        <p className="mt-2 max-w-2xl text-sm text-white">{destination.description}</p>
      </div>
    )
  }

  return (
    <>
      {/* Altura fixa: a foto não desloca o layout ao carregar. */}
      <div className="relative h-44 bg-slate-800 sm:h-56 lg:h-64">
        <img
          src={photo.small}
          srcSet={`${photo.small} ${photo.smallWidth}w, ${photo.large} ${photo.largeWidth}w`}
          sizes="(min-width: 1152px) 1152px, 100vw"
          width={photo.width}
          height={photo.height}
          alt={photo.alt}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onError={() => setFailed(true)}
          style={{ objectPosition: photo.objectPosition }}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 px-6 pb-5 text-white sm:px-8">{title}</div>
      </div>
      <div className="px-6 pt-4 sm:px-8">
        <p className="max-w-2xl text-sm text-slate-700">{destination.description}</p>
        <p className="mt-2 text-xs text-slate-600" data-testid="header-photo-credit">
          Foto: {photo.author} (
          <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline focus-ring">
            {photo.sourceName}
          </a>
          ), licença{' '}
          <a href={photo.license.url} target="_blank" rel="noopener noreferrer" className="underline focus-ring">
            {photo.license.name}
          </a>
          . {photo.changes}
        </p>
      </div>
    </>
  )
}

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
  // Roteiros anteriores ao ritmo não têm `pace`: nada é exibido nem presumido.
  const pace = TRIP_PACES.find((item) => item.id === input.pace)

  return (
    <section aria-labelledby="resumo-viagem">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <DestinationHeader destination={destination} />

        <dl
          className={`grid gap-4 px-6 py-6 sm:grid-cols-2 sm:px-8 ${input.pace ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}
        >
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

          {pace && (
            <div className="flex items-start gap-3">
              <Gauge className="mt-0.5 h-5 w-5 text-blue-600" aria-hidden="true" />
              <div>
                <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Ritmo
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                  {pace.label}
                  <span className="block text-xs font-normal text-slate-500">
                    {pace.description}
                  </span>
                </dd>
              </div>
            </div>
          )}

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
