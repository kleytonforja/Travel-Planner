import { describe, expect, it } from 'vitest'

import {
  countTripDays,
  formatShortDate,
  isValidDuration,
  MAX_DAYS,
  MIN_DAYS,
  parseDurationInput,
  todayISO,
  toDayNumber,
  validateTripDates,
} from '../utils/tripDates'

const TODAY = '2026-10-12'

describe('toDayNumber', () => {
  it.each(['2026-01-01', '2028-02-29', '2026-12-31', '1970-01-01'])('aceita %s', (value) => {
    expect(toDayNumber(value)).not.toBeNull()
  })

  it.each([
    '',
    '2026-02-30',
    '2027-02-29',
    '2026-04-31',
    '2026-13-01',
    '2026-00-10',
    '2026-10-00',
    '2026-1-5',
    '26-10-12',
    '12/10/2026',
    '2026-10-12T10:00:00',
    ' 2026-10-12',
  ])('rejeita %j', (value) => {
    expect(toDayNumber(value)).toBeNull()
  })

  it('dias consecutivos têm números consecutivos', () => {
    expect(toDayNumber('2026-03-01')! - toDayNumber('2026-02-28')!).toBe(1)
    expect(toDayNumber('2028-03-01')! - toDayNumber('2028-02-28')!).toBe(2)
  })
})

describe('countTripDays (contagem inclusiva, sem fuso)', () => {
  it.each([
    ['mesmo dia', '2026-10-12', '2026-10-12', 1],
    ['uma semana e um dia (exemplo da referência)', '2026-01-12', '2026-01-19', 8],
    ['virada de mês', '2026-01-30', '2026-02-02', 4],
    ['virada de ano', '2026-12-30', '2027-01-02', 4],
    ['fevereiro bissexto', '2028-02-28', '2028-03-01', 3],
    ['fevereiro não bissexto', '2027-02-28', '2027-03-01', 2],
    ['horário de verão europeu (março)', '2026-03-28', '2026-03-30', 3],
    ['fim do horário de verão europeu (outubro)', '2026-10-24', '2026-10-26', 3],
    ['horário de verão americano (março)', '2026-03-07', '2026-03-09', 3],
    ['fim do horário de verão americano (novembro)', '2026-10-31', '2026-11-02', 3],
  ])('%s', (_label, start, end, expected) => {
    expect(countTripDays(start, end)).toBe(expected)
  })

  it('devolve null para datas inválidas ou invertidas', () => {
    expect(countTripDays('2026-10-20', '2026-10-19')).toBeNull()
    expect(countTripDays('2026-02-30', '2026-03-05')).toBeNull()
    expect(countTripDays('', '2026-03-05')).toBeNull()
  })

  it('confere com a contagem dia a dia (UTC) em todo o período de 2026 a 2028', () => {
    const MS = 86_400_000
    let checked = 0
    for (let time = Date.UTC(2026, 0, 1); time <= Date.UTC(2028, 11, 31); time += MS) {
      const start = new Date(time).toISOString().slice(0, 10)
      for (const length of [1, 2, 7, 14, 15, 20]) {
        const end = new Date(time + (length - 1) * MS).toISOString().slice(0, 10)
        expect(countTripDays(start, end), `${start} a ${end}`).toBe(length)
        checked += 1
      }
    }
    expect(checked).toBeGreaterThan(6000)
  })
})

describe('validateTripDates', () => {
  it('fica incompleto enquanto faltar uma das datas, sem mensagem de erro', () => {
    expect(validateTripDates('', '', TODAY)).toEqual({ status: 'incomplete' })
    expect(validateTripDates('2026-10-20', '', TODAY)).toEqual({ status: 'incomplete' })
    expect(validateTripDates('', '2026-10-20', TODAY)).toEqual({ status: 'incomplete' })
  })

  it('aceita intervalos válidos e calcula a duração', () => {
    expect(validateTripDates('2026-10-20', '2026-10-27', TODAY)).toEqual({ status: 'valid', days: 8 })
    expect(validateTripDates('2026-10-12', '2026-10-12', TODAY)).toEqual({ status: 'valid', days: 1 })
    expect(validateTripDates('2026-10-12', '2026-10-25', TODAY)).toEqual({ status: 'valid', days: MAX_DAYS })
  })

  it('rejeita datas inexistentes no calendário', () => {
    expect(validateTripDates('2026-02-30', '2026-03-05', TODAY)).toMatchObject({
      status: 'invalid',
      field: 'start',
    })
    expect(validateTripDates('2026-11-10', '2026-11-31', TODAY)).toMatchObject({
      status: 'invalid',
      field: 'end',
    })
  })

  it('rejeita início anterior a hoje, mas aceita hoje', () => {
    const past = validateTripDates('2026-10-11', '2026-10-15', TODAY)
    expect(past).toMatchObject({ status: 'invalid', field: 'start' })
    expect(past.status === 'invalid' && past.message).toMatch(/anterior a hoje/)
    expect(validateTripDates('2026-10-12', '2026-10-15', TODAY).status).toBe('valid')
  })

  it('rejeita término anterior ao início', () => {
    const result = validateTripDates('2026-10-20', '2026-10-19', TODAY)
    expect(result).toMatchObject({ status: 'invalid', field: 'end' })
    expect(result.status === 'invalid' && result.message).toMatch(/igual ou posterior/)
  })

  it('rejeita viagens acima do limite do motor e informa o tamanho', () => {
    const result = validateTripDates('2026-10-12', '2026-10-26', TODAY)
    expect(result).toMatchObject({ status: 'invalid', field: 'range' })
    expect(result.status === 'invalid' && result.message).toContain('15 dias')
    expect(result.status === 'invalid' && result.message).toContain(`${MAX_DAYS} dias`)
  })

  it('usa os limites do validador do motor', () => {
    expect(MIN_DAYS).toBe(1)
    expect(MAX_DAYS).toBe(14)
  })
})

describe('duração informada diretamente', () => {
  it('isValidDuration aceita só inteiros de 1 a 14', () => {
    for (const ok of [1, 3, 7, 14]) expect(isValidDuration(ok)).toBe(true)
    for (const bad of [0, 15, -1, 2.5, Number.NaN, Number.POSITIVE_INFINITY, null]) {
      expect(isValidDuration(bad as number | null)).toBe(false)
    }
  })

  it('parseDurationInput interpreta texto digitado', () => {
    expect(parseDurationInput('7')).toBe(7)
    expect(parseDurationInput(' 14 ')).toBe(14)
    expect(parseDurationInput('007')).toBe(7)
    for (const bad of ['', '0', '15', '3.5', '-2', 'abc', '1e1', '1,5', '1000']) {
      expect(parseDurationInput(bad), bad).toBeNull()
    }
  })
})

describe('formatação', () => {
  it('todayISO usa o calendário local', () => {
    expect(todayISO(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(todayISO(new Date(2026, 11, 31, 0, 1))).toBe('2026-12-31')
  })

  it('formatShortDate mostra dia da semana e data sem deslocar o dia', () => {
    const text = formatShortDate('2026-01-12')
    expect(text).toContain('12/01')
    expect(text.toLowerCase()).toContain('seg')
    expect(formatShortDate('2026-01-19')).toContain('19/01')
    expect(formatShortDate('inválida')).toBe('inválida')
  })
})
