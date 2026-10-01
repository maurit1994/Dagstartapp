/**
 * The mental load of running a household — the part that is invisible.
 *
 * Daminger's study of cognitive labour (American Sociological Review, 2019)
 * splits it into four phases: ANTICIPATING a need before it is urgent,
 * identifying the options, DECIDING, and MONITORING that it actually happens.
 * The division between partners is most lopsided at anticipating and
 * monitoring; deciding is roughly equal. "Waiting until she says something"
 * is exactly that shape: you take part in the decision, she carries the
 * noticing.
 *
 * So this is deliberately NOT a to-do list. A task list only starts once
 * somebody has already noticed — and the noticing is the work being
 * redistributed. The unit here is a thing coming up, how soon it needs
 * someone, and whether you were the one who RAISED it.
 *
 * `raised` is the measure, not `done`. Doing a job you were handed is not the
 * labour in question. Saying "the dentist needs booking" before anyone asks
 * you to, is.
 *
 * It is private to this user by their own choice. A shared ledger of who
 * carries what turns into evidence in an argument, and this app is not for
 * that.
 */

/** How soon something needs someone. Ordered most urgent first. */
export const HORIZONS = [
  { value: 'week', label: 'Deze week' },
  { value: 'fortnight', label: 'Binnen 2 weken' },
  { value: 'month', label: 'Deze maand' },
  { value: 'later', label: 'Later' },
]

export const HORIZON_VALUES = HORIZONS.map((h) => h.value)

/** Long enough for a real sentence, short enough to stay scannable. */
export const MAX_ITEM_TEXT = 140

/** Sunday — the evening you can still do something about the week ahead. */
export const REVIEW_WEEKDAY = 0

export function horizonLabel(value) {
  return HORIZONS.find((h) => h.value === value)?.label ?? value
}

/**
 * Normalise one stored item. Anything unrecognised is repaired to a usable
 * shape rather than dropped — a half-readable note about your household is
 * still worth more than nothing.
 */
export function migrateLoadItem(item) {
  if (!item || typeof item !== 'object') return null
  const text = typeof item.text === 'string' ? item.text.trim().slice(0, MAX_ITEM_TEXT) : ''
  if (text === '') return null
  return {
    id: typeof item.id === 'string' && item.id ? item.id : `load-${item.createdAt ?? 0}`,
    text,
    horizon: HORIZON_VALUES.includes(item.horizon) ? item.horizon : 'week',
    raised: item.raised === true,
    createdAt: typeof item.createdAt === 'number' ? item.createdAt : 0,
    resolvedAt: typeof item.resolvedAt === 'number' ? item.resolvedAt : null,
  }
}

export function migrateLoadItems(items) {
  if (!Array.isArray(items)) return []
  return items.map(migrateLoadItem).filter(Boolean)
}

/** Still needing something from you. */
export function openItems(items) {
  return (items ?? []).filter((item) => item.resolvedAt === null)
}

/**
 * Open items in the order they need attention, most urgent first, and within
 * one horizon the oldest first — a thing you noticed three weeks ago and have
 * not raised is the one most worth seeing.
 */
export function sortedOpenItems(items) {
  return openItems(items).sort((a, b) => {
    const byHorizon =
      HORIZON_VALUES.indexOf(a.horizon) - HORIZON_VALUES.indexOf(b.horizon)
    return byHorizon !== 0 ? byHorizon : a.createdAt - b.createdAt
  })
}

/**
 * Counts, stated plainly. No score, no streak, no target: this is a count of
 * what is on your mind, not a verdict on how good a partner you are.
 */
export function loadStats(items) {
  const open = openItems(items)
  return {
    open: open.length,
    raised: open.filter((item) => item.raised).length,
    thisWeek: open.filter((item) => item.horizon === 'week').length,
    resolved: (items ?? []).length - open.length,
  }
}

/** Whether today is the weekly look-ahead day. */
export function isReviewDay(date = new Date()) {
  return date.getDay() === REVIEW_WEEKDAY
}
