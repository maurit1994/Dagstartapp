import { describe, expect, it } from 'vitest'
import { formatSleepDuration, parseTime, sleepMinutes } from '../sleep.js'

describe('parseTime', () => {
  it('reads a normal time', () => {
    expect(parseTime('07:15')).toBe(7 * 60 + 15)
    expect(parseTime('23:30')).toBe(23 * 60 + 30)
    expect(parseTime('00:00')).toBe(0)
  })

  it('accepts a single-digit hour', () => {
    expect(parseTime('7:05')).toBe(7 * 60 + 5)
  })

  it('rejects nonsense rather than guessing', () => {
    expect(parseTime('25:00')).toBeNull()
    expect(parseTime('07:75')).toBeNull()
    expect(parseTime('halfacht')).toBeNull()
    expect(parseTime('')).toBeNull()
    expect(parseTime(null)).toBeNull()
    expect(parseTime(730)).toBeNull()
  })
})

describe('sleepMinutes — the across-midnight case', () => {
  it('handles a night that crosses midnight', () => {
    expect(sleepMinutes('23:30', '07:15')).toBe(7 * 60 + 45)
    expect(sleepMinutes('22:00', '06:00')).toBe(8 * 60)
  })

  it('handles going to bed after midnight', () => {
    expect(sleepMinutes('01:30', '09:00')).toBe(7 * 60 + 30)
  })

  it('handles a nap that does not cross midnight', () => {
    expect(sleepMinutes('13:00', '14:30')).toBe(90)
  })

  it('never returns a negative duration', () => {
    for (const [bed, wake] of [
      ['23:59', '00:01'],
      ['20:00', '04:00'],
      ['03:00', '02:00'],
    ]) {
      expect(sleepMinutes(bed, wake)).toBeGreaterThan(0)
    }
  })

  it('is null when a time is missing', () => {
    expect(sleepMinutes('23:00', null)).toBeNull()
    expect(sleepMinutes(null, '07:00')).toBeNull()
    expect(sleepMinutes('', '')).toBeNull()
  })
})

describe('formatSleepDuration', () => {
  it('formats hours and minutes', () => {
    expect(formatSleepDuration('23:30', '07:15')).toBe('7u 45m')
  })

  it('drops the minutes when there are none', () => {
    expect(formatSleepDuration('23:00', '07:00')).toBe('8u')
  })

  it('is null when it cannot be computed', () => {
    expect(formatSleepDuration('23:00', '')).toBeNull()
  })
})
