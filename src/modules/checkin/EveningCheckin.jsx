import { useState } from 'react'
import Screen from '../../components/Screen.jsx'
import Button from '../../components/Button.jsx'
import { MOOD_SCALE } from '../../lib/regions.js'
import { getLocalDateKey } from '../../lib/date.js'
import { getCheckin, getTodayIntention, saveEvening } from '../../lib/storage.js'

/**
 * The evening half of the day: how it ended, and whether the morning's
 * intention actually happened.
 *
 * Kept collapsed until the evening so the Vandaag screen has exactly one
 * obvious thing to do at any hour. Answering "did it happen" is the only
 * feedback loop the daily intention has — without it, the intention is just
 * a wish written down.
 */

const OUTCOMES = [
  { value: 'done', label: 'Gelukt', emoji: '✅' },
  { value: 'partly', label: 'Deels', emoji: '🌗' },
  { value: 'missed', label: 'Niet', emoji: '⭕️' },
]

/** Local hour from which the evening card opens by itself. */
export const EVENING_HOUR = 17

export default function EveningCheckin({ onSaved, now = new Date() }) {
  const dateKey = getLocalDateKey(now)
  const intention = getTodayIntention()

  const [saved, setSaved] = useState(() => getCheckin(dateKey)?.evening ?? null)
  // Note the ?? null: a day with no check-in at all returns null from
  // getCheckin, so `?.evening` is undefined rather than null. Comparing that
  // to null kept the card shut all evening whenever the morning check-in had
  // not been done yet — which is exactly when you most want to be asked.
  const [isOpen, setIsOpen] = useState(
    () =>
      (getCheckin(dateKey)?.evening ?? null) === null &&
      now.getHours() >= EVENING_HOUR,
  )

  const [mental, setMental] = useState(() => getCheckin(dateKey)?.evening?.mental ?? null)
  const [outcome, setOutcome] = useState(
    () => getCheckin(dateKey)?.evening?.intention ?? null,
  )
  const [note, setNote] = useState(() => getCheckin(dateKey)?.evening?.note ?? '')
  const [error, setError] = useState(null)

  function handleSave() {
    try {
      const entry = saveEvening(dateKey, { mental, intention: outcome, note })
      setSaved(entry.evening)
      setIsOpen(false)
      setError(null)
      onSaved?.()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!isOpen && saved) {
    const mood = MOOD_SCALE.find((m) => m.value === saved.mental)
    const result = OUTCOMES.find((o) => o.value === saved.intention)
    return (
      <Screen title="Avond ✓">
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none">{mood?.emoji ?? '—'}</span>
          <span className="text-anker-text">{mood?.label ?? 'Niet ingevuld'}</span>
        </div>
        {result && (
          <p className="mt-3 text-anker-text">
            Intentie: {result.emoji} {result.label.toLowerCase()}
          </p>
        )}
        {saved.note && (
          <p className="mt-3 whitespace-pre-wrap text-anker-text">{saved.note}</p>
        )}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Avond-check-in aanpassen"
          className="mt-3 text-xs text-anker-muted underline"
        >
          Aanpassen
        </button>
      </Screen>
    )
  }

  if (!isOpen) {
    return (
      <Screen title="Avond">
        <p>Vanaf {EVENING_HOUR}:00 vraag ik hoe de dag ging.</p>
        <Button variant="secondary" className="mt-3 w-full" onClick={() => setIsOpen(true)}>
          Nu al invullen
        </Button>
      </Screen>
    )
  }

  return (
    <Screen title="Hoe ging de dag?">
      <p className="text-base text-anker-text">Hoe eindig je de dag?</p>
      <div className="mt-3 flex justify-between gap-1">
        {MOOD_SCALE.map((mood) => (
          <button
            key={mood.value}
            type="button"
            onClick={() => setMental(mood.value)}
            aria-pressed={mental === mood.value}
            aria-label={`Avond: ${mood.label}`}
            className={`flex min-h-16 flex-1 items-center justify-center rounded-xl border transition ${
              mental === mood.value
                ? 'border-anker-accent bg-anker-accent/10'
                : 'border-anker-border bg-anker-bg'
            }`}
          >
            <span className="text-2xl leading-none">{mood.emoji}</span>
          </button>
        ))}
      </div>

      {intention && (
        <div className="mt-5">
          <p className="text-base text-anker-text">Is dit gelukt?</p>
          <p className="mt-1 text-sm text-anker-muted">“{intention}”</p>
          <div className="mt-2 flex gap-2">
            {OUTCOMES.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setOutcome(o.value)}
                aria-pressed={outcome === o.value}
                aria-label={`Intentie ${o.label.toLowerCase()}`}
                className={`flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border text-sm transition ${
                  outcome === o.value
                    ? 'border-anker-accent bg-anker-accent/15 text-anker-text'
                    : 'border-anker-border bg-anker-bg text-anker-muted'
                }`}
              >
                <span aria-hidden="true">{o.emoji}</span>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Iets om te onthouden? Mag leeg."
        className="mt-5 w-full rounded-xl border border-anker-border bg-anker-bg p-3 text-base text-anker-text placeholder:text-anker-muted/60 focus:border-anker-accent focus:outline-none"
      />

      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <Button
        className="mt-4 w-full"
        onClick={handleSave}
        disabled={mental === null && outcome === null && !note.trim()}
      >
        Dag afsluiten
      </Button>
    </Screen>
  )
}
