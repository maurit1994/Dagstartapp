import { getDateKeyDaysAgo, getLocalDateKey } from './date.js'

/**
 * Sport and physio.
 *
 * The options are taken VERBATIM from the user's previous app — same words,
 * same order — for the same reason as the Dagstart questions: these are the
 * categories they actually logged against for months, and renaming them makes
 * the old and new records incomparable.
 */

export const SPORT_TYPES = [
  'Gym',
  'Hardlopen',
  'Wandelen',
  'Fietsen',
  'Pilates',
  'Yoga',
  'Zwemmen',
  'Anders',
  'Geen',
]

/** "Geen" is an answer, not an absence: it means "I did not exercise today". */
export const NO_SPORT = 'Geen'

/**
 * "Anders" is the escape hatch, and on its own it records nothing: a year of
 * "Anders ×14" cannot tell you whether you went climbing or bowling. Picking
 * it asks for the name, and that name is what the tallies count.
 *
 * The fixed list stays fixed — renaming or extending it would make the old
 * and new records incomparable, which is why it was copied verbatim in the
 * first place. A typed name sits BESIDE the category instead of inside it.
 */
export const OTHER_SPORT = 'Anders'

/** Long enough for "Bouldern met Joost", short enough to stay one line. */
export const MAX_SPORT_LABEL = 40

/**
 * What to CALL a session: the typed name for "Anders", the category
 * otherwise. Everything that counts or displays sessions goes through this,
 * so a named sport is counted as itself and never lumped under "Anders".
 */
export function sessionName(session) {
  if (!session) return ''
  const label = typeof session.label === 'string' ? session.label.trim() : ''
  if (session.type === OTHER_SPORT && label) return label
  return session.type ?? ''
}

export const DURATIONS = ['< 30 min', '30–60 min', '60+ min']
export const INTENSITIES = ['Laag', 'Medium', 'Hoog']

/** Whether the rest/physio exercises were done. Same three values as the evening. */
export const PHYSIO_OUTCOMES = [
  { value: 'done', label: 'Ja', emoji: '✅' },
  { value: 'partly', label: 'Deels', emoji: '🌗' },
  { value: 'missed', label: 'Nee', emoji: '⭕️' },
]

export const PHYSIO_VALUES = PHYSIO_OUTCOMES.map((o) => o.value)

/** Sessions that were actually exercise, ignoring an explicit "Geen". */
export function realSessions(movement) {
  return (movement?.sports ?? []).filter((s) => s.type && s.type !== NO_SPORT)
}

/**
 * What the last N days look like.
 *
 * `loggedDays` counts days you answered at all — including the ones you
 * answered with "Geen". Knowing you logged a rest day is different from not
 * knowing, and a week overview that cannot tell them apart is misleading.
 */
export function weekStats(checkins, days = 7, today = getLocalDateKey()) {
  const from = new Date(`${today}T12:00:00`)
  const keys = Array.from({ length: days }, (_, i) => getDateKeyDaysAgo(i, from))

  const byType = {}
  let sportDays = 0
  let sessions = 0
  let loggedDays = 0
  let physioDone = 0
  let physioPartly = 0

  for (const key of keys) {
    const movement = checkins?.[key]?.movement
    if (!movement) continue

    const answeredSport = (movement.sports ?? []).length > 0
    if (answeredSport || movement.physio) loggedDays += 1

    const real = realSessions(movement)
    if (real.length > 0) sportDays += 1
    sessions += real.length
    for (const session of real) {
      // By NAME, not by category: an unnamed "Anders" still falls back to
      // "Anders", so nothing is lost either way.
      const name = sessionName(session)
      byType[name] = (byType[name] ?? 0) + 1
    }

    if (movement.physio === 'done') physioDone += 1
    if (movement.physio === 'partly') physioPartly += 1
  }

  return { days, keys, sportDays, sessions, byType, loggedDays, physioDone, physioPartly }
}

/** Types done in the window, most frequent first. */
export function topTypes(stats) {
  return Object.entries(stats.byType).sort((a, b) => b[1] - a[1])
}
