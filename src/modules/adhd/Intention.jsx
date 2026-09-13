import { useState } from 'react'
import Screen from '../../components/Screen.jsx'
import Button from '../../components/Button.jsx'
import { getLocalDateKey } from '../../lib/date.js'
import { getTodayIntention, saveIntention } from '../../lib/storage.js'

/**
 * One intention for today. Exactly one, on purpose: a list of five would be a
 * to-do list, and a to-do list is the thing that stops getting opened.
 */
export default function Intention() {
  const dateKey = getLocalDateKey()
  const [saved, setSaved] = useState(() => getTodayIntention())
  const [draft, setDraft] = useState(() => getTodayIntention())
  const [isEditing, setIsEditing] = useState(() => getTodayIntention() === '')
  const [error, setError] = useState(null)

  function handleSave() {
    try {
      const next = saveIntention(dateKey, draft)
      setSaved(next)
      setIsEditing(next === '')
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }

  if (!isEditing && saved) {
    return (
      <Screen title="Vandaag telt">
        <p className="text-lg text-anker-text">{saved}</p>
        <button
          type="button"
          onClick={() => {
            setDraft(saved)
            setIsEditing(true)
          }}
          aria-label="Intentie aanpassen"
          className="mt-3 text-xs text-anker-muted underline"
        >
          Aanpassen
        </button>
      </Screen>
    )
  }

  return (
    <Screen title="Wat telt vandaag?">
      <p>Eén ding. Niet drie.</p>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        maxLength={140}
        placeholder="Bijv. de huisarts bellen"
        className="mt-3 min-h-12 w-full rounded-xl border border-anker-border bg-anker-bg px-3 text-base text-anker-text placeholder:text-anker-muted/60 focus:border-anker-accent focus:outline-none"
      />
      <div className="mt-3 flex gap-2">
        <Button className="flex-1" onClick={handleSave} disabled={!draft.trim()}>
          Vastzetten
        </Button>
        {saved && (
          <Button variant="ghost" onClick={() => { setDraft(saved); setIsEditing(false) }}>
            Annuleren
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-200">
          {error}
        </p>
      )}
    </Screen>
  )
}
