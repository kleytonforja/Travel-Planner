import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { destinations } from '../data/destinations'
import {
  buildItineraryExport,
  EXPORT_SCHEMA_VERSION,
  serializeItineraryExport,
  SUPPORTED_IMPORT_VERSIONS,
} from '../services/itineraryExport'
import { generateItinerary } from '../services/itineraryGenerator'
import { IMPORT_MAX_FILE_BYTES, parseItineraryImport } from '../services/itineraryImport'
import { arePlanningsEquivalent, saveItinerary, STORAGE_KEY } from '../services/itineraryStorage'
import type { Destination, Itinerary, PlanningInput, SavedItinerary, TripPace } from '../types'
import { installWebLocksMock, uninstallWebLocksMock } from './helpers/webLocksMock'

/**
 * Importação e exportação JSON v2 (M2.4). A geração sem orçamento continua
 * desativada (M2.5): os roteiros sem orçamento são montados à mão a partir de um
 * roteiro gerado com orçamento. Arquivos v1 seguem com todas as exigências antigas.
 */

type Doc = Record<string, any>

const SAVED_AT = '2026-01-15T10:00:00.000Z'
const lisboa = destinations.find((item) => item.id === 'lisboa') as Destination

const INPUT: PlanningInput = {
  destinationId: 'lisboa',
  days: 3,
  interests: ['cultura', 'gastronomia'],
  style: 'equilibrado',
  budget: 400,
}

function withBudget(budget = 400): Itinerary {
  const result = generateItinerary({ ...INPUT, budget }, lisboa)
  if (!result.ok) throw new Error('falha ao gerar roteiro de teste')
  return result.itinerary
}

function withoutBudget(pace?: TripPace): Itinerary {
  const result = generateItinerary({ ...INPUT, budget: undefined, ...(pace ? { pace } : {}) }, lisboa)
  if (!result.ok) throw new Error(result.message)
  // `budget: undefined` some na serialização; aqui garantimos a omissão real.
  delete result.itinerary.input.budget
  return result.itinerary
}

function withPace(pace: TripPace, budget = 400): Itinerary {
  const result = generateItinerary({ ...INPUT, budget, pace }, lisboa)
  if (!result.ok) throw new Error(result.message)
  return result.itinerary
}

const saved = (itinerary: Itinerary): SavedItinerary => ({ id: 'sintetico-v2', savedAt: SAVED_AT, itinerary })
const exportDoc = (itinerary: Itinerary): Doc => JSON.parse(serializeItineraryExport(saved(itinerary), lisboa)) as Doc
const text = (doc: Doc) => JSON.stringify(doc)

function expectRejected(input: string, code: string) {
  const result = parseItineraryImport(input)
  expect(result.ok, JSON.stringify(result)).toBe(false)
  if (result.ok) throw new Error('esperava rejeição')
  expect(result.code).toBe(code)
  return result
}

function expectAccepted(input: string): Itinerary {
  const result = parseItineraryImport(input)
  expect(result.ok, JSON.stringify(result)).toBe(true)
  if (!result.ok) throw new Error('esperava aceitação')
  return result.itinerary
}

