import { describe, expect, it } from 'vitest'
import { lookbackFor } from '../lookback.js'

const TODAY = '2026-09-18'
const day = (answers) => ({ mental: 3, body: [], note: '', answers, evening: null })

describe('lookbackFor', () => {
  it('returns nothing when there is no past writing at all', () => {
    expect(lookbackFor({}, TODAY)).toBeNull()
    expect(lookbackFor({ [TODAY]: day({ bereiken: 'vandaag' }) }, TODAY)).toBeNull()
  })

  it('never shows today back to you', () => {
    // You wrote it ten seconds ago; quoting it is not a memory.
    const out = lookbackFor(
      { [TODAY]: day({ bereiken: 'vandaag' }), '2026-09-01': day({ bereiken: 'ouder' }) },
      TODAY,
    )
    expect(out.dateKey).toBe('2026-09-01')
  })

  it('ignores days with no written answer', () => {
    const out = lookbackFor(
      {
        '2026-09-10': day({}),
        '2026-09-11': { mental: 4, body: [], answers: null },
        '2026-09-01': day({ zin: 'koffie met R.' }),
      },
      TODAY,
    )
    expect(out.dateKey).toBe('2026-09-01')
  })

  it('ignores an answer that is only whitespace', () => {
    expect(lookbackFor({ '2026-09-01': day({ bereiken: '   ' }) }, TODAY)).toBeNull()
  })

  it('returns the question text alongside the answer', () => {
    const out = lookbackFor({ '2026-09-01': day({ bereiken: 'de huisarts bellen' }) }, TODAY)
    expect(out.text).toBe('de huisarts bellen')
    expect(out.question).toBe('Wat wil ik vandaag écht bereiken?')
    expect(out.questionId).toBe('bereiken')
  })

  it('trims the stored answer', () => {
    const out = lookbackFor({ '2026-09-01': day({ zin: '  koffie  ' }) }, TODAY)
    expect(out.text).toBe('koffie')
  })

  it('counts how long ago it was', () => {
    const out = lookbackFor({ '2026-09-01': day({ zin: 'x' }) }, TODAY)
    expect(out.daysAgo).toBe(17)
  })

  it('prefers a day at least a week old over a recent one', () => {
    // The point is something you could not have recalled unaided.
    const out = lookbackFor(
      {
        '2026-09-17': day({ bereiken: 'gisteren' }),
        '2026-09-16': day({ bereiken: 'eergisteren' }),
        '2026-09-05': day({ bereiken: 'twee weken terug' }),
      },
      TODAY,
    )
    expect(out.dateKey).toBe('2026-09-05')
  })

  it('falls back to a recent day when the app is new', () => {
    // A card that stays empty for a week withholds the payoff exactly when
    // the habit is least established.
    const out = lookbackFor({ '2026-09-17': day({ bereiken: 'gisteren' }) }, TODAY)
    expect(out.dateKey).toBe('2026-09-17')
  })

  it('is stable within a day, however often it is called', () => {
    // The Vandaag screen remounts after every save. A random pick would
    // flicker, and this is the third thing that remount has caught out.
    const checkins = {
      '2026-09-01': day({ bereiken: 'a' }),
      '2026-09-02': day({ bereiken: 'b' }),
      '2026-09-03': day({ bereiken: 'c' }),
    }
    const first = lookbackFor(checkins, TODAY)
    for (let i = 0; i < 20; i += 1) {
      expect(lookbackFor(checkins, TODAY)).toEqual(first)
    }
  })

  it('moves on to another day tomorrow', () => {
    const checkins = {
      '2026-09-01': day({ bereiken: 'a' }),
      '2026-09-02': day({ bereiken: 'b' }),
      '2026-09-03': day({ bereiken: 'c' }),
    }
    const picks = new Set()
    for (const today of ['2026-09-18', '2026-09-19', '2026-09-20']) {
      picks.add(lookbackFor(checkins, today).dateKey)
    }
    expect(picks.size).toBe(3)
  })

  it('works its way through every day that has writing', () => {
    const checkins = {}
    for (let d = 1; d <= 5; d += 1) {
      checkins[`2026-09-0${d}`] = day({ bereiken: `dag ${d}` })
    }
    const seen = new Set()
    for (let d = 0; d < 10; d += 1) {
      const today = `2026-09-${String(18 + d).padStart(2, '0')}`
      seen.add(lookbackFor(checkins, today).dateKey)
    }
    expect(seen.size).toBe(5)
  })

  it('still answers for a day whose only writing is a question no longer asked daily', () => {
    // `goed` moved to Full and `dankbaar` to Sundays. What was recorded
    // outlives the rule that prompted it — here too.
    const out = lookbackFor({ '2026-09-01': day({ dankbaar: 'de buren' }) }, TODAY)
    expect(out.questionId).toBe('dankbaar')
    expect(out.question).toBe('Waar ben ik vandaag dankbaar voor?')
  })

  it('survives nonsense', () => {
    expect(lookbackFor(null, TODAY)).toBeNull()
    expect(lookbackFor(undefined, TODAY)).toBeNull()
  })
})
