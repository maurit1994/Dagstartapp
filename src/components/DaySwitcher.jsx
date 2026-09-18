import { formatDateKeyNL } from '../lib/date.js'

/**
 * Which day the Vandaag tab is working on.
 *
 * Yesterday is editable in full, not just fillable when empty: you remember
 * the evening at breakfast, you get a diagnosis that changes what yesterday
 * meant, or you simply tapped the wrong face. A record you cannot correct
 * stops being one you trust.
 *
 * Only two days. Further back belongs in Historie, where you are already
 * looking at a list of days — a date picker on the daily screen would be
 * answering a question nobody asked at breakfast.
 */
export default function DaySwitcher({ value, onChange, dateKey, hint }) {
  return (
    <div>
      <div className="flex gap-2" role="tablist" aria-label="Welke dag">
        {[
          { id: 'today', label: 'Vandaag' },
          { id: 'yesterday', label: 'Gisteren' },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={value === option.id}
            onClick={() => onChange(option.id)}
            className={`min-h-11 flex-1 rounded-xl border text-sm transition ${
              value === option.id
                ? 'border-anker-accent bg-anker-accent/15 text-anker-text'
                : 'border-anker-border bg-anker-surface text-anker-muted'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Which date you are actually editing, spelled out. On a screen that
          can show a day other than today, "Vandaag" as a label is not enough
          to stop you writing into the wrong one. */}
      <p className="mt-2 text-center text-xs text-anker-muted">
        {formatDateKeyNL(dateKey)}
        {hint && ` · ${hint}`}
      </p>
    </div>
  )
}
