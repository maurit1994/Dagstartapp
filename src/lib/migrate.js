/**
 * Schema migrations.
 *
 * Anker's stored shape is versioned. Anything that reads stored data or an
 * export file passes it through here first, so old data keeps working and the
 * rest of the app only ever sees the current shape.
 *
 * v1 -> v2: pain moved from `pain: [{region, intensity}]` to
 * `body: [{region, pain, tension}]`, because a region can now carry two
 * scores. Old entries keep their pain score and get tension 0 — the honest
 * answer, since tension was never asked.
 *
 * v2 -> v3: a day gained an optional `evening` block. Purely additive: old
 * days get `evening: null`, which is exactly true — no evening check-in was
 * ever recorded for them.
 *
 * v3 -> v4: a day gained `mode` (lite/full) and `answers` (the Dagstart
 * questions), and the evening gained five fields. Additive, plus one MOVE:
 * the daily priority used to live in its own key, `anker_v1_intentions`, and
 * is now `answers.bereiken`. migrateCheckins folds that legacy map in on read
 * — an existing answer always wins, the legacy value only fills a gap, and a
 * date present only in the legacy map gets an entry created so nothing
 * written before this change becomes unreachable. The legacy key is never
 * deleted, so the move stays recoverable.
 *
 * v4 -> v5: a day gained an optional `sleep` block — how the night felt, bed
 * and wake times, a note, and the Garmin readings transcribed from the watch.
 * Purely additive: old days get `sleep: null`, which is true of them.
 *
 * v5 -> v6: a day gained an optional `movement` block — sport sessions and
 * whether the physio exercises were done. Purely additive; old days get
 * `movement: null`.
 *
 * v6 -> v7: a sport session gained `label`, the typed name for an "Anders"
 * session. Additive: every session stored before this gets `label: ''`, which
 * is the honest value — the name was never asked for. The label is cleared
 * for any type other than "Anders", so changing the category cannot leave a
 * name behind that contradicts it.
 */

export const CURRENT_SCHEMA_VERSION = 7

/** How a day's priority turned out. null means not answered. */
export const INTENTION_OUTCOMES = ['done', 'partly', 'missed']

const MODES = ['lite', 'full']
const HRV_STATUSES = ['Goed', 'Matig', 'Slecht']
const SPORT_TYPES = [
  'Gym', 'Hardlopen', 'Wandelen', 'Fietsen', 'Pilates', 'Yoga', 'Zwemmen',
  'Anders', 'Geen',
]
const DURATIONS = ['< 30 min', '30–60 min', '60+ min']
const INTENSITIES = ['Laag', 'Medium', 'Hoog']
const PHYSIO_VALUES = ['done', 'partly', 'missed']
const MAX_SESSIONS = 4
// Deliberately a local copy, like SPORT_TYPES above: what migrate.js accepts
// must not shift because the UI changed its mind about a limit.
const MAX_SPORT_LABEL = 40
const FIRST_THING_VALUES = ['Telefoon', 'Daglicht', 'Bewegen', 'Anders']
const QUESTION_IDS = [
  'goed',
  'dankbaar',
  'bereiken',
  'gedragen',
  'onrustig',
  'zin',
  'weekend',
]

/** Keep only known question ids with non-empty answers. */
function cleanAnswers(answers) {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return {}
  const out = {}
  for (const id of QUESTION_IDS) {
    const value = answers[id]
    if (typeof value === 'string' && value.trim()) out[id] = value.trim()
  }
  return out
}

/** A 0-5 score, or null when the question was not answered at all. */
function toScoreOrNull(value) {
  if (value === null || value === undefined || value === '') return null
  return toScore(value)
}

/** Clamp anything to a whole number in 0-5; nonsense becomes 0. */
function toScore(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.min(5, Math.max(0, Math.round(n)))
}