describe('Exportação v2', () => {
  it('usa schemaVersion 2 e a importação declara aceitar 1 e 2', () => {
    expect(EXPORT_SCHEMA_VERSION).toBe(2)
    expect(SUPPORTED_IMPORT_VERSIONS).toEqual([1, 2])
    expect(exportDoc(withBudget()).schemaVersion).toBe(2)
  })

  it('com orçamento: preserva valores, ordem e consistência entre os resumos; sem "ritmo" quando não há', () => {
    const itinerary = withBudget(333.33)
    const doc = exportDoc(itinerary)
    expect(doc.resumo.orcamentoInformado).toBe(333.33)
    expect(doc.resumoFinanceiro.orcamentoInformado).toBe(333.33)
    expect(doc.resumoFinanceiro.saldoNaoAlocado).toBe(itinerary.totals.unallocatedBudget)
    expect(Object.keys(doc.resumoFinanceiro)).toEqual([
      'orcamentoInformado',
      'custoEstimadoAtividades',
      'saldoNaoAlocado',
      'custoMedioAtividadesPorDia',
    ])
    expect(doc.resumo).not.toHaveProperty('ritmo')
  })

  it('sem orçamento: omite os três campos (nunca null) e mantém custo e média', () => {
    const itinerary = withoutBudget()
    const json = serializeItineraryExport(saved(itinerary), lisboa)
    const doc = JSON.parse(json) as Doc
    expect(doc.resumo).not.toHaveProperty('orcamentoInformado')
    expect(doc.resumoFinanceiro).not.toHaveProperty('orcamentoInformado')
    expect(doc.resumoFinanceiro).not.toHaveProperty('saldoNaoAlocado')
    expect(json).not.toContain('orcamentoInformado')
    expect(json).not.toContain('saldoNaoAlocado')
    expect(json).not.toContain('null')
    expect(doc.resumoFinanceiro.custoEstimadoAtividades).toBe(itinerary.totals.estimatedActivitiesCost)
    expect(doc.resumoFinanceiro.custoMedioAtividadesPorDia).toBe(itinerary.totals.averageCostPerDay)
  })

  it.each<TripPace>(['tranquilo', 'equilibrado', 'intenso'])('com ritmo %s: inclui resumo.ritmo', (pace) => {
    expect(exportDoc(withPace(pace)).resumo.ritmo).toBe(pace)
    expect(exportDoc(withoutBudget(pace)).resumo.ritmo).toBe(pace)
  })

  it('um ritmo inválido em memória não é exportado', () => {
    const itinerary = withBudget()
    ;(itinerary.input as unknown as Record<string, unknown>).pace = 'relaxado'
    expect(buildItineraryExport(saved(itinerary), lisboa).resumo).not.toHaveProperty('ritmo')
  })
})

describe('Importação v1 (inalterada)', () => {
  const v1 = (itinerary = withBudget()): Doc => ({ ...exportDoc(itinerary), schemaVersion: 1 })

  it('aceita arquivo v1 histórico e devolve o planejamento original, sem ritmo', () => {
    const itinerary = withBudget()
    const imported = expectAccepted(text(v1(itinerary)))
    expect(imported).toEqual(itinerary)
    expect(imported.input).not.toHaveProperty('pace')
  })

  it('o orçamento e o saldo continuam obrigatórios (ausência nunca vira "opcional")', () => {
    const noSummaryBudget = v1()
    delete noSummaryBudget.resumo.orcamentoInformado
    expectRejected(text(noSummaryBudget), 'invalid-structure')
    const noFinancialBudget = v1()
    delete noFinancialBudget.resumoFinanceiro.orcamentoInformado
    expectRejected(text(noFinancialBudget), 'invalid-structure')
    const noBalance = v1()
    delete noBalance.resumoFinanceiro.saldoNaoAlocado
    expectRejected(text(noBalance), 'invalid-structure')
    // Um arquivo "sem orçamento" no formato v2, rotulado como v1, é rejeitado.
    const budgetlessAsV1 = { ...exportDoc(withoutBudget()), schemaVersion: 1 }
    expectRejected(text(budgetlessAsV1), 'invalid-structure')
  })

  it('ignora um campo "ritmo" em arquivo v1 (a v1 não tem ritmo)', () => {
    const doc = v1()
    doc.resumo.ritmo = 'intenso'
    expect(expectAccepted(text(doc)).input).not.toHaveProperty('pace')
    doc.resumo.ritmo = 'inventado'
    expectAccepted(text(doc))
  })

  it('mantém as demais validações da v1 (orçamento divergente e custo acima do orçamento)', () => {
    const divergent = v1()
    divergent.resumoFinanceiro.orcamentoInformado = divergent.resumo.orcamentoInformado + 1
    expectRejected(text(divergent), 'validation-failed')
    const over = v1()
    over.resumo.orcamentoInformado = 1
    over.resumoFinanceiro.orcamentoInformado = 1
    over.resumoFinanceiro.saldoNaoAlocado = 0
    expectRejected(text(over), 'validation-failed')
  })
})

