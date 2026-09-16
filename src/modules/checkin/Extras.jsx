import { useState } from 'react'
import Screen from '../../components/Screen.jsx'
import Button from '../../components/Button.jsx'
import { HRV_STATUSES } from '../../lib/questions.js'
import { getLocalDateKey } from '../../lib/date.js'
import { getCheckin, saveCheckin } from '../../lib/storage.js'

/**
 * The optional extras, kept OUT of the daily flow.
 *
 * Garmin readings and a free note are worth having and are not worth a step
 * each. Putting them in the flow made the morning seven or ten screens long,
 * and a routine you stop starting records nothing at all. They live here
 * instead: below the Dagstart, folded shut, opened on the days you feel like
 * it.
 *
 * No schema change — the same fields as before, entered somewhere else.
 */
export default function Extras({ onSaved, now = new Date() }) {
  const dateKey = getLocalDateKey(now)
  const entry = getCheckin(dateKey)

  const [isOpen, setIsOpen] = useState(false)
  const [note, setNote] = useState(() => entry?.note ?? '')
  const [garmin, setGarmin] = useState(() => ({
    gedragen: entry?.sleep?.garmin?.gedragen ?? null,
    bodyBattery: entry?.sleep?.garmin?.bodyBattery ?? null,
    slaapscore: entry?.sleep?.garmin?.slaapscore ?? null,
    hrvStatus: entry?.sleep?.garmin?.hrvStatus ?? null,
  }))
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const filled =
    (entry?.note ?? '') !== '' || entry?.sleep?.garmin?.gedragen !== null &&
    entry?.sleep?.garmin?.gedragen !== undefined

  const setG = (key, value) => setGarmin((current) => ({ ...current, [key]: value }))

  function handleSave() {
    try {
      const current = getCheckin(dateKey)
      saveCheckin(dateKey, {
        ...current,
        note,
        // Keep whatever the sleep step recorded; only the Garmin part is ours.
        sleep: { ...(current?.sleep ?? {}), garmin },
      })
      setIsOpen(false)
      setError(null)
      setMessage('Opgeslagen.')
      onSaved?.()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!isOpen) {
    return (
      <Screen title="Extra's" tone="quiet">
        <p>
          {filled
            ? 'Garmin en je notitie staan ingevuld.'
            : 'Garmin-cijfers en een vrije notitie. Alleen als je er zin in hebt.'}
        </p>
        <Button
          variant="secondary"
          className="mt-3 w-full"
          onClick={() => setIsOpen(true)}
        >
          {filled ? 'Aanpassen' : 'Openen'}
        </Button>
        {message && <p className="mt-3 text-sm text-anker-muted">{message}</p>}
      </Screen>
    )
  }

  return (
    <Screen title="Extra's">
      <p className="text-sm text-anker-muted">Garmin gedragen?</p>
      <div className="mt-2 flex gap-2">
        {[
          { label: 'Ja', value: true },
          { label: 'Nee', value: false },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => setG('gedragen', option.value)}
            aria-pressed={garmin.gedragen === option.value}
            aria-label={`Garmin gedragen: ${option.label.toLowerCase()}`}
            className={`min-h-12 flex-1 rounded-xl border text-sm transition ${
              garmin.gedragen === option.value
                ? 'border-anker-accent bg-anker-accent/15 text-anker-text'
                : 'border-anker-border bg-anker-bg text-anker-muted'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {garmin.gedragen === true && (
        <>
          <div className="mt-3 flex gap-3">
            {[
              { key: 'bodyBattery', label: 'Body Battery' },
              { key: 'slaapscore', label: 'Slaapscore' },
            ].map((field) => (
              <label key={field.key} className="flex-1 text-sm text-anker-muted">
                {field.label}
                <input
                  id={`garmin-${field.key}`}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="100"
                  placeholder="—"
                  value={garmin[field.key] ?? ''}
                  onChange={(e) =>
                    setG(field.key, e.target.value === '' ? null : Number(e.target.value))
                  }
                  className="mt-1 min-h-12 w-full rounded-xl border border-anker-border bg-anker-bg px-3 text-base text-anker-text placeholder:text-anker-muted/60 focus:border-anker-accent focus:outline-none"
                />
              </label>
            ))}
          </div>

          <p className="mt-3 text-sm text-anker-muted">HRV Status</p>
          <div className="mt-2 flex gap-2">
            {HRV_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setG('hrvStatus', status)}
                aria-pressed={garmin.hrvStatus === status}
                aria-label={`HRV ${status}`}
                className={`min-h-11 flex-1 rounded-xl border text-sm transition ${
                  garmin.hrvStatus === status
                    ? 'border-anker-accent bg-anker-accent/15 text-anker-text'
                    : 'border-anker-border bg-anker-bg text-anker-muted'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </>
      )}

      <p className="mt-5 text-sm text-anker-muted">Notitie bij vandaag</p>
      <textarea
        id="extra-notitie"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Iets dat je wil onthouden."
        className="mt-2 w-full rounded-xl border border-anker-border bg-anker-bg p-3 text-base text-anker-text placeholder:text-anker-muted/60 focus:border-anker-accent focus:outline-none"
      />

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <Button variant="ghost" onClick={() => setIsOpen(false)}>
          Sluiten
        </Button>
        <Button className="flex-1" onClick={handleSave}>
          Opslaan
        </Button>
      </div>
    </Screen>
  )
}
