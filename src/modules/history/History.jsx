import { useState } from 'react'
import Screen from '../../components/Screen.jsx'
import { getAllCheckins } from '../../lib/storage.js'
import { getRegionLabel, MOOD_SCALE } from '../../lib/regions.js'
import { formatDateKeyNL } from '../../lib/date.js'
import { calculateStreak, daysInWindow, longestStreak } from '../../lib/streak.js'

export default function History() {
  const [checkins] = useState(() => getAllCheckins())
  const dateKeys = Object.keys(checkins).sort().reverse()
  const streak = calculateStreak(dateKeys)
  const last30 = daysInWindow(dateKeys, 30)
  const best = longestStreak(dateKeys)

  if (dateKeys.length === 0) {
    return (
      <Screen title="Historie">
        Nog geen check-ins. Zodra je er een paar hebt, zie je hier je reeks en
        wat er per dag speelde.
      </Screen>
    )
  }

  return (
    <>
      <Screen title="Je reeks">
        {/* The 30-day count comes FIRST and is the bigger number on purpose.
            A streak resetting to zero after one missed day tells you the
            fortnight before the gap no longer counts, and that is where
            people stop. This one barely moves, and it is the truth about
            what you actually did. */}
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold text-anker-done">{last30}</span>
          <span className="text-anker-text">van je laatste 30 dagen</span>
        </div>

        <dl className="mt-4 space-y-1">
          <div className="flex justify-between">
            <dt>Nu op rij</dt>
            <dd className="text-anker-text">
              {streak} {streak === 1 ? 'dag' : 'dagen'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Langste reeks ooit</dt>
            <dd className="text-anker-text">
              {best} {best === 1 ? 'dag' : 'dagen'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Totaal</dt>
            <dd className="text-anker-text">
              {dateKeys.length} check-in{dateKeys.length === 1 ? '' : 's'}
            </dd>
          </div>
        </dl>
      </Screen>

      <Screen title="Per dag">
        <ul className="space-y-3">
          {dateKeys.map((dateKey) => (
            <DayCard key={dateKey} dateKey={dateKey} entry={checkins[dateKey]} />
          ))}
        </ul>
      </Screen>
    </>
  )
}

function DayCard({ dateKey, entry }) {
  const mood = MOOD_SCALE.find((m) => m.value === entry.mental)
  const worst = entry.body.reduce(
    (max, b) => Math.max(max, b.pain, b.tension),
    0,
  )

  return (
    <li className="rounded-xl border border-anker-border bg-anker-bg p-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl leading-none">{mood?.emoji ?? '—'}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-anker-text">{formatDateKeyNL(dateKey)}</p>
          <p className="text-xs text-anker-muted">
            {entry.body.length === 0
              ? 'niets genoteerd'
              : `${entry.body.length} plek${entry.body.length === 1 ? '' : 'ken'} · ergste ${worst}/5`}
          </p>
        </div>
      </div>

      {entry.body.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {entry.body.map((b) => (
            <li
              key={b.region}
              className="rounded-full border border-anker-border px-2.5 py-0.5 text-xs text-anker-muted"
            >
              {getRegionLabel(b.region)} · p{b.pain} s{b.tension}
            </li>
          ))}
        </ul>
      )}

      {entry.note && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-anker-muted">
          {entry.note}
        </p>
      )}

      {entry.evening && (
        <p className="mt-2 text-xs text-anker-muted">
          Avond: {MOOD_SCALE.find((m) => m.value === entry.evening.mental)?.emoji ?? '—'}
          {entry.evening.intention &&
            ` · intentie ${
              { done: 'gelukt', partly: 'deels', missed: 'niet gelukt' }[
                entry.evening.intention
              ]
            }`}
        </p>
      )}
    </li>
  )
}
