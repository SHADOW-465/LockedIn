'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

const PUBLIC_PATHS = ['/', '/login', '/signup']

export function RouteGuard({ children }: { children: React.ReactNode }) {
    const { user, profile, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (loading) return

        const isPublic = PUBLIC_PATHS.includes(pathname)

        if (!user && !isPublic) {
            // Not logged in, trying to access protected route
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
    }, [user, profile, loading, pathname, router])

    // Show nothing while loading auth state
    if (loading) {
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
