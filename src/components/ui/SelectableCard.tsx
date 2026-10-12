import { Check } from 'lucide-react'
import type { ComponentType } from 'react'

interface SelectableCardProps {
  label: string
  description?: string
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  selected: boolean
  onClick: () => void
}

/**
 * Card selecionável do Design System (V1-T3.4), para escolha única ou múltipla:
 * ambas usam a mesma linguagem visual. Selecionado: fundo azul-claro, borda azul
 * de 2 px, check no canto superior direito e sombra de destaque; não selecionado:
 * fundo branco e borda neutra. É um botão com `aria-pressed` (o check é só
 * visual) e o anel de foco aparece independentemente da seleção.
 */
export function SelectableCard({ label, description, icon: Icon, selected, onClick }: SelectableCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`relative flex h-full min-h-14 w-full items-center gap-3 rounded-card-lg border-2 p-4 pr-11 text-left transition-colors focus-ring-on-dark ${
        selected
          ? 'border-brand-600 bg-brand-100 shadow-card-hover'
          : 'border-line-strong bg-surface shadow-card hover:bg-surface-muted'
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-card ${
          selected ? 'bg-white text-brand-700' : 'bg-brand-100 text-brand-700'
        }`}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-base font-semibold text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-sm text-ink-muted">{description}</span>}
      </span>
      {selected && (
        <span
          aria-hidden="true"
          data-testid="selected-check"
          className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white"
        >
          <Check className="h-4 w-4" strokeWidth={3} />
        </span>
      )}
    </button>
  )
}
