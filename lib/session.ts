const SESSION_KEY = 'k19_user'
const TTL_MS = 180 * 24 * 60 * 60 * 1000 // 180 days

export type K19Session = {
  id: string
  phone: string
  name: string
  email: string
  birthday: string
  expiresAt: string
}

// Write session with a fresh 180-day sliding expiry.
export function setSession(fields: Omit<K19Session, 'expiresAt'>): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      ...fields,
      expiresAt: new Date(Date.now() + TTL_MS).toISOString(),
    }))
  } catch { /* ignore */ }
}

// Read session. Returns null if missing or expired; refreshes expiry on every valid read.
export function getSession(): K19Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as K19Session
    if (data.expiresAt && Date.now() > new Date(data.expiresAt).getTime()) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    // Sliding window — reset to 180 days from now on every page visit.
    const refreshed = { ...data, expiresAt: new Date(Date.now() + TTL_MS).toISOString() }
    localStorage.setItem(SESSION_KEY, JSON.stringify(refreshed))
    return refreshed
  } catch {
    return null
  }
}
