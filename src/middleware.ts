import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Auth middleware — protects dashboard routes, enforces onboarding, and redirects appropriately.
 */
export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: { headers: request.headers },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                        response = NextResponse.next({
                            request: { headers: request.headers },
                        })
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const pathname = request.nextUrl.pathname
    
    // --- Zombie Loop Fix: Only clear session on specific auth errors (user deleted/invalid), not "no session" ---
    if (authError && authError.message !== 'Auth session missing!') {
        console.error('Auth error in middleware:', authError)
        // Only clear cookies if it's a real auth error (not just missing session)
        if (authError.status === 401 || authError.status === 403 || 
            authError.message?.includes('not found') || 
            authError.message?.includes('invalid')) {
            const cookies = request.cookies.getAll()
            const response = NextResponse.redirect(new URL('/login', request.url))
            cookies.forEach((cookie) => {
                if (cookie.name.includes('sb-')) {
                    response.cookies.delete(cookie.name)
                }
            })
            return response
        }
    }
    // "No session" is normal - continue with user = null

    // Public routes that don't need auth
    const publicRoutes = ['/', '/login', '/signup', '/auth/callback']
    const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/api/')

    // Onboarding routes (need auth but not onboarding completion)
    const isOnboardingRoute = pathname.startsWith('/onboarding')

    // All protected dashboard routes
    const isDashboardRoute =
        pathname.startsWith('/home') ||
        pathname.startsWith('/tasks') ||
        pathname.startsWith('/chat') ||
        pathname.startsWith('/calendar') ||
        pathname.startsWith('/settings') ||
        pathname.startsWith('/journal') ||
        pathname.startsWith('/achievements') ||
        pathname.startsWith('/regimens') ||
        pathname.startsWith('/feedback')

    // --- No user: protect dashboard and onboarding ---
    if (!user && (isDashboardRoute || isOnboardingRoute)) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // --- Authenticated user ---
    if (user) {
        // Redirect away from login/signup to home (user can complete onboarding later in settings)
        if (pathname === '/login' || pathname === '/signup') {
            return NextResponse.redirect(new URL('/home', request.url))
        }

        // On dashboard routes, allow access even if onboarding is incomplete
        // User can complete onboarding later in settings
        if (isDashboardRoute) {
            // Allow access - no mandatory redirect to onboarding
            // Profile data will be fetched client-side as needed
        }

        // On onboarding routes, if already completed, redirect to home
        if (isOnboardingRoute) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('onboarding_completed')
                .eq('id', user.id)
                .single()

            if (profile?.onboarding_completed) {
                return NextResponse.redirect(new URL('/home', request.url))
            }
        }
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
