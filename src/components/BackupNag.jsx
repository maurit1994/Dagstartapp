import { daysSinceLastExport } from '../lib/backup.js'

/**
 * The nag that turns "I should back up sometime" into a visible, one-tap job.
 * It only appears when there is actually data to lose.
 */
export default function BackupNag({ onOpenSettings, onDismiss }) {
  const days = daysSinceLastExport()

  return (
    <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-3">
      <p className="text-sm text-amber-100">
        {days === null
          ? 'Je hebt nog nooit een backup gemaakt.'
          : `Je laatste backup is ${days} dagen geleden.`}{' '}
        Eén tik en je data staat veilig in iCloud Drive.
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onOpenSettings}
          className="min-h-10 rounded-lg bg-amber-400/20 px-3 text-sm font-medium text-amber-100"
        >
          Nu exporteren
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="min-h-10 px-3 text-sm text-amber-200/70"
        >
          Later
        </button>
      </div>
    </div>
  )
}
