import { describe, expect, it } from 'vitest'
import { calculateStreak } from '../streak.js'

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
