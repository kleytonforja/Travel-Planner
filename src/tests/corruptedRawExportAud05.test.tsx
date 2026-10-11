import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HomePage } from '../pages/HomePage'
import {
  RECOVERY_EXPORT_FORMAT,
  RECOVERY_EXPORT_VERSION,
} from '../services/itineraryExport'
import {
  CORRUPTED_BACKUP_KEY,
  STORAGE_KEY,
} from '../services/itineraryStorage'
import {
  installWebLocksMock,
  uninstallWebLocksMock,
} from './helpers/webLocksMock'

/**
 * Testes adversos da EXPORTAÇÃO DO CONTEÚDO BRUTO da principal
 * corrompida — reprodução do achado AUD-05 da auditoria independente
 * final (docs/FINAL_AUDIT_FINDINGS.md, seção 3):
 *
 * - O exportador de recuperação existia, mas a interface o conectava
 *   somente à quarentena: não havia ação para exportar o conteúdo bruto
 *   observado da chave principal corrompida.
 * - A exportação deve funcionar inclusive quando não há espaço para
 *   criar a quarentena (quota insuficiente): ela não grava nada.
 * - O conteúdo original deve ser preservado integralmente (raw exato,
 *   chave de origem correta) e NENHUMA das duas chaves pode ser
 *   alterada pela exportação.
 * - A interface diferencia "download iniciado" de "arquivo guardado":
 *   disparar o download não prova que o usuário salvou o arquivo.
 */

interface CapturedDownload {
  blob: Blob
}

let capturedDownloads: CapturedDownload[]

function renderHome() {
  render(
    <HomePage onItineraryGenerated={vi.fn()} onOpenSaved={vi.fn()} />,
  )
}

async function readEnvelope(index = 0) {
  const download = capturedDownloads[index]
  if (!download) throw new Error('nenhum download foi disparado')
  return JSON.parse(await download.blob.text()) as Record<string, unknown>
}

