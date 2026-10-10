import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  Save,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { BudgetSummary } from '../components/BudgetSummary'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { ItineraryDayCard } from '../components/ItineraryDayCard'
import { ItinerarySummary } from '../components/ItinerarySummary'
import { destinations } from '../data/destinations'
import { downloadItineraryJson } from '../services/itineraryExport'
import {
  buildItineraryId,
  saveItinerary,
} from '../services/itineraryStorage'
import type { Itinerary, SavedItinerary } from '../types'

interface ItineraryPageProps {
  itinerary: Itinerary
  /** Registro persistido, quando o roteiro aberto veio dos salvos. */
  saved: SavedItinerary | null
  /** Volta para a página inicial (novo planejamento). */
  onNewPlanning: () => void
}

/**
 * Página de resultado do roteiro: resumo da viagem, roteiro diário,
 * resumo financeiro, avisos e ações (salvar, exportar JSON, novo
 * planejamento).
 */
export function ItineraryPage({
  itinerary,
  saved,
  onNewPlanning,
}: ItineraryPageProps) {
  const [savedRecord, setSavedRecord] = useState<SavedItinerary | null>(saved)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const destination = destinations.find(
    (item) => item.id === itinerary.input.destinationId,
  )

  function handleSave() {
    setSavedRecord(saveItinerary(itinerary))
  }

  function handleExport() {
    if (!destination) return
    const record =
      savedRecord ?? {
        id: buildItineraryId(itinerary.input),
        savedAt: new Date().toISOString(),
        itinerary,
      }
    downloadItineraryJson(record, destination)
  }

  if (!destination) {
    return (
      <div className="min-h-screen bg-white text-slate-900">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Pular para o conteúdo
        </a>
        <Header hideNav onHomeClick={onNewPlanning} />
        <main id="conteudo" className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            Não foi possível exibir este roteiro porque o destino não está
            mais disponível na base local. Gere um novo planejamento.
          </p>
          <button
            type="button"
            onClick={onNewPlanning}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Novo planejamento
          </button>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Pular para o conteúdo
      </a>

      <Header hideNav onHomeClick={onNewPlanning} />

      <main id="conteudo" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Ações */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onNewPlanning}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Novo planejamento
          </button>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            {savedRecord ? (
              <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Roteiro salvo neste navegador
              </span>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                Salvar roteiro
              </button>
            )}

            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Exportar JSON
            </button>
          </div>
        </div>

        {/* Avisos */}
        {itinerary.warnings.length > 0 && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Avisos do roteiro
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-amber-800">
              {itinerary.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* A. Resumo da viagem */}
        <div className="mt-8">
          <ItinerarySummary itinerary={itinerary} destination={destination} />
        </div>

        {/* B. Roteiro diário */}
        <section aria-labelledby="roteiro-diario" className="mt-10">
          <h2
            id="roteiro-diario"
            className="text-xl font-bold tracking-tight text-slate-900"
          >
            Roteiro diário
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Horários sugeridos sem sobreposição, com intervalo para refeições
            e deslocamentos. Custos e durações são ilustrativos.
          </p>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {itinerary.days.map((day) => (
              <ItineraryDayCard
                key={day.dayNumber}
                day={day}
                currency={destination.currency}
              />
            ))}
          </div>
        </section>

        {/* C. Resumo financeiro */}
        <BudgetSummary
          totals={itinerary.totals}
          budget={itinerary.input.budget}
          currency={destination.currency}
        />
      </main>

      <div className="mt-10">
        <Footer />
      </div>
    </div>
  )
}
