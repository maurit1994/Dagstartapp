import { getRegionLabel } from '../../lib/regions.js'
import { shapesForView } from './bodyShapes.js'

/**
 * Tappable body figure. Front and back are two views of ONE body: the left
 * arm is the same region from either side, so tapping it anywhere edits the
 * same entry.
 *
 * Colour encodes the worst of the two scores, so a region you have marked is
 * visible at a glance without having to read anything.
 *
 * Props:
 *   view      - 'front' | 'back'
 *   scores    - Map of region id -> { pain, tension }
 *   selected  - currently open region id, or null
 *   onSelect  - called with a region id when a shape is tapped
 */

// Intensity 0-5 -> fill. Deliberately not a rainbow: one hue getting stronger
// reads as "more", which is the only thing the colour has to say.
const FILLS = [
  'fill-slate-700/50',
  'fill-sky-500/25',
  'fill-sky-500/40',
  'fill-amber-500/45',
  'fill-orange-500/55',
  'fill-rose-500/65',
]

export default function BodyMap({ view, scores, selected, onSelect }) {
  const shapes = shapesForView(view)

  return (
    <svg
      viewBox="0 0 200 400"
      // Capped by HEIGHT as well as width: a 1:2 figure at full phone width
      // runs to ~540px, which pushes its own legs and the score panel off the
      // screen. 46vh keeps the whole body in view on a phone while leaving
      // room for the sticky panel underneath.
      className="mx-auto block h-auto max-h-[46vh] w-full max-w-[230px]"
      role="group"
      aria-label={view === 'front' ? 'Lichaam, voorkant' : 'Lichaam, achterkant'}
    >
      {/* Side markers, so there is never doubt about whose left is whose. */}
      <text x="8" y="100" className="fill-slate-500 text-[13px] font-semibold">
        {view === 'front' ? 'R' : 'L'}
      </text>
      <text x="182" y="100" className="fill-slate-500 text-[13px] font-semibold">
        {view === 'front' ? 'L' : 'R'}
      </text>

      {shapes.map((shape) => {
        const score = scores.get(shape.id)
        const worst = Math.max(score?.pain ?? 0, score?.tension ?? 0)
        const isSelected = selected === shape.id
        const label = getRegionLabel(shape.id)

        const common = {
          className: `${FILLS[worst]} cursor-pointer transition-[fill,stroke] ${
            isSelected ? 'stroke-anker-accent' : 'stroke-slate-500'
          }`,
          strokeWidth: isSelected ? 3 : 1.5,
          onClick: () => onSelect(shape.id),
          role: 'button',
          tabIndex: 0,
          onKeyDown: (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelect(shape.id)
            }
          },
          'aria-label': worst
            ? `${label}: pijn ${score?.pain ?? 0}, spanning ${score?.tension ?? 0}`
            : `${label}: niets genoteerd`,
          'aria-pressed': isSelected,
        }

        return shape.el === 'ellipse' ? (
          <ellipse
            key={shape.id}
            cx={shape.cx}
            cy={shape.cy}
            rx={shape.rx}
            ry={shape.ry}
            {...common}
          />
        ) : (
          <path key={shape.id} d={shape.d} {...common} />
        )
      })}
    </svg>
  )
}
