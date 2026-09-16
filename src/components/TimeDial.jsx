import { useRef, useState } from 'react'
import {
  angleToMinutes,
  minutesToAngle,
  minutesToTime,
  polarToXY,
  sleepArcPath,
  xyToAngle,
} from '../lib/clock.js'

/**
 * A 24-hour dial with two draggable handles: bedtime and wake time.
 *
 * Midnight sits at the top and time runs clockwise, so the arc between the
 * handles IS the night — and a night that crosses midnight takes the long way
 * round the top, which is the way it was actually slept. All the geometry
 * lives in lib/clock.js so it can be tested without a browser; this file only
 * draws and listens.
 *
 * Input, in three ways, because none of them suits every moment:
 *  - drag a handle (fast, imprecise)
 *  - arrow keys, 5 minutes a step and 30 with shift (precise, keyboard-only)
 *  - the plain time fields underneath, in the parent (exact, typed)
 *
 * Pointer capture is what makes dragging survive your thumb leaving the
 * circle — without it the drag dies the moment you overshoot.
 *
 * Props:
 *   bedMinutes / wakeMinutes - minutes since midnight
 *   onChange - called with { bedMinutes, wakeMinutes }
 */

const SIZE = 260
const CENTRE = SIZE / 2
const TRACK_RADIUS = 96
const HANDLE_RADIUS = 17
const SNAP_MINUTES = 5