function mainRaw(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

function quarantineRaw(): string | null {
  return localStorage.getItem(CORRUPTED_BACKUP_KEY)
}

describe('exportação do conteúdo bruto da principal corrompida (AUD-05)', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
    Element.prototype.scrollIntoView = vi.fn()
    capturedDownloads = []
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: (blob: Blob) => {
        capturedDownloads.push({ blob })
        return 'blob:download-falso'
      },
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    uninstallWebLocksMock()
    vi.restoreAllMocks()
    Reflect.deleteProperty(URL, 'createObjectURL')
    Reflect.deleteProperty(URL, 'revokeObjectURL')
  })

  it('reproduz o cenário exato do AUD-05: principal corrompida e quarentena ausente exportável', async () => {
    const user = userEvent.setup()
    const corruptedRaw = '{invalid'
    localStorage.setItem(STORAGE_KEY, corruptedRaw)
    renderHome()

    // Painel de corrupção presente.
    expect(
      await screen.findByText(/não puderam ser validados/),
    ).toBeInTheDocument()

    // A ação de exportação do conteúdo bruto da principal existe.
    await user.click(
      screen.getByRole('button', { name: 'Baixar cópia do conteúdo bruto' }),
    )

    // Envelope de recuperação com a chave de origem correta e raw exato.
    expect(capturedDownloads).toHaveLength(1)
    const envelope = await readEnvelope()
    expect(envelope.formato).toBe(RECOVERY_EXPORT_FORMAT)
    expect(envelope.versao).toBe(RECOVERY_EXPORT_VERSION)
    expect(envelope.chaveOrigem).toBe(STORAGE_KEY)
    expect(envelope.raw).toBe(corruptedRaw)

    // Nenhuma das duas chaves foi alterada; nenhuma quarentena foi criada.
    expect(mainRaw()).toBe(corruptedRaw)
    expect(quarantineRaw()).toBeNull()

    // A interface informa o download INICIADO, sem afirmar que o
    // usuário guardou o arquivo.
    const notice = await screen.findByRole('status')
    expect(notice).toHaveTextContent(/[Dd]ownload/)
    expect(notice.textContent).toContain('não confirma que o arquivo foi guardado')
    expect(notice.textContent).not.toContain('foi salvo')
    expect(notice.textContent).not.toContain('guardado com sucesso')
  })

  it('exporta mesmo sob quota insuficiente para o backup: zero escritas, chaves intactas', async () => {
    const user = userEvent.setup()
    const corruptedRaw = '{invalid'
    localStorage.setItem(STORAGE_KEY, corruptedRaw)
    renderHome()
    await screen.findByText(/não puderam ser validados/)

    // Armazenamento sem espaço: qualquer escrita falharia — inclusive a
    // criação do backup da recuperação. A exportação não pode depender
    // dela.
    const setSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('quota esgotada', 'QuotaExceededError')
      })

    await user.click(
      screen.getByRole('button', { name: 'Baixar cópia do conteúdo bruto' }),
    )

    // A exportação disparou o download sem nenhuma tentativa de escrita.
    expect(capturedDownloads).toHaveLength(1)
    expect(setSpy).not.toHaveBeenCalled()
    const envelope = await readEnvelope()
    expect(envelope.chaveOrigem).toBe(STORAGE_KEY)
    expect(envelope.raw).toBe(corruptedRaw)
    expect(mainRaw()).toBe(corruptedRaw)
    expect(quarantineRaw()).toBeNull()
  })

  it('preserva a quarentena existente (conteúdo diferente) ao exportar a principal', async () => {
    const user = userEvent.setup()
    const corruptedRaw = '["registro",{"quebrado":true}]'
    const existingQuarantine = '{"copia":"anterior diferente"}'
    localStorage.setItem(STORAGE_KEY, corruptedRaw)
    localStorage.setItem(CORRUPTED_BACKUP_KEY, existingQuarantine)
    renderHome()
    await screen.findByText(/não puderam ser validados/)

    await user.click(
      screen.getByRole('button', { name: 'Baixar cópia do conteúdo bruto' }),
    )

    const envelope = await readEnvelope()
    expect(envelope.raw).toBe(corruptedRaw)
    expect(envelope.chaveOrigem).toBe(STORAGE_KEY)
    // As DUAS chaves permanecem byte a byte idênticas; a quarentena não
    // foi sobrescrita.
    expect(mainRaw()).toBe(corruptedRaw)
    expect(quarantineRaw()).toBe(existingQuarantine)
  })

  it('a exportação da quarentena existente não é confundida com a da principal', async () => {
    const user = userEvent.setup()
    const corruptedRaw = '{invalid'
    const existingQuarantine = '["conteudo","da","quarentena"]'
    localStorage.setItem(STORAGE_KEY, corruptedRaw)
    localStorage.setItem(CORRUPTED_BACKUP_KEY, existingQuarantine)
    renderHome()
    await screen.findByText(/não puderam ser validados/)

    // Exporta a principal corrompida…
    await user.click(
      screen.getByRole('button', { name: 'Baixar cópia do conteúdo bruto' }),
    )
    // …e, separadamente, a cópia da quarentena.
    await user.click(
      screen.getByRole('button', { name: 'Baixar cópia de segurança' }),
    )

    expect(capturedDownloads).toHaveLength(2)
    const mainEnvelope = await readEnvelope(0)
    const quarantineEnvelope = await readEnvelope(1)
    expect(mainEnvelope.chaveOrigem).toBe(STORAGE_KEY)
    expect(mainEnvelope.raw).toBe(corruptedRaw)
    expect(quarantineEnvelope.chaveOrigem).toBe(CORRUPTED_BACKUP_KEY)
    expect(quarantineEnvelope.raw).toBe(existingQuarantine)
    expect(mainRaw()).toBe(corruptedRaw)
    expect(quarantineRaw()).toBe(existingQuarantine)
  })
})
