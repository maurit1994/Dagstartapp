import { describe, expect, it } from 'vitest'
import {
  HORIZONS,
  isReviewDay,
  loadStats,
  migrateLoadItem,
  migrateLoadItems,
  openItems,
  sortedOpenItems,
} from '../mentalload.js'

const item = (over = {}) => ({
  id: 'a', text: 'tandarts boeken', horizon: 'week',
  raised: false, createdAt: 1, resolvedAt: null, ...over,
})

describe('migrateLoadItem', () => {
  it('drops an item with no text — there is nothing to remember', () => {
    expect(migrateLoadItem({ text: '   ' })).toBeNull()
    expect(migrateLoadItem({})).toBeNull()
    expect(migrateLoadItem(null)).toBeNull()
  })

  it('trims and caps the text', () => {
    expect(migrateLoadItem({ text: '  tandarts  ' }).text).toBe('tandarts')
    expect(migrateLoadItem({ text: 'x'.repeat(400) }).text).toHaveLength(140)
  })

  it('repairs an unknown horizon to the nearest one rather than dropping it', () => {
    // A half-readable note about your household beats no note.
    expect(migrateLoadItem({ text: 'x', horizon: 'ooit' }).horizon).toBe('week')
  })

  it('treats anything but true as not raised', () => {
    expect(migrateLoadItem({ text: 'x', raised: 'ja' }).raised).toBe(false)
    expect(migrateLoadItem({ text: 'x', raised: 1 }).raised).toBe(false)
    expect(migrateLoadItem({ text: 'x', raised: true }).raised).toBe(true)
  })

  it('skips the broken entries in a list and keeps the rest', () => {
    const out = migrateLoadItems([item(), null, { text: '' }, item({ id: 'b' })])
    expect(out.map((i) => i.id)).toEqual(['a', 'b'])
  })

  it('returns an empty list for anything that is not one', () => {
    expect(migrateLoadItems(null)).toEqual([])
    expect(migrateLoadItems('nee')).toEqual([])
  })
})

describe('sortedOpenItems', () => {
  it('puts the soonest horizon first', () => {
    const out = sortedOpenItems([
      item({ id: 'c', horizon: 'month' }),
      item({ id: 'a', horizon: 'week' }),
      item({ id: 'b', horizon: 'fortnight' }),
    ])
    expect(out.map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })

  it('within one horizon, the oldest noticed comes first', () => {
    // Something you spotted three weeks ago and still have not raised is the
    // one most worth seeing.
    const out = sortedOpenItems([
      item({ id: 'new', createdAt: 900 }),
      item({ id: 'old', createdAt: 100 }),
    ])
    expect(out.map((i) => i.id)).toEqual(['old', 'new'])
  })

  it('leaves out what is already resolved', () => {
    const out = sortedOpenItems([item({ id: 'a' }), item({ id: 'b', resolvedAt: 5 })])
    expect(out.map((i) => i.id)).toEqual(['a'])
  })
})

describe('loadStats', () => {
  it('counts what is open, and how much of it you raised yourself', () => {
    // `raised` is the measure, not `done`: doing a job you were handed is not
    // the labour being redistributed.
    const stats = loadStats([
      item({ id: 'a', raised: true }),
      item({ id: 'b', raised: false }),
      item({ id: 'c', raised: false, horizon: 'month' }),
      item({ id: 'd', raised: true, resolvedAt: 9 }),
    ])
    expect(stats).toEqual({ open: 3, raised: 1, thisWeek: 2, resolved: 1 })
  })

  it('is all zero on an empty list, and never divides by it', () => {
    expect(loadStats([])).toEqual({ open: 0, raised: 0, thisWeek: 0, resolved: 0 })
    expect(loadStats(undefined).open).toBe(0)
  })

  it('reports counts, never a score or a target', () => {
    // Deliberately no percentage and no goal: this is a count of what is on
    // your mind, not a verdict on how good a partner you are.
    const keys = Object.keys(loadStats([item()]))
    expect(keys).not.toContain('score')
    expect(keys).not.toContain('target')
    expect(keys).not.toContain('streak')
  })
})

describe('the weekly look-ahead day', () => {
  it('is Sunday — the evening you can still do something about the week', () => {
    expect(isReviewDay(new Date(2026, 8, 20))).toBe(true)   // zondag
    expect(isReviewDay(new Date(2026, 8, 21))).toBe(false)  // maandag
    expect(isReviewDay(new Date(2026, 8, 19))).toBe(false)  // zaterdag
  })
})

describe('the horizons', () => {
  it('run from soonest to furthest, so sorting on index is sorting on urgency', () => {
    expect(HORIZONS.map((h) => h.value)).toEqual(['week', 'fortnight', 'month', 'later'])
  })

  it('all carry a Dutch label', () => {
    for (const h of HORIZONS) expect(h.label.length).toBeGreaterThan(0)
  })
})
