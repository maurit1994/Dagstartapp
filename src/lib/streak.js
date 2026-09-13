import { daysBetweenKeys, getLocalDateKey } from './date.js'

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
