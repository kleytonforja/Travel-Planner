import { useState } from 'react'

import { EMPTY_DRAFT, type PlanningDraft } from './components/planning/planningSteps'
import { HomePage } from './pages/HomePage'
import { ItineraryPage } from './pages/ItineraryPage'
import { PlanningPage } from './pages/PlanningPage'
import type { Itinerary, SavedItinerary } from './types'

/**
 * Componente raiz da aplicação.
 *
 * A navegação entre a página inicial, o planejamento progressivo e a página
 * do roteiro é feita por estado interno, sem roteador (ver DECISIONS.md, D8).
 * O rascunho do planejamento (todas as etapas) vive aqui, apenas em memória,
 * para ser preservado ao alternar entre a home e o planejamento na mesma sessão.
 */
type View =
  | { name: 'home' }
  | { name: 'planning' }
  | { name: 'itinerary'; itinerary: Itinerary; saved: SavedItinerary | null }

function App() {
  const [view, setView] = useState<View>({ name: 'home' })
  const [draft, setDraft] = useState<PlanningDraft>(EMPTY_DRAFT)

  function updateDraft(patch: Partial<PlanningDraft>) {
    setDraft((current) => ({ ...current, ...patch }))
  }

  function handleItineraryGenerated(itinerary: Itinerary) {
    setView({ name: 'itinerary', itinerary, saved: null })
  }

  function handleOpenSaved(saved: SavedItinerary) {
    setView({ name: 'itinerary', itinerary: saved.itinerary, saved })
  }

  function handleNewPlanning() {
    setView({ name: 'home' })
    window.scrollTo(0, 0)
  }

  if (view.name === 'itinerary') {
    return (
      <ItineraryPage
        itinerary={view.itinerary}
        saved={view.saved}
        onNewPlanning={handleNewPlanning}
      />
    )
  }

  if (view.name === 'planning') {
    return (
      <PlanningPage
        draft={draft}
        onDraftChange={updateDraft}
        onBackHome={handleNewPlanning}
        onItineraryGenerated={handleItineraryGenerated}
      />
    )
  }

  return (
    <HomePage
      onOpenSaved={handleOpenSaved}
      initialDestinationId={draft.destinationId}
      onDestinationChange={(id) => updateDraft({ destinationId: id })}
      onStartPlanning={() => setView({ name: 'planning' })}
    />
  )
}

export default App
