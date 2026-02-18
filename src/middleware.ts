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
        return NextResponse.redirect(loginUrl)
    }

    // Authenticated on root → redirect to dashboard immediately at the Edge
    if (isRootPath) {
        const cachedOnboardingForRoot = request.cookies.get('x-onboarding-done')?.value === '1'
        if (cachedOnboardingForRoot) {
            const homeUrl = request.nextUrl.clone()
            homeUrl.pathname = '/home'
            return NextResponse.redirect(homeUrl)
        }
        const { data: rootProfile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single()
        const dest = rootProfile?.onboarding_completed ? '/home' : '/onboarding'
        const destUrl = request.nextUrl.clone()
        destUrl.pathname = dest
        return NextResponse.redirect(destUrl)
    }

    const isOnboardingPath = pathname.startsWith('/onboarding')

    // Fast path: check cached onboarding cookie to skip DB round-trip
    const cachedOnboarding = request.cookies.get('x-onboarding-done')?.value === '1'

    let onboardingDone: boolean

    if (cachedOnboarding) {
        onboardingDone = true
    } else {
        // Check DB (RLS: user can read own profile via SSR session)
        const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single()

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
        return NextResponse.redirect(onboardingUrl)
    }

    if (onboardingDone && isOnboardingPath) {
        const homeUrl = request.nextUrl.clone()
        homeUrl.pathname = '/home'
        return NextResponse.redirect(homeUrl)
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
}
