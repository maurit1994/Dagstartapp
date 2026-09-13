import { useState } from 'react'
import BodyMap from './BodyMap.jsx'
import { BODY_MEASURES, getRegionLabel } from '../../lib/regions.js'

/**
 * Step 2: tap a body part, score pain and tension for it.
 *
 * Scores run 0-5 where 0 means "nothing here", which is also how you clear a
 * region you tapped by accident. A region scored 0 on both is dropped on save.
 *
 * Props:
 *   value    - array of { region, pain, tension }
 *   onChange - called with the next array
 */
export default function BodyStep({ value, onChange }) {
  const [view, setView] = useState('front')
  const [selected, setSelected] = useState(null)

  const scores = new Map(value.map((b) => [b.region, b]))
  const current = selected ? (scores.get(selected) ?? { pain: 0, tension: 0 }) : null

  function setScore(measure, score) {
    const existing = scores.get(selected)
    const next = {
      region: selected,
      pain: existing?.pain ?? 0,
      tension: existing?.tension ?? 0,
      [measure]: score,
    }

    const without = value.filter((b) => b.region !== selected)
    // Both zero means the region carries no information; drop it entirely.
    onChange(next.pain === 0 && next.tension === 0 ? without : [...without, next])
  }

  return (
    <div>
      <p className="text-base text-anker-text">Waar zit het vandaag?</p>
      <p className="mt-1 text-sm text-anker-muted">
        Tik een lichaamsdeel aan. Niets aantikken mag ook.
      </p>

      <div className="mt-4 flex gap-2" role="tablist" aria-label="Voor- of achterkant">
        {[
          { id: 'front', label: 'Voorkant' },
          { id: 'back', label: 'Achterkant' },
        ].map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={view === v.id}
            onClick={() => setView(v.id)}
            className={`min-h-11 flex-1 rounded-xl border text-sm transition ${
              view === v.id
                ? 'border-anker-accent bg-anker-accent/15 text-anker-text'
                : 'border-anker-border bg-anker-surface text-anker-muted'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <BodyMap
          view={view}
          scores={scores}
          selected={selected}
          onSelect={setSelected}
        />
      </div>

      {selected ? (
        <div
          role="group"
          aria-label={`Scores voor ${getRegionLabel(selected)}`}
          className="mt-4 rounded-xl border border-anker-border bg-anker-bg p-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-anker-text">{getRegionLabel(selected)}</p>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="min-h-9 px-2 text-xs text-anker-muted underline"
            >
              Sluiten
            </button>
          </div>

          {BODY_MEASURES.map((measure) => (
            <div key={measure.key} className="mt-3">
              <p className="text-sm text-anker-muted">{measure.label}</p>
              <div className="mt-1.5 flex gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setScore(measure.key, n)}
                    aria-pressed={current[measure.key] === n}
                    aria-label={`${getRegionLabel(selected)}, ${measure.label.toLowerCase()} ${n}`}
                    className={`min-h-11 flex-1 rounded-lg border text-sm transition ${
                      current[measure.key] === n
                        ? 'border-anker-accent bg-anker-accent/20 text-anker-text'
                        : 'border-anker-border bg-anker-surface text-anker-muted'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-anker-muted">
          Tik een lichaamsdeel aan om te scoren.
        </p>
      )}

      {value.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-anker-border pt-3">
          {value.map((b) => (
            <li key={b.region} className="flex justify-between text-sm">
              <button
                type="button"
                onClick={() => setSelected(b.region)}
                className="text-anker-text underline-offset-2 hover:underline"
              >
                {getRegionLabel(b.region)}
              </button>
              <span className="text-anker-muted">
                pijn {b.pain} · spanning {b.tension}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
