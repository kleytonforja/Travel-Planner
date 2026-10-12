import {
  Landmark,
  Moon,
  Mountain,
  ShoppingBag,
  Trees,
  Utensils,
  Waves,
  type LucideIcon,
} from 'lucide-react'

import type { InterestCategory } from '../../types'

/**
 * Variantes visuais do Design System (V1-T1). As classes usam os tokens
 * declarados em `src/index.css` e aparecem como strings completas para que
 * o Tailwind as detecte. Ficam fora dos arquivos de componente para manter
 * cada componente exportando somente componentes.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'onDark'
export type ButtonSize = 'md' | 'lg'
export type ButtonWidth = 'auto' | 'full' | 'responsive'

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors focus-ring disabled:cursor-not-allowed disabled:opacity-50'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  secondary:
    'border border-line-strong bg-surface text-slate-700 hover:bg-surface-muted',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  onDark:
    'bg-night-900/80 text-night-ink ring-1 ring-white/30 backdrop-blur-sm hover:bg-night-800 focus-ring-on-dark',
}

const BUTTON_SIZES: Record<ButtonSize, string> = {
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

const BUTTON_WIDTHS: Record<ButtonWidth, string> = {
  auto: '',
  full: 'w-full',
  responsive: 'w-full sm:w-auto',
}

export interface ButtonStyleOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  width?: ButtonWidth
}

/** Classes de botão; também usadas em links (<a>) com aparência de botão. */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  width = 'auto',
}: ButtonStyleOptions = {}): string {
  return [
    BUTTON_BASE,
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    BUTTON_WIDTHS[width],
  ]
    .filter(Boolean)
    .join(' ')
}

export type CardVariant = 'light' | 'media' | 'photo'

const CARD_VARIANTS: Record<
  CardVariant,
  { base: string; selected: string; idle: string }
> = {
  // Card claro, arredondado, com sombra suave (aparência atual dos destinos).
  light: {
    base: 'flex flex-col rounded-card border bg-surface p-6 shadow-card transition-shadow hover:shadow-card-hover',
    selected: 'border-brand-600 ring-2 ring-brand-100',
    idle: 'border-line',
  },
  // Card claro com mídia (imagem) rente às bordas; o conteúdo define o próprio espaçamento.
  media: {
    base: 'flex flex-col overflow-hidden rounded-card border bg-surface shadow-card transition-shadow hover:shadow-card-hover',
    selected: 'border-brand-600 ring-2 ring-brand-100',
    idle: 'border-line',
  },
  // Card sobre fotografia/fundo escuro: preparado para as telas imersivas.
  photo: {
    base: 'relative flex flex-col overflow-hidden rounded-card-lg border bg-night-900 text-night-ink shadow-float transition-transform duration-150 ease-standard hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
    selected: 'border-brand-300 ring-2 ring-brand-300',
    idle: 'border-white/10',
  },
}

export function cardClasses({
  variant = 'light',
  selected = false,
}: { variant?: CardVariant; selected?: boolean } = {}): string {
  const styles = CARD_VARIANTS[variant]
  return `${styles.base} ${selected ? styles.selected : styles.idle}`
}

/** Ícone e cores (texto e fundo suave) de cada categoria de atração. */
export const CATEGORY_STYLES: Record<
  InterestCategory,
  { icon: LucideIcon; tone: string }
> = {
  gastronomia: { icon: Utensils, tone: 'bg-cat-gastronomia-soft text-cat-gastronomia' },
  natureza: { icon: Trees, tone: 'bg-cat-natureza-soft text-cat-natureza' },
  cultura: { icon: Landmark, tone: 'bg-cat-cultura-soft text-cat-cultura' },
  aventura: { icon: Mountain, tone: 'bg-cat-aventura-soft text-cat-aventura' },
  compras: { icon: ShoppingBag, tone: 'bg-cat-compras-soft text-cat-compras' },
  relaxamento: { icon: Waves, tone: 'bg-cat-relaxamento-soft text-cat-relaxamento' },
  'vida-noturna': {
    icon: Moon,
    tone: 'bg-cat-vida-noturna-soft text-cat-vida-noturna',
  },
}
