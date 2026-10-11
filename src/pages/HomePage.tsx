import { useState } from 'react'

import { DestinationsSection } from '../components/DestinationsSection'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { HowItWorks } from '../components/HowItWorks'
import { PlanningForm } from '../components/PlanningForm'
import { SavedItineraries } from '../components/SavedItineraries'
import { downloadRecoveryJson } from '../services/itineraryExport'
import {
  CORRUPTED_BACKUP_KEY,
  discardQuarantineCopy,
  loadQuarantine,
  loadSavedItineraries,
  previewRecovery,
  recoverCorruptedStorage,
  removeSavedItinerary,
  restoreQuarantineCopy,
  type QuarantineLoadResult,
  type RecoveryPreview,
  type StorageLoadResult,
} from '../services/itineraryStorage'
import type { Itinerary, SavedItinerary } from '../types'

interface HomePageProps {
  /** Chamado quando o formulário gera um roteiro com sucesso. */
  onItineraryGenerated: (itinerary: Itinerary) => void
  /** Chamado quando o usuário reabre um roteiro salvo. */
  onOpenSaved: (saved: SavedItinerary) => void
}

/** Pré-visualização de recuperação pronta para confirmação. */
type RecoveryPreviewReady = Extract<RecoveryPreview, { status: 'corrupted' }>

/**
 * Página inicial do Travel Planner.
 *
 * Mantém o destino selecionado para que os cards de destino e o
 * formulário de planejamento fiquem sincronizados, e lista os roteiros
 * salvos no navegador para reabertura ou exclusão.
 *
 * Persistência segura (plano de remediação, P2): as mutações são
 * assíncronas e coordenadas por Web Locks; a exclusão é vinculada ao
 * conteúdo bruto observado; coleções corrompidas bloqueiam escritas
 * normais e só são recuperadas por ação explícita com confirmação
 * (preservação comprovada na quarentena antes de qualquer alteração);
 * a cópia de segurança pode ser baixada, restaurada (somente sem
 * roteiros ativos) ou descartada definitivamente, sempre com
 * confirmação vinculada ao próprio conteúdo.
 */
