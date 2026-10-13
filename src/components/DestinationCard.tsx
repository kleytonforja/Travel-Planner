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
  /** Rótulo da ação quando o destino ainda não está selecionado. */
  actionLabel?: string
  /** Versão compacta (planejamento progressivo): foto mais baixa e descrição em até 2 linhas. */
  compact?: boolean
}

/** Card de apresentação de um destino cadastrado na base local. */
export function DestinationCard({
  destination,
  selected,
  onSelect,
  actionLabel = 'Selecionar destino',
  compact = false,
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
      <div className={`relative bg-surface-sunken ${compact ? 'aspect-[4/1] overflow-hidden sm:aspect-[2/1]' : 'aspect-[16/9]'}`}>
        <DestinationPhotoImage destinationId={destination.id} name={destination.name} />
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-700 shadow-card">
          {destination.currency.code} ({destination.currency.symbol})
        </span>
      </div>

      <div className={`flex flex-1 flex-col ${compact ? 'p-4' : 'p-5'}`}>
        <h3 className="text-lg font-semibold text-ink">{destination.name}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-ink-subtle">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          {destination.country}
        </p>

        <p className={`text-sm leading-relaxed text-ink-muted ${compact ? 'mt-2 line-clamp-2' : 'mt-3'}`}>
          {destination.description}
        </p>

        <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${compact ? 'mt-3' : 'mt-4'}`}>
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

        <div className={`mt-auto ${compact ? 'pt-3' : 'pt-5'}`}>
          <Button
            variant={selected ? 'soft' : 'primary'}
            width="full"
            onClick={() => onSelect(destination.id)}
          >
            {selected && <Check className="h-4 w-4" aria-hidden="true" />}
            {selected ? 'Destino selecionado' : actionLabel}
            {!selected && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </Button>
        </div>
      </div>
    </Card>
  )
}
