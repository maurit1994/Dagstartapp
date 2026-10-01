import Screen from '../../components/Screen.jsx'
import { formatDateKeyNL } from '../../lib/date.js'
import { lookbackFor } from '../../lib/lookback.js'
import { getAllCheckins } from '../../lib/storage.js'

/** "17 dagen geleden" reads better than a bare date for anything recent. */
function howLongAgo(days) {
  if (days === 1) return 'gisteren'
  if (days < 14) return `${days} dagen geleden`
  if (days < 60) return `${Math.round(days / 7)} weken geleden`
  return `${Math.round(days / 30)} maanden geleden`
}

/**
 * Something you wrote on an earlier day.
 *
 * The one return the app can give honestly from the very first week. Real
 * pattern-finding — does sleep predict focus, does exercise lift mood —
 * needs weeks of dense data before an answer would be true rather than merely
 * printable, and printing one sooner would be a lie dressed as an insight.
 * Your own sentence from three weeks ago needs no statistics at all.
 *
 * Quiet by design: it asks nothing of you. It appears only once the Dagstart
 * is done, because a second card during the routine breaks the one-thing-at-
 * a-time rule, and because this is the payoff FOR having filled it in.
 *
 * Derived on render, never held in state — saving remounts this whole screen.
 */
export default function LookbackCard({ now = new Date(), dateKey }) {
  const memory = lookbackFor(getAllCheckins(), dateKey)
  if (!memory) return null

  return (
    <Screen title="Dat schreef je toen" tone="quiet">
      <p className="text-xs text-anker-muted">
        {howLongAgo(memory.daysAgo)} · {formatDateKeyNL(memory.dateKey)}
      </p>
      <p className="mt-3 text-xs uppercase tracking-wide text-anker-muted">
        {memory.question}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-base text-anker-text">
        {memory.text}
      </p>
    </Screen>
  )
}
