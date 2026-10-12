import { FileUp } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'

import { destinations } from '../data/destinations'
import { INTEREST_LABELS, STYLE_LABELS } from '../data/labels'
import {
  IMPORT_MAX_FILE_BYTES,
  parseItineraryImport,
} from '../services/itineraryImport'
import {
  saveItinerary,
  type ReplaceConfirmation,
  type StorageLoadStatus,
} from '../services/itineraryStorage'
import type { Itinerary } from '../types'
import { formatCurrency, formatDateTime } from '../utils/format'

interface ImportItineraryProps {
  /** Estado da leitura do armazenamento: só 'ok' e 'empty' permitem importar. */
  storageStatus: StorageLoadStatus
  /**
   * Conteúdo bruto da chave principal observado pela página. Uma
   * confirmação de substituição só vale enquanto este conteúdo for o
   * mesmo que o serviço observou ao pedi-la.
   */
  storageRaw: string | null
  /** Outra operação da página está em andamento (bloqueia a importação). */
  externalBusy: boolean
  /** Informa à página o início e o fim de uma gravação (bloqueio de ações concorrentes). */
  onBusyChange: (busy: boolean) => void
  /** A página deve reler o armazenamento (chamado ao fim de toda tentativa de gravação). */
  onStorageChanged: () => void
}

interface PreviewState {
  fileName: string
  itinerary: Itinerary
}

interface ErrorState {
  message: string
  details: string[]
}

const MAX_FILE_NAME_LENGTH = 60

const OVERSIZE_MESSAGE = `O arquivo é maior que o limite de ${IMPORT_MAX_FILE_BYTES / 1024} KB e não foi lido. Nada foi importado.`
const READ_FAILURE_MESSAGE =
  'Não foi possível ler o arquivo selecionado. Nada foi importado.'
const STALE_PENDING_MESSAGE =
  'Os roteiros salvos mudaram desde a análise. A confirmação de substituição foi cancelada por segurança; confirme a importação novamente para reavaliar.'

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

function shortFileName(name: string): string {
  return name.length > MAX_FILE_NAME_LENGTH
    ? `${name.slice(0, MAX_FILE_NAME_LENGTH)}…`
    : name
}

const SECONDARY_BUTTON =
  'inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50'

/**
 * Importação de um roteiro exportado anteriormente (JSON).
 *
 * Fluxo: escolher arquivo → validar (`parseItineraryImport`, sem
 * escrita) → pré-visualizar → confirmar → gravar EXCLUSIVAMENTE por
 * `saveItinerary`. Nada é gravado antes da confirmação; o roteiro
 * importado vira um registro NOVO (identificador e data de gravação são
 * gerados na importação; os do arquivo nunca são usados) e um
 * planejamento equivalente já salvo só é substituído mediante
 * confirmação vinculada ao conteúdo observado pelo serviço. O sucesso é
 * exibido somente quando o serviço confirmou a gravação por releitura.
 */
