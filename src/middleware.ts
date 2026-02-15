import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Auth middleware — protects dashboard routes and redirects appropriately.
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

    // Protected dashboard routes
    const dashboardRoutes = ['/home', '/tasks', '/chat', '/calendar', '/settings', '/journal']
    const isDashboardRoute = dashboardRoutes.some((r) => pathname.startsWith(r))
    const isOnboardingRoute = pathname.startsWith('/onboarding')

    if (!user && (isDashboardRoute || isOnboardingRoute)) {
        // Not logged in → redirect to login
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (user && (pathname === '/login' || pathname === '/signup')) {
        // Already logged in → redirect to dashboard
        return NextResponse.redirect(new URL('/home', request.url))
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
