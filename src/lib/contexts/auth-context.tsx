'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase/client'
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

        // Get the initial session
        const initSession = async () => {
            try {
                // Check if Supabase client is initialized (env vars check)
                if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
                    console.error('Supabase env vars missing. Auth initialization skipped.')
                    setLoading(false)
                    return
                }

                const { data, error } = await supabase.auth.getSession()
                if (error) throw error

                const currentUser = data.session?.user ?? null
                setUser(currentUser)
                if (currentUser) {
                    await fetchProfile(currentUser.id)
                }
            } catch (err) {
                console.error('Auth initialization error:', err)
            } finally {
                setLoading(false)
            }
        }

        initSession()

        // Safety timeout: stop loading after 3s even if Supabase hangs
        const timeoutId = setTimeout(() => {
            setLoading(prev => {
                if (prev) {
                    console.warn('Auth initialization timed out. Forcing loading=false.')
                    return false
                }
                return prev
            })
        }, 3000)

        // Listen for auth state changes
        const { data: listener } = supabase.auth.onAuthStateChange(
            async (_event: string, session: Session | null) => {
                const currentUser = session?.user ?? null
                setUser(currentUser)

                if (currentUser) {
                    await fetchProfile(currentUser.id)
                } else {
                    setProfile(null)
                }
                setLoading(false)
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
