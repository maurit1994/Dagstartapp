import { useState } from 'react'
import Screen from '../../components/Screen.jsx'
import Button from '../../components/Button.jsx'
import {
  HORIZONS,
  MAX_ITEM_TEXT,
  horizonLabel,
  loadStats,
  sortedOpenItems,
} from '../../lib/mentalload.js'
import {
  addLoadItem,
  deleteLoadItem,
  getLoadItems,
  updateLoadItem,
} from '../../lib/storage.js'

/**
 * Vooruit — the household's mental load, the part nobody sees.
 *
 * Deliberately NOT a to-do list. A task list starts once somebody has already
 * noticed, and the noticing is the work being redistributed here. The unit is
 * a thing coming up, how soon it needs someone, and whether YOU were the one
 * who raised it.
 *
 * Private to this user, by their choice. A shared ledger of who carries what
 * becomes evidence in an argument, and this app is not for that.
 *
 * Nothing here scores you. No percentage, no target, no streak — the counts
 * state what is on your mind, the same way insights.js states a fact and
 * stops. An unraised item from three weeks ago is shown first, which is
 * information, not a reprimand.
 */
export default function Load({ onSaved }) {
  const items = getLoadItems()
  const open = sortedOpenItems(items)
  const stats = loadStats(items)

  const [text, setText] = useState('')
  const [horizon, setHorizon] = useState('week')
  const [error, setError] = useState(null)

  function run(action) {
    try {
      action()
      setError(null)
      onSaved?.()
    } catch (err) {
      setError(err.message)
    }
  }

  function add() {
    if (!text.trim()) return
    run(() => {
      addLoadItem(text, horizon)
      setText('')
    })
  }

  return (
    <>
      <Screen title="Wat komt eraan?">
        <p className="text-sm text-anker-muted">
          Dingen die iemand moet gaan regelen. Noteer ze zodra je ze ziet —
          het zien is het werk.
        </p>

        <label htmlFor="load-tekst" className="mt-4 block text-xs text-anker-muted">
          Wat komt eraan?
        </label>
        <textarea
          id="load-tekst"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          maxLength={MAX_ITEM_TEXT}
          placeholder="Bijv. tandartscontrole voor de kinderen"
          className="mt-1 w-full rounded-xl border border-anker-border bg-anker-bg p-3 text-base text-anker-text placeholder:text-anker-muted/60 focus:border-anker-accent focus:outline-none"
        />

        <p className="mt-3 text-xs text-anker-muted">Wanneer moet er iets gebeuren?</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {HORIZONS.map((h) => (
            <button
              key={h.value}
              type="button"
              onClick={() => setHorizon(h.value)}
              aria-pressed={horizon === h.value}
              aria-label={`Horizon ${h.label}`}
              className={`min-h-10 rounded-full border px-3 text-sm transition ${
                horizon === h.value
                  ? 'border-anker-accent bg-anker-accent/15 text-anker-text'
                  : 'border-anker-border text-anker-muted'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200"
          >
            {error}
          </p>
        )}

        <Button className="mt-4 w-full" onClick={add} disabled={!text.trim()}>
          Toevoegen
        </Button>
      </Screen>

      <Screen title="Op je lijst" tone="quiet">
        {open.length === 0 ? (
          <p className="text-sm">Nog niets genoteerd.</p>
        ) : (
          <>
            {/* A count, not a score. "1 van de 4 opgebracht" is a fact about
                this week; it is never coloured, ranked or compared to a goal. */}
            <p className="text-sm text-anker-muted">
              {stats.open} {stats.open === 1 ? 'ding staat' : 'dingen staan'} er
              {stats.raised > 0 && `, ${stats.raised} daarvan heb je opgebracht`}.
            </p>

            <ul className="mt-3 space-y-2">
              {open.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-anker-border bg-anker-bg p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="whitespace-pre-wrap text-base text-anker-text">
                        {item.text}
                      </p>
                      <p className="mt-0.5 text-xs text-anker-muted">
                        {horizonLabel(item.horizon)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => run(() => deleteLoadItem(item.id))}
                      aria-label={`Verwijder: ${item.text}`}
                      className="min-h-10 shrink-0 px-2 text-anker-muted"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mt-3 flex gap-2">
                    {/* The measure. Doing a job you were handed is not the
                        labour in question; saying it out loud first is. */}
                    <button
                      type="button"
                      onClick={() =>
                        run(() => updateLoadItem(item.id, { raised: !item.raised }))
                      }
                      aria-pressed={item.raised}
                      aria-label={`Opgebracht: ${item.text}`}
                      className={`min-h-11 flex-1 rounded-lg border text-sm transition ${
                        item.raised
                          ? 'border-anker-done bg-anker-done/20 text-anker-text'
                          : 'border-anker-border text-anker-muted'
                      }`}
                    >
                      {item.raised ? 'Opgebracht ✓' : 'Opgebracht?'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        run(() => updateLoadItem(item.id, { resolvedAt: Date.now() }))
                      }
                      aria-label={`Afgehandeld: ${item.text}`}
                      className="min-h-11 flex-1 rounded-lg border border-anker-border text-sm text-anker-muted transition"
                    >
                      Afgehandeld
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Screen>
    </>
  )
}
