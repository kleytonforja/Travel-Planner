import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { destinations } from '../data/destinations'
import { serializeItineraryExport, serializeRecoveryExport } from '../services/itineraryExport'
import { IMPORT_MAX_FILE_BYTES } from '../services/itineraryImport'
import { CORRUPTED_BACKUP_KEY, STORAGE_KEY } from '../services/itineraryStorage'
import { HomePage } from '../pages/HomePage'
import type { Itinerary, PlanningInput, SavedItinerary } from '../types'
import { formatCurrency } from '../utils/format'
import {
  buildHistoricalValidRecord,
  buildItineraryFromInput,
} from './fixtures/savedItineraries'
import {
  installWebLocksMock,
  uninstallWebLocksMock,
} from './helpers/webLocksMock'

/**
 * Testes de interação da importação de roteiros JSON (C5-T3).
 *
 * Todos os dados são sintéticos: o arquivo importado vem da exportação
 * real aplicada a roteiros gerados pela base local, e os registros já
 * salvos vêm das fixtures de persistência. Cada teste que verifica
 * ausência de escrita compara o conteúdo bruto das chaves e/ou os
 * espiões de `Storage`.
 */

const IMPORT_INPUT: PlanningInput = {
  destinationId: 'lisboa',
  days: 3,
  interests: ['cultura', 'gastronomia'],
  style: 'equilibrado',
  budget: 400,
}

const FILE_ID = 'id-do-arquivo-que-nao-deve-ser-usado'
const FILE_SAVED_AT = '1999-12-31T23:59:59.000Z'
const EXISTING_ID = 'roteiro-existente-sintetico'
const EXISTING_SAVED_AT = '2026-01-01T12:00:00.000Z'

const lisboa = destinations.find((item) => item.id === 'lisboa')!

function importedItinerary(): Itinerary {
  return buildItineraryFromInput(IMPORT_INPUT)
}

function exportText(itinerary: Itinerary = importedItinerary()): string {
  const saved: SavedItinerary = { id: FILE_ID, savedAt: FILE_SAVED_AT, itinerary }
  return serializeItineraryExport(saved, lisboa)
}

function exportDoc(): Record<string, any> {
  return JSON.parse(exportText()) as Record<string, any>
}

function makeFile(content: string, name = 'roteiro.json'): File {
  return new File([content], name, { type: 'application/json' })
}

function existingEquivalentRecord(): SavedItinerary {
  return { id: EXISTING_ID, savedAt: EXISTING_SAVED_AT, itinerary: importedItinerary() }
}

function seedMain(records: unknown[]): string {
  const raw = JSON.stringify(records)
  localStorage.setItem(STORAGE_KEY, raw)
  return raw
}

function renderHome() {
  render(<HomePage onOpenSaved={vi.fn()} />)
}

const importSection = () => screen.getByRole('region', { name: 'Importar roteiro' })
const savedSection = () => screen.getByRole('region', { name: 'Meus roteiros salvos' })
const fileInput = () => screen.getByLabelText('Arquivo do roteiro (JSON)') as HTMLInputElement
const previewGroup = () => screen.getByRole('group', { name: 'Pré-visualização do roteiro' })

async function chooseFile(user: ReturnType<typeof userEvent.setup>, file: File) {
  await user.upload(fileInput(), file)
}

async function previewReady(user: ReturnType<typeof userEvent.setup>, content = exportText()) {
  await chooseFile(user, makeFile(content))
  await screen.findByRole('heading', { name: 'Pré-visualização do roteiro' })
}

function setItemCalls(spy: { mock: { calls: unknown[][] } }, key = STORAGE_KEY) {
  return spy.mock.calls.filter((call) => call[0] === key)
}

function normalized(text: string | null): string {
  return (text ?? '').replace(/\s+/g, ' ')
}

function storedRecords(): SavedItinerary[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as SavedItinerary[]
}

