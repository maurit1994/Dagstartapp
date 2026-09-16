import { describe, expect, it } from 'vitest'
import { scaleColor, scaleFill } from '../scales.js'

describe('scaleColor', () => {
  it('up: 5 is green, 1 is red', () => {
    expect(scaleColor(5, 'up')).toBe('#4a9e6a')
    expect(scaleColor(1, 'up')).toBe('#a03020')
  })

  it('down: 1 is green, 5 is red', () => {
    expect(scaleColor(1, 'down')).toBe('#4a9e6a')
    expect(scaleColor(5, 'down')).toBe('#a03020')
  })

  it('is a mirror of itself — the two directions never agree except in the middle', () => {
    for (const n of [1, 2, 4, 5]) {
      expect(scaleColor(n, 'up')).not.toBe(scaleColor(n, 'down'))
    }
    expect(scaleColor(3, 'up')).toBe(scaleColor(3, 'down'))
  })

  it('walks the whole ramp without repeating', () => {
    const colors = [1, 2, 3, 4, 5].map((n) => scaleColor(n, 'up'))
    expect(new Set(colors).size).toBe(5)
  })

  it('defaults to up', () => {
    expect(scaleColor(5)).toBe(scaleColor(5, 'up'))
  })

  it('returns null outside 1-5 rather than a wrong colour', () => {
    for (const bad of [0, 6, -1, 2.5, null, undefined, 'drie', NaN]) {
      expect(scaleColor(bad)).toBeNull()
    }
  })
})

describe('scaleFill', () => {
  it('is the same hue at low opacity', () => {
    expect(scaleFill(5, 'up')).toBe('#4a9e6a33')
  })

  it('is null when the value is unusable', () => {
    expect(scaleFill(0)).toBeNull()
  })
})
