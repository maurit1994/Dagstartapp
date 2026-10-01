import { useEffect, useState } from 'react'
import TabBar from './components/TabBar.jsx'
import DaySwitcher from './components/DaySwitcher.jsx'
import BackupNag from './components/BackupNag.jsx'
import Intention from './modules/adhd/Intention.jsx'
import Checkin from './modules/checkin/Checkin.jsx'
import EveningCheckin, { EVENING_HOUR } from './modules/checkin/EveningCheckin.jsx'
import BodyCard from './modules/checkin/BodyCard.jsx'
import Extras from './modules/checkin/Extras.jsx'
import Thoughts from './modules/thoughts/Thoughts.jsx'
import History from './modules/history/History.jsx'
import Movement from './modules/movement/Movement.jsx'
import Load from './modules/load/Load.jsx'
import ReviewCue from './modules/load/ReviewCue.jsx'
import LookbackCard from './modules/checkin/LookbackCard.jsx'
import Settings from './modules/settings/Settings.jsx'
import LockScreen from './modules/lock/LockScreen.jsx'
import { requestPersistentStorage } from './lib/persist.js'
import { shouldRemindToExport } from './lib/backup.js'
import { isDagstartDone } from './lib/dagstart.js'
import { vandaagOrder } from './lib/vandaag.js'
import { getDateKeyDaysAgo, getLocalDateKey } from './lib/date.js'
import { getCheckin, getMeta } from './lib/storage.js'

// The app shell's tabs. `id` drives which module renders below; `label` and
// `icon` are what the user sees (UI language: Dutch). Five is the ceiling at
// 390px — a sixth would put the labels below a readable size.
const TABS = [
  { id: 'vandaag', label: 'Vandaag', icon: '☀️' },
  { id: 'vooruit', label: 'Vooruit', icon: '🧭' },
  { id: 'beweging', label: 'Beweging', icon: '🏃' },
  { id: 'gedachten', label: 'Gedachten', icon: '💭' },
  { id: 'historie', label: 'Historie', icon: '📈' },
]

/**
 * App is the only file that knows about every module. It holds which tab is
 * open, and a `dataVersion` counter it bumps after any write — changing that
 * number remounts the tab content, so every screen re-reads storage instead
 * of showing a stale copy.
 */
