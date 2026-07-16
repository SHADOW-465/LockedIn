'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

const PUBLIC_PATHS = ['/login', '/signup']

/**
 * Sole client-side auth gate (root layout).
 * After first auth settle, never blank the whole tree on pathname changes —
 * that was a major cause of "slow page switches".
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const everReady = useRef(false)

  if (!loading) everReady.current = true

  useEffect(() => {
    if (loading) return

    const isPublic = PUBLIC_PATHS.includes(pathname)

    if (pathname === '/') {
      if (user) {
        router.replace(profile?.onboarding_completed ? '/home' : '/onboarding')
      }
      return
    }

    if (!user && !isPublic) {
      router.replace('/login')
      return
    }

    if (user && isPublic) {
      router.replace(profile?.onboarding_completed ? '/home' : '/onboarding')
      return
    }

    if (user && profile && !profile.onboarding_completed && pathname !== '/onboarding') {
      router.replace('/onboarding')
    }
  }, [user, profile, loading, pathname, router])

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
