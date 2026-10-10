import { CircleSlash, Info } from 'lucide-react'

import type { Currency, ItineraryTotals } from '../types'
import { formatCurrency } from '../utils/format'

interface BudgetSummaryProps {
  totals: ItineraryTotals
  /** Orçamento total por pessoa informado no planejamento. */
  budget: number
  currency: Currency
}

/**
 * Gastos que o MVP não estima. Listados apenas como texto, sem valores:
 * a aplicação não inventa custos de hospedagem, alimentação, transporte
 * ou passagens.
 */
const NON_CONTEMPLATED_EXPENSES = [
  'Hospedagem',
  'Alimentação',
  'Transporte e deslocamentos',
  'Passagens (aéreas ou terrestres)',
] as const

/**
 * Seção C da página de resultado: resumo financeiro das ATIVIDADES.
 *
 * Diferencia explicitamente orçamento informado, custo estimado das
 * atividades e saldo não alocado, e deixa claro que o custo das
 * atividades NÃO é o custo total da viagem.
 */
export function BudgetSummary({ totals, budget, currency }: BudgetSummaryProps) {
  const items = [
    {
      label: 'Orçamento informado',
      description: 'Valor total por pessoa definido por você no planejamento.',
      value: formatCurrency(budget, currency),
      tone: 'text-slate-900',
    },
    {
      label: 'Custo estimado das atividades',
      description: 'Soma dos custos ilustrativos das atividades sugeridas.',
      value: formatCurrency(totals.estimatedActivitiesCost, currency),
      tone: 'text-blue-700',
    },
    {
      label: 'Saldo não alocado',
      description:
        'Parte do orçamento que não foi usada pelas atividades sugeridas.',
      value: formatCurrency(totals.unallocatedBudget, currency),
      tone: 'text-emerald-700',
    },
    {
      label: 'Custo médio das atividades por dia',
      description: 'Custo estimado das atividades dividido pelos dias.',
      value: formatCurrency(totals.averageCostPerDay, currency),
      tone: 'text-slate-900',
    },
  ]

  return (
    <section aria-labelledby="resumo-financeiro" className="mt-10">
      <h2
        id="resumo-financeiro"
        className="text-xl font-bold tracking-tight text-slate-900"
      >
        Resumo financeiro
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Este resumo considera apenas as atividades sugeridas. Ele não é o
        custo total da viagem.
      </p>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {item.label}
            </dt>
            <dd className={`mt-1 text-lg font-bold ${item.tone}`}>
              {item.value}
            </dd>
            <dd className="mt-1 text-xs text-slate-500">{item.description}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <CircleSlash className="h-4 w-4 text-slate-500" aria-hidden="true" />
          Gastos não contemplados nas estimativas
        </h3>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {NON_CONTEMPLATED_EXPENSES.map((expense) => (
            <li
              key={expense}
              className="flex items-center justify-between gap-2 text-sm text-slate-600"
            >
              <span>{expense}</span>
              <span className="text-xs font-medium text-slate-500">
                não incluído
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          O Travel Planner não estima esses valores nesta versão. Reserve
          parte do saldo não alocado para cobri-los por conta própria.
        </p>
      </div>

      <p className="mt-4 flex items-start gap-2 text-sm text-slate-500">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Valores ilustrativos por pessoa, em {currency.code}. Este resumo
          considera apenas o custo estimado das atividades sugeridas — não
          inclui hospedagem, transporte, alimentação nem outros gastos da
          viagem.
        </span>
      </p>
    </section>
  )
}
