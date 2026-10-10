import { describe, expect, it } from 'vitest'

import { destinations } from '../data/destinations'

/**
 * Testes de integridade da base local de destinos (CHECKPOINT 1).
 * A suíte completa de testes de comportamento será criada no CHECKPOINT 4.
 */
describe('base de destinos', () => {
  it('contém pelo menos três destinos cadastrados', () => {
    expect(destinations.length).toBeGreaterThanOrEqual(3)
  })

  it('cada destino possui pelo menos oito atividades', () => {
    for (const destination of destinations) {
      expect(
        destination.activities.length,
        `${destination.name} deve ter ao menos 8 atividades`,
      ).toBeGreaterThanOrEqual(8)
    }
  })

  it('cada destino possui moeda, país e descrição definidos', () => {
    for (const destination of destinations) {
      expect(destination.country).toBeTruthy()
      expect(destination.description).toBeTruthy()
      expect(destination.currency.code).toMatch(/^[A-Z]{3}$/)
      expect(destination.currency.symbol).toBeTruthy()
    }
  })

  it('cada destino possui orientação de transporte definida', () => {
    for (const destination of destinations) {
      expect(
        destination.transportNote,
        `${destination.name} deve ter orientação de transporte`,
      ).toBeTruthy()
    }
  })

  it('não existem atividades duplicadas dentro de um mesmo destino', () => {
    for (const destination of destinations) {
      const ids = destination.activities.map((activity) => activity.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('toda atividade possui dados obrigatórios válidos', () => {
    for (const destination of destinations) {
      for (const activity of destination.activities) {
        expect(activity.name).toBeTruthy()
        expect(activity.categories.length).toBeGreaterThan(0)
        expect(activity.durationHours).toBeGreaterThan(0)
        expect(activity.estimatedCost).toBeGreaterThanOrEqual(0)
        expect(activity.suitableStyles.length).toBeGreaterThan(0)
      }
    }
  })
})
