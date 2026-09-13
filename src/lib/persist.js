/**
 * Persistent-storage handling for iOS.
 *
 * Safari evicts a site's script-created data (localStorage included) after
 * roughly 7 days without interaction. Asking for persistent storage requests
 * an exemption. It is a request, not a guarantee — which is exactly why the
 * JSON export in backup.js is the real safety net, not this.
 */

/** Ask the browser to exempt our data from automatic cleanup. Safe to call often. */
export async function requestPersistentStorage() {
  if (!navigator.storage?.persist) return { supported: false, persisted: false }
  try {
    if (await navigator.storage.persisted?.()) {
      return { supported: true, persisted: true }
    }
    return { supported: true, persisted: await navigator.storage.persist() }
  } catch (err) {
    console.error('[persist] request failed', err)
    return { supported: true, persisted: false }
  }
}

/** Whether persistent storage is currently granted, without asking again. */
export async function getPersistedStatus() {
  if (!navigator.storage?.persisted) return { supported: false, persisted: false }
  try {
    return { supported: true, persisted: await navigator.storage.persisted() }
  } catch {
    return { supported: true, persisted: false }
  }
}

/** True when running from the iPhone home screen rather than a Safari tab. */
export function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

/** Rough guess at whether this is an iOS device, for tailoring instructions. */
export function isIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}
