import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { destinations } from '../data/destinations'
import { serializeItineraryExport } from '../services/itineraryExport'
import { generateItinerary, PACE_MAX_ACTIVITIES_PER_DAY } from '../services/itineraryGenerator'
import { parseItineraryImport } from '../services/itineraryImport'
import {
  arePlanningsEquivalent,
  loadSavedItineraries,
  saveItinerary,
  STORAGE_KEY,
  validateSavedItinerary,
} from '../services/itineraryStorage'
import type { Destination, InterestCategory, Itinerary, PlanningInput, SavedItinerary, TravelStyle, TripPace } from '../types'
import { TRIP_PACES } from '../utils/interests'
import { installWebLocksMock, uninstallWebLocksMock } from './helpers/webLocksMock'

/**
 * Ritmo da viagem (M3): limite de atividades por dia (Tranquilo 2, Equilibrado 3,
 * Intenso sem limite adicional). Sem ritmo, o comportamento do motor é o anterior.
 */

const STYLES: TravelStyle[] = ['economico', 'equilibrado', 'confortavel']
const ALL: InterestCategory[] = ['gastronomia', 'natureza', 'cultura', 'aventura', 'compras', 'relaxamento', 'vida-noturna']
const SETS: InterestCategory[][] = [ALL, ['cultura'], ['natureza', 'gastronomia']]
const DAYS = [1, 2, 3, 5, 7, 14]
const BUDGETS: Array<number | undefined> = [undefined, 100, 1000, 1_000_000]
const PACES: TripPace[] = ['tranquilo', 'equilibrado', 'intenso']

const dest = (id: string) => destinations.find((item) => item.id === id) as Destination

function gen(input: PlanningInput): Itinerary {
  const result = generateItinerary(input, dest(input.destinationId))
  if (!result.ok) throw new Error(result.message)
  return result.itinerary
}

function tryGen(input: PlanningInput) {
  return generateItinerary(input, dest(input.destinationId))
}

function input(destinationId: string, days: number, interests: InterestCategory[], style: TravelStyle, budget?: number, pace?: TripPace): PlanningInput {
  return { destinationId, days, interests, style, ...(budget === undefined ? {} : { budget }), ...(pace ? { pace } : {}) }
}

const perDay = (itinerary: Itinerary) => itinerary.days.map((day) => day.activities.length)
const placedCount = (itinerary: Itinerary) => perDay(itinerary).reduce((sum, n) => sum + n, 0)
const activityIds = (itinerary: Itinerary) => itinerary.days.flatMap((day) => day.activities.map((item) => item.activity.id))

/** Cenários em que a geração é possível (alguns orçamentos baixos não comportam nenhuma atividade). */
function scenarios(): Array<{ key: string; base: PlanningInput }> {
  const list: Array<{ key: string; base: PlanningInput }> = []
  for (const destination of destinations) {
    for (const style of STYLES) {
      for (const days of DAYS) {
        SETS.forEach((interests, setIndex) => {
          for (const budget of BUDGETS) {
            const base = input(destination.id, days, interests, style, budget)
            if (tryGen(base).ok) list.push({ key: `${destination.id}|${style}|${days}|i${setIndex}|${budget ?? 'sem'}`, base })
          }
        })
      }
    }
  }
  return list
}

describe('Constantes do ritmo', () => {
  it('Tranquilo 2, Equilibrado 3, Intenso sem limite adicional', () => {
    expect(PACE_MAX_ACTIVITIES_PER_DAY).toEqual({ tranquilo: 2, equilibrado: 3, intenso: null })
  })

  it('os textos da interface descrevem exatamente esses limites', () => {
    const text = Object.fromEntries(TRIP_PACES.map((pace) => [pace.id, pace.description]))
    expect(text.tranquilo).toMatch(/2 atividades/)
    expect(text.equilibrado).toMatch(/3 atividades/)
    expect(text.intenso).toMatch(/Sem limite/i)
    for (const pace of TRIP_PACES) expect(pace.description).not.toMatch(/esfor|intensidade física|acessib|garant/i)
  })
})

