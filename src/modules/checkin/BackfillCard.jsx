import { useState } from 'react'
import Screen from '../../components/Screen.jsx'
import Button from '../../components/Button.jsx'
import Checkin from './Checkin.jsx'
import { getDateKeyDaysAgo, getLocalDateKey } from '../../lib/date.js'
import { isDagstartDone } from '../../lib/dagstart.js'
import { getCheckin } from '../../lib/storage.js'

/**
 * Fill in yesterday, if yesterday was missed.
 *
 * Missing a day used to cost twice: the data was gone for good AND the streak
 * was broken, with nothing to do about either. That is the point at which
 * "I've already lost it" turns into not opening the app again.
 *
 * This is the way back. It appears only when yesterday is genuinely empty,
 * and it disappears the moment it is filled — it is an exit, not a debt
 * collector.
 */
export default function BackfillCard({ onSaved, now = new Date() }) {
  const yesterdayKey = getDateKeyDaysAgo(1, now)
  const [isOpen, setIsOpen] = useState(false)

  // Re-read on every render so the card leaves as soon as it is used.
  if (isDagstartDone(getCheckin(yesterdayKey))) return null

  // Nothing to catch up on before the app has been used at all.
  if (!isDagstartDone(getCheckin(getLocalDateKey(now)))) return null

  if (isOpen) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    return (
      <div>
        <Checkin now={yesterday} label="Gisteren" onSaved={onSaved} />
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="mt-2 w-full text-center text-xs text-anker-muted underline"
        >
          Laat maar
        </button>
      </div>
    )
  }

  return (
    <Screen title="Gisteren" tone="quiet">
      <p>Gisteren is leeg gebleven. Alsnog invullen kan gewoon.</p>
      <Button variant="secondary" className="mt-3 w-full" onClick={() => setIsOpen(true)}>
        Gisteren invullen
      </Button>
    </Screen>
  )
}
