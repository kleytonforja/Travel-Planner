import { Check } from 'lucide-react'
import type { ComponentType } from 'react'

type CardIcon = ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>

/** Densidade do card: "default" (padrão, inalterada) ou "compact" (52–56 px de altura). */
export type SelectableCardDensity = 'default' | 'compact'

interface BaseProps {
  label: string
  description?: string
  icon: CardIcon
  selected: boolean
  density?: SelectableCardDensity
}

interface SelectableCardProps extends BaseProps {
  onClick: () => void
}

const SELECTED = 'border-brand-600 bg-brand-100 shadow-card-hover'
const IDLE = 'border-line-strong bg-surface shadow-card hover:bg-surface-muted'

const FRAME: Record<SelectableCardDensity, string> = {
  default: 'min-h-14 gap-3 rounded-card-lg p-4 pr-11',
  // 56 px de altura mínima (toque ≥ 44 px); o texto nunca fica menor que 14 px.
  compact: 'min-h-14 gap-2.5 rounded-card py-2 pl-2.5 pr-9',
}

const ICON_BOX: Record<SelectableCardDensity, string> = {
  default: 'h-10 w-10 rounded-card',
  compact: 'h-8 w-8 rounded-control',
}

function frameClasses(selected: boolean, density: SelectableCardDensity): string {
  return `relative flex h-full w-full items-center border-2 text-left transition-colors ${FRAME[density]} ${selected ? SELECTED : IDLE}`
}

/** Conteúdo comum: ícone, texto e check de confirmação (decorativo) no canto superior direito. */
function CardContent({ label, description, icon: Icon, selected, density = 'default' }: BaseProps) {
  const compact = density === 'compact'
  return (
    <>
      <span
        className={`flex shrink-0 items-center justify-center ${ICON_BOX[density]} ${
          selected ? 'bg-white text-brand-700' : 'bg-brand-100 text-brand-700'
        }`}
      >
        <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} aria-hidden="true" />
      </span>
      <span>
        <span className={`block font-semibold text-ink ${compact ? 'text-sm leading-tight' : 'text-base'}`}>
          {label}
        </span>
        {description && (
          <span
            // No modo compacto a descrição aparece a partir de 640 px, mas continua disponível a leitores de tela.
            className={`mt-0.5 block text-ink-muted ${compact ? 'sr-only sm:not-sr-only text-xs' : 'text-sm'}`}
          >
            {description}
          </span>
        )}
      </span>
      {selected && (
        <span
          aria-hidden="true"
          data-testid="selected-check"
          className={`absolute flex items-center justify-center rounded-full bg-brand-600 text-white ${
            compact ? 'right-2 top-2 h-5 w-5' : 'right-3 top-3 h-6 w-6'
          }`}
        >
          <Check className={compact ? 'h-3 w-3' : 'h-4 w-4'} strokeWidth={3} />
        </span>
      )}
    </>
  )
}

/**
 * Card selecionável do Design System (V1-T3.4), para escolha única ou múltipla:
 * ambas usam a mesma linguagem visual. Selecionado: fundo azul-claro, borda azul
 * de 2 px, check no canto superior direito e sombra de destaque; não selecionado:
 * fundo branco e borda neutra. É um botão com `aria-pressed` (o check é só
 * visual) e o anel de foco aparece independentemente da seleção.
 *
 * `density="compact"` (M4.2) reduz a altura para ~56 px mantendo alvo de toque,
 * texto legível e o mesmo estado selecionado; o padrão continua como antes.
 */
export function SelectableCard({ onClick, ...content }: SelectableCardProps) {
  return (
    <button
      type="button"
      aria-pressed={content.selected}
      onClick={onClick}
      className={`${frameClasses(content.selected, content.density ?? 'default')} focus-ring-on-dark`}
    >
      <CardContent {...content} />
    </button>
  )
}

interface SelectableRadioCardProps extends BaseProps {
  /** Nome do grupo de rádio (todos os cards do grupo compartilham o mesmo). */
  name: string
  value: string
  onSelect: () => void
}

/**
 * Variante de escolha única com semântica nativa de `radio` (navegação por setas,
 * Tab no grupo, "checked" para tecnologias assistivas), com o mesmo visual do
 * `SelectableCard`: fundo azul-claro, borda de 2 px, check e anel de foco.
 */
export function SelectableRadioCard({ name, value, onSelect, ...content }: SelectableRadioCardProps) {
  return (
    <label className="block cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        checked={content.selected}
        onChange={onSelect}
        className="peer sr-only"
      />
      <span
        className={`${frameClasses(content.selected, content.density ?? 'default')} peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white`}
      >
        <CardContent {...content} />
      </span>
    </label>
  )
}
