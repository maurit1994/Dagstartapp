/**
 * The Dagstart questions.
 *
 * Wording is taken verbatim from the user's previous app rather than
 * reinvented — these are the questions they actually used for months, and
 * rephrasing them would quietly change what gets answered.
 *
 * Two modes on purpose: three questions on a bad morning, six on a good one.
 * The switch is the ADHD-friendly part. A richer form that gets skipped
 * records nothing.
 */

export const QUESTIONS = {
  goed: { id: 'goed', q: 'Wat ging er gisteren goed?', hint: 'Begin met één ding' },
  dankbaar: {
    id: 'dankbaar',
    q: 'Waar ben ik vandaag dankbaar voor?',
    hint: 'Klein of groot',
  },
  bereiken: {
    id: 'bereiken',
    q: 'Wat wil ik vandaag écht bereiken?',
    hint: 'Één prioriteit',
  },
  gedragen: {
    id: 'gedragen',
    q: 'Hoe wil ik me vandaag gedragen?',
    hint: 'Één woord of zin',
  },
  onrustig: {
    id: 'onrustig',
    q: 'Wat houdt me bezig of maakt me onrustig?',
    hint: 'Geef het een plek',
  },
  zin: { id: 'zin', q: 'Waar heb ik zin in vandaag?', hint: 'Energie voor de dag' },
  weekend: {
    id: 'weekend',
    q: 'Wat plan ik sociaal of persoonlijk dit weekend?',
    hint: 'Iets om naar uit te kijken',
  },
}

export const MODES = ['lite', 'full']

const LITE_IDS = ['goed', 'bereiken', 'zin']
/** The three Full adds on top of Lite, kept in the old app's relative order. */
const EXTRA_IDS = ['dankbaar', 'gedragen', 'onrustig']

/**
 * Every question id that can be stored, in canonical display order.
 *
 * Use this — not questionsForMode — to RENDER stored answers. Which questions
 * get asked depends on the mode and the day, and those rules change; an
 * answer already given must stay visible regardless.
 */
export const ALL_QUESTION_IDS = Object.keys(QUESTIONS)

/**
 * Friday — the day the weekend question is asked.
 *
 * The previous app asked it on Saturday and Sunday, which this app copied at
 * first. It was wrong: "Wat plan ik dit weekend?" on a Sunday afternoon is a
 * question about a weekend that is already over. Asked on Friday it is still
 * a plan.
 */
export function isWeekendPlanningDay(date = new Date()) {
  return date.getDay() === 5
}

/**
 * The questions to ask, in order.
 *
 * Lite's three come FIRST in both modes, and Full appends its extra three
 * after them. The previous app interleaved them, but it also made you choose
 * the length before you started — a decision every single morning, taken at
 * the hour you have least to spend on decisions. Asking the short set first
 * and offering the rest once it is behind you removes that: you cannot pick
 * wrong, and the extras are something you add on a good day rather than a
 * commitment you regret on a bad one.
 *
 * This changes the order questions are ASKED, never their wording, and the
 * summary still renders in ALL_QUESTION_IDS order, so the record is
 * unchanged.
 *
 * @param {'lite'|'full'} mode
 * @param {Date} [date] decides whether the weekend question is included
 */
export function questionsForMode(mode, date = new Date()) {
  const ids = mode === 'full' ? [...LITE_IDS, ...EXTRA_IDS] : [...LITE_IDS]
  if (isWeekendPlanningDay(date)) ids.push('weekend')
  return ids.map((id) => QUESTIONS[id])
}

/** How many extra questions Full adds, for the offer at the end of Lite. */
export const EXTRA_QUESTION_COUNT = EXTRA_IDS.length

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