/** Bring one stored check-in up to the current shape. Safe to re-run. */
export function migrateCheckin(entry) {
  if (!entry || typeof entry !== 'object') return null

  let body = []
  if (Array.isArray(entry.body)) {
    body = entry.body
  } else if (Array.isArray(entry.pain)) {
    // v1 shape.
    body = entry.pain.map((p) => ({ region: p.region, pain: p.intensity, tension: 0 }))
  }

  return {
    mental: entry.mental ?? null,
    mode: MODES.includes(entry.mode) ? entry.mode : 'lite',
    answers: cleanAnswers(entry.answers),
    sleep: migrateSleep(entry.sleep),
    movement: migrateMovement(entry.movement),
    evening: migrateEvening(entry.evening),
    body: body
      .filter((b) => b && typeof b.region === 'string')
      .map((b) => ({
        region: b.region,
        pain: toScore(b.pain),
        tension: toScore(b.tension),
      }))
      // A region scored 0 on both carries no information; drop it rather than
      // storing rows that mean "nothing".
      .filter((b) => b.pain > 0 || b.tension > 0),
    note: typeof entry.note === 'string' ? entry.note : '',
    updatedAt: entry.updatedAt ?? Date.now(),
  }
}

/** "HH:MM" or null. Anything unparseable becomes null rather than reaching disk. */
function toTimeOrNull(value) {
  if (typeof value !== 'string') return null
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return `${String(hours).padStart(2, '0')}:${match[2]}`
}

/** A 0-100 reading from the watch, or null. */
function toHundredOrNull(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return Math.min(100, Math.max(0, Math.round(n)))
}

/**
 * Normalise the optional sleep block.
 *
 * `garmin.gedragen === false` is a real answer — "I did not wear it" is worth
 * recording, and is not the same as never having been asked. So a sleep block
 * holding only that is kept, while one holding nothing at all becomes null.
 */
function migrateSleep(sleep) {
  if (!sleep || typeof sleep !== 'object') return null

  const subjectief = toScoreOrNull(sleep.subjectief)
  const bedtijd = toTimeOrNull(sleep.bedtijd)
  const wakkertijd = toTimeOrNull(sleep.wakkertijd)
  const notitie = typeof sleep.notitie === 'string' ? sleep.notitie : ''

  const incoming = sleep.garmin && typeof sleep.garmin === 'object' ? sleep.garmin : {}
  const gedragen = typeof incoming.gedragen === 'boolean' ? incoming.gedragen : null
  // Readings only mean anything if the watch was actually worn.
  const worn = gedragen === true
  const garmin = {
    gedragen,
    bodyBattery: worn ? toHundredOrNull(incoming.bodyBattery) : null,
    slaapscore: worn ? toHundredOrNull(incoming.slaapscore) : null,
    hrvStatus: worn && HRV_STATUSES.includes(incoming.hrvStatus) ? incoming.hrvStatus : null,
  }

  const answeredSomething =
    subjectief !== null ||
    bedtijd !== null ||
    wakkertijd !== null ||
    notitie !== '' ||
    gedragen !== null
  if (!answeredSomething) return null

  return { subjectief, bedtijd, wakkertijd, notitie, garmin }
}

/**
 * Normalise the optional movement block.
 *
 * "Geen" is an answer meaning "I did not exercise", not an absence — so a
 * block holding only that is kept. It is also exclusive: if it appears at
 * all, it collapses to the single entry, because "no sport, and also an hour
 * of running" is not a state that can be true.
 */
function migrateMovement(movement) {
  if (!movement || typeof movement !== 'object') return null

  const incoming = Array.isArray(movement.sports) ? movement.sports : []
  let sports = incoming
    .filter((s) => s && SPORT_TYPES.includes(s.type))
    .slice(0, MAX_SESSIONS)
    .map((s) => ({
      type: s.type,
      // Only "Anders" carries a name. A label on any other type would
      // contradict the category it sits next to, so it is dropped rather
      // than kept and quietly ignored.
      label:
        s.type === 'Anders' && typeof s.label === 'string'
          ? s.label.trim().slice(0, MAX_SPORT_LABEL)
          : '',
      duration: DURATIONS.includes(s.duration) ? s.duration : null,
      intensity: INTENSITIES.includes(s.intensity) ? s.intensity : null,
    }))

  if (sports.some((s) => s.type === 'Geen')) {
    sports = [{ type: 'Geen', label: '', duration: null, intensity: null }]
  }

  const physio = PHYSIO_VALUES.includes(movement.physio) ? movement.physio : null
  const physioNote =
    typeof movement.physioNote === 'string' ? movement.physioNote : ''

  if (sports.length === 0 && physio === null && physioNote === '') return null

  return { sports, physio, physioNote }
}