describe('Limite diário por ritmo', () => {
  const all = scenarios()

  it('há muitos cenários válidos para exercitar o motor', () => {
    expect(all.length).toBeGreaterThan(500)
  })

  it('Tranquilo: no máximo 2 atividades por dia, em todos os cenários (com e sem orçamento)', () => {
    for (const { key, base } of all) {
      const itinerary = gen({ ...base, pace: 'tranquilo' })
      expect(Math.max(...perDay(itinerary)), key).toBeLessThanOrEqual(2)
    }
  })

  it('Equilibrado: no máximo 3 atividades por dia, em todos os cenários', () => {
    for (const { key, base } of all) {
      const itinerary = gen({ ...base, pace: 'equilibrado' })
      expect(Math.max(...perDay(itinerary)), key).toBeLessThanOrEqual(3)
    }
  })

  it('Intenso: resultado idêntico ao do motor sem ritmo (apenas o ritmo é gravado)', () => {
    for (const { key, base } of all) {
      const plain = gen(base)
      const intense = gen({ ...base, pace: 'intenso' })
      expect(intense.days, key).toEqual(plain.days)
      expect(intense.totals, key).toEqual(plain.totals)
      expect(intense.warnings, key).toEqual(plain.warnings)
      expect(intense.input.pace).toBe('intenso')
    }
  })

  it('o ritmo realmente muda o resultado onde há atividades demais para o limite', () => {
    const base = input('lisboa', 1, ALL, 'economico', 1_000_000)
    const intense = gen({ ...base, pace: 'intenso' })
    const balanced = gen({ ...base, pace: 'equilibrado' })
    const calm = gen({ ...base, pace: 'tranquilo' })
    expect(placedCount(intense)).toBe(4)
    expect(placedCount(balanced)).toBe(3)
    expect(placedCount(calm)).toBe(2)
  })
})

describe('Distribuição antes do descarte e aviso', () => {
  const all = scenarios()

  it('só há descarte por ritmo quando o limite foi atingido em algum dia; sem aviso, nada muda em relação ao Intenso', () => {
    let withWarning = 0
    for (const { key, base } of all) {
      for (const pace of ['tranquilo', 'equilibrado'] as const) {
        const cap = PACE_MAX_ACTIVITIES_PER_DAY[pace] as number
        const paced = gen({ ...base, pace })
        const warning = paced.warnings.find((text) => /pelo ritmo/.test(text))
        if (warning) {
          withWarning += 1
          // Algum dia atingiu o limite (a atividade excluída só caberia em um dia cheio) e nenhum o excede.
          expect(Math.max(...perDay(paced)), `${key} ${pace}`).toBe(cap)
        } else {
          expect(paced.days, `${key} ${pace}`).toEqual(gen({ ...base, pace: 'intenso' }).days)
        }
      }
    }
    expect(withWarning).toBeGreaterThan(20)
  })

  it('o número no aviso fecha a conta: excluídos pelo ritmo = colocadas(Intenso) + não couberam(Intenso) − colocadas − não couberam', () => {
    const countIn = (itinerary: Itinerary, pattern: RegExp) => {
      const text = itinerary.warnings.find((item) => pattern.test(item))
      return text ? Number(/^(\d+)/.exec(text)?.[1]) : 0
    }
    for (const { key, base } of all) {
      const intense = gen({ ...base, pace: 'intenso' })
      for (const pace of ['tranquilo', 'equilibrado'] as const) {
        const paced = gen({ ...base, pace })
        const skipped = countIn(paced, /pelo ritmo/)
        const unplacedPaced = countIn(paced, /não couber|não coube/)
        const unplacedIntense = countIn(intense, /não couber|não coube/)
        expect(skipped, `${key} ${pace}`).toBe(placedCount(intense) + unplacedIntense - placedCount(paced) - unplacedPaced)
      }
    }
  })

  it('a mensagem é clara, cita o ritmo e o limite, e não promete esforço físico nem acessibilidade', () => {
    const calm = gen({ ...input('rio-de-janeiro', 1, ALL, 'equilibrado', 1_000_000), pace: 'tranquilo' })
    const warning = calm.warnings.find((text) => /pelo ritmo/.test(text)) as string
    expect(warning).toMatch(/^\d+ atividades? compatíveis? ficou|^\d+ atividade compatível ficou|^\d+ atividades compatíveis ficaram/)
    expect(warning).toContain('Tranquilo')
    expect(warning).toContain('máximo de 2 atividades por dia')
    expect(warning).not.toMatch(/esfor|acessib|garant/i)
    const single = Object.values(
      Object.fromEntries(all.map(({ base }) => [JSON.stringify(base), gen({ ...base, pace: 'tranquilo' }).warnings.find((text) => /pelo ritmo/.test(text))])),
    ).find((text) => text && /^1 atividade compatível ficou/.test(text))
    if (single) expect(single).toMatch(/incluí-la/)
  })
})

