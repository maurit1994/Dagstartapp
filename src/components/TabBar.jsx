/**
 * Bottom tab bar. Deliberately "dumb": it owns no state, it only draws the
 * tabs it is handed and reports back which one was tapped. App.jsx owns the
 * actual selection. Keeping display and state apart is what makes this
 * component reusable.
 *
 * Props:
 *   tabs      - array of { id, label, icon }
 *   activeTab - id of the currently selected tab
 *   onSelect  - called with a tab id when the user taps a tab
 */
export default function TabBar({ tabs, activeTab, onSelect }) {
  return (
    <nav
      // pb-[env(safe-area-inset-bottom)] keeps the buttons clear of the iPhone
      // home indicator once the app runs full-screen from the home screen.
      className="sticky bottom-0 border-t border-anker-border bg-anker-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      aria-label="Hoofdnavigatie"
    >
      <ul className="mx-auto flex max-w-md">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <li key={tab.id} className="flex-1">
              <button
                type="button"
                onClick={() => onSelect(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                // min-h-16 keeps the touch target comfortably above the ~44px
                // minimum Apple recommends — this app is used one-handed.
                className={`flex min-h-16 w-full flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-anker-accent'
                    : 'text-anker-muted hover:text-anker-text'
                }`}
              >
                <span aria-hidden="true" className="text-xl leading-none">
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
