import { afterEach, describe, expect, it, vi } from 'vitest'

import { destinations } from '../data/destinations'
import {
  buildRecoveryExport,
  serializeItineraryExport,
  serializeRecoveryExport,
} from '../services/itineraryExport'
import { generateItinerary } from '../services/itineraryGenerator'
import {
  IMPORT_MAX_FILE_BYTES,
  IMPORT_MAX_WARNING_LENGTH,
  IMPORT_MAX_WARNINGS,
  parseItineraryImport,
} from '../services/itineraryImport'
import type {
  Activity,
  Destination,
  InterestCategory,
  Itinerary,
  SavedItinerary,
  TravelStyle,
} from '../types'
import { formatMinutesToTime } from '../utils/format'

/**
 * Fixtures sintéticas: nenhum dado de usuário real. O arquivo importado é
 * tratado como entrada não confiável; por isso os testes manipulam o
 * documento JSON como estrutura solta.
 */
type Doc = Record<string, any>

const SAVED_AT = '2026-01-15T10:00:00.000Z'

function destinationById(id: string): Destination {
  const destination = destinations.find((item) => item.id === id)
  if (!destination) throw new Error(`destino de teste inexistente: ${id}`)
  return destination
}

function generate(
  destinationId: string,
  days: number,
  interests: InterestCategory[],
  style: TravelStyle,
  budget: number,
): { itinerary: Itinerary; destination: Destination } | null {
  const destination = destinationById(destinationId)
  const result = generateItinerary(
    { destinationId, days, interests, style, budget },
    destination,
  )
  return result.ok ? { itinerary: result.itinerary, destination } : null
}

/** Exportação real (função de produção) lida como documento mutável. */
function exportDoc(itinerary: Itinerary, destination: Destination): Doc {
  const saved: SavedItinerary = { id: 'sintetico-1', savedAt: SAVED_AT, itinerary }
  return JSON.parse(serializeItineraryExport(saved, destination)) as Doc
}

function sample(): { doc: Doc; itinerary: Itinerary; destination: Destination } {
  const built = generate('lisboa', 3, ['cultura', 'gastronomia'], 'equilibrado', 400)
  if (!built) throw new Error('falha ao gerar roteiro de teste')
  return { ...built, doc: exportDoc(built.itinerary, built.destination) }
}

function text(doc: Doc): string {
  return JSON.stringify(doc)
}

function expectRejected(input: string, code: string) {
  const result = parseItineraryImport(input)
  expect(result.ok).toBe(false)
  if (result.ok) throw new Error('esperava rejeição')
  expect(result.code).toBe(code)
  expect(result.message.length).toBeGreaterThan(10)
  return result
}

interface Slot {
  activity: Activity
  period: 'manha' | 'tarde' | 'noite'
  start: number
  end?: number
}

/** Exportação montada à mão (horários e totais sob controle do teste). */
function handmade(
  destination: Destination,
  days: Slot[][],
  options: {
    style?: TravelStyle
    interests?: InterestCategory[]
    budget?: number
  } = {},
): Doc {
  const budget = options.budget ?? 10_000
  const cost = days.flat().reduce((sum, slot) => sum + slot.activity.estimatedCost, 0)
  return {
    schemaVersion: 1,
    app: 'Travel Planner',
    disclaimer: 'valores ilustrativos',
    savedAt: SAVED_AT,
    resumo: {
      destino: destination.name,
      pais: destination.country,
      moeda: destination.currency.code,
      dias: days.length,
      estilo: options.style ?? 'equilibrado',
      interesses: options.interests ?? ['cultura', 'gastronomia'],
      orcamentoInformado: budget,
    },
    roteiro: days.map((slots, index) => ({
      dia: index + 1,
      atividades: slots.map((slot) => {
        const end = slot.end ?? slot.start + slot.activity.durationHours * 60
        return {
          nome: slot.activity.name,
          periodo: slot.period,
          horarioSugerido: `${formatMinutesToTime(slot.start)} – ${formatMinutesToTime(end)}`,
          duracaoHoras: slot.activity.durationHours,
          categorias: [...slot.activity.categories],
          custoEstimadoIlustrativo: slot.activity.estimatedCost,
        }
      }),
    })),
    resumoFinanceiro: {
      orcamentoInformado: budget,
      custoEstimadoAtividades: cost,
      saldoNaoAlocado: budget - cost,
      custoMedioAtividadesPorDia: cost / days.length,
    },
    avisos: [],
  }
}

