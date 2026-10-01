import { useState } from 'react'
import Screen from '../../components/Screen.jsx'
import { getAllCheckins } from '../../lib/storage.js'
import { getRegionLabel, MOOD_SCALE } from '../../lib/regions.js'
import { formatDateKeyNL } from '../../lib/date.js'
import { calculateStreak, daysInWindow, longestStreak } from '../../lib/streak.js'
import { filledCount, recentSeries } from '../../lib/trends.js'
import { scaleColor, scaleFill } from '../../lib/scales.js'
import {
  ALL_QUESTION_IDS,
  FOCUS_SCALE,
  PRIORITY_OUTCOMES,
  QUESTIONS,
  REACTIVITY_SCALE,
  SLEEP_SCALE,
} from '../../lib/questions.js'
import { formatSleepDuration } from '../../lib/sleep.js'
import { PHYSIO_OUTCOMES, realSessions, sessionName } from '../../lib/movement.js'

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

      <FocusWeek checkins={checkins} />

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

const DAY_LETTERS = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']

/**
 * The last seven days of focus.
 *
 * Focus was WRITE-ONLY until this existed: you scored it every evening and
 * nothing in the app ever showed it to you. That is the sharpest version of
 * "I fill it in and nothing comes out".
 *
 * Raw values, no average and no trend line. Six points cannot support a claim
 * about a pattern, and a chart that implies one is a lie with axes on it.
 * These are your own numbers in order, which claims nothing.
 *
 * Colour comes from the VALUE via scales.js, like every other 1-5 scale —
 * never the accent, which marks what to do next and nothing else.
 */
function FocusWeek({ checkins }) {
  const series = recentSeries(checkins, (entry) => entry?.evening?.focus)
  const filled = filledCount(series)
  if (filled === 0) return null

  return (
    <Screen title="Focus" tone="quiet">
      <ol className="flex gap-1.5">
        {series.map(({ dateKey, value }) => {
          const [y, m, d] = dateKey.split('-').map(Number)
          const date = new Date(y, m - 1, d)
          return (
            <li key={dateKey} className="flex-1">
              <div
                aria-label={`${formatDateKeyNL(dateKey)}: ${
                  value === null ? 'niet ingevuld' : `focus ${value} van 5 — ${FOCUS_SCALE[value]}`
                }`}
                style={
                  value === null
                    ? undefined
                    : { borderColor: scaleColor(value, 'up'), background: scaleFill(value, 'up') }
                }
                className={`flex h-12 items-center justify-center rounded-lg border text-sm ${
                  value === null
                    ? 'border-dashed border-anker-border text-anker-muted/50'
                    : 'text-anker-text'
                }`}
              >
                {value ?? ''}
              </div>
              <p className="mt-1 text-center text-[10px] text-anker-muted">
                {DAY_LETTERS[date.getDay()]}
              </p>
            </li>
          )
        })}
      </ol>
      {/* A count, not a verdict — a missed evening is never coloured as one. */}
      <p className="mt-3 text-sm text-anker-muted">
        Ingevuld op {filled} van de laatste 7 dagen.
      </p>
    </Screen>
  )
}

/** One "label — value" row, skipped entirely when there is no value. */
function Row({ label, children }) {
  if (children === null || children === undefined || children === '') return null
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-anker-muted">{label}</dt>
      <dd className="text-right text-anker-text">{children}</dd>
    </div>
  )
}

/**
 * Everything recorded on one day, shown when you tap it.
 *
 * Rendered from ALL_QUESTION_IDS, never from today's rules: which questions
 * get asked depends on the mode and the weekday and those rules have already
 * changed twice. An answer given under an older rule must stay readable here,
 * or the record would quietly shrink every time the app changes its mind.
 *
 * Every block is skipped when it holds nothing, so a day where you only
 * tapped a face shows one line rather than a page of dashes.
 */
