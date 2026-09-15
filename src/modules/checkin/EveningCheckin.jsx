import { useState } from 'react'
import Screen from '../../components/Screen.jsx'
import Button from '../../components/Button.jsx'
import Scale from '../../components/Scale.jsx'
import { MOOD_SCALE } from '../../lib/regions.js'

const MOOD_WORDS = ['', ...MOOD_SCALE.map((m) => m.label)]
const MOOD_EMOJI = ['', ...MOOD_SCALE.map((m) => m.emoji)]
import {
  FIRST_THING_OPTIONS,
  FOCUS_SCALE,
  PAIN_SCALE,
  PRIORITY_OUTCOMES,
  REACTIVITY_SCALE,
} from '../../lib/questions.js'
import { getLocalDateKey } from '../../lib/date.js'
import { isDagstartDone } from '../../lib/dagstart.js'
import { getCheckin, getTodayIntention, saveEvening } from '../../lib/storage.js'

/**
 * The evening half of the day, carried over from the user's previous app:
 * focus, whether the morning's priority was reached, emotional reactivity,
 * caffeine after 14:00, and the first thing done this morning.
 *
 * The old app's "Pijn nu" is deliberately NOT asked here. Anker records pain
 * in the Dagstart's body map — per region, with tension alongside it — so a
 * second single-number pain question put the same thing on screen twice at
 * lower fidelity. The field survives in storage and old answers still show in
 * the summary; it is only no longer asked.
 *
 * Caffeine and "first thing" look trivial beside the rest. They are the two
 * behavioural dials in the set — the ones a pattern can actually be traced
 * back to — which is why they are here and not dropped as noise.
 *
 * Collapsed until BOTH the clock says evening and the Dagstart is done, so
 * the Vandaag screen has exactly one obvious thing to do at any moment.
 * Opening it while the morning is still half-finished put two forms on screen
 * at once and asked about focus in the middle of a morning check-in.
 */

/** Local hour from which the evening card opens by itself. */
export const EVENING_HOUR = 17

