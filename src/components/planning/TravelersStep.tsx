import { Heart, Minus, Plus, User, UserRound, Users } from 'lucide-react'
import { useId } from 'react'

import {
  ACCESSIBILITY_NEEDS,
  CHILD_AGE_BANDS,
  MAX_TRAVELERS,
  setChildAge,
  setProfile,
  setTravelerCount,
  toggleAccessibility,
  totalTravelers,
  travelerBounds,
  validateTravelers,
  TRAVEL_PROFILES,
  type ChildAgeBand,
  type TravelerKind,
  type TravelProfile,
} from '../../utils/travelers'
import type { StepProps } from './planningSteps'

const PROFILE_ICONS: Record<TravelProfile, typeof User> = {
  individual: User,
  casal: Heart,
  familia: UserRound,
  amigos: Users,
}

const STEP_BUTTON =
  'flex h-11 w-11 items-center justify-center rounded-full bg-surface-sunken text-ink ring-1 ring-line-strong transition-colors hover:bg-line focus-ring disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface-sunken'

interface CounterProps {
  label: string
  hint: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

/** Controle de quantidade: botões − e + (≥ 44 px), valor anunciado em região educada. */
function Counter({ label, hint, value, min, max, onChange }: CounterProps) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={`${id}-label`} className="flex items-center justify-between gap-4 py-3">
      <div>
        <p id={`${id}-label`} className="text-base font-semibold text-ink">
          {label}
        </p>
        <p className="text-sm text-ink-muted">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={STEP_BUTTON}
          aria-label={`Diminuir ${label.toLowerCase()}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <output aria-live="polite" aria-label={`${label}: ${value}`} className="w-8 text-center text-lg font-semibold text-ink">
          {value}
        </output>
        <button
          type="button"
          className={STEP_BUTTON}
          aria-label={`Aumentar ${label.toLowerCase()}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

const KINDS: ReadonlyArray<{ kind: TravelerKind; label: string; hint: string }> = [
  { kind: 'adults', label: 'Adultos', hint: '18 anos ou mais (mínimo 1)' },
  { kind: 'children', label: 'Crianças', hint: 'De 3 a 17 anos' },
  { kind: 'infants', label: 'Bebês', hint: 'Até 2 anos' },
]

/**
 * Etapa 3 do planejamento progressivo: "Quem vai viajar com você?".
 * Coleta só dados agregados (quantidades, faixas etárias opcionais, perfil
 * opcional e necessidades de acessibilidade opcionais). Esses dados ainda não
 * alteram o roteiro gerado: o motor atual não considera o grupo (V1-T3.7).
 */
export function TravelersStep({ draft, onDraftChange }: StepProps) {
  const travelers = draft.travelers
  const update = (next: typeof travelers) => onDraftChange({ travelers: next })
  const validation = validateTravelers(travelers)
  const total = totalTravelers(travelers)

  return (
    <section aria-labelledby="etapa-viajantes-titulo">
      <h1 id="etapa-viajantes-titulo" className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Quem vai viajar com você?
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-night-ink">
        Informe quantas pessoas vão na viagem. Você não precisa cadastrar cada viajante.
      </p>

      <div className="mt-6 rounded-card-lg bg-surface p-5 text-ink shadow-card">
        <h2 className="text-lg font-semibold text-ink">Quantas pessoas?</h2>
        <div className="divide-y divide-line">
          {KINDS.map(({ kind, label, hint }) => {
            const { min, max } = travelerBounds(travelers, kind)
            return (
              <Counter
                key={kind}
                label={label}
                hint={hint}
                value={travelers[kind]}
                min={min}
                max={max}
                onChange={(value) => update(setTravelerCount(travelers, kind, value))}
              />
            )
          })}
        </div>
        <p role="status" className="mt-2 text-sm text-ink-muted">
          Total: {total} {total === 1 ? 'viajante' : 'viajantes'} (máximo de {MAX_TRAVELERS}).
        </p>
        {!validation.valid && (
          <p role="alert" className="mt-2 text-sm font-medium text-red-700">
            {validation.message}
          </p>
        )}

        {travelers.children > 0 && (
          <div className="mt-4 border-t border-line pt-4">
            <h3 className="text-base font-semibold text-ink">Faixas etárias das crianças (opcional)</h3>
            <p className="text-sm text-ink-muted">
              Só quantas crianças há em cada faixa; não pedimos nomes nem datas de nascimento.
            </p>
            <div className="divide-y divide-line">
              {CHILD_AGE_BANDS.map((band) => {
                const others = CHILD_AGE_BANDS.reduce(
                  (sum, item) => (item.id === band.id ? sum : sum + travelers.childAges[item.id]),
                  0,
                )
                return (
                  <Counter
                    key={band.id}
                    label={band.label}
                    hint="Crianças nesta faixa"
                    value={travelers.childAges[band.id as ChildAgeBand]}
                    min={0}
                    max={travelers.children - others}
                    onChange={(value) => update(setChildAge(travelers, band.id, value))}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>

      <fieldset className="mt-6">
        <legend className="text-lg font-semibold text-white">Perfil da viagem (opcional)</legend>
        <p className="mt-1 text-sm text-night-ink">
          Escolha o que melhor descreve o grupo. Não é definido automaticamente; clique de novo para remover.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TRAVEL_PROFILES.map((profile) => {
            const Icon = PROFILE_ICONS[profile.id]
            const active = travelers.profile === profile.id
            return (
              <button
                key={profile.id}
                type="button"
                aria-pressed={active}
                onClick={() => update(setProfile(travelers, profile.id))}
                className={`flex h-full items-start gap-3 rounded-card-lg border-2 p-4 text-left shadow-card transition-colors focus-ring-on-dark ${
                  active
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-transparent bg-surface hover:bg-surface-muted'
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-brand-100 text-brand-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-base font-semibold text-ink">{profile.label}</span>
                  <span className="mt-0.5 block text-sm text-ink-muted">{profile.description}</span>
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="mt-6 rounded-card-lg bg-surface p-5 text-ink shadow-card">
        <legend className="sr-only">Acessibilidade e mobilidade</legend>
        <h2 className="text-lg font-semibold text-ink">Acessibilidade e mobilidade (opcional)</h2>
        <p className="text-sm text-ink-muted">Marque o que se aplica a alguém do grupo.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {ACCESSIBILITY_NEEDS.map((need) => (
            <label
              key={need.id}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control px-2 text-sm text-ink hover:bg-surface-muted"
            >
              <input
                type="checkbox"
                checked={travelers.accessibility.includes(need.id)}
                onChange={() => update(toggleAccessibility(travelers, need.id))}
                className="h-5 w-5 rounded border-line-strong accent-brand-600 focus-ring"
              />
              {need.label}
            </label>
          ))}
        </div>
      </fieldset>

      <p className="mt-4 text-sm text-night-ink-muted">
        Por enquanto, estas informações são guardadas apenas nesta sessão e ainda não
        personalizam atrações nem custos do roteiro.
      </p>
    </section>
  )
}
