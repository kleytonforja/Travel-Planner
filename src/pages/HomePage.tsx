import { useState } from 'react'

import { DestinationsSection } from '../components/DestinationsSection'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { HowItWorks } from '../components/HowItWorks'
import { PlanningForm } from '../components/PlanningForm'
import { SavedItineraries } from '../components/SavedItineraries'
import {
  loadSavedItineraries,
  removeSavedItinerary,
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
 */
export function HomePage({ onItineraryGenerated, onOpenSaved }: HomePageProps) {
  const [destinationId, setDestinationId] = useState('')
  const [savedItineraries, setSavedItineraries] = useState<SavedItinerary[]>(
    () => loadSavedItineraries(),
  )

  function handleSelectDestination(id: string) {
    setDestinationId(id)
    document.getElementById('planejar')?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleRemoveSaved(id: string) {
    removeSavedItinerary(id)
    setSavedItineraries(loadSavedItineraries())
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
        <PlanningForm
          destinationId={destinationId}
          onDestinationChange={setDestinationId}
          onItineraryGenerated={onItineraryGenerated}
        />
        <SavedItineraries
          saved={savedItineraries}
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
