'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { getSupabase, resetSupabase } from '@/lib/supabase/client'
import type { UserProfile } from '@/lib/supabase/schema'

interface AuthContextType {
    user: User | null
    profile: UserProfile | null
    loading: boolean
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    refreshProfile: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    // Track whether the initial session check has completed so that the
    // onAuthStateChange listener never races against initSession to set loading=false.
    const sessionInitialized = useRef(false)

    const fetchProfile = useCallback(async (userId: string) => {
        const supabase = getSupabase()
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (!error && data) {
            setProfile(data as UserProfile)
        } else {
            if (error) console.error('[Auth] fetchProfile error:', error.message, error.code)
            setProfile(null)
        }
    }, [])

    const refreshProfile = useCallback(async () => {
        if (user) {
            await fetchProfile(user.id)
        }
    }, [user, fetchProfile])

    useEffect(() => {
        const supabase = getSupabase()

        // ── STEP 1: Restore session on mount ───────────────────────────────────
        // getSession() reads from localStorage (Supabase SSR stores tokens there).
        // If the access token is expired but a refresh token exists, Supabase
        // will automatically exchange it before returning — this is what restores
        // the session when the PWA is reopened after a long time.
        const initSession = async () => {
            try {
                if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
                    console.error('[Auth] Supabase env vars missing. Auth initialization skipped.')
                    return
                }

                const { data, error } = await supabase.auth.getSession()
                if (error) {
                    console.error('[Auth] getSession error:', error.message)
                    return
                }

                const currentUser = data.session?.user ?? null
                setUser(currentUser)
                if (currentUser) {
                    await fetchProfile(currentUser.id)
                }
            } catch (err) {
                console.error('[Auth] initSession error:', err)
            } finally {
                // setLoading(false) is called EXACTLY ONCE — here, after the full
                // init path (getSession + optional fetchProfile) is complete.
                // The onAuthStateChange listener MUST NOT call setLoading(false)
                // until after this point to avoid the race condition.
                sessionInitialized.current = true
                setLoading(false)
            }
        }

        initSession()

        // Safety timeout: if Supabase hangs for >5s (e.g. network offline on open),
        // force loading=false so the app isn't stuck on the spinner forever.
        // 5s is long enough to allow token refresh over a slow connection.
        const timeoutId = setTimeout(() => {
            if (!sessionInitialized.current) {
                console.warn('[Auth] initSession timed out after 5s. Forcing loading=false.')
                sessionInitialized.current = true
                setLoading(false)
            }
        }, 5000)

        // ── STEP 2: React to future auth events ────────────────────────────────
        // CRITICAL: Only update state here — never call setLoading(false) until
        // sessionInitialized is true, to prevent racing with initSession above.
        const { data: listener } = supabase.auth.onAuthStateChange(
            async (event: string, session: Session | null) => {
                if (event === 'SIGNED_OUT') {
                    resetSupabase()
                    setUser(null)
                    setProfile(null)
                    // setLoading only if we're past init (signed-out after init is fine)
                    if (sessionInitialized.current) {
                        setLoading(false)
                    }
                    return
                }

                // INITIAL_SESSION fires synchronously on mount. At this point
                // initSession() is already running; skip to avoid a double update.
                if (event === 'INITIAL_SESSION') return

                // TOKEN_REFRESHED / SIGNED_IN: update the user and re-fetch profile.
                const currentUser = session?.user ?? null
                setUser(currentUser)

                try {
                    if (currentUser) {
                        await Promise.race([
                            fetchProfile(currentUser.id),
                            new Promise<void>(resolve => setTimeout(resolve, 5000)),
                        ])
                    } else {
                        setProfile(null)
                    }
                } catch (err) {
                    console.error('[Auth] onAuthStateChange fetchProfile error:', err)
                }

                // Only update loading after initSession has completed, so we don't
                // accidentally clear the loading state before the initial profile fetch.
                if (sessionInitialized.current) {
                    setLoading(false)
                }
            }
        )

        return () => {
            clearTimeout(timeoutId)
            listener.subscription.unsubscribe()
        }
    }, [fetchProfile])

    return (
        <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