/**
 * Duas atividades curtas de Lisboa, adequadas a 'equilibrado', cuja soma
 * de durações cabe em sequência na janela da manhã (09:00–12:30): um
 * passeio de cultura (`a`) e uma parada gastronômica (`b`).
 */
function shortCulturePair(): { destination: Destination; a: Activity; b: Activity } {
  const destination = destinationById('lisboa')
  const a = destination.activities.find((item) => item.id === 'lis-mosteiro-jeronimos')
  const b = destination.activities.find((item) => item.id === 'lis-pasteis-de-belem')
  if (!a || !b) throw new Error('atividades de teste ausentes do catálogo')
  if (a.durationHours + b.durationHours > 3.5) {
    throw new Error('as atividades de teste não cabem em sequência na manhã')
  }
  return { destination, a, b }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('parseItineraryImport — ida e volta com a exportação real', () => {
  it('reconstrói exatamente o roteiro exportado (sem id nem savedAt)', () => {
    const { doc, itinerary } = sample()
    const result = parseItineraryImport(text(doc))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.itinerary).toEqual(itinerary)
    expect(Object.keys(result).sort()).toEqual(['itinerary', 'ok'])
    expect('id' in result.itinerary).toBe(false)
    expect('savedAt' in result.itinerary).toBe(false)
  })

  it('aceita a saída serializada da exportação sem transformação', () => {
    const { itinerary, destination } = sample()
    const saved: SavedItinerary = { id: 'sintetico-1', savedAt: SAVED_AT, itinerary }
    const result = parseItineraryImport(serializeItineraryExport(saved, destination))
    expect(result).toEqual({ ok: true, itinerary })
  })

  it('funciona para todos os destinos, estilos e conjuntos de interesses', () => {
    const interestSets: InterestCategory[][] = [
      ['cultura'],
      ['natureza', 'gastronomia'],
      ['aventura', 'relaxamento', 'compras'],
      ['vida-noturna', 'cultura'],
    ]
    const styles: TravelStyle[] = ['economico', 'equilibrado', 'confortavel']
    let imported = 0
    for (const destination of destinations) {
      for (const style of styles) {
        for (const interests of interestSets) {
          for (const days of [1, 3, 7, 14]) {
            for (const budget of [150, 600, 5000]) {
              const built = generate(destination.id, days, interests, style, budget)
              if (!built) continue
              const result = parseItineraryImport(
                text(exportDoc(built.itinerary, built.destination)),
              )
              expect(result.ok, `${destination.id}/${style}/${days}/${budget}`).toBe(true)
              if (result.ok) expect(result.itinerary).toEqual(built.itinerary)
              imported += 1
            }
          }
        }
      }
    }
    expect(imported).toBeGreaterThan(100)
  })

  it('é determinística: a mesma entrada gera sempre o mesmo resultado', () => {
    const { doc } = sample()
    expect(parseItineraryImport(text(doc))).toEqual(parseItineraryImport(text(doc)))
  })

  it('aceita arquivo com BOM UTF-8 e rejeita BOM fora do início', () => {
    const { doc, itinerary } = sample()
    const withBom = parseItineraryImport(`﻿${text(doc)}`)
    expect(withBom).toEqual({ ok: true, itinerary })
    expectRejected(`${text(doc).slice(0, 1)}﻿${text(doc).slice(1)}`, 'invalid-json')
  })

  it('aceita o travessão ou o hífen no intervalo de horário', () => {
    const { doc, itinerary } = sample()
    for (const day of doc.roteiro) {
      for (const item of day.atividades) {
        item.horarioSugerido = String(item.horarioSugerido).replace('–', '-')
      }
    }
    expect(parseItineraryImport(text(doc))).toEqual({ ok: true, itinerary })
  })

  it('aceita a combinação de nomes em forma Unicode decomposta (NFD)', () => {
    const built = generate('florianopolis', 2, ['natureza'], 'equilibrado', 800)
    if (!built) throw new Error('falha ao gerar roteiro de teste')
    const doc = exportDoc(built.itinerary, built.destination)
    doc.resumo.destino = String(doc.resumo.destino).normalize('NFD')
    expect(doc.resumo.destino).not.toBe(built.destination.name)
    expect(parseItineraryImport(text(doc))).toEqual({ ok: true, itinerary: built.itinerary })
  })
})