export default function TimeDial({ bedMinutes, wakeMinutes, onChange }) {
  const svgRef = useRef(null)
  const [dragging, setDragging] = useState(null)

  /** Pointer position -> minutes, in the SVG's own coordinate system. */
  function minutesAtPointer(event) {
    const rect = svgRef.current.getBoundingClientRect()
    const scale = SIZE / rect.width
    const x = (event.clientX - rect.left) * scale
    const y = (event.clientY - rect.top) * scale
    return angleToMinutes(xyToAngle(CENTRE, CENTRE, x, y), SNAP_MINUTES)
  }

  function startDrag(handle) {
    return (event) => {
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragging(handle)
    }
  }

  function handleMove(handle) {
    return (event) => {
      if (dragging !== handle) return
      const minutes = minutesAtPointer(event)
      onChange(
        handle === 'bed'
          ? { bedMinutes: minutes, wakeMinutes }
          : { bedMinutes, wakeMinutes: minutes },
      )
    }
  }

  function handleKey(handle) {
    return (event) => {
      const step = event.shiftKey ? 30 : SNAP_MINUTES
      let delta = 0
      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') delta = step
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') delta = -step
      else return

      event.preventDefault()
      const current = handle === 'bed' ? bedMinutes : wakeMinutes
      const next = (((current + delta) % 1440) + 1440) % 1440
      onChange(
        handle === 'bed'
          ? { bedMinutes: next, wakeMinutes }
          : { bedMinutes, wakeMinutes: next },
      )
    }
  }

  const bedPoint = polarToXY(CENTRE, CENTRE, TRACK_RADIUS, minutesToAngle(bedMinutes))
  const wakePoint = polarToXY(CENTRE, CENTRE, TRACK_RADIUS, minutesToAngle(wakeMinutes))

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="mx-auto block h-auto w-full max-w-[260px] touch-none select-none"
      role="group"
      aria-label="Slaapschema"
    >
      <defs>
        {/* Night to morning. The only gradient in the app, and it is carrying
            information: which end of the arc is evening and which is dawn. */}
        <linearGradient id="anker-night" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6d7fd4" />
          <stop offset="100%" stopColor="#d4944a" />
        </linearGradient>
      </defs>

      <circle
        cx={CENTRE}
        cy={CENTRE}
        r={TRACK_RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth="18"
        className="text-anker-raised"
      />

      {/* Hour ticks: every hour, longer every six, so the quarters read fast. */}
      {Array.from({ length: 24 }, (_, hour) => {
        const angle = minutesToAngle(hour * 60)
        const isQuarter = hour % 6 === 0
        const outer = polarToXY(CENTRE, CENTRE, TRACK_RADIUS - 12, angle)
        const inner = polarToXY(CENTRE, CENTRE, TRACK_RADIUS - (isQuarter ? 20 : 16), angle)
        return (
          <line
            key={hour}
            x1={outer.x}
            y1={outer.y}
            x2={inner.x}
            y2={inner.y}
            stroke="currentColor"
            strokeWidth={isQuarter ? 2 : 1}
            className={isQuarter ? 'text-anker-muted' : 'text-anker-border'}
          />
        )
      })}

      {[0, 6, 12, 18].map((hour) => {
        // Just inside the ring's inner edge (96 - 9 = 87), not near the
        // centre — the readout lives there and the two used to overlap.
        const p = polarToXY(CENTRE, CENTRE, TRACK_RADIUS - 24, minutesToAngle(hour * 60))
        return (
          <text
            key={hour}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-anker-muted text-[11px]"
          >
            {hour}
          </text>
        )
      })}

      <path
        d={sleepArcPath(CENTRE, CENTRE, TRACK_RADIUS, bedMinutes, wakeMinutes)}
        fill="none"
        stroke="url(#anker-night)"
        strokeWidth="18"
        strokeLinecap="round"
      />

      {/* The readout. Labelled in words rather than repeating the handle
          emoji: emoji are wide and unpredictable, and at this size they were
          pushing the times into the hour numbers around them. */}
      <text
        x={CENTRE}
        y={CENTRE - 30}
        textAnchor="middle"
        className="fill-anker-muted text-[10px] uppercase tracking-widest"
      >
        Bedtijd
      </text>
      <text
        x={CENTRE}
        y={CENTRE - 10}
        textAnchor="middle"
        className="fill-anker-text text-[24px] font-semibold"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {minutesToTime(bedMinutes)}
      </text>
      <text
        x={CENTRE}
        y={CENTRE + 18}
        textAnchor="middle"
        className="fill-anker-muted text-[10px] uppercase tracking-widest"
      >
        Wakker
      </text>
      <text
        x={CENTRE}
        y={CENTRE + 38}
        textAnchor="middle"
        className="fill-anker-text text-[24px] font-semibold"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {minutesToTime(wakeMinutes)}
      </text>

      {[
        { id: 'bed', point: bedPoint, minutes: bedMinutes, label: 'Bedtijd', glyph: '🌙' },
        { id: 'wake', point: wakePoint, minutes: wakeMinutes, label: 'Wakker om', glyph: '☀️' },
      ].map((handle) => (
        <g
          key={handle.id}
          role="slider"
          tabIndex={0}
          aria-label={handle.label}
          aria-valuemin={0}
          aria-valuemax={1435}
          aria-valuenow={handle.minutes}
          aria-valuetext={`${handle.label} ${minutesToTime(handle.minutes)}`}
          onPointerDown={startDrag(handle.id)}
          onPointerMove={handleMove(handle.id)}
          onPointerUp={() => setDragging(null)}
          onPointerCancel={() => setDragging(null)}
          onKeyDown={handleKey(handle.id)}
          className="cursor-grab focus:outline-none"
        >
          {/* An invisible disc so the thumb has a target far larger than the
              drawn handle — 17px of visible circle is not a touch target. */}
          <circle cx={handle.point.x} cy={handle.point.y} r="26" fill="transparent" />
          <circle
            cx={handle.point.x}
            cy={handle.point.y}
            r={HANDLE_RADIUS}
            className={`fill-anker-surface ${
              dragging === handle.id ? 'stroke-anker-accent' : 'stroke-anker-muted'
            }`}
            strokeWidth={dragging === handle.id ? 3 : 2}
          />
          <text
            x={handle.point.x}
            y={handle.point.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="pointer-events-none text-[15px]"
          >
            {handle.glyph}
          </text>
        </g>
      ))}
    </svg>
  )
}