describe('Importação v2', () => {
  it('ida e volta com orçamento: reconstrói exatamente o roteiro', () => {
    const itinerary = withBudget(333.33)
    expect(expectAccepted(serializeItineraryExport(saved(itinerary), lisboa))).toEqual(itinerary)
  })

  it('ida e volta sem orçamento: sem budget e sem saldo (propriedades omitidas)', () => {
    const itinerary = withoutBudget()
    const imported = expectAccepted(serializeItineraryExport(saved(itinerary), lisboa))
    expect(imported).toEqual(itinerary)
    expect(imported.input).not.toHaveProperty('budget')
    expect(imported.totals).not.toHaveProperty('unallocatedBudget')
  })

  it.each<TripPace>(['tranquilo', 'equilibrado', 'intenso'])('ida e volta com ritmo %s', (pace) => {
    expect(expectAccepted(serializeItineraryExport(saved(withPace(pace)), lisboa)).input.pace).toBe(pace)
    const imported = expectAccepted(serializeItineraryExport(saved(withoutBudget(pace)), lisboa))
    expect(imported.input.pace).toBe(pace)
    expect(imported.input).not.toHaveProperty('budget')
  })

  it('arquivo v2 sem ritmo importa sem ritmo (nada é preenchido por padrão)', () => {
    expect(expectAccepted(text(exportDoc(withBudget()))).input).not.toHaveProperty('pace')
  })

  describe('rejeita inconsistências financeiras', () => {
    it('orçamento só no resumo, só no financeiro ou divergente', () => {
      const onlySummary = exportDoc(withBudget())
      delete onlySummary.resumoFinanceiro.orcamentoInformado
      expect(expectRejected(text(onlySummary), 'validation-failed').details.join(' ')).toMatch(/apenas um dos resumos/)
      const onlyFinancial = exportDoc(withBudget())
      delete onlyFinancial.resumo.orcamentoInformado
      expectRejected(text(onlyFinancial), 'validation-failed')
      const different = exportDoc(withBudget())
      different.resumoFinanceiro.orcamentoInformado += 1
      expect(expectRejected(text(different), 'validation-failed').details.join(' ')).toMatch(/difere/)
    })

    it('saldo presente sem orçamento (inclusive 0)', () => {
      for (const balance of [0, 10, -1]) {
        const doc = exportDoc(withoutBudget())
        doc.resumoFinanceiro.saldoNaoAlocado = balance
        expectRejected(text(doc), 'validation-failed')
      }
      const nullBalance = exportDoc(withoutBudget())
      nullBalance.resumoFinanceiro.saldoNaoAlocado = null
      expectRejected(text(nullBalance), 'invalid-structure')
    })

    it('orçamento presente sem saldo', () => {
      const doc = exportDoc(withBudget())
      delete doc.resumoFinanceiro.saldoNaoAlocado
      expectRejected(text(doc), 'invalid-structure')
    })

    it.each([
      ['null', null],
      ['texto', '400'],
      ['booleano', true],
      ['objeto', {}],
    ])('orçamento %s é estrutura inválida (nos dois resumos)', (_label, value) => {
      const inSummary = exportDoc(withBudget())
      inSummary.resumo.orcamentoInformado = value
      expectRejected(text(inSummary), 'invalid-structure')
      const inFinancial = exportDoc(withBudget())
      inFinancial.resumoFinanceiro.orcamentoInformado = value
      expectRejected(text(inFinancial), 'invalid-structure')
    })

    it('NaN e Infinity (serializados como null) e literais fora do JSON são rejeitados', () => {
      const doc = exportDoc(withBudget())
      const json = text(doc).replace(`"orcamentoInformado":${doc.resumo.orcamentoInformado}`, '"orcamentoInformado":NaN')
      expectRejected(json, 'invalid-json')
      const infinity = text(doc).replace(`"orcamentoInformado":${doc.resumo.orcamentoInformado}`, '"orcamentoInformado":Infinity')
      expectRejected(infinity, 'invalid-json')
      const huge = text(doc).replace(`"orcamentoInformado":${doc.resumo.orcamentoInformado}`, '"orcamentoInformado":1e999')
      expectRejected(huge, 'invalid-structure')
    })

    it('orçamento zero ou negativo', () => {
      for (const value of [0, -50]) {
        const doc = exportDoc(withBudget())
        doc.resumo.orcamentoInformado = value
        doc.resumoFinanceiro.orcamentoInformado = value
        expectRejected(text(doc), 'validation-failed')
      }
    })

    it('custo acima do orçamento, saldo e média incoerentes continuam rejeitados', () => {
      const over = exportDoc(withBudget())
      over.resumo.orcamentoInformado = 1
      over.resumoFinanceiro.orcamentoInformado = 1
      over.resumoFinanceiro.saldoNaoAlocado = 0
      expectRejected(text(over), 'validation-failed')
      const balance = exportDoc(withBudget())
      balance.resumoFinanceiro.saldoNaoAlocado += 1
      expectRejected(text(balance), 'validation-failed')
      const average = exportDoc(withBudget())
      average.resumoFinanceiro.custoMedioAtividadesPorDia += 1
      expectRejected(text(average), 'validation-failed')
    })

    it('sem orçamento, custo e média continuam validados contra as atividades', () => {
      const cost = exportDoc(withoutBudget())
      cost.resumoFinanceiro.custoEstimadoAtividades += 1
      expectRejected(text(cost), 'validation-failed')
      const average = exportDoc(withoutBudget())
      average.resumoFinanceiro.custoMedioAtividadesPorDia += 1
      expectRejected(text(average), 'validation-failed')
      const negative = exportDoc(withoutBudget())
      negative.resumoFinanceiro.custoEstimadoAtividades = -1
      expectRejected(text(negative), 'validation-failed')
    })
  })

  describe('rejeita ritmo inválido', () => {
    it.each([
      ['desconhecido', 'relaxado'],
      ['maiúsculas', 'Intenso'],
      ['vazio', ''],
      ['nulo', null],
      ['número', 1],
      ['lista', ['intenso']],
    ])('ritmo %s', (_label, value) => {
      const doc = exportDoc(withBudget())
      doc.resumo.ritmo = value
      expectRejected(text(doc), 'invalid-structure')
      const budgetless = exportDoc(withoutBudget())
      budgetless.resumo.ritmo = value
      expectRejected(text(budgetless), 'invalid-structure')
    })
  })

  it('rejeita versões fora de 1 e 2 (3, 0, texto, nulo, ausente)', () => {
    const doc = exportDoc(withBudget())
    for (const version of [3, 9, 0, 1.5, '2', null]) {
      expectRejected(text({ ...doc, schemaVersion: version }), 'unsupported-version')
    }
    const semVersao = { ...doc }
    delete semVersao.schemaVersion
    expectRejected(text(semVersao), 'unsupported-version')
    const result = expectRejected(text({ ...doc, schemaVersion: 3 }), 'unsupported-version')
    expect(result.message).toMatch(/versões 1 e 2/)
  })

  it('rejeita arquivo acima de 256 KB (v1 e v2) antes de interpretá-lo', () => {
    const doc = exportDoc(withBudget())
    const padded = text({ ...doc, avisos: ['x'.repeat(IMPORT_MAX_FILE_BYTES)] })
    expect(padded.length).toBeGreaterThan(IMPORT_MAX_FILE_BYTES)
    expectRejected(padded, 'too-large')
    expectRejected(text({ ...doc, schemaVersion: 1, avisos: ['x'.repeat(IMPORT_MAX_FILE_BYTES)] }), 'too-large')
  })

  it('o catálogo continua sendo a fonte das atividades (divergência de custo é rejeitada)', () => {
    const doc = exportDoc(withoutBudget())
    doc.roteiro[0].atividades[0].custoEstimadoIlustrativo += 1
    expectRejected(text(doc), 'catalog-mismatch')
  })

  it('é determinística', () => {
    const json = serializeItineraryExport(saved(withoutBudget('tranquilo')), lisboa)
    expect(parseItineraryImport(json)).toEqual(parseItineraryImport(json))
  })
})

