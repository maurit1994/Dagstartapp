/**
 * One written question, alone on its screen.
 *
 * One question per screen is the whole point: a form with six boxes reads as
 * six obligations at once, which is exactly what does not get filled in.
 */
export default function QuestionStep({ question, value, onChange }) {
  return (
    <div>
      <p className="text-base text-anker-text">{question.q}</p>
      <p className="mt-1 text-sm text-anker-muted">{question.hint}</p>
      <textarea
        // A stable id per question keeps the value and caret in place when the
        // page re-renders around it.
        id={`vraag-${question.id}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        maxLength={2000}
        autoComplete="off"
        className="mt-4 w-full rounded-xl border border-anker-border bg-anker-bg p-3 text-base text-anker-text placeholder:text-anker-muted/60 focus:border-anker-accent focus:outline-none"
      />
      <p className="mt-2 text-xs text-anker-muted">Leeg laten mag.</p>
    </div>
  )
}
