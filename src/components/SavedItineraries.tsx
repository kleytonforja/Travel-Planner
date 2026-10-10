import { FolderOpen, Trash2 } from 'lucide-react'

import { destinations } from '../data/destinations'
import { STYLE_LABELS } from '../data/labels'
import type { SavedItinerary } from '../types'
import { formatCurrency, formatDateTime } from '../utils/format'

interface SavedItinerariesProps {
  saved: SavedItinerary[]
  onOpen: (saved: SavedItinerary) => void
  onRemove: (id: string) => void
}

/**
 * Lista de roteiros salvos no navegador, com reabertura e exclusão.
 * Exibida na página inicial.
 */
export function SavedItineraries({
  saved,
  onOpen,
  onRemove,
}: SavedItinerariesProps) {
  return (
    <section
      id="roteiros-salvos"
      aria-labelledby="roteiros-salvos-titulo"
      className="scroll-mt-20 border-t border-slate-100 bg-slate-50"
    >
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2
          id="roteiros-salvos-titulo"
          className="text-2xl font-bold tracking-tight text-slate-900"
        >
          Meus roteiros salvos
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Os roteiros ficam armazenados apenas no seu navegador
          (LocalStorage).
        </p>

        {saved.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-6 text-sm text-slate-500">
            Nenhum roteiro salvo ainda. Gere um roteiro no formulário acima e
            use o botão "Salvar roteiro" na página de resultado.
          </p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((record) => {
              const destination = destinations.find(
                (item) => item.id === record.itinerary.input.destinationId,
              )
              return (
                <li
                  key={record.id}
                  className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-base font-bold text-slate-900">
                    {destination?.name ?? record.itinerary.input.destinationId}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {record.itinerary.input.days}{' '}
                    {record.itinerary.input.days === 1 ? 'dia' : 'dias'} ·{' '}
                    {STYLE_LABELS[record.itinerary.input.style] ??
                      record.itinerary.input.style}
                    {destination && (
                      <>
                        {' '}
                        ·{' '}
                        {formatCurrency(
                          record.itinerary.totals.estimatedActivitiesCost,
                          destination.currency,
                        )}{' '}
                        em atividades (ilustrativo)
                      </>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Salvo em {formatDateTime(record.savedAt)}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onOpen(record)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      <FolderOpen className="h-4 w-4" aria-hidden="true" />
                      Abrir
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(record.id)}
                      aria-label={`Excluir roteiro de ${destination?.name ?? 'destino'}`}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Excluir
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
