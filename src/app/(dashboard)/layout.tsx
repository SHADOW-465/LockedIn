'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

/**
 * Dashboard layout — client-side auth guard.
 * Shows loading spinner while auth initializes, redirects to /login if no user.
 */
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login')
        }
    }, [loading, user, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-primary">
                <div className="text-center space-y-4">
                    <Loader2 size={32} className="animate-spin text-purple-primary mx-auto" />
                    <p className="text-text-tertiary text-sm">Loading...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return null // Will redirect via useEffect
    }

    return <>{children}</>
}
