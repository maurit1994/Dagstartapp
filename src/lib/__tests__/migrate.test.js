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
      mode: 'lite',
      answers: {},
      sleep: null,
      body: [{ region: 'hip_l', pain: 4, tension: 0 }],
      note: 'hoi',
      evening: null,
      movement: null,
      updatedAt: 123,
    })
  })

  it('leaves a v5 entry alone', () => {
    const v4 = {
      mental: 5,
      mode: 'full',
      answers: { bereiken: 'huisarts bellen' },
      sleep: null,
      movement: null,
      body: [{ region: 'neck', pain: 1, tension: 5 }],
      note: '',
      evening: null,
      updatedAt: 9,
    }
    expect(migrateCheckin(v4)).toEqual(v4)
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

describe('migrateCheckin: the evening block (v2 -> v3)', () => {
  it('gives a day with no evening an explicit null', () => {
    expect(migrateCheckin({ mental: 3, body: [], note: '' }).evening).toBeNull()
  })

  it('keeps a filled evening block, defaulting the v4 fields to null', () => {
    const out = migrateCheckin({
      mental: 3,
      body: [],
      note: '',
      evening: { mental: 2, intention: 'partly', note: 'moe', savedAt: 7 },
    })
    expect(out.evening).toEqual({
      mental: 2,
      intention: 'partly',
      pijn: null,
      focus: null,
      reactief: null,
      cafeine: null,
      eerste: null,
      note: 'moe',
      savedAt: 7,
    })
  })

  it('drops an evening block where nothing was answered', () => {
    const out = migrateCheckin({
      body: [],
      evening: { mental: null, intention: null, note: '' },
    })
    expect(out.evening).toBeNull()
  })

  it('rejects an unknown intention outcome rather than storing it', () => {
    const out = migrateCheckin({
      body: [],
      evening: { mental: 3, intention: 'misschien', note: '' },
    })
    expect(out.evening.intention).toBeNull()
  })

  it('clamps the evening mood the same way as the morning one', () => {
    const out = migrateCheckin({ body: [], evening: { mental: 42, note: '' } })
    expect(out.evening.mental).toBe(5)
  })

  it('upgrades a v2 day (no evening key at all) without losing anything', () => {
    const v2 = { mental: 4, body: [{ region: 'neck', pain: 2, tension: 1 }], note: 'x', updatedAt: 5 }
    expect(migrateCheckin(v2)).toEqual({
      ...v2,
      mode: 'lite',
      answers: {},
      sleep: null,
      movement: null,
      evening: null,
    })
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

  it('imports a v6 export — sessions gain an empty label', () => {
    // The version before "Anders" could be named. Nothing about that export
    // knows the field exists, and it must still come back whole.
    const out = migrateExport({
      app: 'anker',
      schemaVersion: 6,
      checkins: {
        '2026-09-15': {
          mental: 4,
          body: [],
          note: 'v6',
          movement: {
            sports: [
              { type: 'Anders', duration: '30–60 min', intensity: 'Hoog' },
              { type: 'Gym', duration: '< 30 min', intensity: 'Laag' },
            ],
            physio: 'partly',
            physioNote: 'knie',
          },
        },
      },
    })
    expect(out.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(out.checkins['2026-09-15'].movement).toEqual({
      sports: [
        { type: 'Anders', label: '', duration: '30–60 min', intensity: 'Hoog' },
        { type: 'Gym', label: '', duration: '< 30 min', intensity: 'Laag' },
      ],
      physio: 'partly',
      physioNote: 'knie',
    })
    // Everything else on that day survived the upgrade untouched.
    expect(out.checkins['2026-09-15'].mental).toBe(4)
    expect(out.checkins['2026-09-15'].note).toBe('v6')
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


describe('migrateCheckin: Dagstart questions (v3 -> v4)', () => {
  it('defaults a day with no mode to lite', () => {
    expect(migrateCheckin({ body: [] }).mode).toBe('lite')
  })

  it('rejects a mode outside lite/full rather than storing it', () => {
    expect(migrateCheckin({ body: [], mode: 'turbo' }).mode).toBe('lite')
  })

  it('keeps full when that is what was chosen', () => {
    expect(migrateCheckin({ body: [], mode: 'full' }).mode).toBe('full')
  })

  it('keeps known answers and trims them', () => {
    const out = migrateCheckin({
      body: [],
      answers: { goed: '  doorgeslapen  ', bereiken: 'huisarts bellen' },
    })
    expect(out.answers).toEqual({ goed: 'doorgeslapen', bereiken: 'huisarts bellen' })
  })

  it('drops blank answers instead of storing empty strings', () => {
    const out = migrateCheckin({ body: [], answers: { goed: '   ', zin: 'koffie' } })
    expect(out.answers).toEqual({ zin: 'koffie' })
  })

  it('drops question ids it does not know', () => {
    const out = migrateCheckin({ body: [], answers: { verzonnen: 'x', zin: 'y' } })
    expect(out.answers).toEqual({ zin: 'y' })
  })
})

describe('migrateCheckin: the five new evening fields', () => {
  it('keeps them when answered', () => {
    const out = migrateCheckin({
      body: [],
      evening: {
        pijn: 2,
        focus: 4,
        reactief: 1,
        cafeine: false,
        eerste: 'Daglicht',
        note: '',
      },
    })
    expect(out.evening).toMatchObject({
      pijn: 2,
      focus: 4,
      reactief: 1,
      cafeine: false,
      eerste: 'Daglicht',
    })
  })

  it('stores an unanswered field as null, never 0 or an empty string', () => {
    const out = migrateCheckin({ body: [], evening: { pijn: 3 } })
    expect(out.evening.focus).toBeNull()
    expect(out.evening.reactief).toBeNull()
    expect(out.evening.cafeine).toBeNull()
    expect(out.evening.eerste).toBeNull()
  })

  it('rejects a first-thing value outside the four options', () => {
    const out = migrateCheckin({ body: [], evening: { pijn: 1, eerste: 'Schaken' } })
    expect(out.evening.eerste).toBeNull()
  })

  it('rejects a non-boolean caffeine answer', () => {
    const out = migrateCheckin({ body: [], evening: { pijn: 1, cafeine: 'misschien' } })
    expect(out.evening.cafeine).toBeNull()
  })

  it('counts an evening with only a new field as a real check-in', () => {
    expect(migrateCheckin({ body: [], evening: { focus: 4 } }).evening).not.toBeNull()
  })
})

describe('migrateCheckins: folding in the legacy intentions key', () => {
  it('fills answers.bereiken from the legacy map', () => {
    const out = migrateCheckins(
      { '2026-09-10': { mental: 3, body: [], note: '' } },
      { '2026-09-10': 'huisarts bellen' },
    )
    expect(out['2026-09-10'].answers.bereiken).toBe('huisarts bellen')
  })

  it('creates an entry for a day that exists ONLY in the legacy map', () => {
    const out = migrateCheckins({}, { '2026-09-09': 'alleen legacy' })
    expect(out['2026-09-09'].answers.bereiken).toBe('alleen legacy')
    expect(out['2026-09-09'].body).toEqual([])
  })

  it('lets an existing answer win over the legacy value', () => {
    const out = migrateCheckins(
      { '2026-09-10': { body: [], answers: { bereiken: 'nieuw' } } },
      { '2026-09-10': 'oud' },
    )
    expect(out['2026-09-10'].answers.bereiken).toBe('nieuw')
  })

  it('ignores blank legacy values', () => {
    const out = migrateCheckins({}, { '2026-09-09': '   ' })
    expect(out['2026-09-09']).toBeUndefined()
  })

  it('works with no legacy map at all', () => {
    const out = migrateCheckins({ '2026-09-10': { body: [] } })
    expect(out['2026-09-10'].answers).toEqual({})
  })
})


describe('migrateCheckin: the sleep block (v4 -> v5)', () => {
  it('gives a day with no sleep an explicit null', () => {
    expect(migrateCheckin({ body: [] }).sleep).toBeNull()
  })

  it('drops a sleep block where nothing was answered', () => {
    expect(
      migrateCheckin({ body: [], sleep: { subjectief: null, notitie: '' } }).sleep,
    ).toBeNull()
  })

  it('keeps a full night, padding the hour to two digits', () => {
    const out = migrateCheckin({
      body: [],
      sleep: {
        subjectief: 4,
        bedtijd: '23:30',
        wakkertijd: '7:15',
        notitie: 'onrustig',
        garmin: { gedragen: true, bodyBattery: 62, slaapscore: 71, hrvStatus: 'Goed' },
      },
    })
    expect(out.sleep).toEqual({
      subjectief: 4,
      bedtijd: '23:30',
      wakkertijd: '07:15',
      notitie: 'onrustig',
      garmin: { gedragen: true, bodyBattery: 62, slaapscore: 71, hrvStatus: 'Goed' },
    })
  })

  it('rejects an unusable time rather than storing it', () => {
    const out = migrateCheckin({
      body: [],
      sleep: { subjectief: 3, bedtijd: '25:00', wakkertijd: 'halfacht' },
    })
    expect(out.sleep.bedtijd).toBeNull()
    expect(out.sleep.wakkertijd).toBeNull()
  })

  it('clamps Garmin readings into 0-100', () => {
    const out = migrateCheckin({
      body: [],
      sleep: { garmin: { gedragen: true, bodyBattery: 150, slaapscore: -4 } },
    })
    expect(out.sleep.garmin.bodyBattery).toBe(100)
    expect(out.sleep.garmin.slaapscore).toBe(0)
  })

  it('rejects an HRV status outside the three the watch reports', () => {
    const out = migrateCheckin({
      body: [],
      sleep: { garmin: { gedragen: true, hrvStatus: 'Uitstekend' } },
    })
    expect(out.sleep.garmin.hrvStatus).toBeNull()
  })

  it('discards readings when the watch was NOT worn', () => {
    // A Body Battery from a watch left on the nightstand is not a reading.
    const out = migrateCheckin({
      body: [],
      sleep: { garmin: { gedragen: false, bodyBattery: 88, hrvStatus: 'Goed' } },
    })
    expect(out.sleep.garmin).toEqual({
      gedragen: false,
      bodyBattery: null,
      slaapscore: null,
      hrvStatus: null,
    })
  })

  it('keeps a sleep block that only says the watch was not worn', () => {
    // "I did not wear it" is an answer, and differs from never being asked.
    expect(
      migrateCheckin({ body: [], sleep: { garmin: { gedragen: false } } }).sleep,
    ).not.toBeNull()
  })

  it('is safe to run twice', () => {
    const once = migrateCheckin({
      body: [],
      sleep: { subjectief: 3, bedtijd: '1:05', garmin: { gedragen: true, slaapscore: 80 } },
    })
    expect(migrateCheckin(once).sleep).toEqual(once.sleep)
  })
})

describe('migrateCheckin: the movement block (v5 -> v6)', () => {
  it('gives a day with no movement an explicit null', () => {
    expect(migrateCheckin({ body: [] }).movement).toBeNull()
  })

  it('drops a movement block where nothing was answered', () => {
    expect(
      migrateCheckin({ body: [], movement: { sports: [], physio: null, physioNote: '' } })
        .movement,
    ).toBeNull()
  })

  it('keeps sessions with their duration and intensity', () => {
    const out = migrateCheckin({
      body: [],
      movement: {
        sports: [{ type: 'Gym', duration: '30–60 min', intensity: 'Medium' }],
        physio: 'done',
        physioNote: 'heup voelde stug',
      },
    })
    expect(out.movement).toEqual({
      sports: [{ type: 'Gym', label: '', duration: '30–60 min', intensity: 'Medium' }],
      physio: 'done',
      physioNote: 'heup voelde stug',
    })
  })

  it('rejects a sport, duration or intensity it does not know', () => {
    const out = migrateCheckin({
      body: [],
      movement: {
        sports: [{ type: 'Curling', duration: 'uren', intensity: 'Extreem' }, { type: 'Yoga', duration: 'uren', intensity: 'Extreem' }],
      },
    })
    expect(out.movement.sports).toEqual([
      { type: 'Yoga', label: '', duration: null, intensity: null },
    ])
  })

  it('collapses to "Geen" when that is among the answers', () => {
    // "No sport, and also an hour of running" is not a state that can be true.
    const out = migrateCheckin({
      body: [],
      movement: { sports: [{ type: 'Hardlopen', duration: '60+ min' }, { type: 'Geen' }] },
    })
    expect(out.movement.sports).toEqual([
      { type: 'Geen', label: '', duration: null, intensity: null },
    ])
  })

  it('gives every session stored before v7 an empty label', () => {
    // The name was never asked for, so '' is the honest value — not a guess
    // at what "Anders" meant that day.
    const out = migrateCheckin({
      body: [],
      movement: { sports: [{ type: 'Anders', duration: '< 30 min' }] },
    })
    expect(out.movement.sports).toEqual([
      { type: 'Anders', label: '', duration: '< 30 min', intensity: null },
    ])
  })

  it('keeps the typed name on an "Anders" session', () => {
    const out = migrateCheckin({
      body: [],
      movement: { sports: [{ type: 'Anders', label: '  Bouldern  ' }] },
    })
    expect(out.movement.sports[0].label).toBe('Bouldern')
  })

  it('drops a label sitting on any other type', () => {
    // A name next to "Gym" contradicts the category it sits beside; keeping
    // it would mean two answers to one question.
    const out = migrateCheckin({
      body: [],
      movement: { sports: [{ type: 'Gym', label: 'Bouldern' }] },
    })
    expect(out.movement.sports[0].label).toBe('')
  })

  it('truncates a label rather than storing something unbounded', () => {
    const out = migrateCheckin({
      body: [],
      movement: { sports: [{ type: 'Anders', label: 'x'.repeat(200) }] },
    })
    expect(out.movement.sports[0].label).toHaveLength(40)
  })

  it('ignores a label that is not a string', () => {
    const out = migrateCheckin({
      body: [],
      movement: { sports: [{ type: 'Anders', label: { naam: 'Bouldern' } }] },
    })
    expect(out.movement.sports[0].label).toBe('')
  })

  it('keeps a block that only says "Geen" — that is an answer', () => {
    expect(
      migrateCheckin({ body: [], movement: { sports: [{ type: 'Geen' }] } }).movement,
    ).not.toBeNull()
  })

  it('keeps a block that only says the physio was done', () => {
    expect(
      migrateCheckin({ body: [], movement: { physio: 'partly' } }).movement,
    ).not.toBeNull()
  })

  it('caps the number of sessions rather than storing an unbounded list', () => {
    const many = Array.from({ length: 9 }, () => ({ type: 'Wandelen' }))
    expect(migrateCheckin({ body: [], movement: { sports: many } }).movement.sports)
      .toHaveLength(4)
  })

  it('rejects a physio value outside done/partly/missed', () => {
    expect(
      migrateCheckin({ body: [], movement: { physio: 'bijna', physioNote: 'x' } })
        .movement.physio,
    ).toBeNull()
  })

  it('is safe to run twice', () => {
    const once = migrateCheckin({
      body: [],
      movement: { sports: [{ type: 'Yoga', duration: '< 30 min' }], physio: 'done' },
    })
    expect(migrateCheckin(once).movement).toEqual(once.movement)
  })
})
