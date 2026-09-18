import Screen from '../../components/Screen.jsx'
import MovementLog from './MovementLog.jsx'
import { NO_SPORT, PHYSIO_OUTCOMES, realSessions, topTypes, weekStats } from '../../lib/movement.js'
import { getAllCheckins } from '../../lib/storage.js'
import { getLocalDateKey } from '../../lib/date.js'

const DAY_LETTERS = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']

/**
 * The Beweging tab: log a session, then see the week.
 *
 * The week overview is the reason to keep logging at all — without it this is
 * data entry with no return. It is also the thing a physio actually asks for.
 */
export default function Movement({ onSaved, now = new Date() }) {
  const checkins = getAllCheckins()
  const today = getLocalDateKey(now)
  const stats = weekStats(checkins, 7, today)

  return (
    <>
      <MovementLog onSaved={onSaved} now={now} />
      <WeekOverview checkins={checkins} stats={stats} />
      <PhysioNotes checkins={checkins} stats={stats} />
    </>
  )
}

function WeekOverview({ checkins, stats }) {
  const types = topTypes(stats)

  return (
    <Screen title="Deze week">
      {/* Oldest on the left, so the row reads the way a week does. */}
      <ol className="flex gap-1.5">
        {[...stats.keys].reverse().map((key) => {
          const movement = checkins[key]?.movement
          const sessions = realSessions(movement)
          const rested = movement?.sports?.some((s) => s.type === NO_SPORT)
          const [y, m, d] = key.split('-').map(Number)
          const date = new Date(y, m - 1, d)

          const state = sessions.length > 0 ? 'sport' : rested ? 'rest' : 'unknown'
          const label =
            state === 'sport'
              ? `${sessions.length} sessie${sessions.length === 1 ? '' : 's'}`
              : state === 'rest'
                ? 'rustdag'
                : 'niets ingevuld'

          return (
            <li key={key} className="flex-1">
              <div
                title={label}
                aria-label={`${DAY_LETTERS[date.getDay()]} ${d}: ${label}`}
                className={`flex h-12 items-center justify-center rounded-lg border text-sm ${
                  state === 'sport'
                    ? 'border-anker-done bg-anker-done/25 text-anker-text'
                    : state === 'rest'
                      ? 'border-anker-border bg-anker-raised text-anker-muted'
                      : 'border-dashed border-anker-border text-anker-muted/50'
                }`}
              >
                {state === 'sport' ? sessions.length : state === 'rest' ? '–' : ''}
              </div>
              <p className="mt-1 text-center text-[10px] text-anker-muted">
                {DAY_LETTERS[date.getDay()]}
              </p>
            </li>
          )
        })}
      </ol>

      <dl className="mt-4 space-y-1">
        <div className="flex justify-between">
          <dt>Dagen gesport</dt>
          <dd className="text-anker-text">{stats.sportDays} van 7</dd>
        </div>
        <div className="flex justify-between">
          <dt>Sessies</dt>
          <dd className="text-anker-text">{stats.sessions}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Fysio gedaan</dt>
          <dd className="text-anker-text">
            {stats.physioDone}
            {stats.physioPartly > 0 && ` (+${stats.physioPartly} deels)`}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Dagen ingevuld</dt>
          <dd className="text-anker-text">{stats.loggedDays} van 7</dd>
        </div>
      </dl>

      {types.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5 border-t border-anker-border pt-3">
          {types.map(([type, count]) => (
            <li
              key={type}
              className="rounded-full border border-anker-border px-2.5 py-0.5 text-xs text-anker-muted"
            >
              {type} ×{count}
            </li>
          ))}
        </ul>
      )}
    </Screen>
  )
}

/**
 * Physio notes from the week, in one place.
 *
 * Written on the day something felt off, read out loud at an appointment two
 * weeks later — which is exactly when nobody can remember them.
 */
function PhysioNotes({ checkins, stats }) {
  const notes = stats.keys
    .map((key) => ({ key, note: checkins[key]?.movement?.physioNote }))
    .filter((row) => row.note)

  if (notes.length === 0) return null

  return (
    <Screen title="Voor je fysio" tone="quiet">
      <ul className="space-y-2">
        {notes.map(({ key, note }) => {
          const [, , d] = key.split('-').map(Number)
          const [y, m] = key.split('-').map(Number)
          const date = new Date(y, m - 1, d)
          return (
            <li key={key}>
              <span className="text-xs text-anker-muted">
                {DAY_LETTERS[date.getDay()]} {d}
              </span>
              <p className="whitespace-pre-wrap text-anker-text">{note}</p>
            </li>
          )
        })}
      </ul>
    </Screen>
  )
}

export { PHYSIO_OUTCOMES }
