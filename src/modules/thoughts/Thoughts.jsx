import { useState } from 'react'
import Screen from '../../components/Screen.jsx'
import Button from '../../components/Button.jsx'
import { addThought, deleteThought, getThoughts } from '../../lib/storage.js'
import { formatDateKeyShortNL, formatTimeNL } from '../../lib/date.js'

/**
 * Thought capture: get it out of your head, fast. One textarea, one button,
 * no categories, no tags — anything that slows the capture down defeats it.
 */
export default function Thoughts() {
  const [thoughts, setThoughts] = useState(() => getThoughts())
  const [draft, setDraft] = useState('')
  const [error, setError] = useState(null)

  function handleAdd() {
    if (!draft.trim()) return
    try {
      addThought(draft)
      setThoughts(getThoughts())
      setDraft('')
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }

  function handleDelete(id) {
    try {
      deleteThought(id)
      setThoughts(getThoughts())
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <Screen title="Gedachte vastleggen">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Wat zit er in je hoofd?"
          className="w-full rounded-xl border border-anker-border bg-anker-bg p-3 text-base text-anker-text placeholder:text-anker-muted/60 focus:border-anker-accent focus:outline-none"
        />
        <Button className="mt-3 w-full" onClick={handleAdd} disabled={!draft.trim()}>
          Vastleggen
        </Button>
        {error && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200"
          >
            {error}
          </p>
        )}
      </Screen>

      <Screen title={`Eerder (${thoughts.length})`}>
        {thoughts.length === 0 ? (
          <p>Nog niets vastgelegd.</p>
        ) : (
          <ul className="space-y-3">
            {thoughts.map((thought) => (
              <li
                key={thought.id}
                className="rounded-xl border border-anker-border bg-anker-bg p-3"
              >
                <p className="whitespace-pre-wrap text-anker-text">{thought.text}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-anker-muted">
                    {formatDateKeyShortNL(thought.dateKey)} ·{' '}
                    {formatTimeNL(thought.createdAt)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(thought.id)}
                    aria-label="Gedachte verwijderen"
                    className="min-h-11 px-2 text-xs text-anker-muted underline hover:text-red-300"
                  >
                    Verwijderen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Screen>
    </>
  )
}
