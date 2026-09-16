import { describe, expect, it } from 'vitest'
import {
  angleToMinutes,
  minutesToAngle,
  minutesToTime,
  polarToXY,
  sleepArcPath,
  sweepBetween,
  xyToAngle,
} from '../clock.js'

const round = (n) => Math.round(n * 100) / 100

describe('minutesToAngle — midnight at the top, clockwise', () => {
  it('places the quarters where a clock face has them', () => {
    expect(minutesToAngle(0)).toBe(0) // 00:00 top
    expect(minutesToAngle(6 * 60)).toBe(90) // 06:00 right
    expect(minutesToAngle(12 * 60)).toBe(180) // 12:00 bottom
    expect(minutesToAngle(18 * 60)).toBe(270) // 18:00 left
  })

  it('wraps a full day back to the top', () => {
    expect(minutesToAngle(24 * 60)).toBe(0)
    expect(minutesToAngle(25 * 60)).toBe(minutesToAngle(60))
  })

  it('handles negatives rather than returning a negative angle', () => {
    expect(minutesToAngle(-60)).toBe(minutesToAngle(23 * 60))
  })
})

describe('angleToMinutes', () => {
  it('is the inverse of minutesToAngle on the quarters', () => {
    for (const minutes of [0, 6 * 60, 12 * 60, 18 * 60]) {
      expect(angleToMinutes(minutesToAngle(minutes))).toBe(minutes)
    }
  })

  it('snaps to five minutes by default', () => {
    const almost = minutesToAngle(7 * 60 + 13)
    expect(angleToMinutes(almost)).toBe(7 * 60 + 15)
  })

  it('snapping up from just before midnight lands ON midnight, not on hour 24', () => {
    const almostMidnight = minutesToAngle(23 * 60 + 59)
    expect(angleToMinutes(almostMidnight)).toBe(0)
  })

  it('accepts a different snap', () => {
    expect(angleToMinutes(minutesToAngle(7 * 60 + 20), 30)).toBe(7 * 60 + 30)
  })

  it('normalises angles outside 0-360', () => {
    expect(angleToMinutes(450)).toBe(angleToMinutes(90))
    expect(angleToMinutes(-90)).toBe(angleToMinutes(270))
  })
})

describe('polarToXY and xyToAngle', () => {
  it('puts midnight straight above the centre', () => {
    const p = polarToXY(100, 100, 50, 0)
    expect(round(p.x)).toBe(100)
    expect(round(p.y)).toBe(50)
  })

  it('puts 06:00 to the right', () => {
    const p = polarToXY(100, 100, 50, 90)
    expect(round(p.x)).toBe(150)
    expect(round(p.y)).toBe(100)
  })

  it('round-trips a point back to its angle', () => {
    for (const angle of [0, 45, 90, 180, 270, 315]) {
      const p = polarToXY(100, 100, 50, angle)
      expect(round(xyToAngle(100, 100, p.x, p.y))).toBe(angle)
    }
  })
})

describe('sweepBetween — the across-midnight case', () => {
  it('measures clockwise, never negative', () => {
    expect(sweepBetween(0, 6 * 60)).toBe(90)
    // 23:00 -> 07:00 is eight hours the long way round the top, not -240deg.
    expect(sweepBetween(23 * 60, 7 * 60)).toBe(120)
  })

  it('is zero for identical times', () => {
    expect(sweepBetween(90, 90)).toBe(0)
  })

  it('always stays within 0-360', () => {
    for (const [a, b] of [[0, 0], [10, 1430], [1430, 10], [720, 0]]) {
      const s = sweepBetween(a, b)
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThan(360)
    }
  })
})

describe('sleepArcPath', () => {
  it('uses the SHORT arc for a night under twelve hours', () => {
    // 23:00 -> 07:00 is 8h = 120deg, so the large-arc flag must be 0.
    const d = sleepArcPath(100, 100, 80, 23 * 60, 7 * 60)
    expect(d).toMatch(/A 80 80 0 0 1/)
  })

  it('uses the LONG arc for a night over twelve hours', () => {
    const d = sleepArcPath(100, 100, 80, 20 * 60, 12 * 60)
    expect(d).toMatch(/A 80 80 0 1 1/)
  })

  it('always sweeps clockwise', () => {
    for (const [bed, wake] of [[0, 60], [23 * 60, 60], [12 * 60, 6 * 60]]) {
      expect(sleepArcPath(100, 100, 80, bed, wake)).toMatch(/A 80 80 0 [01] 1/)
    }
  })

  it('draws a full circle, not nothing, when the handles coincide', () => {
    const d = sleepArcPath(100, 100, 80, 90, 90)
    // Two half circles; a single arc with identical endpoints renders nothing.
    expect(d.match(/A /g)).toHaveLength(2)
  })

  it('starts at the bedtime handle', () => {
    const bed = 22 * 60
    const start = polarToXY(100, 100, 80, minutesToAngle(bed))
    expect(sleepArcPath(100, 100, 80, bed, 6 * 60)).toContain(
      `M ${start.x} ${start.y}`,
    )
  })
})

describe('minutesToTime', () => {
  it('pads to HH:MM', () => {
    expect(minutesToTime(0)).toBe('00:00')
    expect(minutesToTime(7 * 60 + 5)).toBe('07:05')
    expect(minutesToTime(23 * 60 + 30)).toBe('23:30')
  })

  it('wraps a full day', () => {
    expect(minutesToTime(24 * 60)).toBe('00:00')
  })
})
