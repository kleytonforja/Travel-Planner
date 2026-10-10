import { AlertTriangle } from 'lucide-react'
import { useState } from 'react'

import { destinations } from '../data/destinations'
import {
  INTEREST_LABELS,
  STYLE_DESCRIPTIONS,
  STYLE_LABELS,
} from '../data/labels'
import { generateItinerary } from '../services/itineraryGenerator'
import {
  MAX_DAYS,
  MIN_DAYS,
  validatePlanningInput,
  type PlanningField,
} from '../services/planningValidation'
import type {
  InterestCategory,
  Itinerary,
  PlanningInput,
  TravelStyle,
} from '../types'

const INTERESTS = Object.keys(INTEREST_LABELS) as InterestCategory[]
const STYLES = Object.keys(STYLE_LABELS) as TravelStyle[]

interface PlanningFormProps {
  /** Destino selecionado (controlado pela página, pois os cards também selecionam). */
  destinationId: string
  onDestinationChange: (id: string) => void
  /** Chamado quando o roteiro é gerado com sucesso. */
  onItineraryGenerated: (itinerary: Itinerary) => void
}

type FormErrors = Partial<Record<PlanningField, string>>

const baseFieldClass =
  'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600'

function fieldClass(hasError: boolean) {
  return `${baseFieldClass} ${hasError ? 'border-red-500' : 'border-slate-300'}`
}

/**
 * Formulário de planejamento de viagem.
 *
 * Valida os dados e aciona o gerador determinístico de roteiros
 * (a regra de negócio fica em `src/services/itineraryGenerator.ts`).
 */
