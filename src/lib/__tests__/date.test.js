import { describe, expect, it } from 'vitest'
import {
  daysBetweenKeys,
  getDateKeyDaysAgo,
  getLocalDateKey,
  relativeDayNameNL,
} from '../date.js'

describe('getLocalDateKey', () => {
  it('formats as YYYY-MM-DD with zero padding', () => {
    expect(getLocalDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(getLocalDateKey(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('uses the LOCAL calendar day, not the UTC one', () => {
    // 00:30 local. In any timezone ahead of UTC, toISOString() would report
    // the previous day — the bug this helper exists to prevent.
    const justAfterMidnight = new Date(2026, 8, 14, 0, 30)
    expect(getLocalDateKey(justAfterMidnight)).toBe('2026-09-14')
  })

  it('still uses the local day late at night', () => {
    // 23:30 local. In any timezone behind UTC, toISOString() would report
    // the NEXT day.
    expect(getLocalDateKey(new Date(2026, 8, 14, 23, 30))).toBe('2026-09-14')
  })
})

describe('getDateKeyDaysAgo', () => {
  it('walks back across a month boundary', () => {
    expect(getDateKeyDaysAgo(1, new Date(2026, 8, 1))).toBe('2026-08-31')
  })

  it('returns the day itself for 0', () => {
    expect(getDateKeyDaysAgo(0, new Date(2026, 8, 14))).toBe('2026-09-14')
  })
})

describe('daysBetweenKeys', () => {
  it('counts whole calendar days', () => {
    expect(daysBetweenKeys('2026-09-13', '2026-09-14')).toBe(1)
    expect(daysBetweenKeys('2026-09-14', '2026-09-14')).toBe(0)
    expect(daysBetweenKeys('2026-08-31', '2026-09-01')).toBe(1)
  })

  it('is unaffected by daylight-saving transitions', () => {
    // The EU clock change falls on 25 October 2026; that day is 23 or 25
    // hours long, which naive millisecond division rounds wrong.
    expect(daysBetweenKeys('2026-10-24', '2026-10-26')).toBe(2)
    expect(daysBetweenKeys('2026-03-28', '2026-03-30')).toBe(2)
  })
})

describe('relativeDayNameNL', () => {
  const now = new Date(2026, 8, 18, 9, 0)

  it('names today and yesterday', () => {
    expect(relativeDayNameNL('2026-09-18', now)).toBe('vandaag')
    expect(relativeDayNameNL('2026-09-17', now)).toBe('gisteren')
  })

  it('says nothing for anything further back', () => {
    // Beyond two days the weekday is ambiguous — "donderdag" is both
    // yesterday and a week ago — so the date itself has to carry it.
    expect(relativeDayNameNL('2026-09-16', now)).toBeNull()
    expect(relativeDayNameNL('2026-09-11', now)).toBeNull()
  })

  it('crosses a month boundary the way the calendar does', () => {
    const firstOfOctober = new Date(2026, 9, 1, 9, 0)
    expect(relativeDayNameNL('2026-09-30', firstOfOctober)).toBe('gisteren')
  })
})
