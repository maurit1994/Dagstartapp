import { MOOD_SCALE } from '../../lib/regions.js'

/** Step 1: how are you mentally, on a 1-5 scale. Tapping a face selects it. */
export default function MoodStep({ value, onChange }) {
  return (
    <div>
      <p className="text-base text-anker-text">Hoe voel je je mentaal?</p>
      <div className="mt-5 flex justify-between gap-1">
        {MOOD_SCALE.map((mood) => {
          const isSelected = value === mood.value
          return (
            <button
              key={mood.value}
              type="button"
              onClick={() => onChange(mood.value)}
              aria-pressed={isSelected}
              aria-label={mood.label}
              className={`flex min-h-20 flex-1 flex-col items-center justify-center gap-1 rounded-xl border transition ${
                isSelected
                  ? 'border-anker-accent bg-anker-accent/10'
                  : 'border-anker-border bg-anker-surface'
              }`}
            >
              <span className="text-3xl leading-none">{mood.emoji}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-3 min-h-5 text-center text-sm text-anker-muted">
        {value ? MOOD_SCALE.find((m) => m.value === value).label : ' '}
      </p>
    </div>
  )
}
