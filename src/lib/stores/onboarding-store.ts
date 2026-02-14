import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OnboardingState {
    step: number
    tier: string | null
    aiPersonality: string | null
    hardLimits: string[]
    softLimits: string[]
    fetishTags: { tag: string; intensity: number }[]
    physicalDetails: {
        penisSize: {
            flaccidLength: number
            flaccidGirth: number
            erectLength: number
            erectGirth: number
            growerOrShower: 'grower' | 'shower'
        }
        bodyType: string
        age: number
        orientation: string
        gender: string
    } | null
    profileAnswers: Record<string, string>
    lockGoal: number
    notificationFreq: string

    setStep: (step: number) => void
    setTier: (tier: string) => void
    setPersonality: (personality: string) => void
    setHardLimits: (limits: string[]) => void
    setSoftLimits: (limits: string[]) => void
    setFetishTags: (tags: { tag: string; intensity: number }[]) => void
    setPhysicalDetails: (details: OnboardingState['physicalDetails']) => void
    addProfileAnswer: (question: string, answer: string) => void
    setLockGoal: (hours: number) => void
    setNotificationFreq: (freq: string) => void
    reset: () => void
}

const initialState = {
    step: 0,
    tier: null,
    aiPersonality: null,
    hardLimits: [],
    softLimits: [],
    fetishTags: [],
    physicalDetails: null,
    profileAnswers: {},
    lockGoal: 168, // 7 days default
    notificationFreq: 'medium',
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
            setFetishTags: (fetishTags) => set({ fetishTags }),
            setPhysicalDetails: (physicalDetails) => set({ physicalDetails }),
            addProfileAnswer: (question, answer) =>
                set((state) => ({
                    profileAnswers: { ...state.profileAnswers, [question]: answer },
                })),
            setLockGoal: (lockGoal) => set({ lockGoal }),
            setNotificationFreq: (notificationFreq) => set({ notificationFreq }),
            reset: () => set(initialState),
        }),
        {
            name: 'onboarding-storage',
        }
    )
)
