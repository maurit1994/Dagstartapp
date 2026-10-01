import { getDateKeyDaysAgo, getLocalDateKey } from './date.js'
import { calculateStreak } from './streak.js'
import { getRegionLabel } from './regions.js'

/**
 * One line to show after saving a Dagstart.
 *
 * Entering data and having nothing happen is a bad trade. This is the small
 * return: something the app noticed that you could not have seen from today
 * alone.
 *
 * Strictly FACTUAL. No praise, no encouragement, no "keep it up" — invented
 * cheerfulness is obvious, and from a health tool it is worse than silence.
 * Every line here is a count of something that actually happened, and when
 * nothing is worth saying it says nothing.
 */

/** The last N date keys ending today, newest first. */
function recentKeys(days, today) {
  const from = new Date(`${today}T12:00:00`)
  return Array.from({ length: days }, (_, i) => getDateKeyDaysAgo(i, from))
}

/**
 * @param {object} checkins date key -> entry, already migrated
 * @param {string} [today]
 * @returns {string|null} one Dutch sentence, or null when nothing stands out
 */
export function insightFor(checkins, today = getLocalDateKey()) {
  if (!checkins || typeof checkins !== 'object') return null
  const entry = checkins[today]
  if (!entry) return null

  const last7 = recentKeys(7, today)
  const last14 = recentKeys(14, today)
  const last30 = recentKeys(30, today)

  // A run of bad nights, counted back from today.
  let badNights = 0
  for (const key of last7) {
    const score = checkins[key]?.sleep?.subjectief
    if (score !== null && score !== undefined && score <= 2) badNights += 1
    else break
  }
  if (badNights >= 3) {
    return `${badNights} nachten op rij slecht geslapen.`
  }

  // A body region that keeps coming back.
  const regionDays = {}
  for (const key of last7) {
    for (const part of checkins[key]?.body ?? []) {
      if (part.pain > 0 || part.tension > 0) {
        regionDays[part.region] = (regionDays[part.region] ?? 0) + 1
      }
    }
  }
  const persistent = Object.entries(regionDays)
    .filter(([, days]) => days >= 4)
    .sort((a, b) => b[1] - a[1])[0]
  if (persistent) {
    return `${getRegionLabel(persistent[0])} speelde ${persistent[1]} van de laatste 7 dagen.`
  }

  // An extreme, in either direction. Reported symmetrically on purpose: an
  // app that mentions your best days and stays quiet about your worst is
  // flattering you by selection, which is the same failure as inventing
  // praise outright. Phrased in RECORDED days, not calendar days — "in 30
  // days" would be a lie when only six of them were filled in.
  const priorMoods = last30
    .slice(1)
    .map((key) => checkins[key]?.mental)
    .filter((value) => typeof value === 'number')
  if (typeof entry.mental === 'number' && priorMoods.length >= 5) {
    const counted = priorMoods.length + 1
    if (priorMoods.every((m) => m < entry.mental)) {
      return `Je hoogste stemming van je laatste ${counted} ingevulde dagen.`
    }
    if (priorMoods.every((m) => m > entry.mental)) {
      return `Je laagste stemming van je laatste ${counted} ingevulde dagen.`
    }
  }

  // Today against yesterday, but only when the step is big enough to mean
  // something. A one-point move is noise. This sits BELOW the extreme above:
  // a run of recorded days says more than a single step, so the step is the
  // fallback for when there is not yet enough history for the other.
  const yesterday = getDateKeyDaysAgo(1, new Date(`${today}T12:00:00`))
  const now = entry.mental
  const before = checkins[yesterday]?.mental
  if (typeof now === 'number' && typeof before === 'number' && now - before >= 2) {
    return 'Je voelt je beduidend beter dan gisteren.'
  }

  // Milestones, stated as a fact rather than congratulated.
  const streak = calculateStreak(Object.keys(checkins), today)
  if ([3, 7, 14, 30, 60, 100].includes(streak)) {
    return `${streak} dagen op rij ingevuld.`
  }

  // How much of the intention actually happened, once there is enough to count.
  // Four, not seven. Seven evening check-ins inside a fortnight is a level of
  // consistency the app has to EARN first, so gating the payoff on it meant
  // the line that justifies filling anything in almost never appeared. Four
  // is still enough for "2 van de 4" to mean something.
  const outcomes = last14
    .map((key) => checkins[key]?.evening?.intention)
    .filter(Boolean)
  if (outcomes.length >= 4) {
    const reached = outcomes.filter((o) => o === 'done').length
    return `Je prioriteit lukte ${reached} van de laatste ${outcomes.length} keer.`
  }

  return null
}

/**
 * One line to close the day with, shown after saving the evening.
 *
 * The evening's counterpart to insightFor, under the same rules: a fact, or
 * nothing. The arc from morning to evening is the one honest thing available
 * from TODAY alone — it needs no history, no threshold and no statistics,
 * which is exactly why it can be here from the first day rather than in some
 * month when enough data has accumulated.
 *
 * Both readings are the same 1-5 mood scale, so the comparison is real and
 * not two different rulers held side by side.
 *
 * @param {object} entry one migrated day entry
 * @returns {string|null}
 */
export function eveningInsightFor(entry) {
  const morning = entry?.mental
  const evening = entry?.evening?.mental
  if (typeof morning !== 'number' || typeof evening !== 'number') return null

  if (evening === morning) {
    return `Je begon en eindigt de dag op ${morning}.`
  }
  return `Je begon op ${morning} en eindigt op ${evening}.`
}
