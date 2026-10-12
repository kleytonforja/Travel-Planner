import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'

import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { PlanningFlow } from '../components/planning/PlanningFlow'
import type { PlanningDraft } from '../components/planning/planningSteps'
import { Button } from '../components/ui/Button'
import type { Itinerary } from '../types'

interface PlanningPageProps {
  draft: PlanningDraft
  onDraftChange: (patch: Partial<PlanningDraft>) => void
  onBackHome: () => void
  onUseLegacyForm: () => void
  onItineraryGenerated: (itinerary: Itinerary) => void
}

/** Página do planejamento progressivo (V1-T3): hoje, apenas a etapa de destino. */
export function PlanningPage({
  draft,
  onDraftChange,
  onBackHome,
  onUseLegacyForm,
  onItineraryGenerated,
}: PlanningPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Pular para o conteúdo
      </a>
      <Header tone="dark" hideNav onHomeClick={onBackHome} />

      <main id="conteudo" className="bg-night-gradient text-night-ink">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
          <div className="mb-6">
            <Button variant="onDark" onClick={onBackHome}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Voltar para o início
            </Button>
          </div>
          <PlanningFlow
            draft={draft}
            onDraftChange={onDraftChange}
            onUseLegacyForm={onUseLegacyForm}
            onItineraryGenerated={onItineraryGenerated}
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}
