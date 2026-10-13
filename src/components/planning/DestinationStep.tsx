import { MapPin } from 'lucide-react'
import { useId, useMemo, useState } from 'react'

import { destinations } from '../../data/destinations'
import {
  ALL_FILTER,
  buildFilterOptions,
  filterDestinations,
  filterKey,
  type DestinationFilter,
  type FilterOption,
} from '../../utils/destinationSearch'
import { DestinationCard } from '../DestinationCard'
import { Button } from '../ui/Button'
import { Disclosure } from '../ui/Disclosure'
import { SearchField } from '../ui/SearchField'
import { CATEGORY_STYLES } from '../ui/variants'
import type { StepProps } from './planningSteps'

const CHIP_BASE =
  'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-ring-on-dark'
const CHIP_IDLE = 'bg-night-900/70 text-night-ink ring-1 ring-white/25 hover:bg-white/15'
const CHIP_ACTIVE = 'bg-brand-600 text-white ring-1 ring-brand-600'

interface FilterChipsProps {
  caption: string
  options: FilterOption[]
  activeKey: string
  onSelect: (filter: DestinationFilter) => void
}

/** Grupo rotulado de filtros (localização ou categoria dos destinos). */
function FilterChips({ caption, options, activeKey, onSelect }: FilterChipsProps) {
  const captionId = useId()
  return (
    <div role="group" aria-labelledby={captionId} className="flex flex-wrap items-center gap-2">
      <span
        id={captionId}
        className="mr-1 text-xs font-semibold uppercase tracking-wide text-night-ink-muted"
      >
        {caption}
      </span>
      {options.map((option) => {
        const category = option.filter.kind === 'category' ? option.filter.value : null
        const CategoryIcon = category ? CATEGORY_STYLES[category].icon : null
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={option.key === activeKey}
            onClick={() => onSelect(option.filter)}
            className={`${CHIP_BASE} ${option.key === activeKey ? CHIP_ACTIVE : CHIP_IDLE}`}
          >
            {category && CategoryIcon ? (
              <span
                aria-hidden="true"
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${CATEGORY_STYLES[category].tone}`}
              >
                <CategoryIcon className="h-3 w-3" />
              </span>
            ) : (
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Etapa 1 do planejamento progressivo: "Para onde vamos viajar?".
 * Pesquisa e filtra os destinos do catálogo local e permite selecionar um
 * por mouse, teclado ou toque (os próprios botões dos cards).
 */
export function DestinationStep({ draft, onDraftChange }: StepProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<DestinationFilter>(ALL_FILTER)
  const options = useMemo(() => buildFilterOptions(destinations), [])
  const results = useMemo(() => filterDestinations(destinations, query, filter), [query, filter])
  const activeKey = filterKey(filter)
  const locationOptions = options.filter((option) => option.filter.kind !== 'category')
  const categoryOptions = options.filter((option) => option.filter.kind === 'category')
  const hasRefinement = query.trim() !== '' || activeKey !== 'all'

  function clearAll() {
    setQuery('')
    setFilter(ALL_FILTER)
  }

  return (
    <section aria-labelledby="etapa-destino-titulo">
      <h1
        id="etapa-destino-titulo"
        className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
      >
        Para onde vamos viajar?
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-night-ink">
        Escolha um destino da nossa base ou pesquise por cidade, país ou tipo de
        experiência.
      </p>

      <div className="mt-6 max-w-3xl">
        <SearchField
          label="Buscar destino"
          hideLabel
          tone="onDark"
          value={query}
          onChange={setQuery}
          placeholder="Buscar destino, país ou categoria"
        />
      </div>

      <div className="mt-4">
        <Disclosure
          title="Filtros"
          summary={activeKey === 'all' ? undefined : '1 filtro ativo'}
          defaultOpen={activeKey !== 'all'}
        >
          <div role="group" aria-label="Filtrar destinos" className="space-y-3">
            <FilterChips
              caption="Localização"
              options={locationOptions}
              activeKey={activeKey}
              onSelect={setFilter}
            />
            <FilterChips
              caption="Categorias dos destinos"
              options={categoryOptions}
              activeKey={activeKey}
              onSelect={setFilter}
            />
            <p className="text-xs text-night-ink-muted">
              Estes controles apenas filtram os destinos listados abaixo. Os seus
              interesses de viagem serão escolhidos em uma etapa própria.
            </p>
          </div>
        </Disclosure>
      </div>

      <p role="status" aria-live="polite" className="mt-5 text-sm text-night-ink-muted">
        {results.length === 0
          ? 'Nenhum destino encontrado para a sua busca.'
          : `${results.length} ${results.length === 1 ? 'destino encontrado' : 'destinos encontrados'}.`}
      </p>

      {results.length === 0 ? (
        <div className="mt-4">
          <Button variant="onDark" onClick={clearAll}>
            Limpar pesquisa e filtros
          </Button>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {results.map((destination) => (
            <DestinationCard
              key={destination.id}
              destination={destination}
              compact
              selected={destination.id === draft.destinationId}
              onSelect={(id) => onDraftChange({ destinationId: id })}
            />
          ))}
        </div>
      )}

      {hasRefinement && results.length > 0 && (
        <div className="mt-4">
          <Button variant="onDark" size="md" onClick={clearAll}>
            Limpar pesquisa e filtros
          </Button>
        </div>
      )}
    </section>
  )
}
