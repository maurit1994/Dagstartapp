/**
 * Date helpers. Every date key in Anker comes from here.
 *
 * The rule this file exists to enforce: date keys derive from LOCAL time.
 * `toISOString()` converts to UTC first, so a check-in saved at 00:30 in
 * UTC+8 would be filed under the previous day. That bug has bitten us before.
 */

/** Two-digit zero padding: 7 -> "07". */
function pad(n) {
  return String(n).padStart(2, '0')
}

/**
 * The canonical date key for a day: "YYYY-MM-DD" in the device's own timezone.
 * @param {Date} [date] defaults to now
 */
export function getLocalDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** The date key for N days before the given day (0 = that day itself). */
export function getDateKeyDaysAgo(daysAgo, from = new Date()) {
  const d = new Date(from)
  d.setDate(d.getDate() - daysAgo)
  return getLocalDateKey(d)
}

/** How many whole days lie between two "YYYY-MM-DD" keys (b - a). */
export function daysBetweenKeys(a, b) {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  // Date.UTC avoids daylight-saving hours making a 24h difference come out
  // as 23 or 25. These are calendar dates, not moments in time.
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round(
    (Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / msPerDay,
  )
}

/** Human-readable Dutch label for a date key, e.g. "zaterdag 13 september". */
export function formatDateKeyNL(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/** Short Dutch label, e.g. "13 sep". */
export function formatDateKeyShortNL(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
  })
}

/** Clock time for a timestamp, e.g. "14:05". */
export function formatTimeNL(timestamp) {
  return new Date(timestamp).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
