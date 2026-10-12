import { describe, expect, it } from 'vitest'

import {
  DEFAULT_TRAVELERS,
  describeTravelers,
  MAX_TRAVELERS,
  setChildAge,
  setProfile,
  setTravelerCount,
  toggleAccessibility,
  totalTravelers,
  travelerBounds,
  validateTravelers,
  type TravelersDraft,
} from '../utils/travelers'

const base = (patch: Partial<TravelersDraft> = {}): TravelersDraft => ({ ...DEFAULT_TRAVELERS, ...patch })

describe('travelers', () => {
  it('começa com 1 adulto, sem perfil nem necessidades', () => {
    expect(DEFAULT_TRAVELERS).toMatchObject({ adults: 1, children: 0, infants: 0, profile: null, accessibility: [] })
    expect(validateTravelers(DEFAULT_TRAVELERS)).toEqual({ valid: true })
  })

  it('nunca aceita negativos nem menos de 1 adulto', () => {
    expect(setTravelerCount(base(), 'adults', 0).adults).toBe(1)
    expect(setTravelerCount(base(), 'adults', -5).adults).toBe(1)
    expect(setTravelerCount(base(), 'children', -1).children).toBe(0)
    expect(setTravelerCount(base(), 'infants', -1).infants).toBe(0)
    expect(setTravelerCount(base(), 'adults', Number.NaN)).toEqual(base())
  })

  it('trunca decimais e respeita o limite total', () => {
    expect(setTravelerCount(base(), 'adults', 3.9).adults).toBe(3)
    const full = setTravelerCount(base(), 'adults', 50)
    expect(full.adults).toBe(MAX_TRAVELERS)
    expect(setTravelerCount(full, 'children', 1).children).toBe(0)
    const mixed = setTravelerCount(setTravelerCount(base({ adults: 10 }), 'children', 50), 'children', 50)
    expect(totalTravelers(mixed)).toBe(MAX_TRAVELERS)
  })

  it('não exige um adulto por bebê: só 1 adulto no grupo e o limite total', () => {
    const two = base({ adults: 2 })
    expect(setTravelerCount(two, 'infants', 5).infants).toBe(5)
    const withInfants = base({ adults: 2, infants: 5 })
    expect(travelerBounds(withInfants, 'adults').min).toBe(1)
    expect(setTravelerCount(withInfants, 'adults', 1).adults).toBe(1)
    expect(setTravelerCount(withInfants, 'adults', 0).adults).toBe(1)
    expect(validateTravelers(base({ adults: 1, infants: 4 }))).toEqual({ valid: true })
    expect(validateTravelers(base({ adults: 0, infants: 4 })).valid).toBe(false)
    const crowded = setTravelerCount(base(), 'infants', 50)
    expect(crowded.infants).toBe(MAX_TRAVELERS - 1)
    expect(totalTravelers(crowded)).toBe(MAX_TRAVELERS)
    expect(validateTravelers(base({ adults: 1, infants: 20 })).valid).toBe(false)
  })

  it('faixas etárias nunca somam mais que as crianças e se ajustam ao reduzir', () => {
    let t = base({ children: 3 })
    t = setChildAge(t, '3-5', 2)
    t = setChildAge(t, '6-11', 5)
    expect(t.childAges).toEqual({ '3-5': 2, '6-11': 1, '12-17': 0 })
    t = setTravelerCount(t, 'children', 1)
    expect(t.childAges['3-5'] + t.childAges['6-11'] + t.childAges['12-17']).toBeLessThanOrEqual(1)
    t = setTravelerCount(t, 'children', 0)
    expect(t.childAges).toEqual({ '3-5': 0, '6-11': 0, '12-17': 0 })
    expect(setChildAge(base(), '3-5', 1).childAges['3-5']).toBe(0)
  })

  it('perfil alterna e nunca é inferido da composição', () => {
    let t = setTravelerCount(base(), 'children', 2)
    expect(t.profile).toBeNull()
    t = setProfile(t, 'amigos')
    expect(t.profile).toBe('amigos')
    expect(setProfile(t, 'amigos').profile).toBeNull()
    expect(setProfile(t, 'casal').profile).toBe('casal')
    expect(setTravelerCount(t, 'adults', 4).profile).toBe('amigos')
  })

  it('necessidades de acessibilidade alternam sem duplicar', () => {
    let t = toggleAccessibility(base(), 'visual')
    t = toggleAccessibility(t, 'mobilidade')
    expect(t.accessibility).toEqual(['mobilidade', 'visual'])
    expect(toggleAccessibility(t, 'visual').accessibility).toEqual(['mobilidade'])
  })

  it('valida estados inválidos vindos de fora', () => {
    expect(validateTravelers(base({ adults: 0 })).valid).toBe(false)
    expect(validateTravelers(base({ children: -1 })).valid).toBe(false)
    expect(validateTravelers(base({ adults: 1.5 })).valid).toBe(false)
    expect(validateTravelers(base({ adults: 15, children: 6 })).valid).toBe(false)
  })

  it('descreve o grupo no singular e no plural', () => {
    expect(describeTravelers(base())).toBe('1 adulto')
    expect(describeTravelers(base({ adults: 2, children: 1, infants: 2 }))).toBe('2 adultos, 1 criança, 2 bebês')
  })
})
