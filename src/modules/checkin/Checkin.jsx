import { useState } from 'react'
import Screen from '../../components/Screen.jsx'
import Button from '../../components/Button.jsx'
import ModeSwitch from './ModeSwitch.jsx'
import QuestionStep from './QuestionStep.jsx'
import MoodStep from './MoodStep.jsx'
import BodyStep from './BodyStep.jsx'
import NoteStep from './NoteStep.jsx'
import { getRegionLabel, MOOD_SCALE } from '../../lib/regions.js'
import {
  ALL_QUESTION_IDS,
  QUESTIONS,
  questionsForMode,
} from '../../lib/questions.js'
import { getLocalDateKey, formatDateKeyNL } from '../../lib/date.js'
import { getCheckin, saveCheckin } from '../../lib/storage.js'

/**
 * The Dagstart: the written questions, then mood, body and an optional note.
 *
 * One entry per local calendar day; opening a day that already has one shows
 * a summary, and "Aanpassen" reopens the flow with the stored answers filled
 * in.
 */
export default function Checkin({ onSaved, now = new Date() }) {
  const dateKey = getLocalDateKey(now)
  const stored = getCheckin(dateKey)

  const [existing, setExisting] = useState(stored)
  const [isEditing, setIsEditing] = useState(stored === null)

  const [mode, setMode] = useState('lite')
  const [answers, setAnswers] = useState(() => stored?.answers ?? {})
  const [step, setStep] = useState(0)
  const [mental, setMental] = useState(() => stored?.mental ?? null)
  const [body, setBody] = useState(() => stored?.body ?? [])
  const [note, setNote] = useState(() => stored?.note ?? '')
  const [error, setError] = useState(null)

  const questions = questionsForMode(mode, now)
  // The written questions come first, then mood, body and note.
  const stepCount = questions.length + 3
  const lastStep = stepCount - 1

  function beginEdit() {
    const current = getCheckin(dateKey)
    setMode(current?.mode ?? 'lite')
    setAnswers(current?.answers ?? {})
    setMental(current?.mental ?? null)
    setBody(current?.body ?? [])
    setNote(current?.note ?? '')
    setStep(0)
    setError(null)
    setIsEditing(true)
  }

  function changeMode(next) {
    setMode(next)
    // Switching length must never lose what is already written, and must never
    // strand you on a step that no longer exists.
    setStep((current) => Math.min(current, questionsForMode(next, now).length + 2))
  }

  function handleSave() {
    try {
      const saved = saveCheckin(dateKey, { mental, mode, answers, body, note })
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

  const questionStep = step < questions.length ? questions[step] : null

  return (
    <Screen title="Dagstart">
      <ModeSwitch mode={mode} onChange={changeMode} />

      <div className="mt-4 mb-5">
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: stepCount }, (_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full ${
                index <= step ? 'bg-anker-accent' : 'bg-anker-border'
              }`}
            />
          ))}
        </div>
        <p className="mt-1.5 text-xs text-anker-muted">
          Stap {step + 1} van {stepCount}
        </p>
      </div>

      {questionStep && (
        <QuestionStep
          question={questionStep}
          value={answers[questionStep.id] ?? ''}
          onChange={(value) =>
            setAnswers((current) => ({ ...current, [questionStep.id]: value }))
          }
        />
      )}
      {step === questions.length && <MoodStep value={mental} onChange={setMental} />}
      {step === questions.length + 1 && (
        <BodyStep value={body} onChange={setBody} />
      )}
      {step === lastStep && <NoteStep value={note} onChange={setNote} />}

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
        {step < lastStep ? (
          <Button className="flex-1" onClick={() => setStep(step + 1)}>
            Volgende
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

/** What you see once the Dagstart is done: the answers, and a way back in. */
function CheckinSummary({ entry, dateKey, onEdit }) {
  const mood = MOOD_SCALE.find((m) => m.value === entry.mental)
  // Render from what was ANSWERED, not from what today's rules would ask.
  // Which questions get asked depends on the mode and the day, and those
  // rules change — an answer already given must stay visible regardless.
  const answered = ALL_QUESTION_IDS.filter((id) => entry.answers[id]).map(
    (id) => QUESTIONS[id],
  )

  return (
    <Screen title="Dagstart ✓">
      <p className="text-anker-muted">{formatDateKeyNL(dateKey)}</p>

      {answered.length > 0 && (
        <dl className="mt-4 space-y-3">
          {answered.map((question) => (
            <div key={question.id}>
              <dt className="text-xs uppercase tracking-wide text-anker-muted">
                {question.q}
              </dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-anker-text">
                {entry.answers[question.id]}
              </dd>
            </div>
          ))}
        </dl>
      )}

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
        aria-label="Dagstart aanpassen"
        onClick={onEdit}
      >
        Aanpassen
      </Button>
    </Screen>
  )
}
