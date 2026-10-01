import Screen from '../../components/Screen.jsx'
import Button from '../../components/Button.jsx'
import { isReviewDay, loadStats } from '../../lib/mentalload.js'
import { getLoadItems } from '../../lib/storage.js'

/**
 * One quiet line on Sunday: look at the week ahead.
 *
 * Anticipating is a week-scale operation, so a daily prompt would turn it
 * into the same form-filling the Dagstart was just pruned of. Sunday is the
 * evening you can still do something about the week that is coming.
 *
 * It states what is there and offers a way in. It never says you are behind,
 * it never counts how many Sundays you skipped, and it is gone again on
 * Monday — the same rule as everything else here: nothing may punish a
 * missed day.
 */
export default function ReviewCue({ now = new Date(), onOpen }) {
  if (!isReviewDay(now)) return null

  const stats = loadStats(getLoadItems())

  return (
    <Screen title="Even vooruitkijken?" tone="quiet">
      <p className="text-sm">
        {stats.open === 0
          ? 'Wat komt er deze week aan dat iemand moet regelen?'
          : `${stats.open} ${stats.open === 1 ? 'ding staat' : 'dingen staan'} op je lijst${
              stats.thisWeek > 0 ? `, ${stats.thisWeek} voor deze week` : ''
            }.`}
      </p>
      <Button variant="secondary" className="mt-3 w-full" onClick={onOpen}>
        Open Vooruit
      </Button>
    </Screen>
  )
}
