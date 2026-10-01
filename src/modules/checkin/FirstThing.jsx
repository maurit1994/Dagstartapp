import { FIRST_THING_OPTIONS } from '../../lib/questions.js'

/**
 * What you did first this morning.
 *
 * Asked in the MORNING, on the sleep step, since v9. It used to sit in the
 * evening, where you answered at 22:00 about 07:00 — a reconstruction, and
 * reconstructions drift toward what you usually do rather than what you did.
 * Its purpose is to test whether the morning affects that night's sleep, and
 * measurement error in a predictor attenuates exactly the correlation it is
 * meant to reveal. At 07:30 it is not a memory question at all.
 *
 * It rides along on the sleep step rather than becoming a step of its own:
 * the Dagstart was just pruned, and the predictor belongs beside the thing it
 * is hypothesised to affect.
 *
 * The four options are VERBATIM from the previous app and mutually exclusive.
 * That is a real limitation for the hypothesis — "Daglicht" competes with
 * "Bewegen" when you may have done both, so it measures a ranking rather than
 * an exposure — but renaming or splitting them would make the old and new
 * records incomparable, which costs more than it buys.
 */
export default function FirstThing({ value, onChange }) {
  return (
    <div className="mt-6 border-t border-anker-border pt-4">
      <p className="text-sm text-anker-muted">Eerste ding vanochtend</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {FIRST_THING_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(value === option.value ? null : option.value)}
            aria-pressed={value === option.value}
            aria-label={`Eerste ding: ${option.value}`}
            className={`min-h-11 rounded-full border px-3.5 text-sm transition ${
              value === option.value
                ? 'border-anker-accent bg-anker-accent/15 text-anker-text'
                : 'border-anker-border bg-anker-bg text-anker-muted'
            }`}
          >
            <span aria-hidden="true">{option.emoji}</span> {option.value}
          </button>
        ))}
      </div>
    </div>
  )
}