export function PlanningForm({
  destinationId,
  onDestinationChange,
  onItineraryGenerated,
}: PlanningFormProps) {
  const [days, setDays] = useState('')
  const [interests, setInterests] = useState<InterestCategory[]>([])
  const [style, setStyle] = useState<TravelStyle | ''>('')
  const [budget, setBudget] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [generationError, setGenerationError] = useState<string | null>(null)

  const selectedDestination = destinations.find(
    (destination) => destination.id === destinationId,
  )

  function toggleInterest(interest: InterestCategory) {
    setGenerationError(null)
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    )
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const input: PlanningInput = {
      destinationId,
      days: Number(days),
      interests,
      style: style as TravelStyle,
      budget: Number(budget),
    }

    const result = validatePlanningInput(
      input,
      destinations.map((destination) => destination.id),
    )

    setErrors(result.errors)
    if (!result.valid) {
      setGenerationError(null)
      return
    }

    // Com a validação aprovada, o destino necessariamente existe na base.
    if (!selectedDestination) return

    const generation = generateItinerary(input, selectedDestination)
    if (generation.ok) {
      setGenerationError(null)
      onItineraryGenerated(generation.itinerary)
    } else {
      setGenerationError(generation.message)
    }
  }

  return (
    <section id="planejar" className="scroll-mt-20 bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Planeje sua viagem
          </h2>
          <p className="mt-3 text-lg text-slate-600">
            Preencha os campos abaixo para montar o seu planejamento.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:p-8"
        >
          {/* Destino */}
          <div>
            <label
              htmlFor="destino"
              className="block text-sm font-semibold text-slate-900"
            >
              Destino
            </label>
            <select
              id="destino"
              value={destinationId}
              onChange={(event) => {
                onDestinationChange(event.target.value)
                setGenerationError(null)
              }}
              aria-invalid={Boolean(errors.destinationId)}
              aria-describedby={
                errors.destinationId ? 'erro-destino' : undefined
              }
              className={`mt-2 ${fieldClass(Boolean(errors.destinationId))}`}
            >
              <option value="">Selecione um destino</option>
              {destinations.map((destination) => (
                <option key={destination.id} value={destination.id}>
                  {destination.name}, {destination.country}
                </option>
              ))}
            </select>
            {errors.destinationId && (
              <p id="erro-destino" role="alert" className="mt-2 text-sm text-red-600">
                {errors.destinationId}
              </p>
            )}
          </div>

          {/* Duração */}
          <div className="mt-6">
            <label
              htmlFor="duracao"
              className="block text-sm font-semibold text-slate-900"
            >
              Duração da viagem (dias)
            </label>
            <input
              id="duracao"
              type="number"
              inputMode="numeric"
              min={MIN_DAYS}
              max={MAX_DAYS}
              step={1}
              value={days}
              onChange={(event) => {
                setDays(event.target.value)
                setGenerationError(null)
              }}
              aria-invalid={Boolean(errors.days)}
              aria-describedby={errors.days ? 'erro-duracao' : 'ajuda-duracao'}
              className={`mt-2 ${fieldClass(Boolean(errors.days))}`}
              placeholder="Ex.: 5"
            />
            <p id="ajuda-duracao" className="mt-2 text-sm text-slate-500">
              Entre {MIN_DAYS} e {MAX_DAYS} dias.
            </p>
            {errors.days && (
              <p id="erro-duracao" role="alert" className="mt-2 text-sm text-red-600">
                {errors.days}
              </p>
            )}
          </div>

          {/* Interesses */}
          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-slate-900">
              Interesses
            </legend>
            <div
              className="mt-2 flex flex-wrap gap-2"
              aria-describedby={errors.interests ? 'erro-interesses' : undefined}
            >
              {INTERESTS.map((interest) => (
                <label key={interest} className="cursor-pointer">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={interests.includes(interest)}
                    onChange={() => toggleInterest(interest)}
                  />
                  <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600">
                    {INTEREST_LABELS[interest]}
                  </span>
                </label>
              ))}
            </div>
            {errors.interests && (
              <p id="erro-interesses" role="alert" className="mt-2 text-sm text-red-600">
                {errors.interests}
              </p>
            )}
          </fieldset>

          {/* Estilo de viagem */}
          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-slate-900">
              Estilo de viagem
            </legend>
            <div
              className="mt-2 grid gap-3 sm:grid-cols-3"
              aria-describedby={errors.style ? 'erro-estilo' : undefined}
            >
              {STYLES.map((option) => (
                <label key={option} className="cursor-pointer">
                  <input
                    type="radio"
                    name="estilo"
                    value={option}
                    className="peer sr-only"
                    checked={style === option}
                    onChange={() => {
                      setStyle(option)
                      setGenerationError(null)
                    }}
                  />
                  <span className="block rounded-lg border border-slate-300 bg-white p-4 text-center transition-colors peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600">
                    <span className="block text-sm font-semibold text-slate-900">
                      {STYLE_LABELS[option]}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {STYLE_DESCRIPTIONS[option]}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            {errors.style && (
              <p id="erro-estilo" role="alert" className="mt-2 text-sm text-red-600">
                {errors.style}
              </p>
            )}
          </fieldset>

          {/* Orçamento */}
          <div className="mt-6">
            <label
              htmlFor="orcamento"
              className="block text-sm font-semibold text-slate-900"
            >
              Orçamento total por pessoa
            </label>
            <div className="relative mt-2">
              <span
                className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-500"
                aria-hidden="true"
              >
                {selectedDestination ? selectedDestination.currency.symbol : '—'}
              </span>
              <input
                id="orcamento"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={budget}
                onChange={(event) => {
                  setBudget(event.target.value)
                  setGenerationError(null)
                }}
                aria-invalid={Boolean(errors.budget)}
                aria-describedby={
                  errors.budget ? 'erro-orcamento' : 'ajuda-orcamento'
                }
                className={`pl-10 ${fieldClass(Boolean(errors.budget))}`}
                placeholder="Ex.: 2000"
              />
            </div>
            <p id="ajuda-orcamento" className="mt-2 text-sm text-slate-500">
              {selectedDestination
                ? `Moeda do destino: ${selectedDestination.currency.code} (${selectedDestination.currency.symbol}).`
                : 'Selecione um destino para ver a moeda utilizada.'}
            </p>
            {errors.budget && (
              <p id="erro-orcamento" role="alert" className="mt-2 text-sm text-red-600">
                {errors.budget}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Gerar roteiro
          </button>
        </form>

        {generationError && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5"
          >
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
              aria-hidden="true"
            />
            <p className="text-sm text-amber-800">{generationError}</p>
          </div>
        )}
      </div>
    </section>
  )
}
