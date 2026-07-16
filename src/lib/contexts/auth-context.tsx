'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
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

/** True when the error means "no valid session" — safe to treat as logged out. */
function isDefinitiveAuthFailure(error: AuthError | null | undefined): boolean {
    if (!error) return false
    if (error.name === 'AuthSessionMissingError') return true
    // Invalid/revoked refresh token, user deleted, etc.
    if (error.name === 'AuthApiError') {
        const status = (error as AuthError & { status?: number }).status
        if (status === 400 || status === 401 || status === 403) return true
        const msg = (error.message || '').toLowerCase()
        if (
            msg.includes('invalid refresh token') ||
            msg.includes('refresh token not found') ||
            msg.includes('user not found') ||
            msg.includes('session not found') ||
            msg.includes('jwt expired')
        ) {
            return true
        }
    }
    return false
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    // Track whether the initial session check has completed so that the
    // onAuthStateChange listener never races against initSession to set loading=false.
    const sessionInitialized = useRef(false)
    // Keep last known good user so transient network failures don't log people out.
    const userRef = useRef<User | null>(null)

    const setUserSafe = useCallback((next: User | null) => {
        userRef.current = next
        setUser(next)
    }, [])

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
            // Don't wipe profile on transient DB errors if we already have one for this user
            setProfile((prev) => (prev?.id === userId ? prev : null))
        }
    }, [])

    const refreshProfile = useCallback(async () => {
        if (userRef.current) {
            await fetchProfile(userRef.current.id)
        }
    }, [fetchProfile])

    useEffect(() => {
        const supabase = getSupabase()

        // ── STEP 1: Restore session on mount ───────────────────────────────────
        // Prefer getSession() for a fast optimistic restore (local cookies/storage),
        // then validate with getUser(). Never clear a known session on network blips.
        const initSession = async () => {
            try {
                if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
                    console.error('[Auth] Supabase env vars missing. Auth initialization skipped.')
                    return
                }

                // Optimistic: restore from local session without network
                const { data: sessionData } = await supabase.auth.getSession()
                const localUser = sessionData.session?.user ?? null
                if (localUser) {
                    setUserSafe(localUser)
                    // Fire-and-forget profile load so UI is not stuck
                    void fetchProfile(localUser.id)
                }

                // Validate / refresh with the auth server
                const { data, error } = await supabase.auth.getUser()

                if (error) {
                    if (isDefinitiveAuthFailure(error)) {
                        console.error('[Auth] getUser auth error (invalid/expired session):', error.message)
                        setUserSafe(null)
                        setProfile(null)
                        return
                    }
                    // Network / 5xx / timeout: keep local session if we have one
                    console.warn(
                        '[Auth] getUser failed (transient) — keeping local session if any:',
                        error.name,
                        error.message,
                    )
                    if (!localUser) {
                        setUserSafe(null)
                        setProfile(null)
                    }
                    return
                }

                const currentUser = data.user ?? null
                setUserSafe(currentUser)
                if (currentUser) {
                    await fetchProfile(currentUser.id)
                } else {
                    setProfile(null)
                }
            } catch (err) {
                console.error('[Auth] initSession unexpected error:', err)
                // Don't force logout if we already restored a local user
                if (!userRef.current) {
                    setUserSafe(null)
                    setProfile(null)
                }
            } finally {
                sessionInitialized.current = true
                setLoading(false)
            }
        }

        initSession()

        // Safety timeout: only end the loading spinner — never wipe an existing user.
        // Wiping on timeout was a major cause of random "logged out" on slow mobile networks.
        const timeoutId = setTimeout(() => {
            if (!sessionInitialized.current) {
                console.warn('[Auth] initSession timed out after 12s. Ending loading without clearing session.')
                sessionInitialized.current = true
                setLoading(false)
            }
        }, 12000)

        // ── STEP 2: React to future auth events ────────────────────────────────
        const { data: listener } = supabase.auth.onAuthStateChange(
            async (event: string, session: Session | null) => {
                if (event === 'SIGNED_OUT') {
                    resetSupabase()
                    setUserSafe(null)
                    setProfile(null)
                    if (sessionInitialized.current) {
                        setLoading(false)
                    }
                    return
                }

                // INITIAL_SESSION fires synchronously on mount; initSession owns that path.
                if (event === 'INITIAL_SESSION') return

                // TOKEN_REFRESHED / SIGNED_IN / USER_UPDATED:
                // Only update user when we actually have a session. A null session on
                // non-SIGNED_OUT events is usually a race — do not log the user out.
                if (!session?.user) {
                    console.warn('[Auth] onAuthStateChange', event, 'with null session — ignoring')
                    return
                }

                setUserSafe(session.user)

                try {
                    await Promise.race([
                        fetchProfile(session.user.id),
                        new Promise<void>(resolve => setTimeout(resolve, 5000)),
                    ])
                } catch (err) {
                    console.error('[Auth] onAuthStateChange fetchProfile error:', err)
                }

                if (sessionInitialized.current) {
                    setLoading(false)
                }
            },
        )

        // ── STEP 3: Soft re-validate when tab becomes visible (PWA / mobile) ────
        // Never log out on transient failures here.
        const onVisibility = () => {
            if (document.visibilityState !== 'visible') return
            if (!sessionInitialized.current) return
            void (async () => {
                try {
                    const { data, error } = await getSupabase().auth.getUser()
                    if (error) {
                        if (isDefinitiveAuthFailure(error)) {
                            console.error('[Auth] visibility revalidate: session invalid', error.message)
                            setUserSafe(null)
                            setProfile(null)
                        } else {
                            console.warn('[Auth] visibility revalidate transient error:', error.message)
                        }
                        return
                    }
                    if (data.user) {
                        setUserSafe(data.user)
                    }
                } catch (err) {
                    console.warn('[Auth] visibility revalidate failed:', err)
                }
            })()
        }
        document.addEventListener('visibilitychange', onVisibility)

        return () => {
            clearTimeout(timeoutId)
            listener.subscription.unsubscribe()
            document.removeEventListener('visibilitychange', onVisibility)
        }
    }, [fetchProfile, setUserSafe])

    return (
        <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
