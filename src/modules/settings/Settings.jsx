import { useEffect, useRef, useState } from 'react'
import Screen from '../../components/Screen.jsx'
import Button from '../../components/Button.jsx'
import {
  downloadBackup,
  daysSinceLastExport,
  restoreFromFile,
} from '../../lib/backup.js'
import {
  getPersistedStatus,
  isIOS,
  isStandalone,
  requestPersistentStorage,
} from '../../lib/persist.js'
import { exportAll, isStorageAvailable } from '../../lib/storage.js'

/**
 * Backup, restore, and an honest readout of how safe the data currently is.
 * Deliberately blunt: the user should be able to see at a glance whether the
 * three iOS data-safety rules are actually being met.
 */
export default function Settings({ onDataChanged }) {
  const [status, setStatus] = useState({ supported: false, persisted: false })
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const fileInput = useRef(null)

  useEffect(() => {
    getPersistedStatus().then(setStatus)
  }, [])

  const data = exportAll()
  const checkinCount = Object.keys(data.checkins).length
  const thoughtCount = data.thoughts.length
  const sinceExport = daysSinceLastExport()

  async function handleExport() {
    setError(null)
    setMessage(null)
    try {
      const how = await downloadBackup()
      setMessage(
        how === 'shared'
          ? 'Gedeeld. Kies "Bewaar in Bestanden" en zet hem in iCloud Drive.'
          : 'Backup gedownload. Zet hem in iCloud Drive.',
      )
    } catch (err) {
      if (err?.name === 'AbortError') return
      setError(err.message ?? 'Exporteren mislukt.')
    }
  }

  async function handleRestore(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError(null)
    setMessage(null)
    try {
      const result = await restoreFromFile(file, 'merge')
      setMessage(
        `Hersteld: ${result.checkinsAdded} check-in(s) en ${result.thoughtsAdded} gedachte(n) toegevoegd.`,
      )
      onDataChanged?.()
    } catch (err) {
      setError(err.message ?? 'Herstellen mislukt.')
    }
  }

  async function handlePersist() {
    const next = await requestPersistentStorage()
    setStatus(next)
    setMessage(
      next.persisted
        ? 'Permanente opslag toegekend.'
        : 'De browser heeft permanente opslag niet toegekend. Je export blijft dus je echte vangnet.',
    )
  }

  return (
    <>
      <Screen title="Backup">
        <p>
          {checkinCount} check-in{checkinCount === 1 ? '' : 's'} en {thoughtCount}{' '}
          gedachte{thoughtCount === 1 ? '' : 'n'} op dit apparaat.
        </p>
        <p className="mt-1">
          {sinceExport === null
            ? 'Nog nooit geëxporteerd.'
            : sinceExport === 0
              ? 'Vandaag geëxporteerd.'
              : `${sinceExport} dag${sinceExport === 1 ? '' : 'en'} geleden geëxporteerd.`}
        </p>

        <Button className="mt-4 w-full" onClick={handleExport}>
          Exporteer nu
        </Button>

        <Button
          variant="secondary"
          className="mt-2 w-full"
          onClick={() => fileInput.current?.click()}
        >
          Herstel uit backup
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          onChange={handleRestore}
          className="hidden"
        />
        <p className="mt-2 text-xs">
          Herstellen voegt toe en overschrijft nooit een nieuwere check-in van
          dezelfde dag.
        </p>

        {message && (
          <p className="mt-3 rounded-lg border border-anker-accent/40 bg-anker-accent/10 p-3 text-sm text-anker-text">
            {message}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200"
          >
            {error}
          </p>
        )}
      </Screen>

      <Screen title="Hoe veilig staat je data nu?">
        <ul className="space-y-2">
          <SafetyRow
            ok={isStorageAvailable()}
            label="Opslag werkt in deze browser"
          />
          <SafetyRow
            ok={status.persisted}
            label="Permanente opslag toegekend"
            hint={
              status.supported
                ? undefined
                : 'Deze browser ondersteunt dit niet.'
            }
          />
          <SafetyRow
            ok={isStandalone()}
            label="Geopend vanaf je beginscherm"
            hint={
              isStandalone()
                ? undefined
                : isIOS()
                  ? 'Open in Safari → Deel-knop → "Zet op beginscherm".'
                  : 'Installeer de app via het menu van je browser.'
            }
          />
          <SafetyRow
            ok={sinceExport !== null && sinceExport < 7}
            label="Recent geëxporteerd (< 7 dagen)"
          />
        </ul>

        {status.supported && !status.persisted && (
          <Button variant="secondary" className="mt-4 w-full" onClick={handlePersist}>
            Vraag permanente opslag aan
          </Button>
        )}
      </Screen>
    </>
  )
}

function SafetyRow({ ok, label, hint }) {
  return (
    <li className="flex gap-2">
      <span aria-hidden="true">{ok ? '✅' : '⚠️'}</span>
      <span>
        <span className={ok ? 'text-anker-text' : 'text-anker-text'}>{label}</span>
        {hint && <span className="block text-xs text-anker-muted">{hint}</span>}
      </span>
    </li>
  )
}
