import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addThought,
  deleteCheckin,
  deleteThought,
  exportAll,
  getAllCheckins,
  getCheckin,
  getThoughts,
  importAll,
  saveCheckin,
  saveIntention,
  StorageWriteError,
  getAllIntentions,
  KEYS,
} from '../storage.js'

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('check-ins', () => {
  it('round-trips a check-in unchanged', () => {
    saveCheckin('2026-09-14', {
      mental: 4,
      body: [{ region: 'hip_l', pain: 3, tension: 2 }],
      note: 'slecht geslapen',
    })
    const back = getCheckin('2026-09-14')
    expect(back.mental).toBe(4)
    expect(back.body).toEqual([{ region: 'hip_l', pain: 3, tension: 2 }])
    expect(back.note).toBe('slecht geslapen')
  })

  it('keeps one entry per day: saving twice edits, never duplicates', () => {
    saveCheckin('2026-09-14', { mental: 2, body: [], note: '' })
    saveCheckin('2026-09-14', { mental: 5, body: [], note: 'beter' })
    expect(Object.keys(getAllCheckins())).toHaveLength(1)
    expect(getCheckin('2026-09-14').mental).toBe(5)
  })

  it('stores under the exact anker_v1_ key', () => {
    saveCheckin('2026-09-14', { mental: 3, body: [], note: '' })
    expect(localStorage.getItem(KEYS.checkins)).toContain('2026-09-14')
    expect(Object.keys(localStorage).every((k) => k.startsWith('anker_v1_'))).toBe(true)
  })

  it('normalises missing fields instead of storing undefined', () => {
    saveCheckin('2026-09-14', {})
    expect(getCheckin('2026-09-14')).toMatchObject({ mental: null, body: [], note: '' })
  })

  it('deletes a day', () => {
    saveCheckin('2026-09-14', { mental: 3, body: [], note: '' })
    deleteCheckin('2026-09-14')
    expect(getCheckin('2026-09-14')).toBeNull()
  })

  it('returns {} and does NOT destroy the raw value when data is corrupt', () => {
    localStorage.setItem(KEYS.checkins, 'not json {{{')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(getAllCheckins()).toEqual({})
    // The unreadable text must survive so it can be rescued by hand.
    expect(localStorage.getItem(KEYS.checkins)).toBe('not json {{{')
  })

  it('throws StorageWriteError when the browser refuses the write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })
    expect(() => saveCheckin('2026-09-14', { mental: 3, body: [], note: '' })).toThrow(
      StorageWriteError,
    )
  })
})

describe('thoughts', () => {
  it('adds newest first and rejects blank text', () => {
    addThought('eerste')
    addThought('tweede')
    expect(getThoughts().map((t) => t.text)).toEqual(['tweede', 'eerste'])
    expect(addThought('   ')).toBeNull()
    expect(getThoughts()).toHaveLength(2)
  })

  it('trims surrounding whitespace', () => {
    addThought('  met spaties  ')
    expect(getThoughts()[0].text).toBe('met spaties')
  })

  it('deletes by id without touching the others', () => {
    const a = addThought('blijft')
    const b = addThought('weg')
    deleteThought(b.id)
    expect(getThoughts().map((t) => t.id)).toEqual([a.id])
  })
})

describe('export and import', () => {
  it('exports everything and re-imports it onto an empty device', () => {
    saveCheckin('2026-09-14', {
      mental: 4,
      body: [{ region: 'lower_back', pain: 2, tension: 5 }],
      note: 'test',
    })
    addThought('een gedachte')
    saveIntention('2026-09-14', 'huisarts bellen')
    const backup = exportAll()

    localStorage.clear()
    const result = importAll(backup, 'merge')

    expect(result).toEqual({ checkinsAdded: 1, thoughtsAdded: 1 })
    expect(getCheckin('2026-09-14').body).toEqual([
      { region: 'lower_back', pain: 2, tension: 5 },
    ])
    expect(getThoughts()[0].text).toBe('een gedachte')
    expect(getAllIntentions()['2026-09-14']).toBe('huisarts bellen')
  })

  it('merge never overwrites a NEWER local check-in with an older backup', () => {
    saveCheckin('2026-09-14', { mental: 1, body: [], note: 'oud' })
    const oldBackup = exportAll()

    // Time moves on and the day gets edited.
    saveCheckin('2026-09-14', { mental: 5, body: [], note: 'nieuw' })

    importAll(oldBackup, 'merge')
    expect(getCheckin('2026-09-14').note).toBe('nieuw')
  })

  it('merge does fill in a day the device is missing', () => {
    saveCheckin('2026-09-13', { mental: 2, body: [], note: 'dag 13' })
    const backup = exportAll()
    localStorage.clear()
    saveCheckin('2026-09-14', { mental: 4, body: [], note: 'dag 14' })

    importAll(backup, 'merge')
    expect(Object.keys(getAllCheckins()).sort()).toEqual(['2026-09-13', '2026-09-14'])
  })

  it('merge does not duplicate thoughts already present', () => {
    addThought('dubbel?')
    const backup = exportAll()
    const result = importAll(backup, 'merge')
    expect(result.thoughtsAdded).toBe(0)
    expect(getThoughts()).toHaveLength(1)
  })

  it('replace wipes and takes the backup wholesale', () => {
    saveCheckin('2026-09-13', { mental: 1, body: [], note: 'weg' })
    const backup = exportAll()
    localStorage.clear()
    saveCheckin('2026-09-14', { mental: 5, body: [], note: 'ook weg' })

    importAll(backup, 'replace')
    expect(Object.keys(getAllCheckins())).toEqual(['2026-09-13'])
  })

  it('refuses a file that is not an Anker backup', () => {
    expect(() => importAll({ app: 'iets anders' })).toThrow(/geen Anker-backup/)
    expect(() => importAll(null)).toThrow(/geen Anker-backup/)
  })

  it('refuses a backup from a future schema version', () => {
    expect(() => importAll({ app: 'anker', schemaVersion: 99 })).toThrow(/nieuwere versie/)
  })

  it('accepts an OLD v1 backup and upgrades it on the way in', () => {
    const v1Backup = {
      app: 'anker',
      schemaVersion: 1,
      checkins: {
        '2026-09-10': {
          mental: 3,
          pain: [{ region: 'hip_l', intensity: 4 }],
          note: 'oud formaat',
          updatedAt: 1,
        },
      },
      thoughts: [],
      intentions: {},
      meta: {},
    }
    const result = importAll(v1Backup, 'merge')
    expect(result.checkinsAdded).toBe(1)
    expect(getCheckin('2026-09-10').body).toEqual([
      { region: 'hip_l', pain: 4, tension: 0 },
    ])
    expect(getCheckin('2026-09-10').note).toBe('oud formaat')
  })
})

describe('intentions', () => {
  it('saves, trims and clears', () => {
    saveIntention('2026-09-14', '  bellen  ')
    expect(getAllIntentions()['2026-09-14']).toBe('bellen')
    saveIntention('2026-09-14', '')
    expect(getAllIntentions()['2026-09-14']).toBeUndefined()
  })
})
