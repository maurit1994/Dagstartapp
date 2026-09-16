import { useState } from 'react'
import Screen from '../../components/Screen.jsx'
import Button from '../../components/Button.jsx'
import BodyStep from './BodyStep.jsx'
import { getRegionLabel } from '../../lib/regions.js'
import { getLocalDateKey } from '../../lib/date.js'
import { getCheckin, saveCheckin } from '../../lib/storage.js'

/**
 * The body map, on its own card rather than inside the Dagstart.
 *
 * Deliberately NOT part of the morning sequence. Opening every day by
 * scanning yourself for pain is the kind of attention that makes pain
 * louder, and it is a poor thing to have to do before anything good has
 * happened yet. It stays one tap away, all day, for the moment your body
 * actually asks for it — which is rarely eight in the morning.
 *
 * Same data, same field, no schema change: it writes `body` on the same day
 * entry and passes everything else through untouched.
 */
export default function BodyCard({ onSaved, now = new Date() }) {
  const dateKey = getLocalDateKey(now)
  const stored = getCheckin(dateKey)?.body ?? []

  const [saved, setSaved] = useState(stored)
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState(stored)
  const [error, setError] = useState(null)

  function open() {
    setDraft(getCheckin(dateKey)?.body ?? [])
    setError(null)
    setIsOpen(true)
  }

  function handleSave() {
    try {
      const current = getCheckin(dateKey)
      const entry = saveCheckin(dateKey, { ...current, body: draft })
      setSaved(entry.body)
      setIsOpen(false)
      setError(null)
      onSaved?.()
    } catch (err) {
      setError(err.message)
    }
  }

  if (isOpen) {
    return (
      <Screen title="Lichaam">
        <BodyStep value={draft} onChange={setDraft} />

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200"
          >
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Annuleren
          </Button>
          <Button className="flex-1" onClick={handleSave}>
            Opslaan
          </Button>
        </div>
      </Screen>
    )
  }

  if (saved.length === 0) {
    return (
      <Screen title="Lichaam" tone="quiet">
        <p>Als er iets speelt, leg het hier vast.</p>
        <Button variant="secondary" className="mt-3 w-full" onClick={open}>
          Openen
        </Button>
      </Screen>
    )
  }

  return (
    <Screen title="Lichaam">
      <ul className="space-y-1">
        {saved.map((b) => (
          <li key={b.region} className="flex justify-between text-anker-text">
            <span>{getRegionLabel(b.region)}</span>
            <span className="text-anker-muted">
              pijn {b.pain} · spanning {b.tension}
            </span>
          </li>
        ))}
      </ul>
      <Button
        variant="secondary"
        className="mt-4 w-full"
        aria-label="Lichaam aanpassen"
        onClick={open}
      >
        Aanpassen
      </Button>
    </Screen>
  )
}