describe('parseItineraryImport — texto inválido e identificação do arquivo', () => {
  it.each([
    ['vazio', ''],
    ['só espaços', '   '],
    ['JSON truncado', '{"app": "Travel Planner"'],
    ['texto simples', 'não sou JSON'],
    ['vírgula sobrando', '{"a":1,}'],
  ])('rejeita JSON inválido (%s)', (_label, input) => {
    expectRejected(input, 'invalid-json')
  })

  it.each([
    ['null', 'null'],
    ['número', '123'],
    ['texto', '"olá"'],
    ['lista', '[]'],
    ['lista de roteiros', '[{"app":"Travel Planner"}]'],
  ])('rejeita JSON que não é um objeto (%s)', (_label, input) => {
    expectRejected(input, 'not-an-export')
  })

  it('rejeita objeto de outra aplicação ou sem identificação', () => {
    const { doc } = sample()
    expectRejected(text({ ...doc, app: 'Outro App' }), 'not-an-export')
    expectRejected(text({ ...doc, app: 'travel planner' }), 'not-an-export')
    const semApp = { ...doc }
    delete semApp.app
    expectRejected(text(semApp), 'not-an-export')
    expectRejected('{}', 'not-an-export')
  })

  it('rejeita versões de esquema incompatíveis', () => {
    const { doc } = sample()
    expectRejected(text({ ...doc, schemaVersion: 2 }), 'unsupported-version')
    expectRejected(text({ ...doc, schemaVersion: 0 }), 'unsupported-version')
    expectRejected(text({ ...doc, schemaVersion: '1' }), 'unsupported-version')
    expectRejected(text({ ...doc, schemaVersion: null }), 'unsupported-version')
    const semVersao = { ...doc }
    delete semVersao.schemaVersion
    expectRejected(text(semVersao), 'unsupported-version')
  })

  it('rejeita o envelope de recuperação do armazenamento', () => {
    const raw = '[{"id":"x"}]'
    const result = expectRejected(
      serializeRecoveryExport(raw, 'travel-planner:saved-itineraries:v1'),
      'recovery-envelope',
    )
    expect(result.message).toMatch(/recupera/i)
    expectRejected(
      JSON.stringify(buildRecoveryExport(raw, 'chave')),
      'recovery-envelope',
    )
  })

  it('rejeita arquivo maior que o limite antes de interpretá-lo', () => {
    expect(IMPORT_MAX_FILE_BYTES).toBe(256 * 1024)
    // JSON inválido e grande: o limite vem antes do parse.
    expectRejected('x'.repeat(IMPORT_MAX_FILE_BYTES + 1), 'too-large')
    // O limite conta bytes UTF-8, não caracteres.
    const multibyte = 'é'.repeat(Math.ceil(IMPORT_MAX_FILE_BYTES / 2) + 1)
    expect(multibyte.length).toBeLessThan(IMPORT_MAX_FILE_BYTES)
    expectRejected(multibyte, 'too-large')
  })
})

