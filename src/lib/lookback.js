import { getDateKeyDaysAgo, getLocalDateKey } from './date.js'
import { ALL_QUESTION_IDS, QUESTIONS } from './questions.js'

/**
 * One thing you wrote on an earlier day, shown back to you.
 *
 * This is the smallest honest return the app can give. Everything else it
 * could offer — does sleep predict focus, does exercise lift mood — needs
 * weeks of dense data before an answer would be true rather than merely
 * printable. Your own sentence from three weeks ago needs none: it is already
 * there, it cost nothing to compute, and it is the one thing a written record
 * gives you that your memory does not.
 *
 * Before this existed, answers went in and never came out except in the
 * summary of the day you wrote them. That is a notebook you never reopen.
 */

/** Days since the epoch, from a LOCAL date key — never Date arithmetic. */
function dayNumber(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
}

/** A written answer worth showing: present, and not just whitespace. */
function writtenAnswers(entry) {
  return ALL_QUESTION_IDS.filter(
    (id) => typeof entry?.answers?.[id] === 'string' && entry.answers[id].trim() !== '',
  )
}

/**
 * Pick one past day and one answer from it.
 *
 * Deterministic, not random: the same day shows the same memory however many
 * times the screen re-renders (and this screen remounts after every save),
 * while a different one comes up tomorrow. Random would flicker on remount
 * and could repeat the same entry twice in a row.
 *
 * Days at least a week old are preferred, because the point is to show you
 * something you could not have recalled unaided — but when the app is new
 * there are none, and a card that stays empty for the first week withholds
 * the payoff exactly when it is most needed. So it falls back to whatever
 * past day exists.
 *
 * @param {object} checkins date key -> entry, already migrated
 * @param {string} [today]
 * @returns {{dateKey: string, questionId: string, question: string, text: string, daysAgo: number}|null}
 */
export function lookbackFor(checkins, today = getLocalDateKey()) {
  if (!checkins || typeof checkins !== 'object') return null

  const withWriting = Object.keys(checkins)
    .filter((key) => key < today && writtenAnswers(checkins[key]).length > 0)
    .sort()
  if (withWriting.length === 0) return null

  const aWeekAgo = getDateKeyDaysAgo(7, new Date(`${today}T12:00:00`))
  const older = withWriting.filter((key) => key <= aWeekAgo)
  const pool = older.length > 0 ? older : withWriting

  const turn = dayNumber(today)
  const dateKey = pool[turn % pool.length]

  const ids = writtenAnswers(checkins[dateKey])
  const questionId = ids[turn % ids.length]

  return {
    dateKey,
    questionId,
    question: QUESTIONS[questionId]?.q ?? questionId,
    text: checkins[dateKey].answers[questionId].trim(),
    daysAgo: dayNumber(today) - dayNumber(dateKey),
  }
}
