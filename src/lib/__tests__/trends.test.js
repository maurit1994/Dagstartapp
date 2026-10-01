import { describe, expect, it } from 'vitest'
import { filledCount, recentSeries } from '../trends.js'

const TODAY = '2026-09-18'
const focus = (entry) => entry?.evening?.focus
const withFocus = (n) => ({ mental: 3, body: [], evening: { focus: n } })

describe('recentSeries', () => {
  it('runs oldest first and ends on today', () => {
    const out = recentSeries({}, focus, 7, TODAY)
    expect(out).toHaveLength(7)
    expect(out[0].dateKey).toBe('2026-09-12')
    expect(out[6].dateKey).toBe(TODAY)
  })

  it('gives a day with no entry a null rather than skipping it', () => {
    // The gaps are the point: a strip that silently closes up would make six
    // scattered days look like a solid week.
    const out = recentSeries({ '2026-09-18': withFocus(4) }, focus, 3, TODAY)
    expect(out.map((d) => d.value)).toEqual([null, null, 4])
  })

  it('gives a day whose field was never answered a null too', () => {
    const out = recentSeries(
      { '2026-09-18': { mental: 3, body: [], evening: null } },
      focus, 1, TODAY,
    )
    expect(out[0].value).toBeNull()
  })

  it('keeps a zero, which is a value and not an absence', () => {
    const out = recentSeries({ '2026-09-18': withFocus(0) }, focus, 1, TODAY)
    expect(out[0].value).toBe(0)
  })

  it('refuses anything that is not a number', () => {
    const out = recentSeries({ '2026-09-18': withFocus('vier') }, focus, 1, TODAY)
    expect(out[0].value).toBeNull()
  })

  it('crosses a month boundary the way the calendar does', () => {
    const out = recentSeries({}, focus, 3, '2026-10-01')
    expect(out.map((d) => d.dateKey)).toEqual(['2026-09-29', '2026-09-30', '2026-10-01'])
  })

  it('survives nonsense', () => {
    expect(recentSeries(null, focus, 2, TODAY).map((d) => d.value)).toEqual([null, null])
  })

  it('returns the series and nothing derived from it', () => {
    // No average, no trend, no correlation: those need far more data than a
    // few weeks before an answer would be true rather than merely printable.
    const out = recentSeries({ '2026-09-18': withFocus(4) }, focus, 1, TODAY)
    expect(Object.keys(out[0]).sort()).toEqual(['dateKey', 'value'])
  })
})

describe('filledCount', () => {
  it('counts only the days that carry a value', () => {
    expect(filledCount(recentSeries({ '2026-09-18': withFocus(4) }, focus, 7, TODAY))).toBe(1)
    expect(filledCount([])).toBe(0)
    expect(filledCount(undefined)).toBe(0)
  })
})
