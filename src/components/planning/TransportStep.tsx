import {
  Bus,
  Car,
  CarTaxiFront,
  CircleHelp,
  Footprints,
  Layers,
  Plane,
  TrainFront,
  TramFront,
  KeyRound,
} from 'lucide-react'
import { useId } from 'react'

import {
  ARRIVAL_MODES,
  chooseArrival,
  LOCAL_MODES,
  MAX_ORIGIN_LENGTH,
  toggleLocal,
  validateOrigin,
  type ArrivalMode,
  type LocalMode,
} from '../../utils/transport'
import { Disclosure } from '../ui/Disclosure'
import { SelectableCard } from '../ui/SelectableCard'
import type { StepProps } from './planningSteps'

const ARRIVAL_ICONS: Record<ArrivalMode, typeof Car> = {
  carro: Car,
  aviao: Plane,
  onibus: Bus,
  trem: TrainFront,
  indefinido: CircleHelp,
}

const LOCAL_ICONS: Record<LocalMode, typeof Car> = {
  'carro-proprio': Car,
  'carro-alugado': KeyRound,
  'taxi-app': CarTaxiFront,
  publico: TramFront,
  caminhada: Footprints,
  combinacao: Layers,
  indefinido: CircleHelp,
}

/**
 * Etapa 4 do planejamento progressivo: "Como você pretende viajar?".
 * Só registra preferências. Não calcula rotas, distâncias nem tarifas e o
 * motor de roteiros atual não as usa (integração prevista no V1-T3.7).
 */
export function TransportStep({ draft, onDraftChange }: StepProps) {
  const transport = draft.transport
  const update = (next: typeof transport) => onDraftChange({ transport: next })
  const originId = useId()
  const origin = validateOrigin(transport.origin)

  return (
    <section aria-labelledby="etapa-transporte-titulo">
      <h1 id="etapa-transporte-titulo" className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Como você pretende viajar?
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-night-ink">
        Conte como você pensa em chegar e se locomover. Tudo aqui é opcional.
      </p>

      <fieldset className="mt-6">
        <legend className="text-lg font-semibold text-white">Como você chegará ao destino?</legend>
        <p className="mt-1 text-sm text-night-ink">Escolha uma opção; clique de novo para remover.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {ARRIVAL_MODES.map((mode) => (
            <SelectableCard
              density="compact"
              key={mode.id}
              label={mode.label}
              icon={ARRIVAL_ICONS[mode.id]}
              selected={transport.arrival === mode.id}
              onClick={() => update(chooseArrival(transport, mode.id))}
            />
          ))}
        </div>
      </fieldset>

      <div className="mt-6">
        <Disclosure
          title="Informar a cidade de origem (opcional)"
          summary={origin.status === 'valid' ? origin.value : undefined}
          defaultOpen={transport.origin.trim() !== ''}
        >
         <div className="mt-6 rounded-card-lg bg-surface p-5 text-ink shadow-card">
          <label htmlFor={originId} className="text-base font-semibold text-ink">
            Cidade de origem (opcional)
          </label>
          <p id={`${originId}-ajuda`} className="text-sm text-ink-muted">
            Texto livre: não é verificado e não calcula distâncias nem preços.
          </p>
          <input
            id={originId}
            type="text"
            autoComplete="off"
            maxLength={MAX_ORIGIN_LENGTH + 20}
            value={transport.origin}
            onChange={(event) => update({ ...transport, origin: event.target.value })}
            aria-invalid={origin.status === 'invalid'}
            aria-describedby={`${originId}-ajuda ${originId}-erro`}
            className={`mt-2 w-full max-w-md rounded-control border bg-surface px-3 py-2.5 text-sm text-ink focus-ring ${origin.status === 'invalid' ? 'border-red-600' : 'border-line-strong'}`}
          />
          <div id={`${originId}-erro`} className="mt-2 min-h-5 text-sm">
            {origin.status === 'invalid' && (
              <p role="alert" className="font-medium text-red-700">
                {origin.message}
              </p>
            )}
          </div>
        </div>
        </Disclosure>
      </div>

      <fieldset className="mt-6">
        <legend className="text-lg font-semibold text-white">
          Como pretende se locomover durante a viagem?
        </legend>
        <p className="mt-1 text-sm text-night-ink">
          Você pode combinar opções. &quot;Ainda não decidi&quot; não se mistura com as outras.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {LOCAL_MODES.map((mode) => (
            <SelectableCard
              density="compact"
              key={mode.id}
              label={mode.label}
              icon={LOCAL_ICONS[mode.id]}
              selected={transport.local.includes(mode.id)}
              onClick={() => update(toggleLocal(transport, mode.id))}
            />
          ))}
        </div>
      </fieldset>

      <p className="mt-4 text-sm text-night-ink-muted">
        Por enquanto, estas preferências são guardadas apenas nesta sessão e ainda não geram
        cálculos de rotas, distâncias ou tarifas, nem mudam as atrações sugeridas.
      </p>
    </section>
  )
}
