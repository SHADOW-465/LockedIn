'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

const PUBLIC_PATHS = ['/login', '/signup']
/** Wait this long after a known user becomes null before forcing /login. */
const LOGOUT_DEBOUNCE_MS = 1500

/**
 * Sole client-side auth gate (root layout).
 * After first auth settle, never blank the whole tree on pathname changes —
 * that was a major cause of "slow page switches".
 *
 * Logout redirects are debounced when a session was previously known, so a
 * brief user=null flicker (network blip / token refresh) does not kick the user.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const everReady = useRef(false)
  const hadUser = useRef(false)
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!loading) everReady.current = true
  if (user) hadUser.current = true

  useEffect(() => {
    if (loading) return

    const isPublic = PUBLIC_PATHS.includes(pathname)

    const clearLogoutTimer = () => {
      if (logoutTimer.current) {
        clearTimeout(logoutTimer.current)
        logoutTimer.current = null
      }
    }

    if (pathname === '/') {
      clearLogoutTimer()
      if (user) {
        router.replace(profile?.onboarding_completed ? '/home' : '/onboarding')
      }
      return
    }

    if (!user && !isPublic) {
      // First visit with no session: redirect immediately
      if (!hadUser.current) {
        router.replace('/login')
        return
      }
      // Known session went null: debounce to avoid false logouts
      if (!logoutTimer.current) {
        logoutTimer.current = setTimeout(() => {
          logoutTimer.current = null
          router.replace('/login')
        }, LOGOUT_DEBOUNCE_MS)
      }
      return
    }

    clearLogoutTimer()

    if (user && isPublic) {
      router.replace(profile?.onboarding_completed ? '/home' : '/onboarding')
      return
    }

    if (user && profile && !profile.onboarding_completed && pathname !== '/onboarding') {
      router.replace('/onboarding')
    }
  }, [user, profile, loading, pathname, router])

  useEffect(() => {
    return () => {
      if (logoutTimer.current) clearTimeout(logoutTimer.current)
    }
  }, [])

  // Only full-screen gate on the *first* auth bootstrap — never on route changes
  if (loading && !everReady.current) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-on-surface">
        <p className="font-label-caps text-sm tracking-wide text-on-surface-variant">
          Authenticating…
        </p>
      </div>
    )
  }

  return <>{children}</>
}
