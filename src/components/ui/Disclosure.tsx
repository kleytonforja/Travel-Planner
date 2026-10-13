import { ChevronDown } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'

interface DisclosureProps {
  title: string
  /** Texto curto à direita do título (por exemplo, "2 marcadas"). */
  summary?: string
  /** Aberto na montagem; use `true` quando já houver dados preenchidos. */
  defaultOpen?: boolean
  /** "onDark" sobre o fundo escuro do planejamento; "onLight" sobre superfícies claras. */
  tone?: 'onDark' | 'onLight'
  children: ReactNode
}

const TONES = {
  onDark:
    'border-white/25 bg-night-900/70 text-white hover:bg-white/10 focus-ring-on-dark',
  onLight: 'border-line-strong bg-surface text-ink hover:bg-surface-muted focus-ring',
} as const

/**
 * Seção recolhível (M4.3) para campos opcionais: botão com `aria-expanded` e
 * `aria-controls`. O conteúdo continua montado quando recolhido (atributo
 * `hidden`), então nenhum valor é apagado ao recolher.
 */
export function Disclosure({ title, summary, defaultOpen = false, tone = 'onDark', children }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-card border px-4 py-2 text-left text-sm font-semibold transition-colors ${TONES[tone]}`}
      >
        <span>{title}</span>
        <span className="flex items-center gap-2 text-xs font-medium opacity-80">
          {summary}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </span>
      </button>
      <div id={panelId} hidden={!open} className="mt-3">
        {children}
      </div>
    </div>
  )
}
