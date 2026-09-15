import { useState } from 'react'
import Screen from '../../components/Screen.jsx'
import Button from '../../components/Button.jsx'
import ModeSwitch from './ModeSwitch.jsx'
import QuestionStep from './QuestionStep.jsx'
import MoodStep from './MoodStep.jsx'
import SleepStep from './SleepStep.jsx'
import BodyStep from './BodyStep.jsx'
import { getRegionLabel, MOOD_SCALE } from '../../lib/regions.js'
import { SLEEP_EMOJI, SLEEP_SCALE } from '../../lib/questions.js'
import { formatSleepDuration } from '../../lib/sleep.js'
import {
  ALL_QUESTION_IDS,
  QUESTIONS,
  questionsForMode,
} from '../../lib/questions.js'
import { getLocalDateKey, formatDateKeyNL } from '../../lib/date.js'
import { isDagstartDone } from '../../lib/dagstart.js'
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

  // Not `stored === null`: the evening check-in writes into the same day
  // entry, so saving only the evening would otherwise show an empty
  // "Dagstart ✓" for a morning that never happened.
  const [existing, setExisting] = useState(stored)
  const [isEditing, setIsEditing] = useState(!isDagstartDone(stored))

  const [mode, setMode] = useState('lite')
  const [answers, setAnswers] = useState(() => stored?.answers ?? {})
  const [step, setStep] = useState(0)
  const [mental, setMental] = useState(() => stored?.mental ?? null)
  const [sleep, setSleep] = useState(() => stored?.sleep ?? null)
  const [body, setBody] = useState(() => stored?.body ?? [])
  const [error, setError] = useState(null)

  const questions = questionsForMode(mode, now)
  // The written questions come first, then mood, sleep and the body map. The
  // free note and the Garmin readings deliberately are NOT steps — they live
  // in Extras, below the flow, so the daily routine stays short enough to
  // actually be done.
  const stepCount = questions.length + 3
  const lastStep = stepCount - 1

  function beginEdit() {
    const current = getCheckin(dateKey)
    setMode(current?.mode ?? 'lite')
    setAnswers(current?.answers ?? {})
    setMental(current?.mental ?? null)
    setSleep(current?.sleep ?? null)
    setBody(current?.body ?? [])
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
      // `note` is owned by Extras; pass through whatever is already stored so
      // saving the Dagstart never wipes a note written there.
      const saved = saveCheckin(dateKey, {
        mental,
        mode,
        answers,
        sleep,
        body,
        note: getCheckin(dateKey)?.note ?? '',
      })
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

  if (!isEditing && isDagstartDone(existing)) {
    return (
      <CheckinSummary entry={existing} dateKey={dateKey} onEdit={beginEdit} />
    )
  }

  const questionStep = step < questions.length ? questions[step] : null
  const stepLabel = questionStep
    ? `Vraag ${step + 1}`
    : step === questions.length
      ? 'Gevoel'
      : step === questions.length + 1
        ? 'Slaap'
        : 'Lichaam'

  return (
    <Screen title="Dagstart">
      {/* Only while the written questions are on screen — it does nothing on
          the mood, body and note steps, and it costs room the body map needs. */}
      {step < questions.length && <ModeSwitch mode={mode} onChange={changeMode} />}

      {/* Thick enough to read at a glance, and it names where you are — a
          bare "4 / 7" tells you how much is left but not what you are doing. */}
      <div className="mb-5 mt-4">
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: stepCount }, (_, index) => (
            <div
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                index < step
                  ? 'bg-anker-done'
                  : index === step
                    ? 'bg-anker-accent'
                    : 'bg-anker-border'
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-anker-muted">
          {stepLabel} · {step + 1} van {stepCount}
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
        <SleepStep value={sleep} onChange={setSleep} />
      )}
      {step === lastStep && <BodyStep value={body} onChange={setBody} />}

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

      {entry.sleep && <SleepSummary sleep={entry.sleep} />}

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

/** Last night, as recorded. Only the parts that were actually answered. */
function SleepSummary({ sleep }) {
  const duration = formatSleepDuration(sleep.bedtijd, sleep.wakkertijd)
  const garmin = sleep.garmin ?? {}

  const rows = [
    ['In bed', sleep.bedtijd && sleep.wakkertijd
      ? `${sleep.bedtijd} → ${sleep.wakkertijd}${duration ? ` (${duration})` : ''}`
      : null],
    ['Body Battery', garmin.bodyBattery],
    ['Slaapscore', garmin.slaapscore],
    ['HRV', garmin.hrvStatus],
  ].filter(([, value]) => value !== null && value !== undefined)

  return (
    <div className="mt-4">
      <p className="text-xs uppercase tracking-wide text-anker-muted">Slaap</p>
      {sleep.subjectief && (
        <p className="mt-1 text-anker-text">
          {SLEEP_EMOJI[sleep.subjectief]} {SLEEP_SCALE[sleep.subjectief]}
        </p>
      )}
      {rows.length > 0 && (
        <dl className="mt-1 space-y-0.5">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <dt className="text-anker-muted">{label}</dt>
              <dd className="text-anker-text">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {garmin.gedragen === false && (
        <p className="mt-1 text-sm text-anker-muted">Garmin niet gedragen</p>
      )}
      {sleep.notitie && (
        <p className="mt-1 whitespace-pre-wrap text-anker-text">{sleep.notitie}</p>
      )}
    </div>
  )
}
