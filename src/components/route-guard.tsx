'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

// Routes that can be accessed without an authenticated session.
// NOTE: "/" is intentionally NOT public — the middleware SSR redirect and this
// guard both redirect authenticated users away from "/", and unauthenticated
// users away from protected paths. Listing "/" here would cause authenticated
// users to see the landing page if the SW/network ever delivers the root HTML
// instead of the server's 302 redirect to /home.
const PUBLIC_PATHS = ['/login', '/signup']

export function RouteGuard({ children }: { children: React.ReactNode }) {
    const { user, profile, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    // When a user IS authenticated but their profile hasn't loaded yet,
    // we must not redirect or render — we wait for the profile.
    // This prevents a brief user!==null + profile===null state from causing
    // wrong onboarding redirects or missing-data renders.
    const [profileSettled, setProfileSettled] = useState(false)

    useEffect(() => {
        // Profile is "settled" once loading is done.
        // Once settled stays settled (no flicker on re-renders).
        if (!loading) {
            setProfileSettled(true)
        }
    }, [loading])

    useEffect(() => {
        // Don't make any routing decisions until both auth and profile are settled.
        if (loading || !profileSettled) return

        const isPublic = PUBLIC_PATHS.includes(pathname)

        // ── Case 1: Root path ("/") ──────────────────────────────────────────
        // The manifest start_url is now "/home", but the user may still land on "/"
        // (e.g. typing the URL, old bookmark, SW cache race). Redirect explicitly
        // rather than falling through to the unauthenticated / protected logic.
        if (pathname === '/') {
            if (user) {
                // Authenticated → send to dashboard or onboarding
                router.replace(profile?.onboarding_completed ? '/home' : '/onboarding')
            } else {
                // Unauthenticated → send to login (landing page is handled by
                // the server component, but this is the client-side safety net)
                router.replace('/login')
            }
            return
        }

        // ── Case 2: Unauthenticated on a protected route ────────────────────
        if (!user && !isPublic) {
            router.replace('/login')
            return
        }

        // ── Case 3: Authenticated on an auth-only page ──────────────────────
        if (user && isPublic) {
            router.replace(profile?.onboarding_completed ? '/home' : '/onboarding')
            return
        }

        // ── Case 4: Authenticated but hasn't finished onboarding ────────────
        if (user && profile && !profile.onboarding_completed && pathname !== '/onboarding') {
            router.replace('/onboarding')
            return
        }
    }, [user, profile, loading, profileSettled, pathname, router])

    // Show loading spinner while auth state or profile is being resolved
    if (loading || (user && !profileSettled)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-primary">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-red-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-text-tertiary text-sm font-mono">Loading...</span>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
