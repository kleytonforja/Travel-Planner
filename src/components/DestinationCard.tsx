import { ArrowRight, Check, MapPin } from 'lucide-react'

import { INTEREST_LABELS } from '../data/labels'
import type { Destination, InterestCategory } from '../types'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { CategoryBadge } from './ui/CategoryBadge'
import { DestinationPhotoImage } from './ui/photos'

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
    <Card variant="media" selected={selected}>
      <div className="relative aspect-[16/9] bg-surface-sunken">
        <DestinationPhotoImage destinationId={destination.id} name={destination.name} />
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-700 shadow-card">
          {destination.currency.code} ({destination.currency.symbol})
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold text-ink">{destination.name}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-ink-subtle">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          {destination.country}
        </p>

        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          {destination.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="flex items-center gap-1 text-sm font-medium text-ink-muted">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {destination.activities.length} atrações
          </p>
          <ul
            className="flex flex-wrap gap-1.5"
            aria-label={`Categorias disponíveis em ${destination.name}`}
          >
            {categories.map((category) => (
              <li key={category} title={INTEREST_LABELS[category]}>
                <CategoryBadge category={category} variant="dot" />
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto pt-5">
          <Button
            variant={selected ? 'soft' : 'primary'}
            width="full"
            onClick={() => onSelect(destination.id)}
          >
            {selected && <Check className="h-4 w-4" aria-hidden="true" />}
            {selected ? 'Destino selecionado' : 'Selecionar destino'}
            {!selected && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </Button>
        </div>
      </div>
    </Card>
  )
}