describe('parseItineraryImport — campos obrigatórios e tipos', () => {
  const caminhos: Array<[string, (doc: Doc) => void]> = [
    ['resumo', (doc) => delete doc.resumo],
    ['resumo.destino', (doc) => delete doc.resumo.destino],
    ['resumo.pais', (doc) => delete doc.resumo.pais],
    ['resumo.moeda', (doc) => delete doc.resumo.moeda],
    ['resumo.dias', (doc) => delete doc.resumo.dias],
    ['resumo.estilo', (doc) => delete doc.resumo.estilo],
    ['resumo.interesses', (doc) => delete doc.resumo.interesses],
    ['resumo.orcamentoInformado', (doc) => delete doc.resumo.orcamentoInformado],
    ['roteiro', (doc) => delete doc.roteiro],
    ['roteiro[0].dia', (doc) => delete doc.roteiro[0].dia],
    ['roteiro[0].atividades', (doc) => delete doc.roteiro[0].atividades],
    ['atividade.nome', (doc) => delete doc.roteiro[0].atividades[0].nome],
    ['atividade.periodo', (doc) => delete doc.roteiro[0].atividades[0].periodo],
    ['atividade.horarioSugerido', (doc) => delete doc.roteiro[0].atividades[0].horarioSugerido],
    ['atividade.duracaoHoras', (doc) => delete doc.roteiro[0].atividades[0].duracaoHoras],
    ['atividade.categorias', (doc) => delete doc.roteiro[0].atividades[0].categorias],
    [
      'atividade.custoEstimadoIlustrativo',
      (doc) => delete doc.roteiro[0].atividades[0].custoEstimadoIlustrativo,
    ],
    ['resumoFinanceiro', (doc) => delete doc.resumoFinanceiro],
    [
      'resumoFinanceiro.custoEstimadoAtividades',
      (doc) => delete doc.resumoFinanceiro.custoEstimadoAtividades,
    ],
    ['resumoFinanceiro.saldoNaoAlocado', (doc) => delete doc.resumoFinanceiro.saldoNaoAlocado],
    [
      'resumoFinanceiro.custoMedioAtividadesPorDia',
      (doc) => delete doc.resumoFinanceiro.custoMedioAtividadesPorDia,
    ],
    ['avisos', (doc) => delete doc.avisos],
  ]

  it.each(caminhos)('rejeita arquivo sem %s', (_caminho, remover) => {
    const { doc } = sample()
    expect(doc.roteiro[0].atividades.length).toBeGreaterThan(0)
    remover(doc)
    const result = expectRejected(text(doc), 'invalid-structure')
    expect(result.details.length).toBeGreaterThan(0)
  })

  it.each([
    ['resumo como lista', (doc: Doc) => (doc.resumo = [])],
    ['roteiro como objeto', (doc: Doc) => (doc.roteiro = {})],
    ['dia como objeto vazio', (doc: Doc) => (doc.roteiro[0] = {})],
    ['dias como texto', (doc: Doc) => (doc.resumo.dias = '3')],
    ['dias fracionário', (doc: Doc) => (doc.resumo.dias = 1.5)],
    ['orçamento como texto', (doc: Doc) => (doc.resumo.orcamentoInformado = '400')],
    ['orçamento nulo (NaN serializado)', (doc: Doc) => (doc.resumo.orcamentoInformado = null)],
    ['interesses como texto', (doc: Doc) => (doc.resumo.interesses = 'cultura')],
    ['interesse não textual', (doc: Doc) => (doc.resumo.interesses = ['cultura', 7])],
    ['atividade nula', (doc: Doc) => (doc.roteiro[0].atividades[0] = null)],
    ['categorias como texto', (doc: Doc) => (doc.roteiro[0].atividades[0].categorias = 'cultura')],
    ['custo como texto', (doc: Doc) => (doc.roteiro[0].atividades[0].custoEstimadoIlustrativo = '5')],
    ['duração nula', (doc: Doc) => (doc.roteiro[0].atividades[0].duracaoHoras = null)],
    ['custo total como texto', (doc: Doc) => (doc.resumoFinanceiro.custoEstimadoAtividades = '1')],
    ['saldo nulo', (doc: Doc) => (doc.resumoFinanceiro.saldoNaoAlocado = null)],
  ])('rejeita tipo inválido: %s', (_label, alterar) => {
    const { doc } = sample()
    alterar(doc)
    expectRejected(text(doc), 'invalid-structure')
  })
})

describe('parseItineraryImport — catálogo atual', () => {
  it('rejeita destino desconhecido (inclusive variação de caixa)', () => {
    const { doc } = sample()
    doc.resumo.destino = 'Atlântida'
    expectRejected(text(doc), 'unknown-destination')
    doc.resumo.destino = 'lisboa'
    expectRejected(text(doc), 'unknown-destination')
  })

  it('rejeita atividade desconhecida', () => {
    const { doc } = sample()
    doc.roteiro[0].atividades[0].nome = 'Passeio que não existe'
    expectRejected(text(doc), 'unknown-activity')
  })

  it('rejeita atividade de outro destino', () => {
    const { doc } = sample()
    const outro = destinationById('florianopolis').activities[0]
    doc.roteiro[0].atividades[0].nome = outro.name
    expectRejected(text(doc), 'unknown-activity')
  })

  it.each([
    ['custo', (item: Doc) => (item.custoEstimadoIlustrativo += 1)],
    ['duração', (item: Doc) => (item.duracaoHoras += 0.5)],
    ['categorias', (item: Doc) => (item.categorias = ['compras'])],
    ['categorias extras', (item: Doc) => item.categorias.push('compras')],
  ])('rejeita divergência de %s com o catálogo atual', (_campo, alterar) => {
    const { doc } = sample()
    alterar(doc.roteiro[0].atividades[0])
    const result = expectRejected(text(doc), 'catalog-mismatch')
    expect(result.message).toMatch(/base|catálogo/i)
  })

  it('rejeita país ou moeda diferentes do destino', () => {
    const { doc } = sample()
    expectRejected(text({ ...doc, resumo: { ...doc.resumo, pais: 'Brasil' } }), 'catalog-mismatch')
    expectRejected(text({ ...doc, resumo: { ...doc.resumo, moeda: 'BRL' } }), 'catalog-mismatch')
  })
})

