import { getDateKeyDaysAgo, getLocalDateKey } from './date.js'

/**
 * The last N days of one field, oldest first.
 *
 * Exists because four of the evening's seven fields were WRITE-ONLY: you
 * tapped focus, reactivity, caffeine and "first thing" every night and
 * nothing in the app ever read them back. Collecting a number nobody looks at
 * is the clearest version of "I fill it in and nothing happens".
 *
 * It returns the raw series and nothing else — no average, no trend line, no
 * correlation. Those need far more data than a few weeks before an answer
 * would be true rather than merely printable, and a chart that implies a
 * pattern from six points is a lie with axes on it. Your own numbers, in
 * order, make no claim at all.
 *
 * @param {object} checkins date key -> entry, already migrated
 * @param {(entry: object) => number|null|undefined} pick reads the field
 * @param {number} [days]
 * @param {string} [today]
 * @returns {{dateKey: string, value: number|null}[]} oldest first
 */
export function recentSeries(checkins, pick, days = 7, today = getLocalDateKey()) {
  const from = new Date(`${today}T12:00:00`)
  const out = []
  for (let i = days - 1; i >= 0; i -= 1) {
    const dateKey = getDateKeyDaysAgo(i, from)
    const value = checkins?.[dateKey] ? pick(checkins[dateKey]) : null
    out.push({
      dateKey,
      value: typeof value === 'number' ? value : null,
    })
  }
  return out
}

/** How many days in a series actually carry a value. */
export function filledCount(series) {
  return (series ?? []).filter((d) => d.value !== null).length
}