export function HomePage({ onItineraryGenerated, onOpenSaved }: HomePageProps) {
  const [destinationId, setDestinationId] = useState('')
  const [storage, setStorage] = useState<StorageLoadResult>(() =>
    loadSavedItineraries(),
  )
  const [quarantine, setQuarantine] = useState<QuarantineLoadResult>(() =>
    loadQuarantine(),
  )
  const [storageMessage, setStorageMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [recoveryPreview, setRecoveryPreview] =
    useState<RecoveryPreviewReady | null>(null)
  const [confirmingRestore, setConfirmingRestore] = useState(false)
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)

  function reloadSaved() {
    setStorage(loadSavedItineraries())
    setQuarantine(loadQuarantine())
  }

  function handleSelectDestination(id: string) {
    setDestinationId(id)
    document.getElementById('planejar')?.scrollIntoView({ behavior: 'smooth' })
  }

  async function handleRemoveSaved(id: string) {
    setBusy(true)
    try {
      // A exclusão é vinculada ao conteúdo bruto observado nesta leitura.
      const result = await removeSavedItinerary(id, { expectedRaw: storage.raw })
      setStorageMessage(result.ok ? null : result.message)
      // Nova leitura sempre que uma mutação termina: só ela permite
      // decidir o próximo passo com segurança (inclusive no incerto).
      reloadSaved()
    } finally {
      setBusy(false)
    }
  }

  function handlePreviewRecovery() {
    const preview = previewRecovery()
    if (preview.status === 'corrupted') {
      setStorageMessage(null)
      setRecoveryPreview(preview)
      return
    }
    if (preview.status === 'unavailable') {
      setStorageMessage(
        'Não foi possível acessar o armazenamento do navegador para analisar a recuperação. Nenhuma alteração foi feita.',
      )
      return
    }
    // O conteúdo mudou desde a exibição: recarregar antes de decidir.
    setStorageMessage(
      'Os dados dos roteiros mudaram desde a última leitura. A lista foi recarregada — analise novamente antes de confirmar.',
    )
    reloadSaved()
  }

  async function handleConfirmRecovery() {
    if (!recoveryPreview) return
    setBusy(true)
    try {
      const result = await recoverCorruptedStorage(recoveryPreview.raw)
      setStorageMessage(result.ok ? null : result.message)
      setRecoveryPreview(null)
      reloadSaved()
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirmRestore() {
    if (quarantine.status !== 'occupied') return
    const expectedRaw = quarantine.raw
    setBusy(true)
    try {
      const result = await restoreQuarantineCopy(expectedRaw)
      setStorageMessage(result.ok ? null : result.message)
      setConfirmingRestore(false)
      reloadSaved()
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirmDiscardQuarantine() {
    if (quarantine.status !== 'occupied') return
    const expectedRaw = quarantine.raw
    setBusy(true)
    try {
      const result = await discardQuarantineCopy(expectedRaw)
      setStorageMessage(result.ok ? null : result.message)
      setConfirmingDiscard(false)
      reloadSaved()
    } finally {
      setBusy(false)
    }
  }

  function handleDownloadQuarantine() {
    if (quarantine.status !== 'occupied') return
    // Disparar o download não prova que o arquivo foi guardado.
    downloadRecoveryJson(quarantine.raw, CORRUPTED_BACKUP_KEY)
  }

  const actionsDisabled = busy || storage.status !== 'ok'

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Pular para o conteúdo
      </a>

      <Header />

      <main id="conteudo">
        <Hero />

        {(storage.status === 'unavailable' ||
          storage.status === 'corrupted' ||
          quarantine.status === 'occupied' ||
          storageMessage) && (
          <div className="mx-auto max-w-6xl space-y-3 px-4 pt-8 sm:px-6">
            {storage.status === 'unavailable' && (
              <p
                role="alert"
                className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800"
              >
                Não foi possível acessar o armazenamento do navegador, então
                seus roteiros salvos não puderam ser exibidos. Verifique as
                configurações de privacidade do navegador e recarregue a
                página. Nenhum dado foi alterado.
              </p>
            )}

            {storage.status === 'corrupted' && (
              <div
                role="alert"
                className="rounded-xl border border-amber-200 bg-amber-50 p-5"
              >
                <p className="text-sm text-amber-800">
                  Encontramos dados de roteiros salvos que não puderam ser
                  validados. Eles não foram alterados nem apagados, e as
                  alterações estão bloqueadas até a recuperação. Você pode
                  preservar uma cópia de segurança neste navegador e recuperar
                  os registros válidos.
                </p>

                {!recoveryPreview ? (
                  <button
                    type="button"
                    onClick={handlePreviewRecovery}
                    disabled={busy}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Preservar cópia e recuperar registros válidos
                  </button>
                ) : (
                  <div className="mt-3 rounded-lg border border-amber-300 bg-white p-4">
                    <p className="text-sm font-semibold text-amber-900">
                      Confirmar recuperação
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-amber-800">
                      <li>
                        {recoveryPreview.recoverableCount}{' '}
                        {recoveryPreview.recoverableCount === 1
                          ? 'registro válido será recuperado'
                          : 'registros válidos serão recuperados'}
                        .
                      </li>
                      <li>
                        {recoveryPreview.backupOnlyCount}{' '}
                        {recoveryPreview.backupOnlyCount === 1
                          ? 'registro ilegível permanecerá'
                          : 'registros ilegíveis permanecerão'}{' '}
                        apenas na cópia de segurança.
                      </li>
                      {recoveryPreview.idsToFixCount > 0 && (
                        <li>
                          {recoveryPreview.idsToFixCount}{' '}
                          {recoveryPreview.idsToFixCount === 1
                            ? 'registro com identificador duplicado receberá'
                            : 'registros com identificadores duplicados receberão'}{' '}
                          novos identificadores.
                        </li>
                      )}
                    </ul>
                    {recoveryPreview.recoverableCount === 0 && (
                      <p className="mt-2 text-sm font-semibold text-amber-900">
                        Nenhum registro poderá ser recuperado: a lista de
                        roteiros ficará vazia e o conteúdo original
                        permanecerá na cópia de segurança (quarentena).
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmRecovery}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Confirmar recuperação
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecoveryPreview(null)}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {quarantine.status === 'occupied' && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-700">
                  Existe uma cópia de segurança de dados anteriores guardada
                  neste navegador (quarentena). Você pode baixá-la para
                  guardá-la fora do navegador
                  {storage.status === 'empty' &&
                    ', restaurar os registros válidos dela'}{' '}
                  ou descartá-la definitivamente.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadQuarantine}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Baixar cópia de segurança
                  </button>
                  {storage.status === 'empty' && !confirmingRestore && (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingDiscard(false)
                        setConfirmingRestore(true)
                      }}
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Restaurar registros da cópia
                    </button>
                  )}
                  {!confirmingDiscard && (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingRestore(false)
                        setConfirmingDiscard(true)
                      }}
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Descartar cópia definitivamente
                    </button>
                  )}
                </div>

                {confirmingRestore && (
                  <div className="mt-3 rounded-lg border border-slate-300 bg-white p-4">
                    <p className="text-sm text-slate-700">
                      Restaurar os registros válidos da cópia de segurança
                      para a lista de roteiros salvos? A cópia será mantida na
                      quarentena.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmRestore}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Confirmar restauração
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingRestore(false)}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {confirmingDiscard && (
                  <div
                    role="alert"
                    className="mt-3 rounded-lg border border-red-300 bg-red-50 p-4"
                  >
                    <p className="text-sm text-red-800">
                      O descarte é definitivo: a cópia de segurança será
                      removida deste navegador e não poderá ser recuperada.
                      Seus roteiros ativos não serão alterados.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmDiscardQuarantine}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Confirmar descarte definitivo
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDiscard(false)}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {storageMessage && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
              >
                {storageMessage}
              </p>
            )}
          </div>
        )}

        <PlanningForm
          destinationId={destinationId}
          onDestinationChange={setDestinationId}
          onItineraryGenerated={onItineraryGenerated}
        />
        <SavedItineraries
          saved={storage.records}
          onOpen={onOpenSaved}
          onRemove={handleRemoveSaved}
          actionsDisabled={actionsDisabled}
        />
        <DestinationsSection
          selectedDestinationId={destinationId}
          onSelectDestination={handleSelectDestination}
        />
        <HowItWorks />
      </main>

      <Footer />
    </div>
  )
}