describe('parseItineraryImport — valores financeiros', () => {
  it.each([
    ['custo total', (doc: Doc) => (doc.resumoFinanceiro.custoEstimadoAtividades += 1)],
    ['saldo', (doc: Doc) => (doc.resumoFinanceiro.saldoNaoAlocado += 1)],
    ['custo médio', (doc: Doc) => (doc.resumoFinanceiro.custoMedioAtividadesPorDia += 1)],
    ['custo total negativo', (doc: Doc) => (doc.resumoFinanceiro.custoEstimadoAtividades = -1)],
    ['saldo negativo', (doc: Doc) => (doc.resumoFinanceiro.saldoNaoAlocado = -1)],
  ])('rejeita %s alterado', (_campo, alterar) => {
    const { doc } = sample()
    alterar(doc)
    expectRejected(text(doc), 'validation-failed')
  })

  it('rejeita orçamento divergente entre o resumo e o resumo financeiro', () => {
    const { doc } = sample()
    doc.resumoFinanceiro.orcamentoInformado = doc.resumo.orcamentoInformado + 1
    const result = expectRejected(text(doc), 'validation-failed')
    expect(result.details.join(' ')).toMatch(/orçamento/i)
  })

  it('rejeita orçamento nulo ou negativo', () => {
    const { doc } = sample()
    doc.resumo.orcamentoInformado = 0
    expectRejected(text(doc), 'validation-failed')
    doc.resumo.orcamentoInformado = -50
    expectRejected(text(doc), 'validation-failed')
  })

  it('rejeita custo acima do orçamento mesmo por diferença mínima (sem tolerância)', () => {
    const { destination, a } = shortCulturePair()
    const pago = destination.activities.find(
      (activity) =>
        activity.estimatedCost > 0 &&
        activity.categories.includes('cultura') &&
        activity.suitableStyles.includes('equilibrado') &&
        activity.durationHours <= 3,
    )
    const alvo = pago ?? a
    expect(alvo.estimatedCost).toBeGreaterThan(0)
    const budget = alvo.estimatedCost - 5e-7
    const doc = handmade(destination, [[{ activity: alvo, period: 'manha', start: 540 }]], {
      budget,
    })
    doc.resumoFinanceiro.saldoNaoAlocado = 0
    const result = expectRejected(text(doc), 'validation-failed')
    expect(result.details.join(' ')).toMatch(/superior ao orçamento/)
  })

  it('aceita o mesmo documento montado à mão com totais consistentes', () => {
    const { destination, a, b } = shortCulturePair()
    const doc = handmade(destination, [
      [
        { activity: a, period: 'manha', start: 540 },
        { activity: b, period: 'tarde', start: 14 * 60 },
      ],
    ])
    const result = parseItineraryImport(text(doc))
    expect(result.ok).toBe(true)
  })
})

