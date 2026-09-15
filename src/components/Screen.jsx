/**
 * Shared page card.
 *
 * `tone` is the hierarchy: on a screen with several cards, exactly one is
 * what you should be doing. A "quiet" card is waiting its turn — the evening
 * before 17:00, the optional extras — and recedes so it cannot compete with
 * the card that wants you.
 *
 * Props:
 *   title    - heading, shown at the top (Dutch, it is user-facing)
 *   tone     - 'active' (default) or 'quiet'
 *   children - the card's content
 */
export default function Screen({ title, tone = 'active', children }) {
  const isQuiet = tone === 'quiet'

  return (
    <section
      className={
        isQuiet
          ? 'rounded-2xl border border-anker-border/60 p-4'
          : 'rounded-2xl border border-anker-border bg-anker-surface p-5'
      }
    >
      <h2
        className={
          isQuiet
            ? 'text-sm font-medium text-anker-muted'
            : 'text-lg font-semibold text-anker-text'
        }
      >
        {title}
      </h2>
      <div
        className={`text-sm leading-relaxed text-anker-muted ${isQuiet ? 'mt-1' : 'mt-2'}`}
      >
        {children}
      </div>
    </section>
  )
}