export default function EveningCheckin({ onSaved, now = new Date() }) {
  const dateKey = getLocalDateKey(now)
  const priority = getTodayIntention()
  const entry = getCheckin(dateKey)
  const stored = entry?.evening ?? null
  const morningDone = isDagstartDone(entry)

  const [saved, setSaved] = useState(stored)
  const [isOpen, setIsOpen] = useState(
    () => stored === null && morningDone && now.getHours() >= EVENING_HOUR,
  )

  const [form, setForm] = useState(() => ({
    mental: stored?.mental ?? null,
    intention: stored?.intention ?? null,
    pijn: stored?.pijn ?? null,
    focus: stored?.focus ?? null,
    reactief: stored?.reactief ?? null,
    cafeine: stored?.cafeine ?? null,
    eerste: stored?.eerste ?? null,
    note: stored?.note ?? '',
  }))
  const [error, setError] = useState(null)

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const hasAnything =
    form.note.trim() !== '' ||
    ['mental', 'intention', 'pijn', 'focus', 'reactief', 'cafeine', 'eerste'].some(
      (key) => form[key] !== null,
    )

  function handleSave() {
    try {
      const entry = saveEvening(dateKey, form)
      setSaved(entry.evening)
      setIsOpen(false)
      setError(null)
      onSaved?.()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!isOpen && saved) {
    return <EveningSummary evening={saved} onEdit={() => setIsOpen(true)} />
  }

  if (!isOpen) {
    return (
      <Screen title="Avond" tone="quiet">
        <p>
          {morningDone
            ? `Vanaf ${EVENING_HOUR}:00 vraag ik hoe de dag ging.`
            : 'Eerst je dagstart. Vanavond vraag ik hoe het ging.'}
        </p>
        <Button
          variant="secondary"
          className="mt-3 w-full"
          onClick={() => setIsOpen(true)}
        >
          Nu al invullen
        </Button>
      </Screen>
    )
  }

  return (
    <Screen title="Hoe ging de dag?">
      <Scale
        label="Focus vandaag"
        words={FOCUS_SCALE}
        direction="up"
        value={form.focus}
        onSelect={(n) => set('focus', n)}
      />

      <div className="mt-5">
        <p className="text-sm text-anker-muted">Prioriteit behaald?</p>
        {priority ? (
          <p className="mt-1 text-base text-anker-text">“{priority}”</p>
        ) : (
          <p className="mt-1 text-xs text-anker-muted">
            Je hebt vanochtend geen prioriteit opgeschreven.
          </p>
        )}
        <div className="mt-2 flex gap-2">
          {PRIORITY_OUTCOMES.map((outcome) => (
            <button
              key={outcome.value}
              type="button"
              onClick={() => set('intention', outcome.value)}
              aria-pressed={form.intention === outcome.value}
              aria-label={`Prioriteit ${outcome.label.toLowerCase()}`}
              className={`flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border text-sm transition ${
                form.intention === outcome.value
                  ? 'border-anker-accent bg-anker-accent/15 text-anker-text'
                  : 'border-anker-border bg-anker-bg text-anker-muted'
              }`}
            >
              <span aria-hidden="true">{outcome.emoji}</span>
              {outcome.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <Scale
          label="Emotionele reactiviteit"
          words={REACTIVITY_SCALE}
          direction="down"
          value={form.reactief}
          onSelect={(n) => set('reactief', n)}
        />
      </div>

      <div className="mt-5">
        <p className="text-sm text-anker-muted">Cafeïne na 14:00?</p>
        <div className="mt-2 flex gap-2">
          {[
            { label: 'Nee', value: false },
            { label: 'Ja', value: true },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => set('cafeine', option.value)}
              aria-pressed={form.cafeine === option.value}
              aria-label={`Cafeïne na 14:00: ${option.label.toLowerCase()}`}
              className={`min-h-12 flex-1 rounded-xl border text-sm transition ${
                form.cafeine === option.value
                  ? 'border-anker-accent bg-anker-accent/15 text-anker-text'
                  : 'border-anker-border bg-anker-bg text-anker-muted'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm text-anker-muted">Eerste ding vanochtend</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {FIRST_THING_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => set('eerste', option.value)}
              aria-pressed={form.eerste === option.value}
              aria-label={`Eerste ding: ${option.value}`}
              className={`min-h-11 rounded-full border px-3.5 text-sm transition ${
                form.eerste === option.value
                  ? 'border-anker-accent bg-anker-accent/15 text-anker-text'
                  : 'border-anker-border bg-anker-bg text-anker-muted'
              }`}
            >
              <span aria-hidden="true">{option.emoji}</span> {option.value}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <Scale
          label="Hoe eindig je de dag?"
          words={MOOD_WORDS}
          emoji={MOOD_EMOJI}
          direction="up"
          value={form.mental}
          onSelect={(n) => set('mental', n)}
        />
      </div>

      <textarea
        id="avond-notitie"
        value={form.note}
        onChange={(e) => set('note', e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Iets om te onthouden? Mag leeg."
        className="mt-5 w-full rounded-xl border border-anker-border bg-anker-bg p-3 text-base text-anker-text placeholder:text-anker-muted/60 focus:border-anker-accent focus:outline-none"
      />

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      <Button className="mt-4 w-full" onClick={handleSave} disabled={!hasAnything}>
        Dag afsluiten
      </Button>
    </Screen>
  )
}

function EveningSummary({ evening, onEdit }) {
  const mood = MOOD_SCALE.find((m) => m.value === evening.mental)
  const outcome = PRIORITY_OUTCOMES.find((o) => o.value === evening.intention)

  const rows = [
    ['Pijn nu', evening.pijn && PAIN_SCALE[evening.pijn]],
    ['Focus', evening.focus && FOCUS_SCALE[evening.focus]],
    ['Prioriteit', outcome && `${outcome.emoji} ${outcome.label}`],
    ['Reactiviteit', evening.reactief && REACTIVITY_SCALE[evening.reactief]],
    ['Cafeïne na 14:00', evening.cafeine === null ? null : evening.cafeine ? 'Ja' : 'Nee'],
    ['Eerste ding', evening.eerste],
  ].filter(([, value]) => value)

  return (
    <Screen title="Avond ✓">
      {mood && (
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none">{mood.emoji}</span>
          <span className="text-anker-text">{mood.label}</span>
        </div>
      )}

      {rows.length > 0 && (
        <dl className="mt-3 space-y-1">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <dt className="text-anker-muted">{label}</dt>
              <dd className="text-anker-text">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {evening.note && (
        <p className="mt-3 whitespace-pre-wrap text-anker-text">{evening.note}</p>
      )}

      <button
        type="button"
        onClick={onEdit}
        aria-label="Avond-check-in aanpassen"
        className="mt-3 text-xs text-anker-muted underline"
      >
        Aanpassen
      </button>
    </Screen>
  )
}
