'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase/client'
import { UserProfile } from '@/lib/supabase/schema'

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
    refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    // Stable client reference
    const supabase = getSupabase()

    const fetchProfile = useCallback(async (userId: string, userEmail?: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error && (error.code === 'PGRST116' || error.message.includes('No rows found'))) {
                // Profile missing, create stub
                console.log('Profile missing, creating stub for', userId)
                const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert({
                        id: userId,
                        email: userEmail || 'unknown@lockedin.app',
                        onboarding_completed: false,
                        onboarding_step: 0,
                        tier: 'Newbie'
                    })
                    .select()
                    .single()

                if (createError) {
                    console.error('Error creating stub profile:', createError)
                    return null
                }
                return newProfile as UserProfile
            }

            if (error) {
                console.error('Error fetching profile:', error)
                return null
            }

            return data as UserProfile
        } catch (err) {
            console.error('Unexpected error in fetchProfile:', err)
            return null
        }
    }, [supabase])

    const refreshProfile = useCallback(async () => {
        // Get current user from state or session?
        // State might be stale if called from outside?
        // Better to rely on supabase session for refresh
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        const p = await fetchProfile(session.user.id, session.user.email)
        setProfile(p)
    }, [supabase, fetchProfile])

    useEffect(() => {
        let mounted = true

        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()

                if (mounted) {
                    if (session?.user) {
                        setUser(session.user)
                        const p = await fetchProfile(session.user.id, session.user.email)
                        if (mounted) setProfile(p)
                    } else {
                        setUser(null)
                        setProfile(null)
                    }
                }
            } catch (err) {
                console.error('Session init error:', err)
            } finally {
                if (mounted) setLoading(false)
            }
        }

        initSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session: Session | null) => {
                // console.log('Auth state change:', event)

                if (mounted) {
                    setUser(session?.user ?? null)

                    if (session?.user) {
                         // Only fetch profile if not redundant?
                         // But for safety, always fetch on auth change (login, token refresh)
                         // to ensure profile is in sync.
                         // But skip if INITIAL_SESSION as we handled it in initSession?
                         // Actually onAuthStateChange fires INITIAL_SESSION too.
                         // So we might double fetch.
                         // But `initSession` is async and runs concurrently with `onAuthStateChange`.
                         // `onAuthStateChange` might fire first or last.
                         // To avoid race, maybe we should rely ONLY on `onAuthStateChange`?
                         // But `initSession` is needed to handle the "already logged in" state before the listener attaches?
                         // Usually `getSession` is faster than waiting for event?
                         // Let's keep both but maybe throttle?
                         // It's okay to double fetch, Supabase is fast.

                         const p = await fetchProfile(session.user.id, session.user.email)
                         if (mounted) setProfile(p)
                    } else {
                        setProfile(null)
                    }

                    setLoading(false)
                }
            }
        )

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [supabase, fetchProfile])

    return (
        <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
