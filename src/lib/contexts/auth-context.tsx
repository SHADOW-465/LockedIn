'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { UserProfile } from '@/lib/supabase/schema'

interface AuthContextType {
    user: User | null
    profile: UserProfile | null
    loading: boolean
    refreshProfile: () => Promise<void>
}

// Mock Data
const MOCK_USER: User = {
    id: '00000000-0000-0000-0000-000000000000',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString()
}

const MOCK_PROFILE: UserProfile = {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'demo@lockedin.app',
    username: 'Demo User',
    tier: 'Pro',
    ai_personality: 'Strict',
    hard_limits: [],
    soft_limits: [],
    interests: [],
    physical_details: {
        penisSize: {
            flaccidLength: 4,
            flaccidGirth: 4,
            erectLength: 6,
            erectGirth: 5,
            growerOrShower: 'grower',
        },
        bodyType: 'Athletic',
        orientation: 'Straight',
        genderIdentity: 'Male',
        notes: 'Ready to serve.',
    },
    preferred_regimens: [],
    notification_frequency: 'medium',
    initial_lock_goal_hours: 24,
    willpower_score: 80,
    compliance_streak: 5,
    total_sessions: 10,
    total_denial_hours: 100,
    total_edges: 50,
    subscription_tier: 'Pro',
    onboarding_completed: true,
    onboarding_step: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
}

const AuthContext = createContext<AuthContextType>({
    user: MOCK_USER,
    profile: MOCK_PROFILE,
    loading: false,
    refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    // Always return the mock user and profile
    const [user] = useState<User | null>(MOCK_USER)
    const [profile] = useState<UserProfile | null>(MOCK_PROFILE)
    const [loading] = useState(false)

    const refreshProfile = async () => {
        // No-op for mock
        console.log('Mock refresh profile')
    }

    return (
        <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