describe('Importação v2 — isolamento e entrada maliciosa', () => {
  it('não confia em propriedades herdadas (orçamento, saldo e ritmo ausentes não são "supridos")', () => {
    const doc = exportDoc(withoutBudget())
    const proto = Object.prototype as unknown as Record<string, unknown>
    Object.defineProperty(proto, 'orcamentoInformado', { value: 999, configurable: true })
    Object.defineProperty(proto, 'saldoNaoAlocado', { value: 1, configurable: true })
    Object.defineProperty(proto, 'ritmo', { value: 'intenso', configurable: true })
    try {
      const imported = expectAccepted(text(doc))
      expect(imported.input).not.toHaveProperty('budget')
      expect(imported.input).not.toHaveProperty('pace')
      expect(imported.totals).not.toHaveProperty('unallocatedBudget')
    } finally {
      delete proto.orcamentoInformado
      delete proto.saldoNaoAlocado
      delete proto.ritmo
    }
  })

  it('campos extras e __proto__ no arquivo v2 são descartados sem poluir protótipos', () => {
    const doc = exportDoc(withPace('tranquilo'))
    const json = text(doc).replace(
      '"app":',
      '"__proto__":{"polluted":true,"budget":1,"pace":"intenso"},"extra":1,"app":',
    )
    const imported = expectAccepted(json)
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    expect(imported.input.pace).toBe('tranquilo')
    expect(imported.input.budget).toBe(400)
    expect(imported.input).not.toHaveProperty('extra')
  })

  it('devolve objetos novos e não toca o armazenamento', () => {
    localStorage.clear()
    const doc = exportDoc(withoutBudget())
    const first = expectAccepted(text(doc))
    const second = expectAccepted(text(doc))
    expect(first).not.toBe(second)
    expect(first.days[0].activities[0].activity).not.toBe(lisboa.activities[0])
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})

describe('Importação v2 — deduplicação ao salvar', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
  })

  afterEach(() => {
    uninstallWebLocksMock()
  })

  it('o roteiro importado sem orçamento equivale ao original e pede confirmação para substituir', async () => {
    const original = withoutBudget('tranquilo')
    const first = await saveItinerary(original)
    expect(first.ok).toBe(true)
    const imported = expectAccepted(serializeItineraryExport(saved(original), lisboa))
    expect(arePlanningsEquivalent(original.input, imported.input)).toBe(true)
    const again = await saveItinerary(imported)
    expect(again.ok).toBe(false)
    expect(!again.ok && again.outcome).toBe('needs-confirmation')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toHaveLength(1)
  })

  it('ausência não equivale a valor: v2 com ritmo ou sem orçamento não substitui o roteiro legado', async () => {
    const legacy = withBudget()
    expect((await saveItinerary(legacy)).ok).toBe(true)
    const legacyFile = { ...exportDoc(legacy), schemaVersion: 1 }
    const importedLegacy = expectAccepted(text(legacyFile))
    expect(arePlanningsEquivalent(legacy.input, importedLegacy.input)).toBe(true)

    const paced = expectAccepted(serializeItineraryExport(saved(withPace('intenso')), lisboa))
    expect(arePlanningsEquivalent(legacy.input, paced.input)).toBe(false)
    expect((await saveItinerary(paced)).ok).toBe(true)

    const noBudget = expectAccepted(serializeItineraryExport(saved(withoutBudget()), lisboa))
    expect(arePlanningsEquivalent(legacy.input, noBudget.input)).toBe(false)
    expect((await saveItinerary(noBudget)).ok).toBe(true)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toHaveLength(3)
  })
})
