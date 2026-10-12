import { useState } from 'react'

import { DestinationsSection } from '../components/DestinationsSection'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { HowItWorks } from '../components/HowItWorks'
import { ImportItinerary } from '../components/ImportItinerary'
import { PlanningForm } from '../components/PlanningForm'
import { SavedItineraries } from '../components/SavedItineraries'
import { downloadRecoveryJson } from '../services/itineraryExport'
import {
  CORRUPTED_BACKUP_KEY,
  discardQuarantineCopy,
  loadQuarantine,
  loadSavedItineraries,
  previewQuarantineRestore,
  previewRecovery,
  recoverCorruptedStorage,
  removeSavedItinerary,
  restoreQuarantineCopy,
  STORAGE_KEY,
  type QuarantineLoadResult,
  type RecoveryPreview,
  type StorageLoadResult,
} from '../services/itineraryStorage'
import type { InterestCategory, Itinerary, SavedItinerary, TravelStyle } from '../types'

interface HomePageProps {
  /** Chamado quando o formulário gera um roteiro com sucesso. */
  onItineraryGenerated: (itinerary: Itinerary) => void
  /** Chamado quando o usuário reabre um roteiro salvo. */
  onOpenSaved: (saved: SavedItinerary) => void
  /** Destino já escolhido na sessão (por exemplo, no planejamento progressivo). */
  initialDestinationId?: string
  /** Duração em dias já escolhida na sessão (preenche o formulário tradicional). */
  initialDays?: number
  initialInterests?: InterestCategory[]
  initialStyle?: TravelStyle
  initialBudget?: string
  /** Informa a escolha de destino, para que ela seja preservada ao sair da home. */
  onDestinationChange?: (id: string) => void
  /** Abre o planejamento progressivo (botão principal do hero). */
  onStartPlanning?: () => void
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
export function HomePage({
  onItineraryGenerated,
  onOpenSaved,
  initialDestinationId = '',
  initialDays,
  initialInterests,
  initialStyle,
  initialBudget,
  onDestinationChange,
  onStartPlanning,
}: HomePageProps) {
  const [destinationId, setDestinationId] = useState(initialDestinationId)

  function changeDestination(id: string) {
    setDestinationId(id)
    onDestinationChange?.(id)
  }
  const [storage, setStorage] = useState<StorageLoadResult>(() =>
    loadSavedItineraries(),
  )
  const [quarantine, setQuarantine] = useState<QuarantineLoadResult>(() =>
    loadQuarantine(),
  )
  const [storageMessage, setStorageMessage] = useState<string | null>(null)
  /**
   * Feedback de sucesso CONFIRMADO: só é exibido depois que o serviço
   * confirmou a operação por releitura (nunca antes da evidência).
   */
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [recoveryPreview, setRecoveryPreview] =
    useState<RecoveryPreviewReady | null>(null)
  /**
   * Autorização da restauração da quarentena (correção AUD-06 + lacuna
   * de autorização, mesmo padrão do AUD-01): guarda o CONTEÚDO BRUTO
   * exato da cópia e a análise apresentada ao usuário na abertura do
   * painel (quantos registros serão restaurados e quantos receberão
   * novos identificadores) — nunca um simples booleano. O conteúdo
   * capturado é o único enviado ao serviço na confirmação, e a
   * autorização é invalidada quando uma releitura observa conteúdo
   * diferente: se os dados mudarem antes da confirmação, a operação é
   * cancelada sem modificar nenhuma chave.
   */
  const [restoreAuthorization, setRestoreAuthorization] = useState<{
    raw: string
    restoreCount: number
    idsToFixCount: number
  } | null>(null)
  /**
   * Autorização do descarte da quarentena (correção AUD-01): guarda o
   * CONTEÚDO BRUTO exato da cópia apresentada ao usuário quando o painel
   * de confirmação foi aberto — nunca um simples booleano. O conteúdo
   * capturado é o único enviado ao serviço na confirmação, e a
   * autorização é invalidada quando uma releitura observa conteúdo
   * diferente: nenhuma confirmação antiga pode descartar uma cópia nova.
   */
  const [discardAuthorization, setDiscardAuthorization] = useState<
    string | null
  >(null)
  /**
   * Aviso de exportação de recuperação (correção AUD-05): informa que
   * o download foi INICIADO. Disparar o download não prova que o
   * usuário guardou o arquivo — a interface nunca afirma isso.
   */
  const [exportNotice, setExportNotice] = useState<string | null>(null)

  function reloadSaved() {
    const nextStorage = loadSavedItineraries()
    const nextQuarantine = loadQuarantine()
    setStorage(nextStorage)
    setQuarantine(nextQuarantine)
    // Correção AUD-01: se a releitura observa um conteúdo de quarentena
    // diferente do autorizado (ou nenhum), a confirmação em aberto é
    // invalidada — o conteúdo novo nunca substitui o alvo da autorização.
    setDiscardAuthorization((authorized) => {
      if (authorized === null) return null
      const currentRaw =
        nextQuarantine.status === 'occupied' ? nextQuarantine.raw : null
      return currentRaw === authorized ? authorized : null
    })
    // Mesma proteção para a restauração (AUD-06): conteúdo diferente do
    // analisado invalida a confirmação em aberto e fecha o painel.
    setRestoreAuthorization((authorized) => {
      if (authorized === null) return null
      const currentRaw =
        nextQuarantine.status === 'occupied' ? nextQuarantine.raw : null
      return currentRaw === authorized.raw ? authorized : null
    })
  }

  /**
   * Chamado pela importação ao fim de toda tentativa de gravação: relê o
   * armazenamento (a lista só muda se a gravação foi confirmada) e
   * remove um sucesso anterior que já não descreve o estado atual.
   */
  function handleImportSettled() {
    setSuccessMessage(null)
    reloadSaved()
  }

  function handleSelectDestination(id: string) {
    changeDestination(id)
    document.getElementById('planejar')?.scrollIntoView({ behavior: 'smooth' })
  }

  async function handleRemoveSaved(id: string) {
    setBusy(true)
    setSuccessMessage(null)
    try {
      // A exclusão é vinculada ao conteúdo bruto observado nesta leitura.
      const result = await removeSavedItinerary(id, { expectedRaw: storage.raw })
      if (result.ok) {
        setStorageMessage(null)
        setSuccessMessage(
          'Roteiro excluído com sucesso. A remoção foi confirmada neste navegador.',
        )
      } else {
        setStorageMessage(result.message)
      }
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
      setSuccessMessage(null)
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
    setSuccessMessage(null)
    try {
      const result = await recoverCorruptedStorage(recoveryPreview.raw)
      if (result.ok) {
        setStorageMessage(null)
        // Sucesso confirmado por releitura; a preservação da cópia foi
        // comprovada ANTES da escrita principal (criada ou reutilizada
        // por ser idêntica).
        const details: string[] = []
        if (result.backupOnlyCount > 0) {
          details.push(
            `${result.backupOnlyCount} ${
              result.backupOnlyCount === 1
                ? 'registro ilegível permanece'
                : 'registros ilegíveis permanecem'
            } apenas na cópia de segurança`,
          )
        }
        if (result.idsFixedCount > 0) {
          details.push(
            `${result.idsFixedCount} ${
              result.idsFixedCount === 1
                ? 'identificador duplicado foi corrigido'
                : 'identificadores duplicados foram corrigidos'
            }`,
          )
        }
        setSuccessMessage(
          result.recoveredCount === 0
            ? `Recuperação concluída e confirmada: nenhum registro era recuperável, então a lista de roteiros ficou vazia. O conteúdo original foi preservado na cópia de segurança (quarentena) deste navegador.`
            : `Recuperação concluída e confirmada: ${result.recoveredCount} ${
                result.recoveredCount === 1
                  ? 'registro recuperado'
                  : 'registros recuperados'
              }${
                details.length > 0 ? ` (${details.join('; ')})` : ''
              }. O conteúdo original foi preservado na cópia de segurança (quarentena) deste navegador.`,
        )
      } else {
        setStorageMessage(result.message)
      }
      setRecoveryPreview(null)
      reloadSaved()
    } finally {
      setBusy(false)
    }
  }

  /**
   * Abre o painel de restauração VINCULADO ao conteúdo bruto exato da
   * cópia observada neste momento (AUD-06), já com a análise que será
   * apresentada ao usuário (registros restauráveis e IDs a corrigir).
   */
  function handleOpenRestorePanel() {
    setDiscardAuthorization(null)
    setSuccessMessage(null)
    const preview = previewQuarantineRestore()
    if (preview.status === 'ready') {
      setStorageMessage(null)
      setRestoreAuthorization({
        raw: preview.raw,
        restoreCount: preview.restoreCount,
        idsToFixCount: preview.idsToFixCount,
      })
      return
    }
    setRestoreAuthorization(null)
    if (preview.status === 'unavailable') {
      setStorageMessage(
        'Não foi possível acessar a cópia de segurança para analisar a restauração. Nenhuma alteração foi feita.',
      )
      return
    }
    // A cópia mudou desde a exibição: recarregar antes de decidir.
    setStorageMessage(
      'Os dados dos roteiros mudaram desde a última leitura. A lista foi recarregada — analise novamente antes de confirmar.',
    )
    reloadSaved()
  }

  async function handleConfirmRestore() {
    // Correção AUD-06 (mesmo padrão do AUD-01): o serviço recebe o
    // conteúdo bruto EXATO autorizado na abertura do painel — nunca uma
    // releitura posterior do estado. Se o armazenamento mudou desde
    // então, o serviço cancela a operação sem modificar nenhuma chave.
    if (restoreAuthorization === null) return
    const expectedRaw = restoreAuthorization.raw
    setBusy(true)
    setSuccessMessage(null)
    try {
      const result = await restoreQuarantineCopy(expectedRaw)
      if (result.ok) {
        setStorageMessage(null)
        const details =
          result.idsFixedCount > 0
            ? ` (${result.idsFixedCount} ${
                result.idsFixedCount === 1
                  ? 'identificador duplicado foi corrigido'
                  : 'identificadores duplicados foram corrigidos'
              })`
            : ''
        setSuccessMessage(
          `Restauração concluída e confirmada: ${result.restoredCount} ${
            result.restoredCount === 1
              ? 'registro restaurado'
              : 'registros restaurados'
          }${details} para a lista de roteiros salvos. A cópia de segurança permanece na quarentena.`,
        )
      } else {
        setStorageMessage(result.message)
      }
      setRestoreAuthorization(null)
      reloadSaved()
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirmDiscardQuarantine() {
    // Correção AUD-01: o serviço recebe o conteúdo bruto EXATO autorizado
    // na abertura do painel — nunca uma releitura posterior do estado.
    // Se o armazenamento mudou desde então, o serviço cancela a operação.
    if (discardAuthorization === null) return
    const expectedRaw = discardAuthorization
    setBusy(true)
    setSuccessMessage(null)
    try {
      const result = await discardQuarantineCopy(expectedRaw)
      if (result.ok) {
        setStorageMessage(null)
        setSuccessMessage(
          'Cópia de segurança descartada definitivamente deste navegador. A remoção foi confirmada.',
        )
      } else {
        setStorageMessage(result.message)
      }
      setDiscardAuthorization(null)
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

  /**
   * Exportação do conteúdo bruto da principal corrompida (correção
   * AUD-05): permite preservar fora do navegador exatamente o conteúdo
   * observado ANTES da recuperação — inclusive quando não há espaço
   * para criar a quarentena, pois a exportação não grava nada: nenhuma
   * das duas chaves é lida para mutação ou alterada, e a quarentena
   * existente nunca é sobrescrita. O aviso registra apenas o download
   * INICIADO; não há evidência de que o usuário guardou o arquivo.
   */
  function handleDownloadCorruptedRaw() {
    if (storage.status !== 'corrupted' || storage.raw === null) return
    downloadRecoveryJson(storage.raw, STORAGE_KEY)
    setExportNotice(
      'Download do arquivo com o conteúdo bruto iniciado. Verifique a pasta de downloads do navegador: iniciar o download não confirma que o arquivo foi guardado.',
    )
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

      <Header tone="dark" />

      <main id="conteudo">
        {(storage.status === 'unavailable' ||
          storage.status === 'corrupted' ||
          quarantine.status === 'occupied' ||
          storageMessage ||
          successMessage) && (
          <div className="mx-auto max-w-6xl space-y-3 px-4 pt-8 sm:px-6">
            {storage.status === 'unavailable' && (
              <p
                role="alert"
                className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800"
              >
                Não foi possível acessar o armazenamento do navegador, então
                seus roteiros salvos não puderam ser exibidos. Verifique as
                configurações de privacidade do navegador e recarregue a
                página.
                Recarregue os roteiros e verifique o estado real dos dados
                antes de tentar uma alteração.
              </p>
            )}

            {storage.status === 'corrupted' && (
              <div
                role="alert"
                className="rounded-xl border border-amber-200 bg-amber-50 p-5"
              >
                <p className="text-sm text-amber-800">
                  Encontramos dados de roteiros salvos que não puderam ser
                  validados. As alterações estão bloqueadas até a recuperação.
                  Recarregue os roteiros e verifique o estado real dos dados
                  antes de tentar outra operação. Você pode
                  baixar o conteúdo bruto para guardá-lo fora do navegador,
                  preservar uma cópia de segurança neste navegador e recuperar
                  os registros válidos.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {/* Correção AUD-05: exportação do conteúdo bruto da
                      principal corrompida, disponível inclusive quando
                      não há espaço para criar a quarentena (a exportação
                      não grava nada no armazenamento). */}
                  {storage.raw !== null && (
                    <button
                      type="button"
                      onClick={handleDownloadCorruptedRaw}
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Baixar cópia do conteúdo bruto
                    </button>
                  )}
                  {!recoveryPreview && (
                    <button
                      type="button"
                      onClick={handlePreviewRecovery}
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Preservar cópia e recuperar registros válidos
                    </button>
                  )}
                </div>

                {/* O aviso registra o download INICIADO — nunca afirma
                    que o usuário guardou o arquivo. */}
                {exportNotice && (
                  <p role="status" className="mt-2 text-sm text-amber-800">
                    {exportNotice}
                  </p>
                )}

                {recoveryPreview && (
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
                  {storage.status === 'empty' && restoreAuthorization === null && (
                    <button
                      type="button"
                      onClick={handleOpenRestorePanel}
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Restaurar registros da cópia
                    </button>
                  )}
                  {discardAuthorization === null && (
                    <button
                      type="button"
                      onClick={() => {
                        setRestoreAuthorization(null)
                        // Correção AUD-01: a confirmação é aberta VINCULADA
                        // ao conteúdo bruto exato exibido neste momento.
                        if (quarantine.status === 'occupied') {
                          setDiscardAuthorization(quarantine.raw)
                        }
                      }}
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Descartar cópia definitivamente
                    </button>
                  )}
                </div>

                {restoreAuthorization !== null && (
                  <div className="mt-3 rounded-lg border border-slate-300 bg-white p-4">
                    <p className="text-sm text-slate-700">
                      Restaurar os registros válidos da cópia de segurança
                      para a lista de roteiros salvos?
                    </p>
                    {/* AUD-06: análise do conteúdo observado apresentada
                        ANTES da confirmação — inclusive a correção de
                        identificadores duplicados que o serviço fará. */}
                    <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-slate-700">
                      <li>
                        {restoreAuthorization.restoreCount}{' '}
                        {restoreAuthorization.restoreCount === 1
                          ? 'registro válido será restaurado'
                          : 'registros válidos serão restaurados'}
                        .
                      </li>
                      {restoreAuthorization.idsToFixCount > 0 && (
                        <li>
                          {restoreAuthorization.idsToFixCount}{' '}
                          {restoreAuthorization.idsToFixCount === 1
                            ? 'registro com identificador duplicado receberá'
                            : 'registros com identificadores duplicados receberão'}{' '}
                          novos identificadores.
                        </li>
                      )}
                    </ul>
                    {restoreAuthorization.restoreCount === 0 && (
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        Nenhum registro válido será restaurado: a lista de
                        roteiros permanecerá vazia.
                      </p>
                    )}
                    <p className="mt-2 text-sm text-slate-700">
                      A cópia será mantida na quarentena.
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
                        onClick={() => setRestoreAuthorization(null)}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {discardAuthorization !== null && (
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
                        onClick={() => setDiscardAuthorization(null)}
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

            {/* Sucesso confirmado (role="status": não interrompe como
                alerta, mas é anunciado por leitores de tela). */}
            {successMessage && (
              <p
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800"
              >
                {successMessage}
              </p>
            )}
          </div>
        )}

        <Hero onStartPlanning={onStartPlanning} />
        <DestinationsSection
          selectedDestinationId={destinationId}
          onSelectDestination={handleSelectDestination}
        />

        <PlanningForm
          destinationId={destinationId}
          onDestinationChange={changeDestination}
          initialDays={initialDays}
          initialInterests={initialInterests}
          initialStyle={initialStyle}
          initialBudget={initialBudget}
          onItineraryGenerated={onItineraryGenerated}
        />
        <SavedItineraries
          saved={storage.records}
          onOpen={onOpenSaved}
          onRemove={handleRemoveSaved}
          actionsDisabled={actionsDisabled}
          storageStatus={storage.status}
        />
        <ImportItinerary
          storageStatus={storage.status}
          storageRaw={storage.raw}
          externalBusy={busy}
          onBusyChange={setBusy}
          onStorageChanged={handleImportSettled}
        />
        <HowItWorks />
      </main>

      <Footer />
    </div>
  )
}
