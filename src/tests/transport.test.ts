import { describe, expect, it } from 'vitest'

import {
  chooseArrival,
  DEFAULT_TRANSPORT,
  describeTransport,
  isTransportComplete,
  MAX_ORIGIN_LENGTH,
  toggleLocal,
  validateOrigin,
} from '../utils/transport'

describe('transport', () => {
  it('começa sem escolhas', () => {
    expect(DEFAULT_TRANSPORT).toEqual({ arrival: null, origin: '', local: [] })
    expect(isTransportComplete(DEFAULT_TRANSPORT)).toBe(true)
    expect(describeTransport(DEFAULT_TRANSPORT)).toBe('ainda não definido')
  })

  it('transporte até o destino é escolha única e alterna', () => {
    let t = chooseArrival(DEFAULT_TRANSPORT, 'aviao')
    expect(t.arrival).toBe('aviao')
    t = chooseArrival(t, 'trem')
    expect(t.arrival).toBe('trem')
    expect(chooseArrival(t, 'trem').arrival).toBeNull()
  })

  it('deslocamentos locais combinam, mantêm a ordem do catálogo e removem', () => {
    let t = toggleLocal(DEFAULT_TRANSPORT, 'caminhada')
    t = toggleLocal(t, 'taxi-app')
    t = toggleLocal(t, 'publico')
    expect(t.local).toEqual(['taxi-app', 'publico', 'caminhada'])
    expect(toggleLocal(t, 'publico').local).toEqual(['taxi-app', 'caminhada'])
  })

  it('"Ainda não decidi" é exclusivo nos dois sentidos', () => {
    let t = toggleLocal(toggleLocal(DEFAULT_TRANSPORT, 'caminhada'), 'carro-alugado')
    t = toggleLocal(t, 'indefinido')
    expect(t.local).toEqual(['indefinido'])
    t = toggleLocal(t, 'publico')
    expect(t.local).toEqual(['publico'])
    t = toggleLocal(toggleLocal(t, 'indefinido'), 'indefinido')
    expect(t.local).toEqual([])
  })

  it('"Combinação de transportes" é uma opção comum, combinável', () => {
    const t = toggleLocal(toggleLocal(DEFAULT_TRANSPORT, 'combinacao'), 'caminhada')
    expect(t.local).toEqual(['caminhada', 'combinacao'])
  })

  describe('cidade de origem', () => {
    it.each(['', '   '])('vazio é aceito (%j)', (text) => {
      expect(validateOrigin(text)).toEqual({ status: 'empty' })
    })

    it.each([
      ['São Paulo', 'São Paulo'],
      ['  Rio   de  Janeiro ', 'Rio de Janeiro'],
      ["Sant'Ana do Livramento", "Sant'Ana do Livramento"],
      ['Foz do Iguaçu', 'Foz do Iguaçu'],
      ['Porto, Portugal', 'Porto, Portugal'],
      ['Ribeirão-Preto', 'Ribeirão-Preto'],
      ['St. Louis', 'St. Louis'],
      ['Zürich', 'Zürich'],
    ])('aceita %j', (text, value) => {
      expect(validateOrigin(text)).toEqual({ status: 'valid', value })
    })

    it.each(['A', '1234', 'Rio 2', '<script>', 'Lisboa; DROP', '😀😀', '-Rio', 'São/Paulo'])('rejeita %j', (text) => {
      expect(validateOrigin(text).status).toBe('invalid')
    })

    it('limita o tamanho', () => {
      expect(validateOrigin('a'.repeat(MAX_ORIGIN_LENGTH)).status).toBe('valid')
      expect(validateOrigin('a'.repeat(MAX_ORIGIN_LENGTH + 1)).status).toBe('invalid')
    })

    it('origem inválida torna a etapa incompleta', () => {
      expect(isTransportComplete({ ...DEFAULT_TRANSPORT, origin: 'Rio 2' })).toBe(false)
      expect(isTransportComplete({ ...DEFAULT_TRANSPORT, origin: 'Rio' })).toBe(true)
    })
  })

  it('descreve as escolhas sem tratar a origem como verificada', () => {
    expect(
      describeTransport({ arrival: 'aviao', origin: 'Curitiba', local: ['taxi-app', 'caminhada'] }),
    ).toBe('Avião (saindo de Curitiba); local: Táxi ou aplicativo, Caminhada')
    expect(describeTransport({ arrival: null, origin: 'Curitiba', local: [] })).toBe('saindo de Curitiba')
    expect(describeTransport({ arrival: null, origin: 'Rio 2', local: [] })).toBe('ainda não definido')
  })
})