function DayDetail({ entry }) {
  const answered = ALL_QUESTION_IDS.filter((id) => entry.answers?.[id])
  const sleep = entry.sleep
  const evening = entry.evening
  const sessions = realSessions(entry.movement)
  const physio = PHYSIO_OUTCOMES.find((o) => o.value === entry.movement?.physio)
  const outcome = PRIORITY_OUTCOMES.find((o) => o.value === evening?.intention)
  const duration = sleep ? formatSleepDuration(sleep.bedtijd, sleep.wakkertijd) : null

  return (
    <div className="mt-3 space-y-4 border-t border-anker-border pt-3 text-sm">
      {answered.length > 0 && (
        <dl className="space-y-2">
          {answered.map((id) => (
            <div key={id}>
              <dt className="text-xs uppercase tracking-wide text-anker-muted">
                {QUESTIONS[id]?.q ?? id}
              </dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-anker-text">
                {entry.answers[id]}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {(sleep || entry.eerste) && (
        <dl className="space-y-1">
          <Row label="Slaap">{sleep?.subjectief ? SLEEP_SCALE[sleep.subjectief] : null}</Row>
          <Row label="In bed">
            {sleep?.bedtijd && sleep?.wakkertijd
              ? `${sleep.bedtijd} – ${sleep.wakkertijd}${duration ? ` (${duration})` : ''}`
              : null}
          </Row>
          <Row label="Body Battery">{sleep?.garmin?.bodyBattery ?? null}</Row>
          <Row label="Slaapscore">{sleep?.garmin?.slaapscore ?? null}</Row>
          <Row label="HRV">{sleep?.garmin?.hrvStatus ?? null}</Row>
          <Row label="Eerste ding">{entry.eerste}</Row>
        </dl>
      )}

      {(sessions.length > 0 || physio) && (
        <dl className="space-y-1">
          <Row label="Sport">
            {sessions.length > 0
              ? sessions
                  .map((x) => [sessionName(x), x.duration, x.intensity].filter(Boolean).join(', '))
                  .join(' · ')
              : null}
          </Row>
          <Row label="Fysio">{physio ? physio.label : null}</Row>
          <Row label="Voor je fysio">{entry.movement?.physioNote || null}</Row>
        </dl>
      )}

      {evening && (
        <dl className="space-y-1">
          <Row label="Focus">{evening.focus ? FOCUS_SCALE[evening.focus] : null}</Row>
          <Row label="Prioriteit">{outcome ? `${outcome.emoji} ${outcome.label}` : null}</Row>
          <Row label="Reactiviteit">
            {evening.reactief ? REACTIVITY_SCALE[evening.reactief] : null}
          </Row>
          <Row label="Cafeïne na 14:00">
            {evening.cafeine === null || evening.cafeine === undefined
              ? null
              : evening.cafeine
                ? 'Ja'
                : 'Nee'}
          </Row>
          <Row label="Einde van de dag">
            {MOOD_SCALE.find((m) => m.value === evening.mental)?.label ?? null}
          </Row>
        </dl>
      )}

      {evening?.note && (
        <p className="whitespace-pre-wrap text-anker-text">{evening.note}</p>
      )}
    </div>
  )
}

function DayCard({ dateKey, entry }) {
  const [isOpen, setIsOpen] = useState(false)
  const mood = MOOD_SCALE.find((m) => m.value === entry.mental)
  const worst = entry.body.reduce(
    (max, b) => Math.max(max, b.pain, b.tension),
    0,
  )

  return (
    <li className="rounded-xl border border-anker-border bg-anker-bg p-3">
      {/* The whole header is the control: a day row is a big target on a
          phone, and a separate chevron would be a 20px one. */}
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label={`${formatDateKeyNL(dateKey)} ${isOpen ? 'dichtklappen' : 'openklappen'}`}
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="text-2xl leading-none">{mood?.emoji ?? '—'}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-anker-text">{formatDateKeyNL(dateKey)}</p>
          <p className="text-xs text-anker-muted">
            {entry.body.length === 0
              ? 'niets genoteerd'
              : `${entry.body.length} plek${entry.body.length === 1 ? '' : 'ken'} · ergste ${worst}/5`}
          </p>
        </div>
        <span aria-hidden="true" className="shrink-0 text-anker-muted">
          {isOpen ? '▴' : '▾'}
        </span>
      </button>

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

      {!isOpen && entry.evening && (
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

      {isOpen && <DayDetail entry={entry} />}
    </li>
  )
}
