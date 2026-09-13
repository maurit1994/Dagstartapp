/**
 * Lite (3 questions) or Full (6).
 *
 * Lite is the default every day and is never remembered: a remembered Full is
 * exactly the friction this switch exists to remove. Switching keeps whatever
 * has already been answered.
 */
export default function ModeSwitch({ mode, onChange }) {
  return (
    <div className="flex gap-2" role="tablist" aria-label="Lengte van je dagstart">
      {[
        { id: 'lite', label: 'Kort', sub: '3 vragen' },
        { id: 'full', label: 'Volledig', sub: '6 vragen' },
      ].map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={mode === option.id}
          onClick={() => onChange(option.id)}
          className={`min-h-12 flex-1 rounded-xl border text-sm transition ${
            mode === option.id
              ? 'border-anker-accent bg-anker-accent/15 text-anker-text'
              : 'border-anker-border bg-anker-surface text-anker-muted'
          }`}
        >
          {option.label}
          <span className="ml-1.5 text-xs opacity-70">{option.sub}</span>
        </button>
      ))}
    </div>
  )
}
