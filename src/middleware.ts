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
    
    // Safety: Clear cookies if auth error is critical
    if (authError && authError.message !== 'Auth session missing!') {
        if (authError.status === 401 || authError.status === 403 || 
            authError.message?.includes('not found') || 
            authError.message?.includes('invalid')) {
            const cookies = request.cookies.getAll()
            const redirect = NextResponse.redirect(new URL('/', request.url))
            cookies.forEach((cookie) => {
                if (cookie.name.includes('sb-')) {
                    redirect.cookies.delete(cookie.name)
                }
            })
            return redirect
        }
    }

    const pathname = request.nextUrl.pathname
    const isPublicRoute = ['/'].includes(pathname) || pathname.startsWith('/api/')

    // 1. Unauthenticated -> Redirect to Landing
    if (!user) {
        if (!isPublicRoute) {
            return NextResponse.redirect(new URL('/', request.url))
        }
        return response
    }

    // 2. Authenticated -> Allow Access
    // If on landing page, redirect to home
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/home', request.url))
    }

    // No more onboarding checks. Access is open.
    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
