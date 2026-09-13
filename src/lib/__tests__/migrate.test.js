import { describe, expect, it } from 'vitest'
import {
  CURRENT_SCHEMA_VERSION,
  migrateCheckin,
  migrateCheckins,
  migrateExport,
} from '../migrate.js'

describe('migrateCheckin: v1 -> v2', () => {
  it('turns v1 pain into a body entry, with tension 0', () => {
    const v1 = {
      mental: 3,
      pain: [{ region: 'hip_l', intensity: 4 }],
      note: 'hoi',
      updatedAt: 123,
    }
    expect(migrateCheckin(v1)).toEqual({
      mental: 3,
      body: [{ region: 'hip_l', pain: 4, tension: 0 }],
      note: 'hoi',
      updatedAt: 123,
    })
  })

  it('leaves a v2 entry alone', () => {
    const v2 = {
      mental: 5,
      body: [{ region: 'neck', pain: 1, tension: 5 }],
      note: '',
      updatedAt: 9,
    }
    expect(migrateCheckin(v2)).toEqual(v2)
  })

  it('is safe to run twice', () => {
    const v1 = { mental: 2, pain: [{ region: 'neck', intensity: 2 }], note: '' }
    const once = migrateCheckin(v1)
    expect(migrateCheckin(once).body).toEqual(once.body)
  })

  it('preserves the original timestamp so merge ordering stays correct', () => {
    expect(migrateCheckin({ mental: 1, pain: [], note: '', updatedAt: 42 }).updatedAt).toBe(42)
  })
})

describe('migrateCheckin: hardening', () => {
  it('clamps scores into 0-5 and rounds them', () => {
    const out = migrateCheckin({
      body: [{ region: 'neck', pain: 99, tension: -4 }],
    })
    expect(out.body).toEqual([{ region: 'neck', pain: 5, tension: 0 }])
  })

  it('turns unusable scores into 0 rather than storing NaN', () => {
    const out = migrateCheckin({
      body: [{ region: 'neck', pain: 'veel', tension: 3 }],
    })
    expect(out.body).toEqual([{ region: 'neck', pain: 0, tension: 3 }])
  })

  it('drops a region scored 0 on both, which carries no information', () => {
    const out = migrateCheckin({
      body: [
        { region: 'neck', pain: 0, tension: 0 },
        { region: 'head', pain: 0, tension: 2 },
      ],
    })
    expect(out.body).toEqual([{ region: 'head', pain: 0, tension: 2 }])
  })

  it('drops rows with no region id instead of writing junk', () => {
    expect(migrateCheckin({ body: [{ pain: 3 }, null] }).body).toEqual([])
  })

  it('returns null for something that is not an entry', () => {
    expect(migrateCheckin(null)).toBeNull()
    expect(migrateCheckin('nope')).toBeNull()
  })
})

describe('migrateCheckins', () => {
  it('upgrades every day in the map', () => {
    const out = migrateCheckins({
      '2026-09-10': { mental: 1, pain: [{ region: 'neck', intensity: 1 }], note: '' },
      '2026-09-11': { mental: 2, body: [{ region: 'head', pain: 2, tension: 1 }], note: '' },
    })
    expect(out['2026-09-10'].body).toEqual([{ region: 'neck', pain: 1, tension: 0 }])
    expect(out['2026-09-11'].body).toEqual([{ region: 'head', pain: 2, tension: 1 }])
  })

  it('returns {} for anything that is not a map', () => {
    expect(migrateCheckins(null)).toEqual({})
    expect(migrateCheckins([])).toEqual({})
  })
})

describe('migrateExport', () => {
  it('upgrades a v1 export and stamps the current version', () => {
    const out = migrateExport({
      app: 'anker',
      schemaVersion: 1,
      checkins: { '2026-09-10': { mental: 3, pain: [], note: '' } },
    })
    expect(out.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(out.thoughts).toEqual([])
    expect(out.intentions).toEqual({})
  })

  it('refuses a file that is not an Anker backup', () => {
    expect(() => migrateExport({ app: 'anders' })).toThrow(/geen Anker-backup/)
    expect(() => migrateExport(null)).toThrow(/geen Anker-backup/)
  })

  it('refuses a backup written by a NEWER app rather than mangling it', () => {
    expect(() =>
      migrateExport({ app: 'anker', schemaVersion: CURRENT_SCHEMA_VERSION + 1 }),
    ).toThrow(/nieuwere versie/)
  })

  it('refuses a backup with no readable version', () => {
    expect(() => migrateExport({ app: 'anker' })).toThrow(/versienummer/)
  })
})
