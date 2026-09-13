import { useState } from 'react'
import TabBar from './components/TabBar.jsx'
import Intention from './modules/adhd/Intention.jsx'
import Checkin from './modules/checkin/Checkin.jsx'
import Thoughts from './modules/thoughts/Thoughts.jsx'
import History from './modules/history/History.jsx'

// The app shell's three tabs. `id` drives which module renders below;
// `label` and `icon` are what the user actually sees (UI language: Dutch).
const TABS = [
  { id: 'vandaag', label: 'Vandaag', icon: '☀️' },
  { id: 'gedachten', label: 'Gedachten', icon: '💭' },
  { id: 'historie', label: 'Historie', icon: '📈' },
]

/**
 * App is the only file that knows about every module. It holds one piece of
 * state — which tab is open — and wires the right module into view. Modules
 * stay unaware of each other; all coupling lives here, on purpose.
 */
export default function App() {
  // useState gives a component a value that survives re-renders, plus a
  // setter that tells React to redraw when the value changes.
  const [activeTab, setActiveTab] = useState('vandaag')

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-anker-border px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="mx-auto max-w-md">
          <h1 className="text-xl font-semibold tracking-tight text-anker-text">
            Anker
          </h1>
          <p className="text-xs text-anker-muted">
            Je dagelijkse houvast
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 space-y-4 px-5 py-5">
        {activeTab === 'vandaag' && (
          <>
            <Intention />
            <Checkin />
          </>
        )}
        {activeTab === 'gedachten' && <Thoughts />}
        {activeTab === 'historie' && <History />}
      </main>

      <TabBar tabs={TABS} activeTab={activeTab} onSelect={setActiveTab} />
    </div>
  )
}