describe('Restrições preservadas com ritmo', () => {
  it('sem repetição, sem conflito de horário, períodos e orçamento respeitados (invariantes de persistência)', () => {
    for (const { key, base } of scenarios()) {
      for (const pace of PACES) {
        const itinerary = gen({ ...base, pace })
        const ids = activityIds(itinerary)
        expect(new Set(ids).size, `${key} ${pace}`).toBe(ids.length)
        const result = validateSavedItinerary({ id: 'x', savedAt: '2026-10-12T12:00:00.000Z', itinerary })
        expect(result.ok, `${key} ${pace}: ${result.reasons.join('; ')}`).toBe(true)
        if (base.budget !== undefined) expect(itinerary.totals.estimatedActivitiesCost, `${key} ${pace}`).toBeLessThanOrEqual(base.budget)
      }
    }
  })

  it('é determinístico', () => {
    const base = input('florianopolis', 5, ALL, 'equilibrado', undefined, 'tranquilo')
    expect(gen(base)).toEqual(gen(base))
  })

  it('não repete atrações para completar dias: dias vazios continuam vazios', () => {
    const itinerary = gen(input('florianopolis', 14, ALL, 'economico', undefined, 'tranquilo'))
    const ids = activityIds(itinerary)
    expect(new Set(ids).size).toBe(ids.length)
    expect(perDay(itinerary).filter((n) => n === 0).length).toBeGreaterThan(0)
  })

  it('as regras de orçamento do M2 seguem iguais com ritmo (orçamento insuficiente, inválido, ausente)', () => {
    expect(tryGen({ ...input('rio-de-janeiro', 3, ['cultura'], 'equilibrado', 0.01), pace: 'tranquilo' }).ok).toBe(false)
    expect(tryGen({ ...input('rio-de-janeiro', 3, ['cultura'], 'equilibrado'), budget: 0, pace: 'tranquilo' }).ok).toBe(false)
    expect(tryGen({ ...input('rio-de-janeiro', 3, ['cultura'], 'equilibrado', undefined, 'tranquilo') }).ok).toBe(true)
    const withBudget = gen(input('rio-de-janeiro', 3, ALL, 'equilibrado', 300, 'tranquilo'))
    expect(withBudget.totals.unallocatedBudget).toBe(300 - withBudget.totals.estimatedActivitiesCost)
    expect(gen(input('rio-de-janeiro', 3, ALL, 'equilibrado', undefined, 'tranquilo')).totals).not.toHaveProperty('unallocatedBudget')
  })
})

