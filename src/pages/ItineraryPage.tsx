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
import { ActivityPhotoCredits } from '../components/ActivityPhotoCredits'
import { ItineraryDayCard } from '../components/ItineraryDayCard'
import { ItinerarySummary } from '../components/ItinerarySummary'
import { destinations } from '../data/destinations'
import { downloadItineraryJson } from '../services/itineraryExport'
import {
  buildPlanningFingerprint,
  saveItinerary,
  type ReplaceConfirmation,
} from '../services/itineraryStorage'
import type { Itinerary, SavedItinerary } from '../types'
import { formatDateTime } from '../utils/format'

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
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingReplace, setPendingReplace] =
    useState<ReplaceConfirmation | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const destination = destinations.find(
    (item) => item.id === itinerary.input.destinationId,
  )

  /**
   * Salvamento assíncrono (P2): coordenado por Web Locks, com sucesso
   * somente após confirmação por releitura. Um planejamento equivalente
   * já salvo exige confirmação explícita de substituição, vinculada ao
   * id do alvo e ao conteúdo bruto observado.
   */
  async function handleSave(confirmation?: ReplaceConfirmation) {
    setIsSaving(true)
    try {
      const result = await saveItinerary(itinerary, confirmation)
      if (result.ok) {
        setSaveError(null)
        setPendingReplace(null)
        setSavedRecord(result.record)
        return
      }
      if (result.outcome === 'needs-confirmation') {
        setSaveError(null)
        setPendingReplace(result.confirmation)
        return
      }
      // Falha ou resultado incerto: nunca informar sucesso sem
      // confirmação. A confirmação pendente é descartada — uma nova
      // análise é necessária após nova leitura.
      setPendingReplace(null)
      setSaveError(result.message)
    } finally {
      setIsSaving(false)
    }
  }

  function handleExport() {
    if (!destination) return
    const record =
      savedRecord ?? {
        id: buildPlanningFingerprint(itinerary.input),
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
                onClick={() => handleSave()}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                {isSaving ? 'Salvando…' : 'Salvar roteiro'}
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

        {/* Confirmação de substituição (TP-03): vinculada ao alvo e ao
            conteúdo bruto observado; informa destino, dias e data do
            registro que será substituído. */}
        {pendingReplace && !savedRecord && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"
          >
            <p className="text-sm font-semibold text-amber-900">
              Substituir roteiro salvo?
            </p>
            <p className="mt-1 text-sm text-amber-800">
              Já existe um roteiro salvo com este mesmo planejamento:{' '}
              {destinations.find(
                (item) => item.id === pendingReplace.target.destinationId,
              )?.name ?? pendingReplace.target.destinationId}
              , {pendingReplace.target.days}{' '}
              {pendingReplace.target.days === 1 ? 'dia' : 'dias'}, salvo em{' '}
              {formatDateTime(pendingReplace.target.savedAt)}. Ao confirmar,
              somente esse registro será substituído.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSave(pendingReplace)}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? 'Salvando…' : 'Confirmar substituição'}
              </button>
              <button
                type="button"
                onClick={() => setPendingReplace(null)}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Falha ao salvar (TP-04: erro recuperável, sem falso sucesso) */}
        {saveError && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {saveError}
          </p>
        )}

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
          <ActivityPhotoCredits days={itinerary.days} />
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
