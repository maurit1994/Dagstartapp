import { BODY_REGIONS } from '../../lib/regions.js'

/**
 * Step 2: where does it hurt, and how much.
 *
 * Tapping a region turns it on at intensity 3 (a neutral middle) so one tap
 * is already a valid answer; the 1-5 row underneath lets you adjust. Tapping
 * an active region again removes it.
 *
 * Props:
 *   value    - array of { region, intensity }, the permanent stored shape
 *   onChange - called with the next array
 */
export default function PainStep({ value, onChange }) {
  const byRegion = new Map(value.map((p) => [p.region, p.intensity]))

  function toggleRegion(id) {
    if (byRegion.has(id)) {
      onChange(value.filter((p) => p.region !== id))
    } else {
      onChange([...value, { region: id, intensity: 3 }])
    }
  }

  function setIntensity(id, intensity) {
    onChange(value.map((p) => (p.region === id ? { ...p, intensity } : p)))
  }

  return (
    <div>
      <p className="text-base text-anker-text">Waar heb je pijn?</p>
      <p className="mt-1 text-sm text-anker-muted">
        Tik aan wat vandaag speelt. Niets aantikken mag ook.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {BODY_REGIONS.map((region) => {
          const isSelected = byRegion.has(region.id)
          return (
            <button
              key={region.id}
              type="button"
              onClick={() => toggleRegion(region.id)}
              aria-pressed={isSelected}
              className={`min-h-11 rounded-full border px-3.5 text-sm transition ${
                isSelected
                  ? 'border-anker-accent bg-anker-accent/15 text-anker-text'
                  : 'border-anker-border bg-anker-surface text-anker-muted'
              }`}
            >
              {region.label}
            </button>
          )
        })}
      </div>

      {value.length > 0 && (
        <div className="mt-6 space-y-3 border-t border-anker-border pt-4">
          <p className="text-sm text-anker-muted">Hoe erg? (1 = licht, 5 = heftig)</p>
          {value.map((pain) => (
            <IntensityRow
              key={pain.region}
              regionId={pain.region}
              intensity={pain.intensity}
              onSelect={(n) => setIntensity(pain.region, n)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function IntensityRow({ regionId, intensity, onSelect }) {
  const label = BODY_REGIONS.find((r) => r.id === regionId)?.label ?? regionId
  return (
    <div>
      <p className="text-sm text-anker-text">{label}</p>
      <div className="mt-1.5 flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onSelect(n)}
            aria-pressed={intensity === n}
            aria-label={`${label}, intensiteit ${n}`}
            className={`min-h-11 flex-1 rounded-lg border text-sm transition ${
              intensity === n
                ? 'border-anker-accent bg-anker-accent/20 text-anker-text'
                : 'border-anker-border bg-anker-surface text-anker-muted'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}
