import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Paths that never require authentication
// NOTE: '/' is intentionally excluded — the root page.tsx is a server component
// that performs its own SSR auth check and redirect.
const PUBLIC_PATHS = ['/login', '/signup', '/auth']
// API routes handle their own auth — skip onboarding redirect
const API_PREFIX = '/api/'

function isPublicPath(pathname: string): boolean {
    return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

/**
 * Creates a redirect response that forwards any updated session cookies
 * from `response` (which may have been written by supabase.auth.getUser()
 * during a token refresh) so the browser receives them even on redirects.
 */
function redirectWithCookies(url: URL, response: NextResponse): NextResponse {
    const redirect = NextResponse.redirect(url)
    response.cookies.getAll().forEach(({ name, value, ...options }) => {
        redirect.cookies.set(name, value, options)
    })
    return redirect
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Always pass through public paths and API routes
    if (isPublicPath(pathname) || pathname.startsWith(API_PREFIX)) {
        return NextResponse.next({ request: { headers: request.headers } })
    }

    // Create a mutable response to allow cookie updates
    let response = NextResponse.next({ request: { headers: request.headers } })

    // Root path: unauthenticated users see the landing page;
    // authenticated users are redirected below after the auth check.
    const isRootPath = pathname === '/'

    // SSR Supabase client — reads/writes session cookies
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value),
                    )
                    response = NextResponse.next({ request: { headers: request.headers } })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options),
                    )
                },
            },
        },
    )

    // Validate JWT server-side — cannot be forged by client
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        // Unauthenticated on root → show landing page
        if (isRootPath) return response
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/login'
        return redirectWithCookies(loginUrl, response)
    }

    // Authenticated on root → redirect to dashboard immediately at the Edge
    if (isRootPath) {
        const cachedOnboardingForRoot = request.cookies.get('x-onboarding-done')?.value === '1'
        if (cachedOnboardingForRoot) {
            const homeUrl = request.nextUrl.clone()
            homeUrl.pathname = '/home'
            return redirectWithCookies(homeUrl, response)
        }
        const { data: rootProfile, error: rootProfileError } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single()

        // If the profile query failed, send to /home and let client-side RouteGuard handle it
        if (rootProfileError) {
            const homeUrl = request.nextUrl.clone()
            homeUrl.pathname = '/home'
            return redirectWithCookies(homeUrl, response)
        }

        const dest = rootProfile?.onboarding_completed ? '/home' : '/onboarding'
        const destUrl = request.nextUrl.clone()
        destUrl.pathname = dest
        return redirectWithCookies(destUrl, response)
    }

    const isOnboardingPath = pathname.startsWith('/onboarding')

    // Fast path: check cached onboarding cookie to skip DB round-trip
    const cachedOnboarding = request.cookies.get('x-onboarding-done')?.value === '1'

    let onboardingDone: boolean

    if (cachedOnboarding) {
        onboardingDone = true
    } else {
        // Check DB (RLS: user can read own profile via SSR session)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single()

        // If the query failed (RLS block, DB error, network issue in Edge Runtime),
        // skip onboarding enforcement and let the client-side RouteGuard handle it.
        if (profileError) {
            return response
        }

        onboardingDone = profile?.onboarding_completed === true

        // Cache for 24h so subsequent requests skip the DB call
        if (onboardingDone) {
            response.cookies.set('x-onboarding-done', '1', {
                maxAge: 60 * 60 * 24,
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
            })
        }
    }

    // Enforce onboarding flow
    if (!onboardingDone && !isOnboardingPath) {
        const onboardingUrl = request.nextUrl.clone()
        onboardingUrl.pathname = '/onboarding'
        return redirectWithCookies(onboardingUrl, response)
    }

    if (onboardingDone && isOnboardingPath) {
        const homeUrl = request.nextUrl.clone()
        homeUrl.pathname = '/home'
        return redirectWithCookies(homeUrl, response)
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
}