describe('parseItineraryImport — horários, períodos e dias', () => {
  it.each([
    ['texto livre', 'abc'],
    ['sem zero à esquerda', '9:00 – 10:00'],
    ['hora inexistente', '25:00 – 26:00'],
    ['minuto inexistente', '09:75 – 10:00'],
    ['sem separador', '09:00 10:00'],
    ['só um horário', '09:00'],
    ['vazio', ''],
  ])('rejeita horário mal formado (%s)', (_label, horario) => {
    const { doc } = sample()
    doc.roteiro[0].atividades[0].horarioSugerido = horario
    expectRejected(text(doc), 'invalid-schedule')
  })

  it.each([['madrugada'], ['qualquer'], [''], [7]])('rejeita período inválido (%s)', (periodo) => {
    const { doc } = sample()
    doc.roteiro[0].atividades[0].periodo = periodo
    expectRejected(text(doc), 'invalid-schedule')
  })

  it('rejeita horário fora da janela do período', () => {
    const { destination, a } = shortCulturePair()
    const doc = handmade(destination, [[{ activity: a, period: 'manha', start: 6 * 60 }]])
    const result = expectRejected(text(doc), 'validation-failed')
    expect(result.details.join(' ')).toMatch(/janelas/)
  })

  it('rejeita horário incompatível com a duração da atividade', () => {
    const { destination, a } = shortCulturePair()
    const doc = handmade(destination, [
      [{ activity: a, period: 'manha', start: 540, end: 540 + a.durationHours * 60 + 15 }],
    ])
    const result = expectRejected(text(doc), 'validation-failed')
    expect(result.details.join(' ')).toMatch(/duração/)
  })

  it('rejeita atividades com horários sobrepostos no mesmo dia', () => {
    const { destination, a, b } = shortCulturePair()
    const doc = handmade(destination, [
      [
        { activity: a, period: 'manha', start: 540 },
        { activity: b, period: 'manha', start: 570 },
      ],
    ])
    const result = expectRejected(text(doc), 'validation-failed')
    expect(result.details.join(' ')).toMatch(/sobrepostos/)
  })

  it('aceita atividades que apenas se tocam (término = início)', () => {
    const { destination, a, b } = shortCulturePair()
    const inicioB = 540 + a.durationHours * 60
    const doc = handmade(destination, [
      [
        { activity: a, period: 'manha', start: 540 },
        { activity: b, period: 'manha', start: inicioB },
      ],
    ])
    expect(inicioB + b.durationHours * 60).toBeLessThanOrEqual(12 * 60 + 30)
    expect(parseItineraryImport(text(doc)).ok).toBe(true)
  })

  it('rejeita dias fora de sequência, repetidos ou em quantidade diferente', () => {
    const { doc } = sample()
    const trocado = structuredClone(doc)
    trocado.roteiro[0].dia = 2
    trocado.roteiro[1].dia = 1
    expectRejected(text(trocado), 'validation-failed')

    const repetido = structuredClone(doc)
    repetido.roteiro[1].dia = 1
    expectRejected(text(repetido), 'validation-failed')

    const faltando = structuredClone(doc)
    faltando.roteiro.pop()
    expectRejected(text(faltando), 'validation-failed')

    const sobrando = structuredClone(doc)
    sobrando.roteiro.push({ dia: 4, atividades: [] })
    expectRejected(text(sobrando), 'validation-failed')
  })

  it('rejeita mais de 14 dias sem processar o roteiro inteiro', () => {
    const { doc } = sample()
    doc.resumo.dias = 15
    doc.roteiro = Array.from({ length: 15 }, (_, index) => ({ dia: index + 1, atividades: [] }))
    expectRejected(text(doc), 'validation-failed')
    doc.resumo.dias = 1_000_000
    doc.roteiro = Array.from({ length: 5000 }, (_, index) => ({ dia: index + 1, atividades: [] }))
    expectRejected(text(doc), 'validation-failed')
  })

  it('rejeita a mesma atividade repetida no roteiro', () => {
    const { destination, a } = shortCulturePair()
    const doc = handmade(destination, [
      [{ activity: a, period: 'manha', start: 540 }],
      [{ activity: a, period: 'manha', start: 540 }],
    ])
    const result = expectRejected(text(doc), 'validation-failed')
    expect(result.details.join(' ')).toMatch(/repetida/)
  })

  it('rejeita lista de atividades maior que o catálogo do destino', () => {
    const { destination, a } = shortCulturePair()
    const doc = handmade(destination, [[{ activity: a, period: 'manha', start: 540 }]])
    const item = doc.roteiro[0].atividades[0]
    doc.roteiro[0].atividades = Array.from(
      { length: destination.activities.length + 1 },
      () => structuredClone(item),
    )
    expectRejected(text(doc), 'validation-failed')
  })
})

