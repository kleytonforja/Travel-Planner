import { Banknote, CircleHelp, Gem, Scale, Users, Wallet } from 'lucide-react'
import { useId } from 'react'

import { destinations } from '../../data/destinations'
import { STYLE_DESCRIPTIONS, STYLE_LABELS } from '../../data/labels'
import type { TravelStyle } from '../../types'
import {
  centsToMoney,
  computeBudget,
  parseAmount,
  TRAVEL_STYLE_OPTIONS,
  type BudgetBasis,
} from '../../utils/budget'
import { totalTravelers } from '../../utils/travelers'
import { SelectableCard } from '../ui/SelectableCard'
import type { StepProps } from './planningSteps'

const STYLE_ICONS: Record<TravelStyle, typeof Wallet> = {
  economico: Wallet,
  equilibrado: Scale,
  confortavel: Gem,
}

const BASIS_OPTIONS: ReadonlyArray<{ id: BudgetBasis; label: string; description: string }> = [
  { id: 'total', label: 'Valor total da viagem', description: 'Dividido igualmente entre os viajantes.' },
  { id: 'perPerson', label: 'Valor por pessoa', description: 'Multiplicado pelo número de viajantes.' },
]

/**
 * Etapa 6 do planejamento progressivo: "Quanto você pretende investir na
 * viagem?". Estilo financeiro (mesmos valores do motor), orçamento opcional em
 * valor total ou por pessoa, na moeda do destino, sem conversão cambial. O
 * motor não é alterado: a revisão converte o orçamento em valor por pessoa para
 * gerar o roteiro; hospedagem, alimentação e transporte não são calculados.
 */
export function BudgetStep({ draft, onDraftChange }: StepProps) {
  const budget = draft.budget
  const update = (patch: Partial<typeof budget>) => onDraftChange({ budget: { ...budget, ...patch } })
  const inputId = useId()
  const currency = destinations.find((item) => item.id === draft.destinationId)?.currency ?? null
  const travelers = totalTravelers(draft.travelers)
  const parsed = parseAmount(budget.amount)
  const figures = computeBudget(budget, travelers)
  const basisLabel = BASIS_OPTIONS.find((item) => item.id === budget.basis)?.label ?? ''
  const tooSmall = figures !== null && figures.perPersonCents === 0

  return (
    <section aria-labelledby="etapa-orcamento-titulo">
      <h1 id="etapa-orcamento-titulo" className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Quanto você pretende investir na viagem?
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-night-ink">
        Escolha o estilo da viagem e, se quiser, informe um valor. O orçamento é opcional.
      </p>

      <fieldset className="mt-6">
        <legend className="text-lg font-semibold text-white">Estilo da viagem</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {TRAVEL_STYLE_OPTIONS.map((style) => (
            <SelectableCard
              key={style}
              label={STYLE_LABELS[style]}
              description={STYLE_DESCRIPTIONS[style]}
              icon={STYLE_ICONS[style]}
              selected={budget.style === style}
              onClick={() => update({ style })}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="text-lg font-semibold text-white">Orçamento (opcional)</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <SelectableCard
            label="Informar um valor"
            description="Defina quanto pretende investir."
            icon={Banknote}
            selected={budget.amountMode === 'value'}
            onClick={() => update({ amountMode: 'value' })}
          />
          <SelectableCard
            label="Ainda não defini"
            description="Você pode informar o valor depois."
            icon={CircleHelp}
            selected={budget.amountMode === 'undecided'}
            onClick={() => update({ amountMode: 'undecided' })}
          />
        </div>
      </fieldset>

      {budget.amountMode === 'value' && (
        <>
          <fieldset className="mt-6">
            <legend className="text-lg font-semibold text-white">Como você quer informar o valor?</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {BASIS_OPTIONS.map((option) => (
                <SelectableCard
                  key={option.id}
                  label={option.label}
                  description={option.description}
                  icon={option.id === 'total' ? Banknote : Users}
                  selected={budget.basis === option.id}
                  onClick={() => update({ basis: option.id })}
                />
              ))}
            </div>
          </fieldset>

          <div className="mt-6 rounded-card-lg bg-surface p-5 text-ink shadow-card">
            <label htmlFor={inputId} className="text-base font-semibold text-ink">
              {basisLabel}
              {currency ? ` (${currency.code})` : ''}
            </label>
            <div className="relative mt-2 max-w-xs">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-ink-muted"
              >
                {currency ? currency.symbol : '—'}
              </span>
              <input
                id={inputId}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={budget.amount}
                onChange={(event) => update({ amount: event.target.value })}
                aria-invalid={parsed.status === 'invalid'}
                aria-describedby={`${inputId}-info`}
                placeholder="Ex.: 2500"
                className={`w-full rounded-control border bg-surface py-2.5 pl-10 pr-3 text-sm text-ink focus-ring ${parsed.status === 'invalid' ? 'border-red-600' : 'border-line-strong'}`}
              />
            </div>
            <div id={`${inputId}-info`} className="mt-3 min-h-6 text-sm">
              {parsed.status === 'invalid' && (
                <p role="alert" className="font-medium text-red-700">
                  {parsed.message}
                </p>
              )}
              {parsed.status === 'empty' && (
                <p className="text-ink-muted">
                  Sem valor, o planejamento segue normalmente. Os valores são sempre em{' '}
                  {currency ? `${currency.code} (${currency.symbol})` : 'moeda do destino'}, sem
                  conversão cambial.
                </p>
              )}
              {figures !== null && currency && (
                <p role="status" className="font-semibold text-ink">
                  {budget.basis === 'total'
                    ? `Total de ${centsToMoney(figures.totalCents, currency)} para ${figures.travelers} ${figures.travelers === 1 ? 'viajante' : 'viajantes'}: ${figures.rounded ? 'cerca de ' : ''}${centsToMoney(figures.perPersonCents, currency)} por pessoa.`
                    : `${centsToMoney(figures.perPersonCents, currency)} por pessoa, para ${figures.travelers} ${figures.travelers === 1 ? 'viajante' : 'viajantes'}: total de ${centsToMoney(figures.totalCents, currency)}.`}
                  {figures.rounded && (
                    <span className="block text-sm font-normal text-ink-muted">
                      A divisão é igual entre todos e arredondada para baixo ao centavo. Crianças e
                      bebês contam como 1 viajante cada, sem descontos presumidos.
                    </span>
                  )}
                </p>
              )}
              {tooSmall && (
                <p role="alert" className="mt-1 font-medium text-red-700">
                  O valor é pequeno demais para dividir entre {travelers} viajantes. Aumente o valor.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      <p className="mt-4 text-sm text-night-ink-muted">
        Valores de atrações são estimativas ilustrativas. O orçamento serve de teto para
        escolher atrações e não representa dinheiro disponível para outras despesas;
        hospedagem, alimentação e transporte não são calculados. O estilo e o valor por pessoa
        são usados na geração do roteiro, na revisão. Estas escolhas ficam guardadas apenas
        nesta sessão.
      </p>
    </section>
  )
}
