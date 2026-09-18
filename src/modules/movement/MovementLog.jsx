import { useState } from 'react'
import Screen from '../../components/Screen.jsx'
import Button from '../../components/Button.jsx'
import {
  DURATIONS,
  INTENSITIES,
  MAX_SPORT_LABEL,
  NO_SPORT,
  OTHER_SPORT,
  PHYSIO_OUTCOMES,
  SPORT_TYPES,
} from '../../lib/movement.js'
import { formatDateKeyNL, relativeDayNameNL } from '../../lib/date.js'
import { getCheckin, saveCheckin } from '../../lib/storage.js'

const MAX_SESSIONS = 4

/**
 * Log what you did, for whichever day the week strip above has selected.
 *
 * The day is chosen there rather than here: the strip already shows which
 * days are blank, and a second day control on the same screen would be two
 * answers to one question. This card only ever writes to that day's OWN
 * entry — a session logged on Tuesday that happened Saturday night belongs
 * to Saturday, and the record should say so. The previous app kept a
 * gisteren/vandaag marker on the session instead, which made every later
 * question about "how many days did I train" need special handling.
 */
export default function MovementLog({ onSaved, dateKey, now = new Date() }) {
  const relative = relativeDayNameNL(dateKey, now)

  // Keyed on the date so switching day reloads that day's answers.
  const [form, setForm] = useState(() => load(dateKey))
  const [loadedFor, setLoadedFor] = useState(dateKey)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  function load(key) {
    const m = getCheckin(key)?.movement
    return {
      sports: m?.sports ?? [],
      physio: m?.physio ?? null,
      physioNote: m?.physioNote ?? '',
    }
  }

  if (loadedFor !== dateKey) {
    setLoadedFor(dateKey)
    setForm(load(dateKey))
    setMessage(null)
  }

  function setSport(index, key, value) {
    // "Geen" is exclusive: it means the day had no exercise at all.
    if (key === 'type' && value === NO_SPORT) {
      setForm({
        ...form,
        sports: [{ type: NO_SPORT, label: '', duration: null, intensity: null }],
      })
      return
    }
    const next = [...form.sports]
    next[index] = { ...next[index], [key]: value }
    // Only "Anders" carries a name. Moving to any other type drops it, so a
    // session can never show "Gym" with "Bouldern" still typed beside it.
    if (key === 'type' && value !== OTHER_SPORT) next[index].label = ''
    setForm({ ...form, sports: next })
  }

  const hasNone = form.sports.some((s) => s.type === NO_SPORT)

  function handleSave() {
    try {
      const current = getCheckin(dateKey)
      saveCheckin(dateKey, { ...current, movement: form })
      setError(null)
      setMessage('Opgeslagen.')
      onSaved?.()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Screen title="Wat heb je gedaan?">
      {/* Which day this card is writing into, spelled out. The strip above
          shows only a weekday letter, and "do" is both yesterday and last
          week. */}
      <p className="text-sm text-anker-muted">
        {relative ? `${relative} · ` : ''}
        {formatDateKeyNL(dateKey)}
      </p>

      <p className="mt-5 text-sm text-anker-muted">Sport</p>
      {form.sports.length === 0 && (
        <p className="mt-1 text-sm">Nog niets toegevoegd.</p>
      )}

      <div className="mt-2 space-y-3">
        {form.sports.map((session, index) => (
          <div
            key={index}
            className="rounded-xl border border-anker-border bg-anker-bg p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {SPORT_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSport(index, 'type', type)}
                    aria-pressed={session.type === type}
                    aria-label={`Sessie ${index + 1}: ${type}`}
                    className={`min-h-10 rounded-full border px-3 text-sm transition ${
                      session.type === type
                        ? 'border-anker-accent bg-anker-accent/15 text-anker-text'
                        : 'border-anker-border text-anker-muted'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm({ ...form, sports: form.sports.filter((_, i) => i !== index) })
                }
                aria-label={`Sessie ${index + 1} verwijderen`}
                className="min-h-10 px-2 text-anker-muted"
              >
                ✕
              </button>
            </div>

            {session.type === OTHER_SPORT && (
              <div className="mt-3">
                <label
                  htmlFor={`sport-naam-${index}`}
                  className="text-xs text-anker-muted"
                >
                  Welke sport?
                </label>
                <input
                  id={`sport-naam-${index}`}
                  type="text"
                  value={session.label ?? ''}
                  onChange={(e) => setSport(index, 'label', e.target.value)}
                  maxLength={MAX_SPORT_LABEL}
                  placeholder="Bijv. Bouldern"
                  aria-label={`Sessie ${index + 1}: welke sport`}
                  className="mt-1 w-full rounded-lg border border-anker-border bg-anker-bg p-2.5 text-base text-anker-text placeholder:text-anker-muted/60 focus:border-anker-accent focus:outline-none"
                />
              </div>
            )}

            {session.type && session.type !== NO_SPORT && (
              <>
                <p className="mt-3 text-xs text-anker-muted">Duur</p>
                <div className="mt-1 flex gap-1.5">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSport(index, 'duration', d)}
                      aria-pressed={session.duration === d}
                      aria-label={`Sessie ${index + 1} duur ${d}`}
                      className={`min-h-11 flex-1 rounded-lg border text-xs transition ${
                        session.duration === d
                          ? 'border-anker-accent bg-anker-accent/20 text-anker-text'
                          : 'border-anker-border text-anker-muted'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                <p className="mt-3 text-xs text-anker-muted">Intensiteit</p>
                <div className="mt-1 flex gap-1.5">
                  {INTENSITIES.map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSport(index, 'intensity', i)}
                      aria-pressed={session.intensity === i}
                      aria-label={`Sessie ${index + 1} intensiteit ${i}`}
                      className={`min-h-11 flex-1 rounded-lg border text-xs transition ${
                        session.intensity === i
                          ? 'border-anker-accent bg-anker-accent/20 text-anker-text'
                          : 'border-anker-border text-anker-muted'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {!hasNone && form.sports.length < MAX_SESSIONS && (
        <Button
          variant="secondary"
          className="mt-3 w-full"
          onClick={() =>
            setForm({
              ...form,
              sports: [
                ...form.sports,
                { type: null, label: '', duration: null, intensity: null },
              ],
            })
          }
        >
          + Sport toevoegen
        </Button>
      )}

      <div className="mt-6 border-t border-anker-border pt-4">
        <p className="text-sm text-anker-muted">Rustoefeningen / fysio gedaan</p>
        <div className="mt-2 flex gap-2">
          {PHYSIO_OUTCOMES.map((outcome) => (
            <button
              key={outcome.value}
              type="button"
              onClick={() => setForm({ ...form, physio: outcome.value })}
              aria-pressed={form.physio === outcome.value}
              aria-label={`Fysio ${outcome.label.toLowerCase()}`}
              className={`flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border text-sm transition ${
                form.physio === outcome.value
                  ? 'border-anker-accent bg-anker-accent/15 text-anker-text'
                  : 'border-anker-border bg-anker-bg text-anker-muted'
              }`}
            >
              <span aria-hidden="true">{outcome.emoji}</span>
              {outcome.label}
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm text-anker-muted">Notitie voor fysio (optioneel)</p>
        <textarea
          id="fysio-notitie"
          value={form.physioNote}
          onChange={(e) => setForm({ ...form, physioNote: e.target.value })}
          rows={2}
          maxLength={1000}
          placeholder="Iets opvallends voor je volgende sessie…"
          className="mt-2 w-full rounded-xl border border-anker-border bg-anker-bg p-3 text-base text-anker-text placeholder:text-anker-muted/60 focus:border-anker-accent focus:outline-none"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}
      {message && <p className="mt-3 text-sm text-anker-done">{message}</p>}

      <Button className="mt-4 w-full" onClick={handleSave}>
        Opslaan
      </Button>
    </Screen>
  )
}