export default function App() {
  const [activeTab, setActiveTab] = useState('vandaag')
  const [showSettings, setShowSettings] = useState(false)
  const [dataVersion, setDataVersion] = useState(0)
  const [showNag, setShowNag] = useState(() => shouldRemindToExport())
  const [viewDay, setViewDay] = useState('today')
  // Which of the last seven days the Beweging tab is logging into, as an
  // offset rather than a date key: kept up here so saving — which bumps
  // dataVersion and remounts the tab — does not snap you back to today
  // halfway through filling in Saturday. An offset also survives midnight,
  // where a stored key would quietly point at the wrong day.
  const [movementDay, setMovementDay] = useState(0)
  // Locked only for this page load. There is no session token: closing the app
  // and reopening asks again, which is the whole point of a courtesy lock.
  const [lock, setLock] = useState(() => getMeta().lock ?? null)
  const [isUnlocked, setIsUnlocked] = useState(() => !getMeta().lock)

  // Ask iOS to exempt our data from the 7-day cleanup. Fire-and-forget: the
  // answer only affects what the settings screen reports.
  useEffect(() => {
    requestPersistentStorage()
  }, [])

  function refresh() {
    setDataVersion((v) => v + 1)
    setShowNag(shouldRemindToExport())
    setLock(getMeta().lock ?? null)
  }

  // The moment the chosen day is being viewed from. For a past day that
  // moment is its END — otherwise the evening card would judge yesterday by
  // this morning's clock and stay shut on a day that is long over.
  const viewNow = (() => {
    if (viewDay === 'today') return new Date()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(23, 59, 0, 0)
    return yesterday
  })()
  const viewKey = getLocalDateKey(viewNow)
  const viewEntry = getCheckin(viewKey)
  const yesterdayEmpty = !isDagstartDone(getCheckin(getDateKeyDaysAgo(1)))

  if (lock && !isUnlocked) {
    return <LockScreen lock={lock} onUnlock={() => setIsUnlocked(true)} />
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-anker-border px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-anker-text">
              Anker
            </h1>
            <p className="text-xs text-anker-muted">Je dagelijkse houvast</p>
          </div>
          <button
            type="button"
            onClick={() => setShowSettings((open) => !open)}
            aria-label={showSettings ? 'Sluit instellingen' : 'Open instellingen'}
            aria-pressed={showSettings}
            className={`flex size-11 items-center justify-center rounded-xl border text-lg transition ${
              showSettings
                ? 'border-anker-accent text-anker-accent'
                : 'border-anker-border text-anker-muted'
            }`}
          >
            {showSettings ? '✕' : '⚙'}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 space-y-4 px-5 py-5">
        {showSettings ? (
          // Deliberately NOT keyed on dataVersion: refresh() bumps that after
          // an import, and remounting Settings would wipe the "restored N
          // entries" confirmation the user needs to see. Settings re-reads
          // storage on every render anyway.
          <Settings onDataChanged={refresh} />
        ) : (
          <>
            {showNag && (
              <BackupNag
                onOpenSettings={() => setShowSettings(true)}
                onDismiss={() => setShowNag(false)}
              />
            )}

            {activeTab === 'vandaag' && (
              <div key={`${dataVersion}-${viewDay}`} className="space-y-4">
                {/* Pinned: the day you are writing into, and the priority that
                    is meant to stay in front of you all day. Everything below
                    them reorders; these two never move, or the screen would
                    have no fixed point at all. */}
                <DaySwitcher
                  value={viewDay}
                  onChange={setViewDay}
                  dateKey={viewKey}
                  hint={
                    viewDay === 'today' && yesterdayEmpty
                      ? 'gisteren is leeg gebleven'
                      : undefined
                  }
                />
                <Intention now={viewNow} />
                {/* Whatever the day is asking of you floats to the top, the
                    record of the day sits under it, and the optional tools
                    sink. lib/vandaag.js decides; this only maps ids to cards.
                    The keys are stable so React MOVES a card rather than
                    remounting it — a remount here would throw away an open
                    body-map draft mid-edit. */}
                {vandaagOrder({
                  morningDone: isDagstartDone(viewEntry),
                  eveningSaved: (viewEntry?.evening ?? null) !== null,
                  isEvening: viewNow.getHours() >= EVENING_HOUR,
                }).map((id) => (
                  <VandaagCard
                    key={id}
                    id={id}
                    now={viewNow}
                    viewKey={viewKey}
                    viewDay={viewDay}
                    morningDone={isDagstartDone(viewEntry)}
                    onSaved={refresh}
                    onOpenVooruit={() => setActiveTab('vooruit')}
                  />
                ))}
              </div>
            )}
            {activeTab === 'vooruit' && <Load key={dataVersion} onSaved={refresh} />}
            {activeTab === 'beweging' && (
              <Movement
                key={`${dataVersion}-${movementDay}`}
                dayOffset={movementDay}
                onSelectDay={setMovementDay}
                onSaved={refresh}
              />
            )}
            {activeTab === 'gedachten' && <Thoughts key={dataVersion} />}
            {activeTab === 'historie' && <History key={dataVersion} />}
          </>
        )}
      </main>

      {!showSettings && (
        <TabBar tabs={TABS} activeTab={activeTab} onSelect={setActiveTab} />
      )}
    </div>
  )
}

/**
 * One Vandaag card, picked by id.
 *
 * Only a lookup: which cards exist and in what order is lib/vandaag.js's
 * decision, and each card still decides for itself whether it has anything to
 * show (LookbackCard and ReviewCue return null on their own).
 */
function VandaagCard({ id, now, viewKey, viewDay, morningDone, onSaved, onOpenVooruit }) {
  switch (id) {
    case 'checkin':
      return (
        <Checkin
          now={now}
          label={viewDay === 'today' ? 'Dagstart' : 'Dagstart gisteren'}
          onSaved={onSaved}
        />
      )
    case 'lookback':
      // The payoff FOR the morning, so it only appears once there is one.
      return morningDone ? <LookbackCard now={now} dateKey={viewKey} /> : null
    case 'evening':
      return <EveningCheckin now={now} onSaved={onSaved} />
    case 'body':
      // Decoupled from the Dagstart on purpose: scanning yourself for pain is
      // a poor way to open a day. Available all day, asked for by nobody.
      return <BodyCard now={now} onSaved={onSaved} />
    case 'review':
      // Sunday only, and only on today — a cue about the week ahead makes no
      // sense while you are editing yesterday.
      return viewDay === 'today' ? <ReviewCue now={now} onOpen={onOpenVooruit} /> : null
    case 'extras':
      // Only once the flow is behind you: the optional extras must never
      // compete with the routine.
      return morningDone ? <Extras now={now} onSaved={onSaved} /> : null
    default:
      return null
  }
}
