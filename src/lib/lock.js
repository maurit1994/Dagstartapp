/**
 * The in-app PIN — a courtesy lock, and nothing more.
 *
 * BE HONEST ABOUT WHAT THIS IS. It stops someone holding your unlocked phone
 * from reading your entries by tapping the icon. It is NOT encryption: the
 * data sits in localStorage in plain text, and anyone who knows to open the
 * browser's developer tools can read it without ever seeing this screen.
 *
 * What the hashing below buys is narrow but real: the PIN itself is not
 * sitting in localStorage in readable form, so a shoulder-surfer or a casual
 * poke around storage does not learn a number you may well have reused
 * elsewhere. It does not make the DATA any safer.
 *
 * Anything stronger means deriving a key from a passphrase and encrypting the
 * entries themselves — a different feature, with a real cost: forget the
 * passphrase and the data is gone for good.
 */

const ITERATIONS = 100_000

function bufferToHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function randomSaltHex() {
  return bufferToHex(crypto.getRandomValues(new Uint8Array(16)))
}

/**
 * Derive a hash from a PIN and salt.
 *
 * PBKDF2 with a high iteration count, not a bare SHA-256: a 4-digit PIN has
 * only 10,000 possible values, so a plain hash is trivially reversed by
 * trying them all. This makes each guess cost real work.
 */
async function derive(pin, saltHex) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(String(pin)),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(saltHex),
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    256,
  )
  return bufferToHex(bits)
}

/** Build the stored lock record for a new PIN. */
export async function createLock(pin) {
  const salt = randomSaltHex()
  return { salt, hash: await derive(pin, salt), createdAt: Date.now() }
}

/** Whether a PIN matches a stored lock record. */
export async function verifyPin(pin, lock) {
  if (!lock?.salt || !lock?.hash) return false
  const candidate = await derive(pin, lock.salt)
  // Both values are derived from the same PBKDF2 call, so they are always the
  // same length; a constant-time compare avoids leaking how much matched.
  return timingSafeEqual(candidate, lock.hash)
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** PIN rules: 4 to 8 digits. Returns an error message, or null when valid. */
export function validatePin(pin) {
  if (!/^\d{4,8}$/.test(String(pin))) return 'Kies 4 tot 8 cijfers.'
  if (/^(\d)\1+$/.test(String(pin))) return 'Niet alle cijfers hetzelfde.'
  return null
}
