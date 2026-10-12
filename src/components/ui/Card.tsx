import type { HTMLAttributes } from 'react'

import { cardClasses, type CardVariant } from './variants'

interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?: CardVariant
  selected?: boolean
}

/** Card do Design System (variante clara atual e variante sobre foto/fundo escuro). */
export function Card({ variant, selected, className, ...rest }: CardProps) {
  const classes = cardClasses({ variant, selected })
  return (
    <article className={className ? `${classes} ${className}` : classes} {...rest} />
  )
}
