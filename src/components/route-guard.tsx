'use client'

export function RouteGuard({ children }: { children: React.ReactNode }) {
    // Pass through, no checks
    return <>{children}</>
}
