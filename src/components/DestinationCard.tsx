import { Check, MapPin } from 'lucide-react'

import { INTEREST_LABELS } from '../data/labels'
import type { Destination, InterestCategory } from '../types'

interface DestinationCardProps {
  destination: Destination
  selected: boolean
  onSelect: (id: string) => void
}

/** Card de apresentação de um destino cadastrado na base local. */
export function DestinationCard({
  destination,
  selected,
  onSelect,
}: DestinationCardProps) {
  const categories = [
    ...new Set(
      destination.activities.flatMap(
        (activity) => activity.categories as InterestCategory[],
      ),
    ),
  ]

  return (
    <article
      className={`flex flex-col rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${
        selected ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {destination.name}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {destination.country}
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          {destination.currency.code} ({destination.currency.symbol})
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        {destination.description}
      </p>

      <p className="mt-4 text-sm font-medium text-slate-700">
        {destination.activities.length} atividades cadastradas
      </p>

      <ul
        className="mt-2 flex flex-wrap gap-2"
        aria-label={`Categorias disponíveis em ${destination.name}`}
      >
        {categories.map((category) => (
          <li
            key={category}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
          >
            {INTEREST_LABELS[category]}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onSelect(destination.id)}
        className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
          selected
            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {selected && <Check className="h-4 w-4" aria-hidden="true" />}
        {selected ? 'Destino selecionado' : 'Planejar para este destino'}
      </button>
    </article>
  )
}
