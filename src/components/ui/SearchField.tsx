import { Search, X } from 'lucide-react'
import { useId, useRef } from 'react'

interface SearchFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Oculta o rótulo visualmente (continua disponível a leitores de tela). */
  hideLabel?: boolean
  tone?: 'light' | 'onDark'
}

const INPUT_TONES = {
  light: 'border-line-strong bg-surface text-ink placeholder:text-ink-subtle focus-ring',
  onDark:
    'border-white/20 bg-white/10 text-night-ink placeholder:text-night-ink-muted focus-ring-on-dark',
} as const

/** Campo de pesquisa com ícone e botão de limpar. */
export function SearchField({
  label,
  value,
  onChange,
  placeholder,
  hideLabel = false,
  tone = 'light',
}: SearchFieldProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const labelTone = tone === 'onDark' ? 'text-night-ink' : 'text-ink'
  const iconTone = tone === 'onDark' ? 'text-night-ink-muted' : 'text-ink-subtle'
  const clearFocus = tone === 'onDark' ? 'focus-ring-on-dark' : 'focus-ring'

  return (
    <div>
      <label
        htmlFor={id}
        className={`mb-1 block text-sm font-semibold ${labelTone} ${hideLabel ? 'sr-only' : ''}`}
      >
        {label}
      </label>
      <div className="relative">
        <Search
          className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${iconTone}`}
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={id}
          type="search"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-control border py-2.5 pl-10 pr-10 text-sm ${INPUT_TONES[tone]}`}
        />
        {value !== '' && (
          <button
            type="button"
            aria-label="Limpar pesquisa"
            onClick={() => {
              onChange('')
              inputRef.current?.focus()
            }}
            className={`absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-control ${iconTone} ${clearFocus}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
