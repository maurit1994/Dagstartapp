import Screen from '../../components/Screen.jsx'
import { getTodayIntention } from '../../lib/storage.js'

/**
 * Today's priority, kept visible at the top of the Vandaag screen.
 *
 * Read-only: it is the answer to "Wat wil ik vandaag écht bereiken?" in the
 * Dagstart, so it is edited there rather than in two places. Its job here is
 * simply to stay in front of you all day — an intention you have to go
 * looking for is one you have already lost.
 */
export default function Intention() {
  const priority = getTodayIntention()

  // Nothing to show until the Dagstart has been answered. A card telling you
  // to fill in the form directly below it is noise, and on the body step it
  // costs the screen room the figure needs.
  if (!priority) return null

  return (
    <Screen title="Vandaag telt">
      <p className="text-lg text-anker-text">{priority}</p>
    </Screen>
  )
}
