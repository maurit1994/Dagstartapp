/**
 * The Dagstart questions.
 *
 * Wording is taken verbatim from the user's previous app rather than
 * reinvented — these are the questions they actually used for months, and
 * rephrasing them would quietly change what gets answered. That freeze is on
 * the WORDS. How often a question is asked is a separate decision, and this
 * file now carries it: every question declares either a `tier` (asked every
 * day, at that tier) or a `weekday` (asked only on that day, whatever the
 * tier). `weekend` always worked that way; the mechanism is simply no longer
 * a special case of one.
 *
 * Two modes on purpose: the short set on a bad morning, the full one on a
 * good one. The switch is the ADHD-friendly part. A richer form that gets
 * skipped records nothing.
 *
 * Why the daily set is smaller than it was
 * ---------------------------------------
 * Six of seven questions asked for free text, and free recall is the most
 * expensive thing you can ask for at the hour there is least of it. The
 * scales next to them are one tap. That balance was backwards, so the
 * expensive questions moved to where there is capacity for them.
 *
 * - `goed` ("wat ging er GISTEREN goed") is the hardest retrieval in the set
 *   and it sat in the short morning set. Now Full only: a question that asks
 *   you to reconstruct yesterday evening belongs on a day you have something
 *   to reconstruct it with.
 * - `dankbaar` is the one question the evidence says to ask LESS often.
 *   Counting blessings once a week beat three times a week in Lyubomirsky's
 *   frequency work, with the more frequent group doing worse — habituation
 *   turns it into a form to fill in. Weekly, on Sunday.
 * - Lite is two typed questions, not three. `bereiken` is load-bearing (the
 *   evening quotes it back, Vandaag shows it all day). `zin` stays beside it
 *   because it is the only positively-framed thing in the short set, and a
 *   bad morning that opens with nothing but "what must I achieve" is a bleak
 *   way in.
 *
 * `onrustig` is asked here and shown again in the evening. Its hint says
 * "geef het een plek", and for a long time there was no place: it was stored
 * and never surfaced again, which is how surfacing a worry turns into
 * rehearsing it. The evening card is the designated return.
 */

/** Day numbers as Date#getDay reports them. */
const SUNDAY = 0
const FRIDAY = 5

export const QUESTIONS = {
  goed: {
    id: 'goed',
    q: 'Wat ging er gisteren goed?',
    hint: 'Begin met één ding',
    tier: 'full',
  },
  dankbaar: {
    id: 'dankbaar',
    q: 'Waar ben ik vandaag dankbaar voor?',
    hint: 'Klein of groot',
    weekday: SUNDAY,
  },
  bereiken: {
    id: 'bereiken',
    q: 'Wat wil ik vandaag écht bereiken?',
    hint: 'Één prioriteit',
    tier: 'lite',
  },
  gedragen: {
    id: 'gedragen',
    q: 'Hoe wil ik me vandaag gedragen?',
    hint: 'Één woord of zin',
    tier: 'full',
  },
  onrustig: {
    id: 'onrustig',
    q: 'Wat houdt me bezig of maakt me onrustig?',
    hint: 'Geef het een plek',
    tier: 'full',
  },
  zin: {
    id: 'zin',
    q: 'Waar heb ik zin in vandaag?',
    hint: 'Energie voor de dag',
    tier: 'lite',
  },
  weekend: {
    id: 'weekend',
    q: 'Wat plan ik sociaal of persoonlijk dit weekend?',
    hint: 'Iets om naar uit te kijken',
    weekday: FRIDAY,
  },
}

export const MODES = ['lite', 'full']

/**
 * The daily questions in the order they are asked. Lite's come first in both
 * modes, so switching to Full mid-flow appends rather than reshuffles and you
 * keep your place.
 */
const DAILY_IDS = ['bereiken', 'zin', 'goed', 'gedragen', 'onrustig']

/** Asked on one weekday only, whatever the mode. */
const WEEKLY_IDS = ['dankbaar', 'weekend']

/**
 * Every question id that can be stored, in canonical display order.
 *
 * Use this — not questionsForMode — to RENDER stored answers. Which questions
 * get asked depends on the mode and the day, and those rules change; an
 * answer already given must stay visible regardless.
 */