describe('parseItineraryImport — coerência do planejamento', () => {
  it('rejeita atividade incompatível com o estilo informado', () => {
    const destination = destinationById('lisboa')
    const naoEconomica = destination.activities.find(
      (activity) =>
        !activity.suitableStyles.includes('economico') &&
        activity.categories.includes('cultura') &&
        activity.durationHours <= 3,
    )
    if (!naoEconomica) throw new Error('catálogo sem atividade não econômica de cultura')
    const doc = handmade(
      destination,
      [[{ activity: naoEconomica, period: 'manha', start: 540 }]],
      { style: 'economico' },
    )
    const result = expectRejected(text(doc), 'validation-failed')
    expect(result.details.join(' ')).toMatch(/estilo/)
  })

  it('rejeita atividade que não atende a nenhum interesse informado', () => {
    const { destination, a } = shortCulturePair()
    const doc = handmade(destination, [[{ activity: a, period: 'manha', start: 540 }]], {
      interests: ['compras'],
    })
    const result = expectRejected(text(doc), 'validation-failed')
    expect(result.details.join(' ')).toMatch(/interesse/)
  })

  it.each([
    ['estilo desconhecido', (doc: Doc) => (doc.resumo.estilo = 'luxo')],
    ['interesse desconhecido', (doc: Doc) => (doc.resumo.interesses = ['cultura', 'esportes'])],
    ['interesses vazios', (doc: Doc) => (doc.resumo.interesses = [])],
    ['interesses repetidos', (doc: Doc) => (doc.resumo.interesses = ['cultura', 'cultura'])],
  ])('rejeita planejamento inválido: %s', (_label, alterar) => {
    const { doc } = sample()
    alterar(doc)
    expectRejected(text(doc), 'validation-failed')
  })
})

describe('parseItineraryImport — avisos', () => {
  function comAvisos(avisos: unknown): string {
    const { doc } = sample()
    doc.avisos = avisos
    return text(doc)
  }

  it('aceita lista vazia e preserva os avisos válidos na ordem', () => {
    const resultado = parseItineraryImport(comAvisos([]))
    expect(resultado.ok && resultado.itinerary.warnings).toEqual([])
    const lista = ['Primeiro aviso.', 'Segundo aviso, com acentuação: ação.']
    const comLista = parseItineraryImport(comAvisos(lista))
    expect(comLista.ok && comLista.itinerary.warnings).toEqual(lista)
  })

  it('aceita exatamente os limites de quantidade e de tamanho', () => {
    const naQuantidade = Array.from({ length: IMPORT_MAX_WARNINGS }, (_, i) => `Aviso ${i}`)
    expect(parseItineraryImport(comAvisos(naQuantidade)).ok).toBe(true)
    const noTamanho = ['a'.repeat(IMPORT_MAX_WARNING_LENGTH)]
    expect(parseItineraryImport(comAvisos(noTamanho)).ok).toBe(true)
  })

  it('rejeita quantidade excessiva de avisos', () => {
    const demais = Array.from({ length: IMPORT_MAX_WARNINGS + 1 }, (_, i) => `Aviso ${i}`)
    expectRejected(comAvisos(demais), 'invalid-warnings')
  })

  it('rejeita aviso acima do tamanho máximo', () => {
    expectRejected(comAvisos(['a'.repeat(IMPORT_MAX_WARNING_LENGTH + 1)]), 'invalid-warnings')
  })

  it.each([
    ['número', [1]],
    ['nulo', [null]],
    ['objeto', [{ texto: 'x' }]],
    ['lista aninhada', [['x']]],
    ['vazio', ['']],
    ['só espaços', ['   ']],
    ['caractere de controle NUL', ['aviso\u0000']],
    ['sequência de escape', ['aviso\u001b[31m']],
  ])('rejeita aviso inválido (%s)', (_label, avisos) => {
    expectRejected(comAvisos(avisos), 'invalid-warnings')
  })

  it('rejeita avisos que não sejam uma lista', () => {
    expectRejected(comAvisos('um aviso'), 'invalid-structure')
    expectRejected(comAvisos({ 0: 'aviso' }), 'invalid-structure')
    expectRejected(comAvisos(null), 'invalid-structure')
  })

  it('preserva marcação HTML como texto, sem interpretá-la', () => {
    const html = ['<script>alert(1)</script> & <img src=x onerror=alert(1)>']
    const resultado = parseItineraryImport(comAvisos(html))
    expect(resultado.ok && resultado.itinerary.warnings).toEqual(html)
  })
})

