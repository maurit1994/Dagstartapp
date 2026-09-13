/**
 * Is the morning Dagstart actually done for a given day?
 *
 * Derived rather than stored, so it needs no schema version of its own. The
 * evening check-in writes into the SAME day entry, so "an entry exists" is not
 * the same question — saving only the evening would otherwise make the app
 * believe the morning was finished and show an empty summary.
 *
 * A Dagstart with nothing at all in it is not a Dagstart. That is deliberate:
 * tapping straight through the flow records nothing, and pretending otherwise
 * would hide the fact from the person relying on the record.
 */
export function isDagstartDone(entry) {
  if (!entry || typeof entry !== 'object') return false
  return (
    // typeof, not `!== null`: a malformed entry has mental UNDEFINED, and
    // undefined !== null is true, which would call an empty object done.
    typeof entry.mental === 'number' ||
    Object.keys(entry.answers ?? {}).length > 0 ||
    (entry.body ?? []).length > 0 ||
    (entry.note ?? '').trim() !== ''
  )
}
