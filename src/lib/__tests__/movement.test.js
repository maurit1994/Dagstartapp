import { describe, expect, it } from 'vitest'
import { realSessions, sessionName, topTypes, weekStats } from '../movement.js'

const TODAY = '2026-09-18'
const move = (sports = [], physio = null) => ({ movement: { sports, physio, physioNote: '' } })
const gym = { type: 'Gym', duration: '30–60 min', intensity: 'Medium' }
const walk = { type: 'Wandelen', duration: '< 30 min', intensity: 'Laag' }
const none = { type: 'Geen', duration: null, intensity: null }

describe('sessionName', () => {
  it('uses the typed name for "Anders"', () => {
    expect(sessionName({ type: 'Anders', label: 'Bouldern' })).toBe('Bouldern')
  })

  it('falls back to "Anders" when no name was typed', () => {
    // Every session stored before v7 looks like this. It must still count as
    // something rather than disappearing from the tally.
    expect(sessionName({ type: 'Anders', label: '' })).toBe('Anders')
    expect(sessionName({ type: 'Anders' })).toBe('Anders')
    expect(sessionName({ type: 'Anders', label: '   ' })).toBe('Anders')
  })

  it('ignores a name on a type that already has one', () => {
    expect(sessionName({ type: 'Gym', label: 'Bouldern' })).toBe('Gym')
  })

  it('survives nonsense', () => {
    expect(sessionName(null)).toBe('')
    expect(sessionName({})).toBe('')
  })
})

describe('realSessions', () => {
  it('ignores an explicit "Geen"', () => {
    expect(realSessions({ sports: [none] })).toEqual([])
    expect(realSessions({ sports: [gym, none] })).toEqual([gym])
  })

  it('survives a missing block', () => {
    expect(realSessions(null)).toEqual([])
    expect(realSessions({})).toEqual([])
  })
})

describe('weekStats', () => {
  it('counts days with sport, and sessions separately', () => {
    const s = weekStats(
      {
        '2026-09-18': move([gym, walk]),
        '2026-09-17': move([walk]),
      },
      7,
      TODAY,
    )
    expect(s.sportDays).toBe(2)
    expect(s.sessions).toBe(3)
  })

  it('counts a logged rest day as LOGGED but not as a sport day', () => {
    // Knowing you rested differs from not knowing; a week view that cannot
    // tell them apart is misleading.
    const s = weekStats({ '2026-09-18': move([none]) }, 7, TODAY)
    expect(s.loggedDays).toBe(1)
    expect(s.sportDays).toBe(0)
    expect(s.sessions).toBe(0)
  })

  it('does not count a day that was never answered', () => {
    const s = weekStats({ '2026-09-18': { movement: null } }, 7, TODAY)
    expect(s.loggedDays).toBe(0)
  })

  it('tallies types', () => {
    const s = weekStats(
      { '2026-09-18': move([gym]), '2026-09-17': move([gym, walk]) },
      7,
      TODAY,
    )
    expect(s.byType).toEqual({ Gym: 2, Wandelen: 1 })
    expect(topTypes(s)[0]).toEqual(['Gym', 2])
  })

  it('tallies a named "Anders" under its own name, not under "Anders"', () => {
    // The whole point of typing the name: a year of "Anders ×14" says
    // nothing, while "Bouldern ×14" is a fact about your year.
    const bouldern = { type: 'Anders', label: 'Bouldern', duration: null, intensity: null }
    const klimmen = { type: 'Anders', label: 'Klimmen', duration: null, intensity: null }
    const s = weekStats(
      { '2026-09-18': move([bouldern, klimmen]), '2026-09-17': move([bouldern]) },
      7,
      TODAY,
    )
    expect(s.byType).toEqual({ Bouldern: 2, Klimmen: 1 })
    expect(topTypes(s)[0]).toEqual(['Bouldern', 2])
  })

  it('still counts an unnamed "Anders" from before v7', () => {
    const s = weekStats({ '2026-09-18': move([{ type: 'Anders', label: '' }]) }, 7, TODAY)
    expect(s.byType).toEqual({ Anders: 1 })
    expect(s.sessions).toBe(1)
  })

  it('counts the physio, separating done from partly', () => {
    const s = weekStats(
      {
        '2026-09-18': move([], 'done'),
        '2026-09-17': move([], 'partly'),
        '2026-09-16': move([], 'missed'),
      },
      7,
      TODAY,
    )
    expect(s.physioDone).toBe(1)
    expect(s.physioPartly).toBe(1)
    expect(s.loggedDays).toBe(3)
  })

  it('ignores days outside the window', () => {
    const s = weekStats(
      { '2026-09-18': move([gym]), '2026-09-01': move([gym]) },
      7,
      TODAY,
    )
    expect(s.sportDays).toBe(1)
  })

  it('looks back exactly N days, today included', () => {
    const s = weekStats({}, 7, TODAY)
    expect(s.keys).toHaveLength(7)
    expect(s.keys[0]).toBe(TODAY)
    expect(s.keys[6]).toBe('2026-09-12')
  })

  it('returns zeroes rather than throwing on no data', () => {
    const s = weekStats(null, 7, TODAY)
    expect(s).toMatchObject({ sportDays: 0, sessions: 0, loggedDays: 0, byType: {} })
  })
})
