import { describe, expect, it } from 'vitest'
import { calculateStreak, daysInWindow, longestStreak } from '../streak.js'

const TODAY = '2026-09-14'

describe('calculateStreak', () => {
  it('is 0 with no check-ins', () => {
    expect(calculateStreak([], TODAY)).toBe(0)
  })

  it('counts an unbroken run ending today', () => {
    expect(
      calculateStreak(['2026-09-12', '2026-09-13', '2026-09-14'], TODAY),
    ).toBe(3)
  })

  it('still counts when the run ends yesterday (today is not done yet)', () => {
    expect(calculateStreak(['2026-09-12', '2026-09-13'], TODAY)).toBe(2)
  })

  it('resets to 0 once a whole day is skipped', () => {
    expect(calculateStreak(['2026-09-11', '2026-09-12'], TODAY)).toBe(0)
  })

  it('counts only the most recent run, ignoring older ones', () => {
    expect(
      calculateStreak(
        ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-13', '2026-09-14'],
        TODAY,
      ),
    ).toBe(2)
  })

  it('does not care what order the keys arrive in', () => {
    expect(
      calculateStreak(['2026-09-14', '2026-09-12', '2026-09-13'], TODAY),
    ).toBe(3)
  })

  it('counts a duplicate day only once', () => {
    expect(
      calculateStreak(['2026-09-14', '2026-09-14', '2026-09-13'], TODAY),
    ).toBe(2)
  })

  it('runs correctly across a month boundary', () => {
    expect(
      calculateStreak(['2026-08-30', '2026-08-31', '2026-09-01'], '2026-09-01'),
    ).toBe(3)
  })

  it('survives the daylight-saving change', () => {
    expect(
      calculateStreak(['2026-10-24', '2026-10-25', '2026-10-26'], '2026-10-26'),
    ).toBe(3)
  })
})

describe('daysInWindow — the number a missed day cannot destroy', () => {
  const keys = (n, from = '2026-09-15') =>
    Array.from({ length: n }, (_, i) => {
      const d = new Date(`${from}T12:00:00`)
      d.setDate(d.getDate() - i)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    })

  it('counts an unbroken month as the whole window', () => {
    expect(daysInWindow(keys(30), 30, '2026-09-15')).toBe(30)
  })

  it('loses only ONE from a single missed day — unlike the streak', () => {
    const withGap = keys(30).filter((k) => k !== '2026-09-10')
    expect(daysInWindow(withGap, 30, '2026-09-15')).toBe(29)
    // The same gap takes the streak all the way down.
    expect(calculateStreak(withGap, '2026-09-15')).toBeLessThan(6)
  })

  it('ignores days older than the window', () => {
    expect(daysInWindow(keys(60), 30, '2026-09-15')).toBe(30)
  })

  it('ignores a duplicate day', () => {
    expect(daysInWindow(['2026-09-15', '2026-09-15'], 30, '2026-09-15')).toBe(1)
  })

  it('is 0 for no data', () => {
    expect(daysInWindow([], 30, '2026-09-15')).toBe(0)
    expect(daysInWindow(null, 30, '2026-09-15')).toBe(0)
  })
})

describe('longestStreak — what a broken run cannot take away', () => {
  it('finds the best run anywhere in the history', () => {
    expect(
      longestStreak([
        '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04',
        '2026-09-10',
        '2026-09-14', '2026-09-15',
      ]),
    ).toBe(4)
  })

  it('survives a broken current streak', () => {
    const keys = ['2026-08-01', '2026-08-02', '2026-08-03']
    // Nothing recent at all, so the current streak is zero...
    expect(calculateStreak(keys, '2026-09-15')).toBe(0)
    // ...but the run still happened.
    expect(longestStreak(keys)).toBe(3)
  })

  it('is 1 for a single day, 0 for none', () => {
    expect(longestStreak(['2026-09-15'])).toBe(1)
    expect(longestStreak([])).toBe(0)
  })

  it('does not care about order, and counts a duplicate once', () => {
    expect(longestStreak(['2026-09-03', '2026-09-01', '2026-09-02', '2026-09-02'])).toBe(3)
  })

  it('runs across a month boundary', () => {
    expect(longestStreak(['2026-08-30', '2026-08-31', '2026-09-01'])).toBe(3)
  })
})