export function ImportItinerary({
  storageStatus,
  storageRaw,
  externalBusy,
  onBusyChange,
  onStorageChanged,
}: ImportItineraryProps) {
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const [pending, setPending] = useState<ReplaceConfirmation | null>(null)
  const [error, setError] = useState<ErrorState | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const [saving, setSaving] = useState(false)
  const requestId = useRef(0)
  const previewHeading = useRef<HTMLHeadingElement>(null)

  const canImport = storageStatus === 'ok' || storageStatus === 'empty'
  const blocked = externalBusy || reading || saving

  // Leva o foco à pré-visualização para que leitores de tela a anunciem.
  useEffect(() => {
    if (preview) previewHeading.current?.focus()
  }, [preview])

  // Autorização pendente só vale para o conteúdo que o serviço observou:
  // se a página passou a observar outro conteúdo, ela é descartada na
  // própria renderização (ajuste de estado derivado, sem efeito).
  if (pending && !saving && pending.expectedRaw !== storageRaw) {
    setPending(null)
    setError({ message: STALE_PENDING_MESSAGE, details: [] })
  }

  function reset() {
    requestId.current += 1
    setPreview(null)
    setPending(null)
    setError(null)
    setSuccess(null)
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target
    const file = input.files?.[0]
    // Permite escolher o mesmo arquivo novamente depois.
    input.value = ''
    reset()
    if (!file) return

    if (file.size > IMPORT_MAX_FILE_BYTES) {
      setError({ message: OVERSIZE_MESSAGE, details: [] })
      return
    }

    const currentRequest = requestId.current
    setReading(true)
    try {
      const content = await readFileAsText(file)
      if (currentRequest !== requestId.current) return
      const result = parseItineraryImport(content)
      if (!result.ok) {
        setError({ message: result.message, details: result.details })
        return
      }
      setPreview({ fileName: file.name, itinerary: result.itinerary })
    } catch {
      if (currentRequest === requestId.current) {
        setError({ message: READ_FAILURE_MESSAGE, details: [] })
      }
    } finally {
      if (currentRequest === requestId.current) setReading(false)
    }
  }

  async function runImport(confirmation?: ReplaceConfirmation) {
    if (!preview || saving || externalBusy || !canImport) return
    const { itinerary } = preview
    setSaving(true)
    onBusyChange(true)
    setSuccess(null)
    try {
      const result = await saveItinerary(itinerary, confirmation)
      if (result.ok) {
        const destination = destinations.find(
          (item) => item.id === itinerary.input.destinationId,
        )
        const days = itinerary.input.days
        setError(null)
        setPending(null)
        setPreview(null)
        setSuccess(
          `${confirmation ? 'Substituição' : 'Importação'} concluída e confirmada: roteiro de ${
            destination?.name ?? 'destino'
          }, ${days} ${days === 1 ? 'dia' : 'dias'}. A gravação foi confirmada neste navegador, como ${
            confirmation ? 'substituição do registro selecionado' : 'um novo registro'
          } com a data e a hora desta importação.`,
        )
        onStorageChanged()
        return
      }
      if (result.outcome === 'needs-confirmation') {
        setError(null)
        setPending(result.confirmation)
        // Sincroniza a página com o conteúdo que o serviço observou.
        onStorageChanged()
        return
      }
      // Falha ou resultado incerto: nenhuma autorização é reaproveitada.
      setPending(null)
      setError({ message: result.message, details: [] })
      // Resultado incerto: a gravação pode ter ocorrido; não se
      // reaproveita a pré-visualização — recarregar e analisar de novo.
      if (result.outcome === 'uncertain') setPreview(null)
      onStorageChanged()
    } finally {
      setSaving(false)
      onBusyChange(false)
    }
  }

  const previewDestination = preview
    ? destinations.find((item) => item.id === preview.itinerary.input.destinationId)
    : undefined
  const activityCount = preview
    ? preview.itinerary.days.reduce((sum, day) => sum + day.activities.length, 0)
    : 0

  return (
    <section
      id="importar-roteiro"
      aria-labelledby="importar-roteiro-titulo"
      className="scroll-mt-20 bg-slate-50"
    >
      <div className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2
            id="importar-roteiro-titulo"
            className="flex items-center gap-2 text-lg font-bold text-slate-900"
          >
            <FileUp className="h-5 w-5 text-blue-600" aria-hidden="true" />
            Importar roteiro
          </h2>
          <p id="importar-roteiro-ajuda" className="mt-2 text-sm text-slate-600">
            Recupere um roteiro exportado anteriormente por este aplicativo
            (arquivo JSON de até {IMPORT_MAX_FILE_BYTES / 1024} KB). Nada é
            salvo antes da sua confirmação e nenhum roteiro existente é
            substituído sem pedir a sua permissão.
          </p>

          {!canImport && (
            <p className="mt-3 text-sm text-amber-800">
              A importação está indisponível enquanto os roteiros salvos não
              puderem ser lidos ou precisarem de recuperação. Veja os avisos no
              topo da página.
            </p>
          )}

          <div className="mt-4">
            <label
              htmlFor="importar-roteiro-arquivo"
              className="block text-sm font-semibold text-slate-800"
            >
              Arquivo do roteiro (JSON)
            </label>
            <input
              id="importar-roteiro-arquivo"
              type="file"
              accept=".json,application/json"
              aria-describedby="importar-roteiro-ajuda"
              disabled={!canImport || blocked}
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {reading && (
              <p className="mt-2 text-sm text-slate-600" aria-live="polite">
                Lendo e validando o arquivo…
              </p>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              <p>{error.message}</p>
              {error.details.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  {error.details.map((detail, index) => (
                    <li key={`${index}-${detail}`}>{detail}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {success && (
            <p
              role="status"
              className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
            >
              {success}
            </p>
          )}

          {preview && (
            <div
              role="group"
              aria-labelledby="importar-roteiro-previa"
              className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <h3
                id="importar-roteiro-previa"
                ref={previewHeading}
                tabIndex={-1}
                className="text-base font-bold text-slate-900 focus:outline-none"
              >
                Pré-visualização do roteiro
              </h3>
              <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-slate-700">Arquivo</dt>
                  <dd className="text-slate-600">{shortFileName(preview.fileName)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">Destino</dt>
                  <dd className="text-slate-600">
                    {previewDestination?.name ?? preview.itinerary.input.destinationId}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">Duração</dt>
                  <dd className="text-slate-600">
                    {preview.itinerary.input.days}{' '}
                    {preview.itinerary.input.days === 1 ? 'dia' : 'dias'}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">Estilo</dt>
                  <dd className="text-slate-600">
                    {STYLE_LABELS[preview.itinerary.input.style]}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">Interesses</dt>
                  <dd className="text-slate-600">
                    {preview.itinerary.input.interests
                      .map((interest) => INTEREST_LABELS[interest])
                      .join(', ')}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">Atividades</dt>
                  <dd className="text-slate-600">{activityCount}</dd>
                </div>
                {previewDestination && (
                  <>
                    <div>
                      <dt className="font-semibold text-slate-700">
                        {preview.itinerary.input.budget === undefined
                          ? 'Orçamento'
                          : 'Orçamento informado'}
                      </dt>
                      <dd className="text-slate-600">
                        {preview.itinerary.input.budget === undefined
                          ? 'Orçamento não informado'
                          : formatCurrency(
                              preview.itinerary.input.budget,
                              previewDestination.currency,
                            )}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-700">
                        Custo estimado das atividades (ilustrativo)
                      </dt>
                      <dd className="text-slate-600">
                        {formatCurrency(
                          preview.itinerary.totals.estimatedActivitiesCost,
                          previewDestination.currency,
                        )}
                      </dd>
                    </div>
                  </>
                )}
              </dl>

              {preview.itinerary.warnings.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-slate-700">
                    Avisos do roteiro
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-6 text-sm text-slate-600">
                    {preview.itinerary.warnings.map((warning, index) => (
                      <li key={`${index}-${warning}`}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="mt-3 text-sm text-slate-600">
                Ao confirmar, o roteiro será salvo como um novo registro, com a
                data e a hora desta importação. O identificador e a data do
                arquivo não são usados. Valores e horários são ilustrativos.
              </p>

              {pending ? (
                <div
                  role="alert"
                  className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
                >
                  <p className="text-sm font-semibold text-amber-900">
                    Substituir roteiro salvo?
                  </p>
                  <p className="mt-1 text-sm text-amber-800">
                    Já existe um roteiro salvo com este mesmo planejamento:{' '}
                    {destinations.find(
                      (item) => item.id === pending.target.destinationId,
                    )?.name ?? pending.target.destinationId}
                    , {pending.target.days}{' '}
                    {pending.target.days === 1 ? 'dia' : 'dias'}, salvo em{' '}
                    {formatDateTime(pending.target.savedAt)}. Ao confirmar,
                    somente esse registro será substituído.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => runImport(pending)}
                      disabled={blocked}
                      className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? 'Salvando…' : 'Confirmar substituição'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPending(null)}
                      disabled={blocked}
                      className={SECONDARY_BUTTON}
                    >
                      Cancelar substituição
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => runImport()}
                    disabled={blocked || !canImport}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? 'Salvando…' : 'Confirmar importação'}
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    disabled={blocked}
                    className={SECONDARY_BUTTON}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