/**
 * Normalise the optional evening block. Anything unrecognised becomes null
 * rather than a half-filled object, so "no evening check-in" stays
 * distinguishable from "an evening check-in with nothing in it".
 */
function migrateEvening(evening) {
  if (!evening || typeof evening !== 'object') return null

  const mental =
    evening.mental === null || evening.mental === undefined
      ? null
      : toScore(evening.mental)
  const intention = INTENTION_OUTCOMES.includes(evening.intention)
    ? evening.intention
    : null
  const note = typeof evening.note === 'string' ? evening.note : ''

  const pijn = toScoreOrNull(evening.pijn)
  const focus = toScoreOrNull(evening.focus)
  const reactief = toScoreOrNull(evening.reactief)
  const cafeine = typeof evening.cafeine === 'boolean' ? evening.cafeine : null
  const eerste = FIRST_THING_VALUES.includes(evening.eerste) ? evening.eerste : null

  // An evening block with nothing answered is not a check-in.
  const answeredSomething =
    mental !== null ||
    intention !== null ||
    pijn !== null ||
    focus !== null ||
    reactief !== null ||
    cafeine !== null ||
    eerste !== null ||
    note !== ''
  if (!answeredSomething) return null

  return {
    mental,
    intention,
    pijn,
    focus,
    reactief,
    cafeine,
    eerste,
    note,
    savedAt: evening.savedAt ?? Date.now(),
  }
}

/**
 * Bring a whole date-keyed map of check-ins up to the current shape.
 *
 * @param {object} all
 * @param {object} [legacyIntentions] the pre-v4 `anker_v1_intentions` map.
 *   Its values become `answers.bereiken` where a day has no answer of its own.
 */
export function migrateCheckins(all, legacyIntentions = {}) {
  const source = all && typeof all === 'object' && !Array.isArray(all) ? all : {}
  const legacy =
    legacyIntentions && typeof legacyIntentions === 'object' &&
    !Array.isArray(legacyIntentions)
      ? legacyIntentions
      : {}

  const out = {}
  for (const [dateKey, entry] of Object.entries(source)) {
    const migrated = migrateCheckin(entry)
    if (migrated) out[dateKey] = migrated
  }

  for (const [dateKey, text] of Object.entries(legacy)) {
    if (typeof text !== 'string' || !text.trim()) continue
    // A day that exists only in the legacy map still needs an entry, or the
    // priority the user typed would simply disappear from the app.
    if (!out[dateKey]) out[dateKey] = migrateCheckin({})
    // An answer given since the move always wins over the legacy value.
    if (!out[dateKey].answers.bereiken) {
      out[dateKey].answers = { ...out[dateKey].answers, bereiken: text.trim() }
    }
  }
  return out
}

/**
 * Bring a whole export file up to the current shape.
 * @throws if the file is not an Anker backup or is newer than this app.
 */
export function migrateExport(data) {
  if (!data || data.app !== 'anker') {
    throw new Error('Dit bestand is geen Anker-backup.')
  }
  const version = data.schemaVersion
  if (typeof version !== 'number' || version < 1) {
    throw new Error('Deze backup heeft geen leesbaar versienummer.')
  }
  if (version > CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `Deze backup komt van een nieuwere versie van Anker (${version}). Werk de app eerst bij.`,
    )
  }

  return {
    ...data,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    checkins: migrateCheckins(data.checkins),
    thoughts: Array.isArray(data.thoughts) ? data.thoughts : [],
    intentions:
      data.intentions && typeof data.intentions === 'object' ? data.intentions : {},
    meta: data.meta && typeof data.meta === 'object' ? data.meta : {},
  }
}
