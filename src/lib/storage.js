/**
 * The one door to Anker's data.
 *
 * Every feature module reads and writes through this file — no module ever
 * calls localStorage directly. When localStorage is outgrown, this single
 * file changes and nothing else does.
 *
 * Contract:
 *  - every key is prefixed `anker_v1_`
 *  - date keys come from lib/date.js (local time, never toISOString)
 *  - body scores are stored as [{ region, pain, tension }] against ids from
 *    lib/regions.js, and read back through lib/migrate.js so older shapes
 *    keep working
 *  - nothing here ever leaves the device
 *
 * Failure policy, because this holds health data:
 *  - a read that cannot be parsed returns the fallback and does NOT overwrite
 *    the stored value, so a corrupt entry can still be rescued by hand
 *  - a write that fails throws StorageWriteError so the UI can say so out
 *    loud; silently losing a save is the one unacceptable outcome
 */

import { getLocalDateKey } from './date.js'
import {
  CURRENT_SCHEMA_VERSION,
  migrateCheckin,
  migrateCheckins,
  migrateExport,
} from './migrate.js'

export const STORAGE_PREFIX = 'anker_v1_'

export const KEYS = {
  checkins: `${STORAGE_PREFIX}checkins`,
  thoughts: `${STORAGE_PREFIX}thoughts`,
  intentions: `${STORAGE_PREFIX}intentions`,
  meta: `${STORAGE_PREFIX}meta`,
}

/** Thrown when a write fails (quota exceeded, private mode, storage disabled). */
export class StorageWriteError extends Error {
  constructor(message, cause) {
    super(message)
    this.name = 'StorageWriteError'
    this.cause = cause
  }
}

