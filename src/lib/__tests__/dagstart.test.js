import { describe, expect, it } from 'vitest'
import { isDagstartDone } from '../dagstart.js'

const empty = { mental: null, answers: {}, sleep: null, body: [], note: '', evening: null }

describe('isDagstartDone', () => {
  it('is false for a day with no entry at all', () => {
    expect(isDagstartDone(null)).toBe(false)
    expect(isDagstartDone(undefined)).toBe(false)
  })

  it('is false for an entry with nothing filled in', () => {
    expect(isDagstartDone(empty)).toBe(false)
  })

  it('is TRUE if any single part was filled', () => {
    expect(isDagstartDone({ ...empty, mental: 3 })).toBe(true)
    expect(isDagstartDone({ ...empty, answers: { zin: 'koffie' } })).toBe(true)
    expect(isDagstartDone({ ...empty, body: [{ region: 'neck', pain: 1, tension: 0 }] })).toBe(true)
    expect(isDagstartDone({ ...empty, note: 'iets' })).toBe(true)
    expect(isDagstartDone({ ...empty, sleep: { subjectief: 4 } })).toBe(true)
  })

  it('ignores a note that is only whitespace', () => {
    expect(isDagstartDone({ ...empty, note: '   ' })).toBe(false)
  })

  it('stays FALSE when only the evening was saved', () => {
    // The evening writes into the same day entry. Treating "an entry exists"
    // as "the morning is done" showed an empty Dagstart summary.
    const eveningOnly = {
      ...empty,
      evening: { mental: 3, intention: 'done', focus: 4, note: '', savedAt: 1 },
    }
    expect(isDagstartDone(eveningOnly)).toBe(false)
  })

  it('is true once both halves exist', () => {
    expect(
      isDagstartDone({
        ...empty,
        mental: 4,
        evening: { mental: 3, intention: 'done', note: '', savedAt: 1 },
      }),
    ).toBe(true)
  })

  it('survives a malformed entry rather than throwing', () => {
    expect(isDagstartDone({})).toBe(false)
    expect(isDagstartDone('nope')).toBe(false)
  })
})
