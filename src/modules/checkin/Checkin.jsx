import { useState } from 'react'
import Screen from '../../components/Screen.jsx'
import Button from '../../components/Button.jsx'
import MoodStep from './MoodStep.jsx'
import BodyStep from './BodyStep.jsx'
import NoteStep from './NoteStep.jsx'
import { getRegionLabel, MOOD_SCALE } from '../../lib/regions.js'
import { getLocalDateKey, formatDateKeyNL } from '../../lib/date.js'
import { getCheckin, saveCheckin } from '../../lib/storage.js'

const STEPS = ['Gevoel', 'Lichaam', 'Notitie']

/**
 * The daily check-in. One entry per local calendar day; opening a day that
 * already has an entry shows a summary, and "Aanpassen" reopens the steps
 * with the stored answers filled in.
 *
 * Props:
 *   onSaved - optional callback so the rest of the app can refresh
 */
export default function Checkin({ onSaved }) {
  const dateKey = getLocalDateKey()

  // Read once on mount. localStorage is synchronous, so the lazy initialiser
  // form of useState (passing a function) keeps it off every re-render.
  const [existing, setExisting] = useState(() => getCheckin(dateKey))
  const [isEditing, setIsEditing] = useState(() => getCheckin(dateKey) === null)

  const [step, setStep] = useState(0)
  const [mental, setMental] = useState(() => getCheckin(dateKey)?.mental ?? null)
  const [body, setBody] = useState(() => getCheckin(dateKey)?.body ?? [])
  const [note, setNote] = useState(() => getCheckin(dateKey)?.note ?? '')
  const [error, setError] = useState(null)

  function beginEdit() {
    const current = getCheckin(dateKey)
    setMental(current?.mental ?? null)
    setBody(current?.body ?? [])
    setNote(current?.note ?? '')
    setStep(0)
    setError(null)
    setIsEditing(true)
  }

  function handleSave() {
    try {
      const saved = saveCheckin(dateKey, { mental, body, note })
      setExisting(saved)
      setIsEditing(false)
      setError(null)
      onSaved?.()
    } catch (err) {
      // saveCheckin throws StorageWriteError when the browser refuses the
      // write. Never swallow this: a check-in that silently vanished is worse
      // than one that visibly failed.
      setError(err.message)
    }
  }

  if (!isEditing && existing) {
    return (
      <CheckinSummary entry={existing} dateKey={dateKey} onEdit={beginEdit} />
    )
  }

  return (
    <Screen title="Check-in">
      <div className="mb-5 flex items-center gap-2">
        {STEPS.map((label, index) => (
          <div key={label} className="flex flex-1 flex-col gap-1.5">
            <div
              className={`h-1 rounded-full ${
                index <= step ? 'bg-anker-accent' : 'bg-anker-border'
              }`}
            />
            <span
              className={`text-xs ${
                index === step ? 'text-anker-text' : 'text-anker-muted'
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {step === 0 && <MoodStep value={mental} onChange={setMental} />}
      {step === 1 && <BodyStep value={body} onChange={setBody} />}
      {step === 2 && <NoteStep value={note} onChange={setNote} />}

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-2">
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep(step - 1)}>
            Terug
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button
            className="flex-1"
            onClick={() => setStep(step + 1)}
            disabled={step === 0 && mental === null}
          >
            {step === 0 && mental === null ? 'Kies eerst hoe je je voelt' : 'Volgende'}
          </Button>
        ) : (
          <Button className="flex-1" onClick={handleSave}>
            Opslaan
          </Button>
        )}
      </div>

      {existing && (
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="mt-3 w-full text-center text-xs text-anker-muted underline"
        >
          Annuleren
        </button>
      )}
    </Screen>
  )
}

/** What you see once today is done: the answers, and a way back in. */
function CheckinSummary({ entry, dateKey, onEdit }) {
  const mood = MOOD_SCALE.find((m) => m.value === entry.mental)

  return (
    <Screen title="Check-in ✓">
      <p className="text-anker-muted">{formatDateKeyNL(dateKey)}</p>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-4xl leading-none">{mood?.emoji ?? '—'}</span>
        <span className="text-anker-text">{mood?.label ?? 'Niet ingevuld'}</span>
      </div>

      <div className="mt-4">
        <p className="text-xs uppercase tracking-wide text-anker-muted">Lichaam</p>
        {entry.body.length === 0 ? (
          <p className="mt-1 text-anker-text">Niets genoteerd</p>
        ) : (
          <ul className="mt-1 space-y-1">
            {entry.body.map((b) => (
              <li key={b.region} className="flex justify-between text-anker-text">
                <span>{getRegionLabel(b.region)}</span>
                <span className="text-anker-muted">
                  pijn {b.pain} · spanning {b.tension}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {entry.note && (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-anker-muted">Notitie</p>
          <p className="mt-1 whitespace-pre-wrap text-anker-text">{entry.note}</p>
        </div>
      )}

      <Button
        variant="secondary"
        className="mt-5 w-full"
        aria-label="Check-in aanpassen"
        onClick={onEdit}
      >
        Aanpassen
      </Button>
    </Screen>
  )
}
