import { useEffect, useState } from 'react'
import TabBar from './components/TabBar.jsx'
import BackupNag from './components/BackupNag.jsx'
import Intention from './modules/adhd/Intention.jsx'
import Checkin from './modules/checkin/Checkin.jsx'
import Thoughts from './modules/thoughts/Thoughts.jsx'
import History from './modules/history/History.jsx'
import Settings from './modules/settings/Settings.jsx'
import { requestPersistentStorage } from './lib/persist.js'
import { shouldRemindToExport } from './lib/backup.js'

// The app shell's three tabs. `id` drives which module renders below;
// `label` and `icon` are what the user sees (UI language: Dutch).
const TABS = [
  { id: 'vandaag', label: 'Vandaag', icon: '☀️' },
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

  // Ask iOS to exempt our data from the 7-day cleanup. Fire-and-forget: the
  // answer only affects what the settings screen reports.
  useEffect(() => {
    requestPersistentStorage()
  }, [])

  function refresh() {
    setDataVersion((v) => v + 1)
    setShowNag(shouldRemindToExport())
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
              <div key={dataVersion} className="space-y-4">
                <Intention />
                <Checkin onSaved={refresh} />
              </div>
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
