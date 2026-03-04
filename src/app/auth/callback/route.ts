import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const rawNext = searchParams.get('next') ?? '/home'
    // Validate next is a relative path to prevent open redirect
    const next = rawNext.startsWith('/') ? rawNext : '/home'

    if (code) {
        // IMPORTANT: Must use createServerClient (not createBrowserClient) here.
        // Route handlers run server-side — there is no `document.cookie`. Using
        // createBrowserClient would return an empty getAll() and throw on setAll(),
        // causing exchangeCodeForSession to fail silently and never persist the
        // OAuth session.
        //
        // createServerClient reads the PKCE code verifier from request cookies
        // (written by the browser before the OAuth redirect) and writes the new
        // session tokens to the response cookies so the browser receives them.
        const response = NextResponse.redirect(`${origin}${next}`)

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
                            response.cookies.set(name, value, options)
                        })
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return response
        }

        console.error('[Auth Callback] exchangeCodeForSession error:', error.message)
    }

    // Return to login on error
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
