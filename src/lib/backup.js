/**
 * Tier A backup: a JSON file you save into iCloud Drive.
 *
 * This is the real safety net for Anker's data — persistent storage is only a
 * request the browser may ignore, but a file in iCloud Drive survives a wiped
 * phone, a cleared Safari cache and a replacement device.
 */

import { exportAll, importAll, getMeta, setMeta } from './storage.js'
import { getLocalDateKey } from './date.js'

/** Remind after this many days without an export. */
export const EXPORT_REMINDER_DAYS = 7

function exportFilename() {
  return `anker-backup-${getLocalDateKey()}.json`
}

/**
 * Hand the user their data as a file.
 *
 * iOS gets the Web Share sheet when available — that is what produces a real
 * "Save to Files" entry, and it is the only reliable route from a standalone
 * home-screen app, where plain <a download> links are unreliable. Everything
 * else falls back to a normal download.
 *
 * @returns {Promise<'shared'|'downloaded'>}
 */
export async function downloadBackup() {
  const json = JSON.stringify(exportAll(), null, 2)
  const filename = exportFilename()
  const blob = new Blob([json], { type: 'application/json' })

  const file = new File([blob], filename, { type: 'application/json' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Anker backup' })
      markExported()
      return 'shared'
    } catch (err) {
      // A user who taps Cancel is not an error, and must not be told the
      // backup failed — but it did not happen, so do not mark it as done.
      if (err?.name === 'AbortError') throw err
      console.warn('[backup] share failed, falling back to download', err)
    }
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)

  markExported()
  return 'downloaded'
}

/** Read a user-picked .json file and merge or replace with its contents. */
export async function restoreFromFile(file, mode = 'merge') {
  const text = await file.text()
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Dit bestand bevat geen geldige JSON.')
  }
  return importAll(parsed, mode)
}

/** Record that a backup just happened. */
export function markExported() {
  setMeta({ lastExportAt: Date.now(), lastExportDateKey: getLocalDateKey() })
}

/** Timestamp of the last export, or null if never. */
export function getLastExportAt() {
  return getMeta().lastExportAt ?? null
}

/** Whole days since the last export; null if there has never been one. */
export function daysSinceLastExport() {
  const last = getLastExportAt()
  if (!last) return null
  return Math.floor((Date.now() - last) / (24 * 60 * 60 * 1000))
}

/**
 * Whether to show the backup nag.
 * Never nags an empty app — there is nothing to lose yet.
 */
export function shouldRemindToExport() {
  const data = exportAll()
  const hasData =
    Object.keys(data.checkins).length > 0 || data.thoughts.length > 0
  if (!hasData) return false

  const days = daysSinceLastExport()
  return days === null || days >= EXPORT_REMINDER_DAYS
}
