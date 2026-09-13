/**
 * Shared page card. Every module renders its content inside one of these so
 * spacing, corners and colours stay identical across the app — change it here,
 * it changes everywhere. This is what "shared UI" in components/ means.
 *
 * Props:
 *   title    - heading shown at the top of the card (Dutch, it is user-facing)
 *   children - whatever the module wants to put inside the card
 */
export default function Screen({ title, children }) {
  return (
    <section className="rounded-2xl border border-anker-border bg-anker-surface p-5">
      <h2 className="text-lg font-semibold text-anker-text">{title}</h2>
      <div className="mt-2 text-sm leading-relaxed text-anker-muted">
        {children}
      </div>
    </section>
  )
}