describe('Invariante de persistência e importação do limite do ritmo', () => {
  function overLimit(): Itinerary {
    const intense = gen(input('rio-de-janeiro', 1, ALL, 'equilibrado', 1_000_000, 'intenso'))
    expect(perDay(intense)[0]).toBeGreaterThan(2)
    return { ...intense, input: { ...intense.input, pace: 'tranquilo' } }
  }

  it('um roteiro com mais atividades por dia que o limite do ritmo é inválido', () => {
    const result = validateSavedItinerary({ id: 'x', savedAt: '2026-10-12T12:00:00.000Z', itinerary: overLimit() })
    expect(result.ok).toBe(false)
    expect(result.reasons.join(' ')).toMatch(/excede o limite de 2 atividades do ritmo tranquilo/)
  })

  it('a importação rejeita arquivo adulterado com ritmo incompatível com os dias', () => {
    const itinerary = overLimit()
    const doc = JSON.parse(serializeItineraryExport({ id: 'x', savedAt: '2026-10-12T12:00:00.000Z', itinerary }, dest('rio-de-janeiro')))
    const result = parseItineraryImport(JSON.stringify(doc))
    expect(result.ok).toBe(false)
    expect(!result.ok && result.code).toBe('validation-failed')
  })

  it('roteiros sem ritmo (anteriores) nunca são limitados pela regra', () => {
    const plain = gen(input('rio-de-janeiro', 1, ALL, 'equilibrado', 1_000_000))
    expect(plain.input).not.toHaveProperty('pace')
    expect(validateSavedItinerary({ id: 'x', savedAt: '2026-10-12T12:00:00.000Z', itinerary: plain }).ok).toBe(true)
  })
})

describe('Persistência, JSON e deduplicação com ritmo', () => {
  beforeEach(() => {
    localStorage.clear()
    installWebLocksMock()
  })

  afterEach(() => {
    uninstallWebLocksMock()
  })

  it.each(PACES)('ritmo %s: gera, salva, reabre, exporta v2 e importa preservando o ritmo', async (pace) => {
    const itinerary = gen(input('lisboa', 4, ALL, 'equilibrado', pace === 'intenso' ? undefined : 500, pace))
    expect((await saveItinerary(itinerary)).ok).toBe(true)
    const reloaded = loadSavedItineraries()
    expect(reloaded.status).toBe('ok')
    expect(reloaded.records[0].itinerary.input.pace).toBe(pace)
    const json = serializeItineraryExport(reloaded.records[0], dest('lisboa'))
    expect(JSON.parse(json).resumo.ritmo).toBe(pace)
    const imported = parseItineraryImport(json)
    expect(imported.ok && imported.itinerary).toEqual(itinerary)
  })

  it('a deduplicação considera o ritmo: mesmo planejamento com ritmos diferentes são registros distintos', async () => {
    const calm = gen(input('lisboa', 3, ALL, 'equilibrado', 400, 'tranquilo'))
    const intense = gen(input('lisboa', 3, ALL, 'equilibrado', 400, 'intenso'))
    const plain = gen(input('lisboa', 3, ALL, 'equilibrado', 400))
    expect(arePlanningsEquivalent(calm.input, intense.input)).toBe(false)
    expect(arePlanningsEquivalent(plain.input, intense.input)).toBe(false) // ausente ≠ intenso explícito
    expect((await saveItinerary(calm)).ok).toBe(true)
    expect((await saveItinerary(intense)).ok).toBe(true)
    expect((await saveItinerary(plain)).ok).toBe(true)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toHaveLength(3)
    const again = await saveItinerary(gen(input('lisboa', 3, ALL, 'equilibrado', 400, 'tranquilo')))
    expect(again.ok === false && again.outcome).toBe('needs-confirmation')
  })

  it('arquivo v1 histórico (sem ritmo) segue importável e continua sem ritmo', () => {
    const itinerary = gen(input('lisboa', 3, ['cultura', 'gastronomia'], 'equilibrado', 400))
    const v1 = { ...JSON.parse(serializeItineraryExport({ id: 'h', savedAt: '2026-01-15T10:00:00.000Z', itinerary } as SavedItinerary, dest('lisboa'))), schemaVersion: 1 }
    const imported = parseItineraryImport(JSON.stringify(v1))
    expect(imported.ok && imported.itinerary).toEqual(itinerary)
    expect(imported.ok && imported.itinerary.input).not.toHaveProperty('pace')
  })
})
