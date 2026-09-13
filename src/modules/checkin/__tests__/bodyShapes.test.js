import { describe, expect, it } from 'vitest'
import { backShapes, frontShapes, shapesForView } from '../bodyShapes.js'
import { REGION_IDS } from '../../../lib/regions.js'
import { BODY_REGIONS } from '../../../lib/regions.js'

/**
 * Average x of a shape — its centre of mass across the viewBox.
 *
 * Not the path's first point: some shapes start exactly on the midline and
 * extend to one side, so a single point says nothing about which side the
 * shape is actually on.
 */
function xOf(shape) {
  if (shape.el === 'ellipse') return shape.cx
  // In this file every path command is "<letter> x y ...", so the x values are
  // the 1st, 3rd, 5th ... numbers. H commands take a lone x, which is also an
  // x value, so taking every other number would drift. Parse per command.
  const xs = []
  for (const [, cmd, args] of shape.d.matchAll(/([MLQHVZ])([^MLQHVZ]*)/g)) {
    const nums = (args.match(/-?[\d.]+/g) ?? []).map(Number)
    if (cmd === 'H') xs.push(...nums)
    else if (cmd === 'V' || cmd === 'Z') continue
    else for (let i = 0; i < nums.length; i += 2) xs.push(nums[i])
  }
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

// Midline of the 200-wide viewBox.
const CENTRE = 100

describe('left / right mirroring — the silent-wrong-data risk', () => {
  it('FRONT view: the person\'s LEFT is on the viewer\'s RIGHT', () => {
    const shapes = frontShapes()
    const left = shapes.find((s) => s.id === 'shoulder_l')
    const right = shapes.find((s) => s.id === 'shoulder_r')
    expect(xOf(left)).toBeGreaterThan(CENTRE)
    expect(xOf(right)).toBeLessThan(CENTRE)
  })

  it('BACK view: the person\'s LEFT is on the viewer\'s LEFT', () => {
    const shapes = backShapes()
    const left = shapes.find((s) => s.id === 'shoulder_l')
    const right = shapes.find((s) => s.id === 'shoulder_r')
    expect(xOf(left)).toBeLessThan(CENTRE)
    expect(xOf(right)).toBeGreaterThan(CENTRE)
  })

  it('mirrors arms and legs the same way as shoulders', () => {
    for (const pair of ['arm', 'leg']) {
      const front = frontShapes()
      expect(xOf(front.find((s) => s.id === `${pair}_l`))).toBeGreaterThan(CENTRE)
      expect(xOf(front.find((s) => s.id === `${pair}_r`))).toBeLessThan(CENTRE)

      const back = backShapes()
      expect(xOf(back.find((s) => s.id === `${pair}_l`))).toBeLessThan(CENTRE)
      expect(xOf(back.find((s) => s.id === `${pair}_r`))).toBeGreaterThan(CENTRE)
    }
  })

  it('puts hips (back-only) on the correct sides', () => {
    const shapes = backShapes()
    expect(xOf(shapes.find((s) => s.id === 'hip_l'))).toBeLessThan(CENTRE)
    expect(xOf(shapes.find((s) => s.id === 'hip_r'))).toBeGreaterThan(CENTRE)
  })
})

describe('every region is reachable and nothing is drawn twice', () => {
  it('draws no id that is not a known region', () => {
    const drawn = [...frontShapes(), ...backShapes()].map((s) => s.id)
    for (const id of drawn) expect(REGION_IDS).toContain(id)
  })

  it('can reach every region from one view or the other', () => {
    const drawn = new Set([...frontShapes(), ...backShapes()].map((s) => s.id))
    for (const id of REGION_IDS) expect(drawn).toContain(id)
  })

  it('draws each region at most once per view', () => {
    for (const view of ['front', 'back']) {
      const ids = shapesForView(view).map((s) => s.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('matches what regions.js claims about which view each appears on', () => {
    for (const view of ['front', 'back']) {
      const drawn = new Set(shapesForView(view).map((s) => s.id))
      for (const region of BODY_REGIONS) {
        expect(drawn.has(region.id)).toBe(region.views.includes(view))
      }
    }
  })
})
