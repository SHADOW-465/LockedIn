import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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
    
    // Safety: Clear cookies if auth error is critical (e.g. user deleted)
    if (authError && authError.message !== 'Auth session missing!') {
        console.error('Auth error in middleware:', authError)
        // Only clear if 401/403 or explicit not found
        if (authError.status === 401 || authError.status === 403 || 
            authError.message?.includes('not found') || 
            authError.message?.includes('invalid')) {
            const cookies = request.cookies.getAll()
            const redirect = NextResponse.redirect(new URL('/login', request.url))
            cookies.forEach((cookie) => {
                if (cookie.name.includes('sb-')) {
                    redirect.cookies.delete(cookie.name)
                }
            })
            return redirect
        }
    }

    const pathname = request.nextUrl.pathname
    const isPublicRoute = ['/', '/login', '/signup', '/auth/callback'].includes(pathname) || pathname.startsWith('/api/')
    const isOnboardingRoute = pathname.startsWith('/onboarding')

    // 1. Unauthenticated
    if (!user) {
        if (!isPublicRoute) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        // Allow public routes
        return response
    }

    // 2. Authenticated
    if (user) {
        // Fetch profile to check onboarding status
        // We select only the necessary field to minimize data transfer
        const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single()

        const isOnboarded = profile?.onboarding_completed ?? false

        // Case A: User NOT onboarded
        if (!isOnboarded) {
            // Allow access to onboarding routes
            if (isOnboardingRoute) {
                return response
            }
            // Redirect EVERYTHING else (including /login, /signup, /, /home) to onboarding
            // We redirect to /onboarding/welcome as the starting point
            return NextResponse.redirect(new URL('/onboarding/welcome', request.url))
        }

        // Case B: User IS onboarded
        if (isOnboarded) {
            // Prevent access to onboarding routes
            if (isOnboardingRoute) {
                return NextResponse.redirect(new URL('/home', request.url))
            }
            // Prevent access to public auth routes (login/signup) -> redirect to home
            if (['/login', '/signup', '/'].includes(pathname)) {
                return NextResponse.redirect(new URL('/home', request.url))
            }
            // Allow access to dashboard/protected routes
            return response
        }
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
