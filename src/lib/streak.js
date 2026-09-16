import { daysBetweenKeys, getDateKeyDaysAgo, getLocalDateKey } from './date.js'

/**
 * Count of consecutive days checked in, ending today or yesterday.
 *
 * Yesterday still counts so the streak does not read as broken during the
 * part of today before you have checked in; it breaks only once a full day
 * is genuinely skipped.
 *
 * @param {string[]} dateKeys  "YYYY-MM-DD" keys, any order
 * @param {string} [today]     defaults to the local today
 */
export function calculateStreak(dateKeys, today = getLocalDateKey()) {
  if (!Array.isArray(dateKeys) || dateKeys.length === 0) return 0

  const sorted = [...new Set(dateKeys)].sort().reverse()
  if (daysBetweenKeys(sorted[0], today) > 1) return 0

  let streak = 1
  for (let i = 1; i < sorted.length; i += 1) {
    if (daysBetweenKeys(sorted[i], sorted[i - 1]) === 1) streak += 1
    else break
  }
  return streak
}


/**
 * How many of the last N days were checked in.
 *
 * The number that cannot be destroyed. A streak resetting to zero after one
 * missed day is the mechanic that ends habits: it tells you the fortnight
 * before the gap no longer counts, and "I've lost it anyway" is where people
 * stop. This sits beside the streak and barely moves when a day is missed,
 * because that is the truth about what you actually did.
 */
export function daysInWindow(dateKeys, windowDays = 30, today = getLocalDateKey()) {
  if (!Array.isArray(dateKeys) || dateKeys.length === 0) return 0
  const window = new Set(
    Array.from({ length: windowDays }, (_, i) =>
      getDateKeyDaysAgo(i, new Date(`${today}T12:00:00`)),
    ),
  )
  return new Set(dateKeys.filter((key) => window.has(key))).size
}

/**
 * The longest run ever recorded.
 *
 * A broken streak takes the current number away; it must not take away that
 * the run happened.
 */
export function longestStreak(dateKeys) {
  if (!Array.isArray(dateKeys) || dateKeys.length === 0) return 0
  const sorted = [...new Set(dateKeys)].sort()

  let best = 1
  let run = 1
  for (let i = 1; i < sorted.length; i += 1) {
    run = daysBetweenKeys(sorted[i - 1], sorted[i]) === 1 ? run + 1 : 1
    if (run > best) best = run
  }
  return best
}