/** True if localStorage can actually be written to in this browser session. */
export function isStorageAvailable() {
  try {
    const probe = `${STORAGE_PREFIX}__probe__`
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

function readJSON(key, fallback) {
  let raw
  try {
    raw = localStorage.getItem(key)
  } catch (err) {
    console.error(`[storage] could not read ${key}`, err)
    return fallback
  }
  if (raw === null) return fallback
  try {
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch (err) {
    // Deliberately do not delete or repair: the raw text is still in
    // localStorage and can be recovered manually via DevTools.
    console.error(`[storage] ${key} contains unreadable data; leaving it`, err)
    return fallback
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    throw new StorageWriteError(
      'Opslaan is niet gelukt. Mogelijk is de opslag vol of staat privénavigatie aan.',
      err,
    )
  }
}

/* ---------------------------------------------------------------- check-ins */

/**
 * All check-ins as an object keyed by local date:
 *   { "2026-09-13": { mental, pain, note, updatedAt }, ... }
 */
export function getAllCheckins() {
  // Everything leaving this function is in the CURRENT shape, whatever shape
  // it happens to have on disk. The rest of the app never sees an old one.
  // The legacy intentions map is folded in here rather than rewritten on
  // disk, so the move stays reversible.
  return migrateCheckins(readJSON(KEYS.checkins, {}), readJSON(KEYS.intentions, {}))
}

/** One day's check-in, or null if that day has none. */
export function getCheckin(dateKey) {
  return getAllCheckins()[dateKey] ?? null
}

/** Today's check-in, or null. */
export function getTodayCheckin() {
  return getCheckin(getLocalDateKey())
}

/**
 * Create or replace one day's check-in.
 * @param {string} dateKey  "YYYY-MM-DD" from lib/date.js
 * @param {{mental: number|null, mode: 'lite'|'full', answers: object, body: Array<{region: string, pain: number, tension: number}>, note: string}} entry
 */
export function saveCheckin(dateKey, entry) {
  const all = getAllCheckins()
  // migrateCheckin also normalises and clamps, so a malformed entry cannot
  // reach disk regardless of which caller built it.
  all[dateKey] = { ...migrateCheckin(entry), updatedAt: Date.now() }
  writeJSON(KEYS.checkins, all)
  return all[dateKey]
}

/**
 * Save only the evening block of a day, leaving the morning answers alone.
 * @param {string} dateKey
 * @param {{mental: number|null, intention: string|null, note: string}|null} evening
 */
export function saveEvening(dateKey, evening) {
  const all = getAllCheckins()
  const existing = all[dateKey] ?? { mental: null, body: [], note: '' }
  all[dateKey] = {
    ...existing,
    evening: evening ? { ...evening, savedAt: Date.now() } : null,
    updatedAt: Date.now(),
  }
  // Round-trip through the migrator so the same normalisation applies here as
  // to anything else that reaches disk.
  all[dateKey] = { ...migrateCheckin(all[dateKey]), updatedAt: Date.now() }
  writeJSON(KEYS.checkins, all)
  return all[dateKey]
}

/** Remove one day's check-in entirely. */
export function deleteCheckin(dateKey) {
  const all = getAllCheckins()
  delete all[dateKey]
  writeJSON(KEYS.checkins, all)
}

/** Date keys that have a check-in, newest first. */
export function getCheckinDateKeys() {
  return Object.keys(getAllCheckins()).sort().reverse()
}

/* ----------------------------------------------------------------- thoughts */

/** All captured thoughts, newest first. */
export function getThoughts() {
  const value = readJSON(KEYS.thoughts, [])
  return Array.isArray(value) ? value : []
}

/** Append a thought. Empty or whitespace-only text is rejected. */
export function addThought(text) {
  const trimmed = String(text ?? '').trim()
  if (!trimmed) return null

  const thought = {
    id: makeId(),
    text: trimmed,
    createdAt: Date.now(),
    dateKey: getLocalDateKey(),
  }
  const all = getThoughts()
  all.unshift(thought)
  writeJSON(KEYS.thoughts, all)
  return thought
}

/** Remove one thought by id. */
export function deleteThought(id) {
  writeJSON(
    KEYS.thoughts,
    getThoughts().filter((t) => t.id !== id),
  )
}

/* --------------------------------------------------------------- intentions */

/**
 * The day's priority — the answer to "Wat wil ik vandaag écht bereiken?".
 *
 * Before v4 this lived in its own `anker_v1_intentions` key. It now lives in
 * the day's answers; migrateCheckins folds the legacy map in on read, so both
 * old and new days answer this the same way.
 */
export function getIntention(dateKey) {
  return getCheckin(dateKey)?.answers?.bereiken ?? ''
}

/** Today's priority, or ''. */
export function getTodayIntention() {
  return getIntention(getLocalDateKey())
}

/** All days that have a priority, keyed by date. */
export function getAllIntentions() {
  const out = {}
  for (const [dateKey, entry] of Object.entries(getAllCheckins())) {
    if (entry.answers?.bereiken) out[dateKey] = entry.answers.bereiken
  }
  return out
}

/* --------------------------------------------------------------------- meta */

/** Small app-level bookkeeping (last export time, first-run flags). */
export function getMeta() {
  const value = readJSON(KEYS.meta, {})
  return typeof value === 'object' && !Array.isArray(value) ? value : {}
}

/** Merge fields into meta, leaving the rest untouched. */
export function setMeta(patch) {
  const next = { ...getMeta(), ...patch }
  writeJSON(KEYS.meta, next)
  return next
}

/* ------------------------------------------------------------------ export */

/** Everything Anker holds, as one plain object ready to be written to a file. */
export function exportAll() {
  return {
    app: 'anker',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: Date.now(),
    checkins: getAllCheckins(),
    thoughts: getThoughts(),
    // Kept for backwards compatibility: an older build of Anker reads this
    // key. Current builds derive it from the check-ins above.
    intentions: getAllIntentions(),
    meta: getMeta(),
  }
}

/**
 * Restore from an export.
 * @param {object} data parsed export file
 * @param {'merge'|'replace'} mode  merge keeps existing entries and only adds
 *   days/thoughts that are missing; replace overwrites everything.
 * @returns {{checkinsAdded: number, thoughtsAdded: number}}
 */
export function importAll(data, mode = 'merge') {
  // Throws on a file that is not an Anker backup or is from a newer app.
  const upgraded = migrateExport(data)

  const incomingCheckins = upgraded.checkins
  const incomingThoughts = upgraded.thoughts
  const incomingIntentions = upgraded.intentions

  if (mode === 'replace') {
    writeJSON(KEYS.checkins, incomingCheckins)
    writeJSON(KEYS.thoughts, incomingThoughts)
    writeJSON(KEYS.intentions, incomingIntentions)
    return {
      checkinsAdded: Object.keys(incomingCheckins).length,
      thoughtsAdded: incomingThoughts.length,
    }
  }

  const checkins = getAllCheckins()
  let checkinsAdded = 0
  for (const [dateKey, entry] of Object.entries(incomingCheckins)) {
    // Newest wins, so re-importing an old backup never overwrites newer work.
    const existing = checkins[dateKey]
    if (!existing || (entry.updatedAt ?? 0) > (existing.updatedAt ?? 0)) {
      checkins[dateKey] = entry
      checkinsAdded += 1
    }
  }

  const thoughts = getThoughts()
  const seen = new Set(thoughts.map((t) => t.id))
  let thoughtsAdded = 0
  for (const thought of incomingThoughts) {
    if (!seen.has(thought.id)) {
      thoughts.push(thought)
      seen.add(thought.id)
      thoughtsAdded += 1
    }
  }
  thoughts.sort((a, b) => b.createdAt - a.createdAt)

  // An incoming backup's intentions map only matters for days it brings that
  // carry no answers of their own; migrateCheckins applies the same "existing
  // answer wins" rule on the next read.
  const intentions = { ...readJSON(KEYS.intentions, {}), ...incomingIntentions }

  writeJSON(KEYS.checkins, checkins)
  writeJSON(KEYS.thoughts, thoughts)
  writeJSON(KEYS.intentions, intentions)
  return { checkinsAdded, thoughtsAdded }
}

/* ------------------------------------------------------------------ helpers */

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