describe('ImportItinerary — importação válida', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    uninstallWebLocksMock()
    vi.restoreAllMocks()
  })

  it('valida o arquivo e mostra a pré-visualização antes de qualquer gravação', async () => {
    const user = userEvent.setup()
    const rawBefore = seedMain([buildHistoricalValidRecord()])
    renderHome()
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    await previewReady(user)

    const group = previewGroup()
    const text = normalized(group.textContent)
    expect(text).toContain('Lisboa')
    expect(text).toContain('3 dias')
    expect(text).toContain('Equilibrado')
    expect(text).toContain('Cultura, Gastronomia')
    expect(text).toContain('Custo estimado das atividades (ilustrativo)')
    expect(text).toContain(
      normalized(
        formatCurrency(importedItinerary().totals.estimatedActivitiesCost, lisboa.currency),
      ),
    )
    expect(text).toContain('roteiro.json')
    expect(
      within(group).getByRole('button', { name: 'Confirmar importação' }),
    ).toBeEnabled()
    expect(within(group).getByRole('button', { name: 'Cancelar' })).toBeEnabled()

    // Nada foi gravado e a lista continua só com o registro anterior.
    expect(setItem).not.toHaveBeenCalled()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(rawBefore)
    expect(within(savedSection()).getAllByRole('listitem')).toHaveLength(1)
    expect(within(savedSection()).queryByText('Lisboa')).not.toBeInTheDocument()
  })

  it('importa como registro novo, sem usar id nem data do arquivo, preservando os demais', async () => {
    const user = userEvent.setup()
    const historical = buildHistoricalValidRecord()
    seedMain([historical])
    renderHome()
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem')
    const startedAt = Date.now()

    await previewReady(user)
    await user.click(screen.getByRole('button', { name: 'Confirmar importação' }))

    const status = await within(importSection()).findByRole('status')
    expect(status).toHaveTextContent('Importação concluída e confirmada')
    expect(status).toHaveTextContent('Lisboa')

    const records = storedRecords()
    expect(records).toHaveLength(2)
    const [created, previous] = records
    expect(created.id).toMatch(/^roteiro-[0-9a-f-]{36}$/)
    expect(created.id).not.toBe(FILE_ID)
    expect(created.savedAt).not.toBe(FILE_SAVED_AT)
    expect(new Date(created.savedAt).getTime()).toBeGreaterThanOrEqual(startedAt - 1000)
    expect(new Date(created.savedAt).getTime()).toBeLessThanOrEqual(Date.now() + 1000)
    expect(created.itinerary).toEqual(importedItinerary())
    // O registro anterior permanece idêntico.
    expect(previous).toEqual(historical)

    // Uma única escrita principal, nenhuma remoção, quarentena intocada.
    expect(setItemCalls(setItem)).toHaveLength(1)
    expect(removeItem).not.toHaveBeenCalled()
    expect(localStorage.getItem(CORRUPTED_BACKUP_KEY)).toBeNull()

    // Pré-visualização encerrada, campo reiniciado e lista atualizada.
    expect(screen.queryByRole('group', { name: 'Pré-visualização do roteiro' })).toBeNull()
    expect(fileInput().value).toBe('')
    expect(within(savedSection()).getAllByRole('listitem')).toHaveLength(2)
    expect(within(savedSection()).getByText('Lisboa')).toBeInTheDocument()
  })

  it('importa com o armazenamento vazio', async () => {
    const user = userEvent.setup()
    renderHome()
    expect(fileInput()).toBeEnabled()

    await previewReady(user)
    await user.click(screen.getByRole('button', { name: 'Confirmar importação' }))

    await within(importSection()).findByRole('status')
    expect(storedRecords()).toHaveLength(1)
    expect(storedRecords()[0].itinerary).toEqual(importedItinerary())
    expect(within(savedSection()).getByText('Lisboa')).toBeInTheDocument()
  })

  it('cancelar a pré-visualização não grava e permite escolher o mesmo arquivo de novo', async () => {
    const user = userEvent.setup()
    const rawBefore = seedMain([buildHistoricalValidRecord()])
    renderHome()
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    await previewReady(user)
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('group', { name: 'Pré-visualização do roteiro' })).toBeNull()
    expect(setItem).not.toHaveBeenCalled()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(rawBefore)
    expect(within(savedSection()).getAllByRole('listitem')).toHaveLength(1)

    await previewReady(user)
    expect(previewGroup()).toBeInTheDocument()
  })

  it('a lista só é atualizada depois da gravação confirmada', async () => {
    const user = userEvent.setup()
    seedMain([buildHistoricalValidRecord()])
    renderHome()
    await previewReady(user)
    expect(within(savedSection()).getAllByRole('listitem')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Confirmar importação' }))
    await within(importSection()).findByRole('status')
    expect(within(savedSection()).getAllByRole('listitem')).toHaveLength(2)
  })

  it('escolher outro arquivo substitui a pré-visualização e limpa o erro anterior', async () => {
    const user = userEvent.setup()
    renderHome()

    await chooseFile(user, makeFile('isto não é JSON', 'ruim.json'))
    expect(await within(importSection()).findByRole('alert')).toHaveTextContent(
      'não contém um JSON válido',
    )

    await previewReady(user)
    expect(within(importSection()).queryByRole('alert')).toBeNull()
    expect(previewGroup()).toBeInTheDocument()

    await chooseFile(user, makeFile('{}', 'vazio.json'))
    expect(await within(importSection()).findByRole('alert')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Pré-visualização do roteiro' })).toBeNull()
  })
})

