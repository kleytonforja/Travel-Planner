import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { BudgetSummary } from '../components/BudgetSummary'
import type { Currency, ItineraryTotals } from '../types'

const BRL: Currency = { code: 'BRL', symbol: 'R$', locale: 'pt-BR' }

const TOTALS: ItineraryTotals = {
  estimatedActivitiesCost: 260,
  unallocatedBudget: 740,
  averageCostPerDay: 260 / 3,
}

function renderSummary() {
  return render(<BudgetSummary totals={TOTALS} budget={1000} currency={BRL} />)
}

describe('BudgetSummary', () => {
  it('apresenta o orçamento informado formatado na moeda do destino', () => {
    renderSummary()
    expect(screen.getByText('Orçamento informado')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*1\.000,00/)).toBeInTheDocument()
  })

  it('apresenta o custo estimado das atividades separado do orçamento', () => {
    renderSummary()
    expect(
      screen.getByText('Custo estimado das atividades'),
    ).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*260,00/)).toBeInTheDocument()
  })

  it('apresenta o saldo não alocado e a média por dia', () => {
    renderSummary()
    expect(screen.getByText('Saldo não alocado')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*740,00/)).toBeInTheDocument()
    expect(
      screen.getByText('Custo médio das atividades por dia'),
    ).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*86,67/)).toBeInTheDocument()
  })

  it('deixa claro que o resumo não é o custo total da viagem', () => {
    renderSummary()
    expect(
      screen.getByText(/não é o custo total da viagem/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/não inclui hospedagem/i)).toBeInTheDocument()
  })

  it('lista os gastos não contemplados sem inventar valores', () => {
    renderSummary()
    expect(
      screen.getByRole('heading', {
        name: 'Gastos não contemplados nas estimativas',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Hospedagem')).toBeInTheDocument()
    expect(screen.getByText('Alimentação')).toBeInTheDocument()
    expect(screen.getByText('Transporte e deslocamentos')).toBeInTheDocument()
    expect(
      screen.getByText('Passagens (aéreas ou terrestres)'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('não incluído')).toHaveLength(4)
  })
})
