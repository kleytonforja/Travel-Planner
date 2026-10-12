import { INTEREST_LABELS } from '../../data/labels'
import type { InterestCategory } from '../../types'
import { CATEGORY_STYLES } from './variants'

interface CategoryBadgeProps {
  category: InterestCategory
  /** "chip": ícone + rótulo; "icon": ícone colorido em bloco (rótulo acessível). */
  variant?: 'chip' | 'icon'
}

/** Indicador de categoria de atração com ícone colorido. */
export function CategoryBadge({ category, variant = 'chip' }: CategoryBadgeProps) {
  const { icon: Icon, tone } = CATEGORY_STYLES[category]
  const label = INTEREST_LABELS[category]

  if (variant === 'icon') {
    return (
      <span
        role="img"
        aria-label={label}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-card ${tone}`}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  )
}
