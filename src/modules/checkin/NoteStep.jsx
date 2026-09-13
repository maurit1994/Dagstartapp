/** Step 3: anything else worth remembering about today. Optional by design. */
export default function NoteStep({ value, onChange }) {
  return (
    <div>
      <p className="text-base text-anker-text">Wil je er iets bij schrijven?</p>
      <p className="mt-1 text-sm text-anker-muted">Mag leeg blijven.</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        maxLength={1000}
        placeholder="Bijv. slecht geslapen, drukke dag..."
        className="mt-4 w-full rounded-xl border border-anker-border bg-anker-surface p-3 text-base text-anker-text placeholder:text-anker-muted/60 focus:border-anker-accent focus:outline-none"
      />
    </div>
  )
}
