import { Check } from 'lucide-react'

interface ProgressStep {
  id: string
  label: string
}

interface ProgressStepsProps {
  steps: readonly ProgressStep[]
  /** Índice (a partir de 0) da etapa atual; valores fora do intervalo são ajustados. */
  currentIndex: number
  /** Nome acessível da lista de etapas. */
  label?: string
  tone?: 'light' | 'onDark'
}

type StepState = 'done' | 'current' | 'todo'

const STATE_TEXT: Record<StepState, string> = {
  done: 'concluída',
  current: 'etapa atual',
  todo: 'pendente',
}

/** Indicador de progresso em etapas (navegação visual progressiva). */
export function ProgressSteps({
  steps,
  currentIndex,
  label = 'Progresso',
  tone = 'light',
}: ProgressStepsProps) {
  if (steps.length === 0) return null
  const safeIndex = Number.isFinite(currentIndex) ? Math.trunc(currentIndex) : 0
  const current = Math.min(Math.max(safeIndex, 0), steps.length - 1)
  const onDark = tone === 'onDark'

  return (
    <ol aria-label={label} className="flex flex-wrap items-center gap-x-2 gap-y-3">
      {steps.map((step, index) => {
        const state: StepState =
          index < current ? 'done' : index === current ? 'current' : 'todo'
        const circle =
          state === 'todo'
            ? onDark
              ? 'border border-white/30 text-night-ink-muted'
              : 'border border-line-strong bg-surface text-ink-muted'
            : // brand-600 com texto branco: 5,26:1 (AA); brand-500 daria 3,76:1.
              'bg-brand-600 text-white'
        const text = onDark
          ? state === 'current'
            ? 'font-semibold text-night-ink'
            : 'text-night-ink-muted'
          : state === 'current'
            ? 'font-semibold text-ink'
            : 'text-ink-muted'

        return (
          <li
            key={step.id}
            aria-current={state === 'current' ? 'step' : undefined}
            className="flex items-center gap-2"
          >
            <span
              className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${circle}`}
              aria-hidden="true"
            >
              {state === 'done' ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span
              className={`text-sm ${text} ${state === 'current' ? '' : 'sr-only lg:not-sr-only'}`}
            >
              {step.label}
              <span className="sr-only"> ({STATE_TEXT[state]})</span>
            </span>
            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={`hidden h-px w-4 sm:block lg:w-6 ${onDark ? 'bg-white/30' : 'bg-line-strong'}`}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
