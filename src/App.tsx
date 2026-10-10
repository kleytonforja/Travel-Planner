import { useState } from 'react'

import { HomePage } from './pages/HomePage'
import { ItineraryPage } from './pages/ItineraryPage'
import type { Itinerary, SavedItinerary } from './types'

/**
 * Componente raiz da aplicação.
 *
 * A navegação entre a página inicial e a página do roteiro é feita por
 * estado interno, sem roteador (ver DECISIONS.md, D8).
 */
type View =
  | { name: 'home' }
  | { name: 'itinerary'; itinerary: Itinerary; saved: SavedItinerary | null }

function App() {
  const [view, setView] = useState<View>({ name: 'home' })

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

  return (
    <HomePage
      onItineraryGenerated={handleItineraryGenerated}
      onOpenSaved={handleOpenSaved}
    />
  )
}

export default App
