import type { Destination, SavedItinerary } from '../types'
import { formatMinutesToTime } from '../utils/format'

/**
 * Exportação de roteiros em JSON.
 *
 * O arquivo exportado é autoexplicativo, traz versão de esquema, aviso de
 * que os valores são ilustrativos e nenhum dado sensível do usuário.
 */

export const EXPORT_SCHEMA_VERSION = 1

export const EXPORT_DISCLAIMER =
  'Custos, durações e horários são valores ilustrativos para fins de planejamento e não representam cotações, horários oficiais ou disponibilidade real de serviços. O resumo financeiro considera apenas as atividades e não inclui hospedagem, transporte ou alimentação.'

/**
 * Monta o objeto de exportação de um roteiro salvo. Função pura para
 * facilitar testes; a serialização e o download ficam separados.
 */
export function buildItineraryExport(
  saved: SavedItinerary,
  destination: Destination,
) {
  const { itinerary } = saved

  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    app: 'Travel Planner',
    disclaimer: EXPORT_DISCLAIMER,
    savedAt: saved.savedAt,
    resumo: {
      destino: destination.name,
      pais: destination.country,
      moeda: destination.currency.code,
      dias: itinerary.input.days,
      estilo: itinerary.input.style,
      interesses: itinerary.input.interests,
      orcamentoInformado: itinerary.input.budget,
    },
    roteiro: itinerary.days.map((day) => ({
      dia: day.dayNumber,
      atividades: day.activities.map((item) => ({
        nome: item.activity.name,
        periodo: item.period,
        horarioSugerido: `${formatMinutesToTime(item.startMinutes)} – ${formatMinutesToTime(item.endMinutes)}`,
        duracaoHoras: item.activity.durationHours,
        categorias: item.activity.categories,
        custoEstimadoIlustrativo: item.activity.estimatedCost,
      })),
    })),
    resumoFinanceiro: {
      orcamentoInformado: itinerary.input.budget,
      custoEstimadoAtividades: itinerary.totals.estimatedActivitiesCost,
      saldoNaoAlocado: itinerary.totals.unallocatedBudget,
      custoMedioAtividadesPorDia: itinerary.totals.averageCostPerDay,
    },
    avisos: itinerary.warnings,
  }
}

/** Serializa o objeto de exportação em JSON formatado. */
export function serializeItineraryExport(
  saved: SavedItinerary,
  destination: Destination,
): string {
  return JSON.stringify(buildItineraryExport(saved, destination), null, 2)
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    // Remove marcas diacríticas (faixa Unicode combinável).
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Dispara o download do arquivo JSON no navegador. */
export function downloadItineraryJson(
  saved: SavedItinerary,
  destination: Destination,
): void {
  const json = serializeItineraryExport(saved, destination)
  downloadJsonFile(json, `roteiro-${slugify(destination.name)}-${saved.id}.json`)
}

/* ------------------------------------------------------------------ */
/* Exportação de recuperação (cópia bruta do armazenamento)            */
/* ------------------------------------------------------------------ */

/**
 * Identificador do formato do envelope de recuperação. NÃO é o JSON de
 * exportação normal do roteiro: contém o conteúdo bruto da chave de
 * origem, para preservação externa dos dados antes do descarte.
 */
export const RECOVERY_EXPORT_FORMAT = 'travel-planner:recuperacao-armazenamento'
export const RECOVERY_EXPORT_VERSION = 1

/**
 * Monta o envelope de recuperação: identificador do formato, versão,
 * chave de origem e a string raw preservada integralmente.
 */
export function buildRecoveryExport(raw: string, sourceKey: string) {
  return {
    formato: RECOVERY_EXPORT_FORMAT,
    versao: RECOVERY_EXPORT_VERSION,
    chaveOrigem: sourceKey,
    raw,
  }
}

/** Serializa o envelope de recuperação em JSON formatado. */
export function serializeRecoveryExport(raw: string, sourceKey: string): string {
  return JSON.stringify(buildRecoveryExport(raw, sourceKey), null, 2)
}

/**
 * Dispara o download da cópia bruta para recuperação. Disparar o
 * download não prova que o usuário guardou o arquivo — a interface não
 * pode afirmar isso.
 */
export function downloadRecoveryJson(raw: string, sourceKey: string): void {
  downloadJsonFile(
    serializeRecoveryExport(raw, sourceKey),
    'travel-planner-copia-de-seguranca.json',
  )
}

function downloadJsonFile(json: string, filename: string): void {
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
