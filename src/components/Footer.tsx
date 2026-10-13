import { Plane } from 'lucide-react'

import { DESTINATION_PHOTOS, HERO_PHOTO } from '../data/photos'

const PHOTO_CREDITS = [
  { label: 'capa', credit: HERO_PHOTO.credit },
  { label: 'Florianópolis', credit: DESTINATION_PHOTOS.florianopolis.credit },
  { label: 'Rio de Janeiro', credit: DESTINATION_PHOTOS['rio-de-janeiro'].credit },
  { label: 'Lisboa', credit: DESTINATION_PHOTOS.lisboa.credit },
] as const

/**
 * Ano exibido no rodapé. Calculado uma única vez no carregamento do módulo
 * (fora da renderização) para manter os componentes puros.
 */
const CURRENT_YEAR = new Date().getFullYear()

/** Rodapé da aplicação. */
export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Plane className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-base font-bold text-slate-900">
              Travel Planner
            </span>
          </div>

          <nav aria-label="Navegação do rodapé">
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <li>
                <a
                  href="#planejar"
                  className="text-sm text-slate-600 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Planejar
                </a>
              </li>
              <li>
                <a
                  href="#destinos"
                  className="text-sm text-slate-600 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Destinos
                </a>
              </li>
              <li>
                <a
                  href="#como-funciona"
                  className="text-sm text-slate-600 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Como funciona
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <aside
          aria-label="Aviso de demonstração experimental"
          className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900"
        >
          <p>
            Demonstração experimental. Os roteiros ficam armazenados somente
            neste navegador e podem ser perdidos. Não existe sincronização nem
            garantia de preservação permanente. Exporte o JSON para guardar
            uma cópia e, se precisar, use "Importar roteiro" na página
            inicial para recuperá-la. A importação aceita apenas arquivos
            exportados por este aplicativo e nunca substitui um roteiro salvo
            sem a sua confirmação.
          </p>
        </aside>

        <p className="mt-6 border-t border-slate-200 pt-6 text-sm text-slate-500">
          Custos e durações exibidos são valores ilustrativos para fins de
          demonstração e não representam cotações, horários oficiais ou
          disponibilidade real de serviços.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Fotografias via{' '}
          <a
            href="https://unsplash.com/license"
            target="_blank"
            rel="noopener noreferrer"
            className="underline focus-ring"
          >
            Unsplash
          </a>
          : {PHOTO_CREDITS.map(({ label, credit }, index) => (
            <span key={credit.sourceUrl}>
              {index > 0 && ', '}
              <a
                href={credit.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline focus-ring"
              >
                {credit.photographer}
              </a>{' '}
              ({label})
            </span>
          ))}
          .
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Fotografias das atrações (Rio de Janeiro, Florianópolis e Lisboa): Wikimedia Commons (licenças CC0, CC BY e CC BY-SA); os
          créditos de cada foto aparecem no roteiro.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          © {CURRENT_YEAR} Travel Planner. Projeto de código aberto.
        </p>
      </div>
    </footer>
  )
}
