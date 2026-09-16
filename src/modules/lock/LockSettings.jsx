import { useState } from 'react'
import Screen from '../../components/Screen.jsx'
import Button from '../../components/Button.jsx'
import { createLock, validatePin, verifyPin } from '../../lib/lock.js'
import { getMeta, setMeta } from '../../lib/storage.js'

/** Turn the PIN on or off, and say plainly what it does and does not protect. */
export default function LockSettings({ onChanged }) {
  const [lock, setLock] = useState(() => getMeta().lock ?? null)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [currentPin, setCurrentPin] = useState('')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  async function handleEnable() {
    const invalid = validatePin(pin)
    if (invalid) return setError(invalid)
    if (pin !== confirmPin) return setError('De twee codes zijn niet gelijk.')

    try {
      const next = await createLock(pin)
      setMeta({ lock: next })
      setLock(next)
      setPin('')
      setConfirmPin('')
      setError(null)
      setMessage('Pincode ingesteld. Hij geldt vanaf de volgende keer openen.')
      onChanged?.()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDisable() {
    if (!(await verifyPin(currentPin, lock))) {
      return setError('Onjuiste pincode.')
    }
    setMeta({ lock: null })
    setLock(null)
    setCurrentPin('')
    setError(null)
    setMessage('Pincode uitgezet.')
    onChanged?.()
  }

  return (
    <Screen title="Pincode">
      <p>
        Een pincode houdt iemand die je ontgrendelde telefoon vastpakt uit je
        aantekeningen.
      </p>
      <p className="mt-2 rounded-lg border border-anker-border bg-anker-bg p-3 text-xs">
        <strong className="text-anker-text">Wees hier eerlijk over:</strong> dit is
        geen versleuteling. Je gegevens staan onversleuteld op dit apparaat, en wie
        de ontwikkelaarstools van een browser kent, leest ze zonder dit scherm ooit
        te zien. Het stopt nieuwsgierigheid, geen techneut.
      </p>

      {lock ? (
        <div className="mt-4">
          <p className="text-anker-text">Pincode staat aan.</p>
          <input
            type="password"
            inputMode="numeric"
            value={currentPin}
            onChange={(e) => {
              setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 8))
              setError(null)
            }}
            placeholder="Huidige pincode"
            aria-label="Huidige pincode"
            className="mt-3 min-h-12 w-full rounded-xl border border-anker-border bg-anker-bg px-3 text-base text-anker-text placeholder:text-anker-muted/60 focus:border-anker-accent focus:outline-none"
          />
          <Button
            variant="danger"
            className="mt-3 w-full"
            onClick={handleDisable}
            disabled={currentPin.length < 4}
          >
            Pincode uitzetten
          </Button>
        </div>
      ) : (
        <div className="mt-4">
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, '').slice(0, 8))
              setError(null)
            }}
            placeholder="Nieuwe pincode (4-8 cijfers)"
            aria-label="Nieuwe pincode"
            className="min-h-12 w-full rounded-xl border border-anker-border bg-anker-bg px-3 text-base text-anker-text placeholder:text-anker-muted/60 focus:border-anker-accent focus:outline-none"
          />
          <input
            type="password"
            inputMode="numeric"
            value={confirmPin}
            onChange={(e) => {
              setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 8))
              setError(null)
            }}
            placeholder="Nogmaals"
            aria-label="Pincode nogmaals"
            className="mt-2 min-h-12 w-full rounded-xl border border-anker-border bg-anker-bg px-3 text-base text-anker-text placeholder:text-anker-muted/60 focus:border-anker-accent focus:outline-none"
          />
          <Button
            className="mt-3 w-full"
            onClick={handleEnable}
            disabled={pin.length < 4 || confirmPin.length < 4}
          >
            Pincode instellen
          </Button>
          <p className="mt-2 text-xs">
            Vergeet je hem? Zet de app-gegevens niet zomaar weg — exporteer eerst
            je backup, die is niet met de pincode beveiligd.
          </p>
        </div>
      )}

      {message && (
        <p className="mt-3 rounded-lg border border-anker-accent/40 bg-anker-accent/10 p-3 text-sm text-anker-text">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      )}
    </Screen>
  )
}