describe('ImportItinerary — arquivos rejeitados', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    uninstallWebLocksMock()
    vi.restoreAllMocks()
  })

  async function expectRejection(content: string | File, message: RegExp) {
    const user = userEvent.setup()
    const rawBefore = seedMain([buildHistoricalValidRecord()])
    renderHome()
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    await chooseFile(user, typeof content === 'string' ? makeFile(content) : content)

    const alert = await within(importSection()).findByRole('alert')
    expect(alert).toHaveTextContent(message)
    expect(screen.queryByRole('group', { name: 'Pré-visualização do roteiro' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Confirmar importação' })).toBeNull()
    expect(setItem).not.toHaveBeenCalled()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(rawBefore)
    expect(within(savedSection()).getAllByRole('listitem')).toHaveLength(1)
    return alert
  }

  it('arquivo que não é JSON', async () => {
    await expectRejection('<html>não sou JSON</html>', /não contém um JSON válido/)
  })

  it('arquivo acima de 256 KB é recusado antes da leitura', async () => {
    const readAsText = vi.spyOn(FileReader.prototype, 'readAsText')
    const big = makeFile('x'.repeat(IMPORT_MAX_FILE_BYTES + 1), 'grande.json')
    expect(big.size).toBeGreaterThan(IMPORT_MAX_FILE_BYTES)
    await expectRejection(big, /maior que o limite de 256 KB e não foi lido/)
    expect(readAsText).not.toHaveBeenCalled()
  })

  it('versão de esquema incompatível', async () => {
    await expectRejection(
      JSON.stringify({ ...exportDoc(), schemaVersion: 2 }),
      /versão do arquivo não é suportada/,
    )
  })

  it('envelope de recuperação do armazenamento', async () => {
    await expectRejection(
      serializeRecoveryExport('[]', STORAGE_KEY),
      /cópia de segurança de recuperação/,
    )
  })

  it('arquivo de outro aplicativo', async () => {
    await expectRejection(
      JSON.stringify({ app: 'Outro App', schemaVersion: 1 }),
      /não parece ser um roteiro exportado/,
    )
  })

  it('divergência com a base atual', async () => {
    const doc = exportDoc()
    doc.roteiro[0].atividades[0].custoEstimadoIlustrativo += 5
    await expectRejection(JSON.stringify(doc), /diverge da base atual/)
  })

  it('exibe os motivos da validação quando os totais foram adulterados', async () => {
    const doc = exportDoc()
    doc.resumoFinanceiro.saldoNaoAlocado += 10
    const alert = await expectRejection(JSON.stringify(doc), /validação de consistência/)
    expect(within(alert).getAllByRole('listitem').length).toBeGreaterThan(0)
    expect(alert).toHaveTextContent(/saldo/)
  })

  it('exibe marcação HTML de avisos e do nome do arquivo apenas como texto', async () => {
    const user = userEvent.setup()
    seedMain([buildHistoricalValidRecord()])
    renderHome()
    const doc = exportDoc()
    doc.avisos = ['<img src=x onerror=alert(1)> <b>negrito</b>']

    await chooseFile(user, makeFile(JSON.stringify(doc), '<script>alert(1)</script>.json'))
    const group = await screen.findByRole('group', { name: 'Pré-visualização do roteiro' })

    expect(group).toHaveTextContent('<img src=x onerror=alert(1)> <b>negrito</b>')
    expect(group).toHaveTextContent('<script>alert(1)</script>.json')
    expect(group.querySelector('img')).toBeNull()
    expect(group.querySelector('b')).toBeNull()
    expect(group.querySelector('script')).toBeNull()
  })
})

describe('ImportItinerary — duplicatas e confirmação de substituição', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    uninstallWebLocksMock()
    vi.restoreAllMocks()
  })

  async function openReplacePanel(user: ReturnType<typeof userEvent.setup>) {
    await previewReady(user)
    await user.click(screen.getByRole('button', { name: 'Confirmar importação' }))
    await screen.findByText('Substituir roteiro salvo?')
  }

  it('planejamento equivalente pede confirmação e nada é gravado antes dela', async () => {
    const user = userEvent.setup()
    const rawBefore = seedMain([existingEquivalentRecord()])
    renderHome()
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    await openReplacePanel(user)

    const panel = screen.getByText('Substituir roteiro salvo?').closest('[role="alert"]')!
    expect(panel).toHaveTextContent('Lisboa, 3 dias')
    expect(panel).toHaveTextContent('somente esse registro será substituído')
    expect(setItem).not.toHaveBeenCalled()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(rawBefore)
    expect(within(importSection()).queryByRole('status')).toBeNull()
    // A opção de importar como novo registro não é oferecida junto da confirmação.
    expect(screen.queryByRole('button', { name: 'Confirmar importação' })).toBeNull()
  })

  it('cancelar a substituição não grava e volta à pré-visualização', async () => {
    const user = userEvent.setup()
    const rawBefore = seedMain([existingEquivalentRecord()])
    renderHome()
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    await openReplacePanel(user)
    await user.click(screen.getByRole('button', { name: 'Cancelar substituição' }))

    expect(screen.queryByText('Substituir roteiro salvo?')).toBeNull()
    expect(previewGroup()).toBeInTheDocument()
    expect(setItem).not.toHaveBeenCalled()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(rawBefore)
  })

  it('confirmar a substituição troca somente o registro autorizado, preservando o id dele', async () => {
    const user = userEvent.setup()
    const other = buildHistoricalValidRecord()
    seedMain([existingEquivalentRecord(), other])
    renderHome()
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    await openReplacePanel(user)
    await user.click(screen.getByRole('button', { name: 'Confirmar substituição' }))

    const status = await within(importSection()).findByRole('status')
    expect(status).toHaveTextContent('Substituição concluída e confirmada')
    const records = storedRecords()
    expect(records).toHaveLength(2)
    const replaced = records.find((record) => record.id === EXISTING_ID)!
    expect(replaced.itinerary).toEqual(importedItinerary())
    expect(replaced.savedAt).not.toBe(EXISTING_SAVED_AT)
    expect(replaced.savedAt).not.toBe(FILE_SAVED_AT)
    expect(records.find((record) => record.id === other.id)).toEqual(other)
    expect(setItemCalls(setItem)).toHaveLength(1)
    expect(screen.queryByText('Substituir roteiro salvo?')).toBeNull()
  })

  it('confirmação desatualizada (armazenamento alterado em outra aba) é cancelada sem sobrescrever', async () => {
    const user = userEvent.setup()
    seedMain([existingEquivalentRecord()])
    renderHome()

    await openReplacePanel(user)
    // Outra aba altera os dados depois do pedido de confirmação.
    const changedByOtherTab = JSON.stringify([buildHistoricalValidRecord()])
    localStorage.setItem(STORAGE_KEY, changedByOtherTab)
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    await user.click(screen.getByRole('button', { name: 'Confirmar substituição' }))

    const alert = await within(importSection()).findByRole('alert')
    expect(alert).toHaveTextContent('mudaram desde a última leitura')
    expect(localStorage.getItem(STORAGE_KEY)).toBe(changedByOtherTab)
    expect(setItem).not.toHaveBeenCalled()
    expect(screen.queryByText('Substituir roteiro salvo?')).toBeNull()
    expect(within(importSection()).queryByText(/Substituição concluída/)).toBeNull()
  })

  it('a autorização é descartada quando a página passa a observar outro conteúdo', async () => {
    const user = userEvent.setup()
    seedMain([existingEquivalentRecord()])
    renderHome()

    await openReplacePanel(user)
    // Exclui o alvo pela própria lista: a página relê um conteúdo diferente.
    await user.click(
      within(savedSection()).getByRole('button', { name: 'Excluir roteiro de Lisboa' }),
    )

    await waitFor(() => {
      expect(screen.queryByText('Substituir roteiro salvo?')).toBeNull()
    })
    expect(
      await within(importSection()).findByText(/confirmação de substituição foi cancelada/),
    ).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBe('[]')
    expect(within(importSection()).queryByText(/Substituição concluída/)).toBeNull()
    // Nenhum botão de confirmação antigo sobrou para reaproveitar a autorização.
    expect(screen.queryByRole('button', { name: 'Confirmar substituição' })).toBeNull()
  })
})

