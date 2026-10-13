import { ACTIVITY_PHOTOS } from '../data/activityPhotos'
import type { ItineraryDay } from '../types'
import { Disclosure } from './ui/Disclosure'

interface ActivityPhotoCreditsProps {
  days: ItineraryDay[]
}

/**
 * Créditos das fotografias das atrações exibidas no roteiro (M5.3): autor, fonte, licença (com link) e
 * alterações. Aparece só quando há ao menos uma fotografia no roteiro; cada foto é listada uma vez.
 */
export function ActivityPhotoCredits({ days }: ActivityPhotoCreditsProps) {
  const seen = new Set<string>()
  const entries = days
    .flatMap((day) => day.activities)
    .map((item) => item.activity)
    .filter((activity) => {
      if (!ACTIVITY_PHOTOS[activity.id] || seen.has(activity.id)) return false
      seen.add(activity.id)
      return true
    })
  if (entries.length === 0) return null

  return (
    <section aria-label="Créditos das fotografias" className="mt-4">
      <Disclosure title="Créditos das fotografias" summary={`${entries.length}`} tone="onLight">
        <p className="text-sm text-slate-600">
          Fotografias do Wikimedia Commons, usadas conforme a licença de cada arquivo. Foram recortadas e
          convertidas para WebP; nas licenças CC BY-SA, as versões derivadas permanecem sob a mesma licença.
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
          {entries.map((activity) => {
            const { credit } = ACTIVITY_PHOTOS[activity.id]
            return (
              <li key={activity.id}>
                <span className="font-semibold">{activity.name}:</span> foto de {credit.author} (
                <a href={credit.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline focus-ring">
                  fonte
                </a>
                ), licença{' '}
                <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline focus-ring">
                  {credit.license}
                </a>
                . {credit.changes}
              </li>
            )
          })}
        </ul>
      </Disclosure>
    </section>
  )
}
