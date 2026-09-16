/**
 * Geometry for the 24-hour clock dial.
 *
 * Kept away from the component on purpose: this is the part that goes wrong
 * quietly — an angle off by 90°, a night that wraps past midnight drawn the
 * short way round — and the part that can be tested without a browser.
 *
 * Convention, matching how a clock is read: 00:00 sits at the TOP and time
 * runs CLOCKWISE, so 06:00 is on the right, 12:00 at the bottom, 18:00 left.
 */

export const MINUTES_PER_DAY = 24 * 60

/** Minutes since midnight -> degrees clockwise from the top. */
export function minutesToAngle(minutes) {
  const wrapped = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  return (wrapped / MINUTES_PER_DAY) * 360
}

/**
 * Degrees clockwise from the top -> minutes since midnight.
 * @param {number} angle
 * @param {number} [snapTo] round to this many minutes (5 by default)
 */
export function angleToMinutes(angle, snapTo = 5) {
  const wrapped = ((angle % 360) + 360) % 360
  const raw = (wrapped / 360) * MINUTES_PER_DAY
  const snapped = Math.round(raw / snapTo) * snapTo
  // Snapping 23:58 upward lands on 24:00, which is midnight, not a 25th hour.
  return snapped % MINUTES_PER_DAY
}

/** A point on the dial. SVG y grows downward, hence the minus on cos. */
export function polarToXY(cx, cy, radius, angle) {
  const radians = ((angle - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  }
}

/** Where a pointer landed, as degrees clockwise from the top. */
export function xyToAngle(cx, cy, x, y) {
  const degrees = (Math.atan2(y - cy, x - cx) * 180) / Math.PI + 90
  return ((degrees % 360) + 360) % 360
}

/** Clockwise sweep from one time to another, in degrees. Always 0-360. */
export function sweepBetween(fromMinutes, toMinutes) {
  const diff = minutesToAngle(toMinutes) - minutesToAngle(fromMinutes)
  return ((diff % 360) + 360) % 360
}

/**
 * SVG path for the sleep arc, drawn CLOCKWISE from bedtime to wake time — so
 * a night that crosses midnight takes the long way round the top, which is
 * the way it was actually slept.
 *
 * A zero sweep means the two handles coincide; that is a full 24 hours, and a
 * single arc command with identical endpoints draws nothing, so it is split
 * into two half circles.
 */
export function sleepArcPath(cx, cy, radius, bedMinutes, wakeMinutes) {
  const sweep = sweepBetween(bedMinutes, wakeMinutes)
  const start = polarToXY(cx, cy, radius, minutesToAngle(bedMinutes))

  if (sweep === 0) {
    const opposite = polarToXY(cx, cy, radius, minutesToAngle(bedMinutes) + 180)
    return [
      `M ${start.x} ${start.y}`,
      `A ${radius} ${radius} 0 1 1 ${opposite.x} ${opposite.y}`,
      `A ${radius} ${radius} 0 1 1 ${start.x} ${start.y}`,
    ].join(' ')
  }

  const end = polarToXY(cx, cy, radius, minutesToAngle(wakeMinutes))
  const largeArc = sweep > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

/** "HH:MM" from minutes since midnight. */
export function minutesToTime(minutes) {
  const wrapped = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  const hours = Math.floor(wrapped / 60)
  return `${String(hours).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`
}
