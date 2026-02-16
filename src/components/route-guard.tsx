'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { Loader2 } from 'lucide-react'

export function RouteGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const { user, profile, loading } = useAuth()

    useEffect(() => {
        if (loading) return // Wait for auth check

        const isPublicRoute = ['/', '/login', '/signup', '/auth/callback'].includes(pathname)
        const isOnboardingRoute = pathname.startsWith('/onboarding')

        // 1. Unauthenticated -> Redirect to login if accessing protected route
        if (!user) {
            if (!isPublicRoute) {
                router.replace('/login')
            }
            return
        }

        // 2. Authenticated
        if (user) {
            // If profile is missing (and loading is false), it might be an error state or stub creation failed.
            // But let's assume AuthContext handles stub creation and eventually returns a profile (or null if error).
            // If null, we might be in a bad state. But let's try to handle redirects based on what we know.

            // If profile is NOT loaded yet but loading is false? (Shouldn't happen with our AuthContext logic unless error)
            if (!profile) return

            // Not onboarded
            if (!profile.onboarding_completed) {
                // Allow onboarding routes
                if (isOnboardingRoute) return

                // Redirect everything else to onboarding
                router.replace('/onboarding/welcome')
            }
            // Onboarded
            else {
                // Disallow onboarding routes and public auth routes
                if (isOnboardingRoute || ['/login', '/signup', '/'].includes(pathname)) {
                    router.replace('/home')
                }
                // Allow everything else
            }
        }
    }, [user, profile, loading, pathname, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-primary">
                <Loader2 className="animate-spin text-purple-primary" size={48} />
            </div>
        )
    }

    return <>{children}</>
}
