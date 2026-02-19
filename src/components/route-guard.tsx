'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const PUBLIC_PATHS = ['/', '/login', '/signup']

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

        if (!user && !isPublic) {
            // Confirmed: no session, trying to access a protected route → /login
            router.replace('/login')
            return
        }

        if (user && (pathname === '/login' || pathname === '/signup')) {
            // Already logged in, redirect away from auth pages
            if (!profile?.onboarding_completed) {
                router.replace('/onboarding')
            } else {
                router.replace('/home')
            }
            return
        }

        if (user && profile && !profile.onboarding_completed && pathname !== '/onboarding' && !isPublic) {
            // Logged in but hasn't finished onboarding
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
