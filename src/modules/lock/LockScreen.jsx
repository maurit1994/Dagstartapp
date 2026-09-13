import { useState } from 'react'
import Button from '../../components/Button.jsx'
import { verifyPin } from '../../lib/lock.js'

/** Shown instead of the app while a PIN is set and not yet entered. */
export default function LockScreen({ lock, onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(null)
  const [checking, setChecking] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setChecking(true)
    const okay = await verifyPin(pin, lock)
    setChecking(false)
    if (okay) {
      onUnlock()
    } else {
      setError('Onjuiste pincode.')
      setPin('')
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-xs text-center">
        <h1 className="text-2xl font-semibold text-anker-text">Anker</h1>
        <p className="mt-1 text-sm text-anker-muted">Voer je pincode in</p>

        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, '').slice(0, 8))
            setError(null)
          }}
          aria-label="Pincode"
          className="mt-6 min-h-14 w-full rounded-xl border border-anker-border bg-anker-surface text-center text-2xl tracking-[0.4em] text-anker-text focus:border-anker-accent focus:outline-none"
        />

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <Button type="submit" className="mt-4 w-full" disabled={pin.length < 4 || checking}>
          {checking ? 'Controleren…' : 'Ontgrendel'}
        </Button>
      </form>
    </div>
  )
}
