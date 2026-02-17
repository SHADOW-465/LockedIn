'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
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
            const { data } = await supabase.auth.getSession()
            const currentUser = data.session?.user ?? null
            setUser(currentUser)
            if (currentUser) {
                await fetchProfile(currentUser.id)
            }
            setLoading(false)
        }

        initSession()

        // Listen for auth state changes
        const { data: listener } = supabase.auth.onAuthStateChange(
            async (_event: string, session: { user: User } | null) => {
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
