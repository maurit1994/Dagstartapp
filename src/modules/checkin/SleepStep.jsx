import Scale from '../../components/Scale.jsx'
import { SLEEP_EMOJI, SLEEP_SCALE } from '../../lib/questions.js'
import { formatSleepDuration } from '../../lib/sleep.js'

/**
 * How last night went: the feeling, the times, and a note about the night.
 *
 * The Garmin readings used to live here and now sit in Extras, below the
 * flow. They need the watch in your hand and three numbers typed in, which is
 * the kind of step that turns a morning routine into something you skip.
 *
 * Times use native <input type="time"> — on iOS that is the system wheel
 * picker, which beats a custom slider for both speed and accessibility. The
 * duration underneath is what makes entering two times worth the trouble.
 */
export default function SleepStep({ value, onChange }) {
  const sleep = value ?? {
    subjectief: null,
    bedtijd: null,
    wakkertijd: null,
    notitie: '',
    garmin: { gedragen: null, bodyBattery: null, slaapscore: null, hrvStatus: null },
  }
  const duration = formatSleepDuration(sleep.bedtijd, sleep.wakkertijd)
  const set = (key, next) => onChange({ ...sleep, [key]: next })

  return (
    <div>
      <p className="text-base text-anker-text">Hoe voelde je slaap?</p>

      <div className="mt-4">
        <Scale
          label="Slaap"
          words={SLEEP_SCALE}
          emoji={SLEEP_EMOJI}
          direction="up"
          value={sleep.subjectief}
          onSelect={(n) => set('subjectief', n)}
          size="lg"
          hideLabel
        />
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
      <p
        className="mt-2 min-h-6 text-center text-base font-medium text-anker-accent"
        aria-live="polite"
      >
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
    </div>
  )
}