export const ALL_QUESTION_IDS = Object.keys(QUESTIONS)

/**
 * The weekly questions falling on this date, in canonical order.
 *
 * `weekend` is asked on FRIDAY. The previous app asked it on Saturday and
 * Sunday, which this app copied at first. It was wrong: "Wat plan ik dit
 * weekend?" on a Sunday afternoon asks about a weekend that is already over.
 * On Friday it is still a plan.
 *
 * `dankbaar` is asked on SUNDAY, and weekly rather than daily on the
 * evidence: asked every morning it habituates into a form to fill in, which
 * is the opposite of what it is for.
 */
export function weeklyQuestionsOn(date = new Date()) {
  return WEEKLY_IDS.map((id) => QUESTIONS[id]).filter((q) => q.weekday === date.getDay())
}

/**
 * The questions to ask, in order: the day's daily set, then whatever weekly
 * question falls today.
 *
 * Lite's come FIRST in both modes, and Full appends after them. The previous
 * app interleaved them, but it also made you choose the length before you
 * started — a decision every single morning, taken at the hour you have least
 * to spend on decisions. Asking the short set first and offering the rest
 * once it is behind you removes that: you cannot pick wrong, and the extras
 * are something you add on a good day rather than a commitment you regret on
 * a bad one.
 *
 * A weekly question is appended whatever the mode. Asking it only on Full
 * days would mean the questions meant to be rare are also the ones most
 * likely never to be asked at all.
 *
 * This decides which questions are ASKED, never their wording, and the
 * summary still renders in ALL_QUESTION_IDS order, so everything already
 * recorded stays visible however these rules change.
 *
 * @param {'lite'|'full'} mode
 * @param {Date} [date] decides which weekly question, if any, is included
 */
export function questionsForMode(mode, date = new Date()) {
  const daily = DAILY_IDS.map((id) => QUESTIONS[id]).filter(
    (q) => mode === 'full' || q.tier === 'lite',
  )
  return [...daily, ...weeklyQuestionsOn(date)]
}

/** How many extra questions Full adds, for the offer at the end of Lite. */
export const EXTRA_QUESTION_COUNT = DAILY_IDS.filter(
  (id) => QUESTIONS[id].tier === 'full',
).length

/* -------------------------------------------------------------------- sleep */

/** How the night felt. Index 0 unused so the value equals the scale position. */
export const SLEEP_SCALE = ['', 'Slecht', 'Matig', 'Oké', 'Goed', 'Uitstekend']
export const SLEEP_EMOJI = ['', '😴', '😕', '😐', '🙂', '😊']

/** Garmin's own HRV verdict, transcribed by hand from the watch. */
export const HRV_STATUSES = ['Goed', 'Matig', 'Slecht']

/* ------------------------------------------------------------------ evening */

/** Pain right now. Index 0 is unused so the value equals the scale position. */
export const PAIN_SCALE = ['', 'Geen', 'Licht', 'Matig', 'Veel', 'Erg veel']
export const FOCUS_SCALE = ['', 'Slecht', 'Matig', 'Oké', 'Goed', 'Scherp']
export const REACTIVITY_SCALE = [
  '',
  'Kalm',
  'Rustig',
  'Neutraal',
  'Gespannen',
  'Reactief',
]

/** Was the morning's priority reached? */
export const PRIORITY_OUTCOMES = [
  { value: 'done', label: 'Ja', emoji: '✅' },
  { value: 'partly', label: 'Deels', emoji: '🌗' },
  { value: 'missed', label: 'Nee', emoji: '⭕️' },
]

/** First thing this morning — a habit marker, not a judgement. */
export const FIRST_THING_OPTIONS = [
  { value: 'Telefoon', emoji: '📱' },
  { value: 'Daglicht', emoji: '☀️' },
  { value: 'Bewegen', emoji: '🚶' },
  { value: 'Anders', emoji: '✦' },
]

export const FIRST_THING_VALUES = FIRST_THING_OPTIONS.map((o) => o.value)
