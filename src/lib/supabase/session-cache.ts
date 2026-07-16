import type { Session } from './schema'

/**
 * Short-lived client cache for live session lookups.
 * Nav between pages was re-querying Supabase every mount (~200–800ms each).
 * TTL keeps data fresh enough while making shell switches feel instant.
 */
const TTL_MS = 12_000

type Entry = {
  session: Session | null
  expires: number
}

const liveByUser = new Map<string, Entry>()
const activeByUser = new Map<string, Entry>()

function getCached(map: Map<string, Entry>, userId: string): Session | null | undefined {
  const hit = map.get(userId)
  if (!hit) return undefined
  if (Date.now() > hit.expires) {
    map.delete(userId)
    return undefined
  }
  return hit.session
}

function setCached(map: Map<string, Entry>, userId: string, session: Session | null) {
  map.set(userId, { session, expires: Date.now() + TTL_MS })
}

export function getCachedLiveSession(userId: string): Session | null | undefined {
  return getCached(liveByUser, userId)
}

export function setCachedLiveSession(userId: string, session: Session | null) {
  setCached(liveByUser, userId, session)
  // Active is a subset — keep active cache coherent
  if (!session || session.status === 'active') {
    setCached(activeByUser, userId, session?.status === 'active' ? session : null)
  }
}

export function getCachedActiveSession(userId: string): Session | null | undefined {
  return getCached(activeByUser, userId)
}

export function setCachedActiveSession(userId: string, session: Session | null) {
  setCached(activeByUser, userId, session)
  if (session) setCached(liveByUser, userId, session)
}

/** Call after start / emergency / complete so UI doesn't show stale lock. */
export function invalidateSessionCache(userId?: string) {
  if (userId) {
    liveByUser.delete(userId)
    activeByUser.delete(userId)
    return
  }
  liveByUser.clear()
  activeByUser.clear()
}