describe('ImportItinerary — falhas de armazenamento', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    uninstallWebLocksMock()
    vi.restoreAllMocks()
  })

  it('quota excedida: alerta, nada alterado, sem sucesso e nova tentativa segura', async () => {
    const user = userEvent.setup()
    const rawBefore = seedMain([buildHistoricalValidRecord()])
    renderHome()
    await previewReady(user)

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota esgotada', 'QuotaExceededError')
    })
    await user.click(screen.getByRole('button', { name: 'Confirmar importação' }))

    const alert = await within(importSection()).findByRole('alert')
    expect(alert).toHaveTextContent('armazenamento do navegador está cheio')
    expect(localStorage.getItem(STORAGE_KEY)).toBe(rawBefore)
    expect(within(importSection()).queryByRole('status')).toBeNull()
    expect(within(savedSection()).getAllByRole('listitem')).toHaveLength(1)
    // A pré-visualização permanece para nova tentativa.
    expect(screen.getByRole('button', { name: 'Confirmar importação' })).toBeEnabled()

    vi.restoreAllMocks()
    await user.click(screen.getByRole('button', { name: 'Confirmar importação' }))
    await within(importSection()).findByRole('status')
    expect(storedRecords()).toHaveLength(2)
  })

  it('armazenamento indisponível desde o início: importação bloqueada e nenhuma escrita', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('leitura bloqueada', 'SecurityError')
    })
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    renderHome()

    expect(fileInput()).toBeDisabled()
    expect(importSection()).toHaveTextContent('A importação está indisponível')
    expect(getItem).toHaveBeenCalled()
    expect(setItem).not.toHaveBeenCalled()
  })

  it('armazenamento que fica indisponível depois da pré-visualização: falha sem escrita', async () => {
    const user = userEvent.setup()
    const rawBefore = seedMain([buildHistoricalValidRecord()])
    renderHome()
    await previewReady(user)

    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('leitura bloqueada', 'SecurityError')
    })
    await user.click(screen.getByRole('button', { name: 'Confirmar importação' }))

    const alert = await within(importSection()).findByRole('alert')
    expect(alert).toHaveTextContent('Não foi possível acessar o armazenamento do navegador')
    expect(setItem).not.toHaveBeenCalled()
    expect(within(importSection()).queryByRole('status')).toBeNull()
    vi.restoreAllMocks()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(rawBefore)
  })

  it('sem Web Locks as alterações são bloqueadas e nada é gravado', async () => {
    const user = userEvent.setup()
    const rawBefore = seedMain([buildHistoricalValidRecord()])
    renderHome()
    await previewReady(user)

    uninstallWebLocksMock()
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    await user.click(screen.getByRole('button', { name: 'Confirmar importação' }))

    expect(await within(importSection()).findByRole('alert')).toHaveTextContent(
      'coordenação segura entre abas',
    )
    expect(setItem).not.toHaveBeenCalled()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(rawBefore)
  })

  it('resultado incerto: mensagem fixa, uma única escrita, sem rollback e sem afirmar preservação', async () => {
    const user = userEvent.setup()
    seedMain([buildHistoricalValidRecord()])
    renderHome()
    await previewReady(user)

    const realGetItem = Storage.prototype.getItem
    const realSetItem = Storage.prototype.setItem
    let wrote = false
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(function (this: Storage, key: string, value: string) {
        wrote = true
        realSetItem.call(this, key, value)
      })
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem')
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (
      this: Storage,
      key: string,
    ) {
      // A releitura de confirmação (após a escrita) falha.
      if (wrote) throw new DOMException('releitura bloqueada', 'SecurityError')
      return realGetItem.call(this, key)
    })

    await user.click(screen.getByRole('button', { name: 'Confirmar importação' }))

    const alert = await within(importSection()).findByRole('alert')
    expect(alert).toHaveTextContent('Não foi possível confirmar a operação')
    expect(alert).toHaveTextContent('Recarregue os roteiros')
    expect(alert.textContent).not.toMatch(/preservad|nenhuma alteração foi feita|não foi alterad/i)
    expect(within(importSection()).queryByRole('status')).toBeNull()
    expect(within(importSection()).queryByText(/concluída e confirmada/)).toBeNull()
    expect(setItemCalls(setItem)).toHaveLength(1)
    expect(removeItem).not.toHaveBeenCalled()
    // Pré-visualização descartada: não há reenvio cego depois de um resultado incerto.
    expect(screen.queryByRole('button', { name: 'Confirmar importação' })).toBeNull()
  })
})

