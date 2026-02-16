import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PhysicalDetails {
    penisSize?: {
        flaccidLength?: number
        flaccidGirth?: number
        erectLength?: number
        erectGirth?: number
        growerOrShower?: 'grower' | 'shower'
    }
    bodyType?: string
    orientation?: string
    genderIdentity?: string
    age?: number
    notes?: string
}

interface OnboardingState {
    step: number
    tier: string | null
    aiPersonality: string | null
    hardLimits: string[]
    softLimits: string[]
    interests: string[]
    physicalDetails: PhysicalDetails | null
    preferredRegimens: string[]
    profileAnswers: Record<string, string>
    initialLockGoalHours: number
    notificationFrequency: 'low' | 'medium' | 'high' | 'extreme'

    setStep: (step: number) => void
    setTier: (tier: string) => void
    setPersonality: (personality: string) => void
    setHardLimits: (limits: string[]) => void
    setSoftLimits: (limits: string[]) => void
    setInterests: (interests: string[]) => void
    setPhysicalDetails: (details: PhysicalDetails) => void
    setPreferredRegimens: (regimens: string[]) => void
    addProfileAnswer: (question: string, answer: string) => void
    setInitialLockGoalHours: (hours: number) => void
    setNotificationFrequency: (freq: 'low' | 'medium' | 'high' | 'extreme') => void
    reset: () => void
}

const initialState = {
    step: 0,
    tier: null,
    aiPersonality: null,
    hardLimits: [],
    softLimits: [],
    interests: [],
    physicalDetails: null,
    preferredRegimens: [],
    profileAnswers: {},
    initialLockGoalHours: 168, // 7 days default
    notificationFrequency: 'medium' as const,
}

export const useOnboarding = create<OnboardingState>()(
    persist(
        (set) => ({
            ...initialState,

            setStep: (step) => set({ step }),
            setTier: (tier) => set({ tier }),
            setPersonality: (aiPersonality) => set({ aiPersonality }),
            setHardLimits: (hardLimits) => set({ hardLimits }),
            setSoftLimits: (softLimits) => set({ softLimits }),
            setInterests: (interests) => set({ interests }),
            setPhysicalDetails: (physicalDetails) => set({ physicalDetails }),
            setPreferredRegimens: (preferredRegimens) => set({ preferredRegimens }),
            addProfileAnswer: (question, answer) =>
                set((state) => ({
                    profileAnswers: { ...state.profileAnswers, [question]: answer },
                })),
            setInitialLockGoalHours: (initialLockGoalHours) => set({ initialLockGoalHours }),
            setNotificationFrequency: (notificationFrequency) => set({ notificationFrequency }),
            reset: () => set(initialState),
        }),
        {
            name: 'onboarding-storage',
        }
    )
)
