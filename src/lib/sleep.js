/**
 * Sleep duration from a bedtime and a wake time.
 *
 * Both are plain "HH:MM" strings with no date attached, which is the whole
 * difficulty: going to bed at 23:30 and waking at 07:15 is 7h45m, not minus
 * sixteen hours. A wake time at or before the bedtime is therefore read as
 * the next morning.
 *
 * Deliberately not built on Date: there is no calendar day here, and dragging
 * one in would drag daylight saving in with it.
 */

const MINUTES_PER_DAY = 24 * 60

/** "HH:MM" -> minutes since midnight, or null if unusable. */
export function parseTime(value) {
  if (typeof value !== 'string') return null
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

/**
 * Minutes slept, or null when either time is missing or unusable.
 * Equal times mean a full 24 hours, not zero — nobody records a zero-second
 * night, and reading it as 24h at least shows up as obviously odd.
 */
export function sleepMinutes(bedtijd, wakkertijd) {
  const bed = parseTime(bedtijd)
  const wake = parseTime(wakkertijd)
  if (bed === null || wake === null) return null
  const diff = wake - bed
  return diff > 0 ? diff : diff + MINUTES_PER_DAY
}

/** Dutch duration label, e.g. "7u 45m". Null when it cannot be computed. */
export function formatSleepDuration(bedtijd, wakkertijd) {
  const total = sleepMinutes(bedtijd, wakkertijd)
  if (total === null) return null
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return minutes === 0 ? `${hours}u` : `${hours}u ${minutes}m`
}
