import { scaleColor, scaleFill } from '../lib/scales.js'

/**
 * A 1-5 scale. The one used by mood, sleep, focus, reactivity — everywhere.
 *
 * There were four near-identical copies of this before, which is how they
 * drifted apart in height, spacing and wording. One component means one
 * answer to "what does a scale look like".
 *
 * The selected button takes its colour from the VALUE, not from the app
 * accent, so a filled-in day can be read without reading any words.
 *
 * Props:
 *   label      - what is being rated; always used for the accessible name,
 *                and shown above the row unless hideLabel is set (which it is
 *                wherever the question text right above already says it)
 *   words      - 6 entries, index 1-5 used (index 0 ignored)
 *   emoji      - optional, same shape as words
 *   direction  - 'up' when a high value is good, 'down' when it is bad
 *   value      - 1-5 or null
 *   onSelect   - called with the number; tapping the current value clears it
 */
export default function Scale({
  label,
  words,
  emoji,
  direction = 'up',
  value,
  onSelect,
  size = 'md',
  hideLabel = false,
}) {
  return (
    <div>
      {!hideLabel && <p className="text-sm text-anker-muted">{label}</p>}
      <div className={`flex gap-1.5 ${hideLabel ? '' : 'mt-2'}`}>
        {[1, 2, 3, 4, 5].map((n) => {
          const isSelected = value === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => onSelect(isSelected ? null : n)}
              aria-pressed={isSelected}
              aria-label={`${label}: ${words[n]}`}
              style={
                isSelected
                  ? {
                      borderColor: scaleColor(n, direction),
                      backgroundColor: scaleFill(n, direction),
                    }
                  : undefined
              }
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border transition ${
                size === 'lg' ? 'min-h-[4.5rem]' : 'min-h-14'
              } ${
                isSelected
                  ? 'border-2 text-anker-text'
                  : 'border-anker-border bg-anker-bg text-anker-muted'
              }`}
            >
              {emoji ? (
                <span className={size === 'lg' ? 'text-3xl leading-none' : 'text-2xl leading-none'}>
                  {emoji[n]}
                </span>
              ) : (
                <span className="text-base leading-none">{n}</span>
              )}
              <span className="px-0.5 text-[10px] leading-tight">{words[n]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
