import { useState } from 'react'

import { DestinationsSection } from '../components/DestinationsSection'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { HowItWorks } from '../components/HowItWorks'
import { PlanningForm } from '../components/PlanningForm'
import { SavedItineraries } from '../components/SavedItineraries'
import {
  discardCorruptedData,
  loadSavedItineraries,
  removeSavedItinerary,
  type StorageLoadResult,
} from '../services/itineraryStorage'
import type { Itinerary, SavedItinerary } from '../types'

interface HomePageProps {
  /** Chamado quando o formulário gera um roteiro com sucesso. */
  onItineraryGenerated: (itinerary: Itinerary) => void
  /** Chamado quando o usuário reabre um roteiro salvo. */
  onOpenSaved: (saved: SavedItinerary) => void
}

/**
 * Página inicial do Travel Planner.
 *
 * Mantém o destino selecionado para que os cards de destino e o
 * formulário de planejamento fiquem sincronizados, e lista os roteiros
 * salvos no navegador para reabertura ou exclusão.
 *
 * Problemas de armazenamento (dados corrompidos, registros inválidos,
 * armazenamento indisponível, falhas de escrita) são exibidos como
 * alertas recuperáveis — registros inválidos nunca são renderizados e
 * dados ilegíveis só são descartados com autorização explícita do
 * usuário (uma cópia é mantida em quarentena no próprio navegador).
 */
export function HomePage({ onItineraryGenerated, onOpenSaved }: HomePageProps) {
  const [destinationId, setDestinationId] = useState('')
  const [storage, setStorage] = useState<StorageLoadResult>(() =>
    loadSavedItineraries(),
  )
  const [storageMessage, setStorageMessage] = useState<string | null>(null)

  function reloadSaved() {
    setStorage(loadSavedItineraries())
  }

  function handleSelectDestination(id: string) {
    setDestinationId(id)
    document.getElementById('planejar')?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleRemoveSaved(id: string) {
    const result = removeSavedItinerary(id)
    if (!result.ok) {
      // TP-04: a exclusão falhou — a lista anterior é preservada.
      setStorageMessage(result.message)
      return
    }
    setStorageMessage(null)
    reloadSaved()
  }

  function handleDiscardCorrupted() {
    // TP-05: descarte explícito autorizado pelo usuário.
    const result = discardCorruptedData()
    if (!result.ok) {
      setStorageMessage(result.message)
      return
    }
    setStorageMessage(null)
    reloadSaved()
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Pular para o conteúdo
      </a>

      <Header />

      <main id="conteudo">
        <Hero />

        {(storage.status === 'unavailable' ||
          storage.status === 'corrupted' ||
          storage.discardedCount > 0 ||
          storageMessage) && (
          <div className="mx-auto max-w-6xl space-y-3 px-4 pt-8 sm:px-6">
            {storage.status === 'unavailable' && (
              <p
                role="alert"
                className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800"
              >
                Não foi possível acessar o armazenamento do navegador, então
                seus roteiros salvos não puderam ser exibidos. Verifique as
                configurações de privacidade do navegador e recarregue a
                página. Nenhum dado foi alterado.
              </p>
            )}

            {storage.status === 'corrupted' && (
              <div
                role="alert"
                className="rounded-xl border border-amber-200 bg-amber-50 p-5"
              >
                <p className="text-sm text-amber-800">
                  Encontramos dados de roteiros salvos que não puderam ser
                  lidos. Eles não foram alterados nem apagados. Se preferir,
                  você pode descartá-los — uma cópia de segurança será mantida
                  neste navegador.
                </p>
                <button
                  type="button"
                  onClick={handleDiscardCorrupted}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Descartar dados ilegíveis
                </button>
              </div>
            )}

            {storage.discardedCount > 0 && (
              <p
                role="alert"
                className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800"
              >
                {storage.discardedCount}{' '}
                {storage.discardedCount === 1
                  ? 'roteiro salvo foi ignorado'
                  : 'roteiros salvos foram ignorados'}{' '}
                por conter dados inválidos. Os demais registros não foram
                afetados.
              </p>
            )}

            {storageMessage && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
              >
                {storageMessage}
              </p>
            )}
          </div>
        )}

        <PlanningForm
          destinationId={destinationId}
          onDestinationChange={setDestinationId}
          onItineraryGenerated={onItineraryGenerated}
        />
        <SavedItineraries
          saved={storage.records}
          onOpen={onOpenSaved}
          onRemove={handleRemoveSaved}
        />
        <DestinationsSection
          selectedDestinationId={destinationId}
          onSelectDestination={handleSelectDestination}
        />
        <HowItWorks />
      </main>

      <Footer />
    </div>
  )
}
