import { useEffect, useRef, useState } from 'react'

import {
  EMPTY_DRAFT,
  resolveTripDays,
  type PlanningDraft,
} from './components/planning/planningSteps'
import { HomePage } from './pages/HomePage'
import { ItineraryPage } from './pages/ItineraryPage'
import { PlanningPage } from './pages/PlanningPage'
import type { Itinerary, SavedItinerary } from './types'
import { engineBudgetInput } from './utils/budget'
import { totalTravelers } from './utils/travelers'

/**
 * Componente raiz da aplicação.
 *
 * A navegação entre a página inicial, o planejamento progressivo e a página
 * do roteiro é feita por estado interno, sem roteador (ver DECISIONS.md, D8).
 * O rascunho do planejamento (destino e duração) vive aqui, apenas em memória,
 * para ser preservado ao alternar entre a home e o planejamento na mesma sessão.
 */
type View =
  | { name: 'home' }
  | { name: 'planning' }
  | { name: 'itinerary'; itinerary: Itinerary; saved: SavedItinerary | null }

function App() {
  const [view, setView] = useState<View>({ name: 'home' })
  const [draft, setDraft] = useState<PlanningDraft>(EMPTY_DRAFT)
  // Âncora a rolar depois da próxima troca de tela (sem estado extra).
  const pendingAnchor = useRef<string | null>(null)
  // Estilo e orçamento só pré-preenchem o formulário tradicional depois de passar pelo fluxo progressivo.
  const [prefillBudget, setPrefillBudget] = useState(false)

  useEffect(() => {
    const anchor = pendingAnchor.current
    if (anchor) {
      pendingAnchor.current = null
      document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [view])

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

  function handleUseLegacyForm() {
    pendingAnchor.current = 'planejar'
    setPrefillBudget(true)
    setView({ name: 'home' })
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
        onUseLegacyForm={handleUseLegacyForm}
        onItineraryGenerated={handleItineraryGenerated}
      />
    )
  }

  return (
    <HomePage
      onItineraryGenerated={handleItineraryGenerated}
      onOpenSaved={handleOpenSaved}
      initialDestinationId={draft.destinationId}
      initialDays={resolveTripDays(draft) ?? undefined}
      initialInterests={draft.interests}
      initialStyle={prefillBudget ? draft.budget.style : undefined}
      initialBudget={
        prefillBudget ? engineBudgetInput(draft.budget, totalTravelers(draft.travelers)) || undefined : undefined
      }
      onDestinationChange={(id) => updateDraft({ destinationId: id })}
      onStartPlanning={() => setView({ name: 'planning' })}
    />
  )
}

export default App
