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
 */

export const CURRENT_SCHEMA_VERSION = 2

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

/** Bring a whole date-keyed map of check-ins up to the current shape. */
export function migrateCheckins(all) {
  if (!all || typeof all !== 'object' || Array.isArray(all)) return {}
  const out = {}
  for (const [dateKey, entry] of Object.entries(all)) {
    const migrated = migrateCheckin(entry)
    if (migrated) out[dateKey] = migrated
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