describe('parseItineraryImport — entrada maliciosa e isolamento', () => {
  it('ignora campos adicionais e não polui protótipos', () => {
    const { doc, itinerary } = sample()
    const marcador = { polluted: true }
    for (const alvo of [
      doc,
      doc.resumo,
      doc.resumoFinanceiro,
      doc.roteiro[0],
      doc.roteiro[0].atividades[0],
    ] as Doc[]) {
      Object.defineProperty(alvo, '__proto__', {
        value: marcador,
        enumerable: true,
        configurable: true,
        writable: true,
      })
      Object.defineProperty(alvo, 'constructor', {
        value: { prototype: marcador },
        enumerable: true,
        configurable: true,
        writable: true,
      })
      alvo.id = 'roteiro-injetado'
      alvo.savedAt = '1999-01-01T00:00:00.000Z'
      alvo.extra = '<script>'
    }
    doc.roteiro[0].atividades[0].estimatedCost = 9999
    doc.resumo.destinationId = 'outro-destino'

    const result = parseItineraryImport(text(doc))

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.itinerary).toEqual(itinerary)
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    expect(Object.prototype.hasOwnProperty.call(Object.prototype, 'polluted')).toBe(false)
    expect(JSON.stringify(result)).not.toContain('injetado')
    expect(JSON.stringify(result)).not.toContain('<script>')
    expect(Object.keys(result.itinerary).sort()).toEqual(['days', 'input', 'totals', 'warnings'])
    expect(Object.keys(result.itinerary.input).sort()).toEqual([
      'budget',
      'days',
      'destinationId',
      'interests',
      'style',
    ])
    expect(Object.keys(result.itinerary.days[0].activities[0]).sort()).toEqual([
      'activity',
      'endMinutes',
      'period',
      'startMinutes',
    ])
  })

  it('não confia em propriedades herdadas ao procurar campos', () => {
    const { doc } = sample()
    const semResumo = JSON.parse(text(doc)) as Doc
    const resumo = semResumo.resumo
    delete semResumo.resumo
    // Se o serviço lesse campos herdados, um Object.prototype adulterado
    // por outro código supriria o campo ausente.
    Object.defineProperty(Object.prototype, 'resumo', {
      value: resumo,
      configurable: true,
    })
    try {
      expectRejected(text(semResumo), 'invalid-structure')
    } finally {
      delete (Object.prototype as Doc).resumo
    }
    expect(Object.prototype.hasOwnProperty.call(Object.prototype, 'resumo')).toBe(false)
  })

  it('devolve cópias independentes do catálogo', () => {
    const { doc, destination } = sample()
    const result = parseItineraryImport(text(doc))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const importada = result.itinerary.days[0].activities[0].activity
    const original = destination.activities.find((item) => item.id === importada.id)
    expect(original).toBeDefined()
    expect(importada).not.toBe(original)
    expect(importada.categories).not.toBe(original?.categories)
    expect(importada.suitableStyles).not.toBe(original?.suitableStyles)
    const nomeOriginal = original?.name
    importada.name = 'alterado'
    importada.categories.push('compras')
    expect(original?.name).toBe(nomeOriginal)
    expect(original?.categories).not.toContain('compras')
  })

  it('não toca no armazenamento nem gera identificadores', () => {
    localStorage.clear()
    const gravar = vi.spyOn(Storage.prototype, 'setItem')
    const ler = vi.spyOn(Storage.prototype, 'getItem')
    const remover = vi.spyOn(Storage.prototype, 'removeItem')
    const limpar = vi.spyOn(Storage.prototype, 'clear')
    const uuid = vi.spyOn(crypto, 'randomUUID')

    const { doc } = sample()
    expect(parseItineraryImport(text(doc)).ok).toBe(true)
    expectRejected('{', 'invalid-json')
    expectRejected(text({ ...doc, schemaVersion: 9 }), 'unsupported-version')

    expect(gravar).not.toHaveBeenCalled()
    expect(ler).not.toHaveBeenCalled()
    expect(remover).not.toHaveBeenCalled()
    expect(limpar).not.toHaveBeenCalled()
    expect(uuid).not.toHaveBeenCalled()
    expect(localStorage.length).toBe(0)
  })

  it('não lança exceção para entradas extremas', () => {
    const profundo = '['.repeat(2000) + ']'.repeat(2000)
    expect(() => parseItineraryImport(profundo)).not.toThrow()
    expect(parseItineraryImport(profundo).ok).toBe(false)
    expect(() => parseItineraryImport('{"a":' + '1'.repeat(50_000) + '}')).not.toThrow()
    expect(() => parseItineraryImport(undefined as unknown as string)).not.toThrow()
    expect(parseItineraryImport(undefined as unknown as string).ok).toBe(false)
    expect(parseItineraryImport(42 as unknown as string).ok).toBe(false)
  })
})
