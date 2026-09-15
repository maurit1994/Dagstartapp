import { HRV_STATUSES, SLEEP_EMOJI, SLEEP_SCALE } from '../../lib/questions.js'
import { formatSleepDuration } from '../../lib/sleep.js'

/**
 * How last night went.
 *
 * Its own step rather than tacked onto the body screen: the body map only
 * just fits a phone, and sleep is a different question anyway.
 *
 * Times use native <input type="time"> — on iOS that is the system wheel
 * picker, which beats a custom slider for both speed and accessibility. The
 * duration underneath is what makes entering two times worth the trouble;
 * without it they are just numbers you never look at again.
 *
 * Props:
 *   value    - the sleep block, or null
 *   onChange - called with the next block
 */
export default function SleepStep({ value, onChange }) {
  const sleep = value ?? {
    subjectief: null,
    bedtijd: null,
    wakkertijd: null,
    notitie: '',
    garmin: { gedragen: null, bodyBattery: null, slaapscore: null, hrvStatus: null },
  }
  const garmin = sleep.garmin ?? {}
  const duration = formatSleepDuration(sleep.bedtijd, sleep.wakkertijd)

  const set = (key, next) => onChange({ ...sleep, [key]: next })
  const setGarmin = (key, next) =>
    onChange({ ...sleep, garmin: { ...garmin, [key]: next } })

  return (
    <div>
      <p className="text-base text-anker-text">Hoe voelde je slaap?</p>
      <div className="mt-3 flex justify-between gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => set('subjectief', sleep.subjectief === n ? null : n)}
            aria-pressed={sleep.subjectief === n}
            aria-label={`Slaap: ${SLEEP_SCALE[n]}`}
            className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border transition ${
              sleep.subjectief === n
                ? 'border-anker-accent bg-anker-accent/10'
                : 'border-anker-border bg-anker-bg'
            }`}
          >
            <span className="text-2xl leading-none">{SLEEP_EMOJI[n]}</span>
            <span className="text-[9px] leading-tight text-anker-muted">
              {SLEEP_SCALE[n]}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 flex gap-3">
        <label className="flex-1 text-sm text-anker-muted">
          Bedtijd
          <input
            id="slaap-bedtijd"
            type="time"
            value={sleep.bedtijd ?? ''}
            onChange={(e) => set('bedtijd', e.target.value || null)}
            className="mt-1 min-h-12 w-full rounded-xl border border-anker-border bg-anker-bg px-3 text-base text-anker-text focus:border-anker-accent focus:outline-none"
          />
        </label>
        <label className="flex-1 text-sm text-anker-muted">
          Wakker om
          <input
            id="slaap-wakkertijd"
            type="time"
            value={sleep.wakkertijd ?? ''}
            onChange={(e) => set('wakkertijd', e.target.value || null)}
            className="mt-1 min-h-12 w-full rounded-xl border border-anker-border bg-anker-bg px-3 text-base text-anker-text focus:border-anker-accent focus:outline-none"
          />
        </label>
      </div>
      <p className="mt-2 min-h-5 text-sm text-anker-accent" aria-live="polite">
        {duration ? `${duration} geslapen` : ' '}
      </p>

      <textarea
        id="slaap-notitie"
        value={sleep.notitie ?? ''}
        onChange={(e) => set('notitie', e.target.value)}
        rows={2}
        maxLength={500}
        placeholder="Wakker geworden? Onrustig?"
        className="mt-3 w-full rounded-xl border border-anker-border bg-anker-bg p-3 text-base text-anker-text placeholder:text-anker-muted/60 focus:border-anker-accent focus:outline-none"
      />

      <div className="mt-5 border-t border-anker-border pt-4">
        <p className="text-sm text-anker-muted">Garmin gedragen?</p>
        <div className="mt-2 flex gap-2">
          {[
            { label: 'Ja', value: true },
            { label: 'Nee', value: false },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => setGarmin('gedragen', option.value)}
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
                      setGarmin(
                        field.key,
                        e.target.value === '' ? null : Number(e.target.value),
                      )
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
                  onClick={() => setGarmin('hrvStatus', status)}
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
      </div>
    </div>
  )
}
