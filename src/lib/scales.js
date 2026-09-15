/**
 * Colour for the 1-5 scales.
 *
 * Carried over from the user's previous app, where every scale was coloured
 * and a filled-in day could be read at a glance. Anker painted every selected
 * button the same accent blue, which looks tidy and tells you nothing.
 *
 * One ramp, walked in either direction:
 *  - high is GOOD  (mood, sleep, focus)        -> 1 red ... 5 green
 *  - high is BAD   (pain, tension, reactivity) -> 1 green ... 5 red
 *
 * The colours are muted on purpose. A health tool opened on a bad morning
 * should not shout at you in signal red.
 */

/** Index 0 is the best, index 4 the worst. */
const RAMP = ['#4a9e6a', '#8ab84a', '#d4944a', '#c0602a', '#a03020']

/**
 * @param {number} value 1-5
 * @param {'up'|'down'} direction 'up' = a high value is good
 * @returns {string|null} hex colour, or null when the value is out of range
 */
export function scaleColor(value, direction = 'up') {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1 || n > 5) return null
  // 'up': 5 should be the best, so walk the ramp backwards.
  const index = direction === 'up' ? 5 - n : n - 1
  return RAMP[index]
}

/** The same colour at low opacity, for a selected button's fill. */
export function scaleFill(value, direction = 'up') {
  const color = scaleColor(value, direction)
  return color ? `${color}33` : null
}
