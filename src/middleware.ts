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

    const { data: { user } } = await supabase.auth.getUser()
    const pathname = request.nextUrl.pathname

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
        // Redirect away from login/signup
        if (pathname === '/login' || pathname === '/signup') {
            // Check if onboarding is done to decide where to send them
            const { data: profile } = await supabase
                .from('profiles')
                .select('onboarding_completed')
                .eq('id', user.id)
                .single()

            if (profile?.onboarding_completed) {
                return NextResponse.redirect(new URL('/home', request.url))
            } else {
                return NextResponse.redirect(new URL('/onboarding/welcome', request.url))
            }
        }

        // On dashboard routes, check if onboarding is completed
        if (isDashboardRoute) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('onboarding_completed')
                .eq('id', user.id)
                .single()

            if (!profile?.onboarding_completed) {
                return NextResponse.redirect(new URL('/onboarding/welcome', request.url))
            }
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