describe('ImportItinerary — estados do armazenamento e quarentena', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    uninstallWebLocksMock()
    vi.restoreAllMocks()
  })

  it('preserva a quarentena existente durante e depois da importação', async () => {
    const user = userEvent.setup()
    seedMain([buildHistoricalValidRecord()])
    const quarantine = 'cópia-sintética-ilegível {'
    localStorage.setItem(CORRUPTED_BACKUP_KEY, quarantine)
    renderHome()
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem')
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    await previewReady(user)
    await user.click(screen.getByRole('button', { name: 'Confirmar importação' }))
    await within(importSection()).findByRole('status')

    expect(localStorage.getItem(CORRUPTED_BACKUP_KEY)).toBe(quarantine)
    expect(setItemCalls(setItem, CORRUPTED_BACKUP_KEY)).toHaveLength(0)
    expect(removeItem).not.toHaveBeenCalled()
    expect(storedRecords()).toHaveLength(2)
  })

  it('coleção corrompida bloqueia a importação sem tocar nas chaves', async () => {
    const corrupted = '[{"id":"x","savedAt":"ontem"}'
    localStorage.setItem(STORAGE_KEY, corrupted)
    localStorage.setItem(CORRUPTED_BACKUP_KEY, 'quarentena-sintética')
    renderHome()
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    expect(fileInput()).toBeDisabled()
    expect(importSection()).toHaveTextContent('A importação está indisponível')
    expect(setItem).not.toHaveBeenCalled()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(corrupted)
    expect(localStorage.getItem(CORRUPTED_BACKUP_KEY)).toBe('quarentena-sintética')
  })

  it('bloqueia ações concorrentes enquanto a gravação está em andamento', async () => {
    const user = userEvent.setup()
    seedMain([buildHistoricalValidRecord()])
    renderHome()
    await previewReady(user)

    // Lock controlado pelo teste: a gravação só prossegue ao liberá-lo.
    let release: () => void = () => {}
    Object.defineProperty(window.navigator, 'locks', {
      configurable: true,
      value: {
        request: <T,>(_name: string, callback: () => T | Promise<T>) =>
          new Promise<T>((resolve) => {
            release = () => resolve(callback() as T)
          }),
      },
    })

    await user.click(screen.getByRole('button', { name: 'Confirmar importação' }))

    expect(await screen.findByRole('button', { name: 'Salvando…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    expect(fileInput()).toBeDisabled()
    expect(
      within(savedSection()).getByRole('button', {
        name: 'Excluir roteiro de Florianópolis',
      }),
    ).toBeDisabled()
    expect(storedRecords()).toHaveLength(1)

    release()
    await within(importSection()).findByRole('status')
    expect(storedRecords()).toHaveLength(2)
    expect(fileInput()).toBeEnabled()
  })
})

describe('ImportItinerary — acessibilidade e aviso do rodapé', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    uninstallWebLocksMock()
    vi.restoreAllMocks()
  })

  it('o campo tem rótulo, descrição e filtro de tipo; os resultados usam papéis ARIA adequados', async () => {
    const user = userEvent.setup()
    renderHome()

    const input = fileInput()
    expect(input).toHaveAttribute('accept', '.json,application/json')
    expect(input).toHaveAccessibleDescription(/exportado anteriormente.*256 KB/s)

    await chooseFile(user, makeFile('não é JSON'))
    expect(await within(importSection()).findByRole('alert')).toBeInTheDocument()

    await previewReady(user)
    const heading = screen.getByRole('heading', { name: 'Pré-visualização do roteiro' })
    // O foco vai para a pré-visualização para ser anunciada.
    expect(heading).toHaveFocus()
    expect(previewGroup()).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Confirmar importação' }))
    expect(await within(importSection()).findByRole('status')).toBeInTheDocument()
    expect(within(importSection()).queryByRole('alert')).toBeNull()
  })

  it('o rodapé informa que a importação existe e que nada é substituído sem confirmação', () => {
    renderHome()
    const notice = screen.getByRole('complementary', {
      name: 'Aviso de demonstração experimental',
    })
    expect(notice).toHaveTextContent('Importar roteiro')
    expect(notice).toHaveTextContent(/sem a sua confirmação/)
    expect(notice).not.toHaveTextContent(/ainda não permite importar/)
  })
})
