import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Types ───────────────────────────────────────────────────

export interface PhysicalDetails {
    penisSize?: {
        flaccidLength?: number
        flaccidGirth?: number
        erectLength?: number
        erectGirth?: number
        growerOrShower?: 'grower' | 'shower'
        sizeBucket?: string
    }
    bodyType?: string
    orientation?: string
    genderIdentity?: string
    age?: number
}

export interface TrainingRegimen {
    id: string
    name: string
    isPrimary: boolean
}

// Tiers per PRD §2
export const TIERS = ['Newbie', 'Slave', 'Hardcore', 'Extreme', 'Total Destruction'] as const
export type Tier = (typeof TIERS)[number]

// AI Personas per PRD §4.4
export const PERSONAS = [
    'Cruel Mistress',
    'Clinical Sadist',
    'Playful Tease',
    'Strict Master',
    'Humiliation Expert',
    'Goddess',
    'Dommy Mommy',
    'Bratty Keyholder',
    'Psychological Manipulator',
    'Extreme Sadist',
] as const
export type Persona = (typeof PERSONAS)[number]

// Fetish genres per PRD §3.1
export const FETISH_GENRES = [
    'Chastity & Denial',
    'Edging & Orgasm Control',
    'CBT',
    'SPH',
    'CEI',
    'Sissy Training',
    'Femdom Worship',
    'Humiliation',
    'Body Writing',
    'Anal Training',
    'Bondage',
    'Impact Play',
    'Foot Worship',
    'Pet Play',
    'Degradation',
    'Financial Domination',
    'Exhibitionism',
    'JOI',
] as const

// Training regimens — comprehensive list
export const REGIMEN_OPTIONS = [
    { id: 'sissy-training', name: 'Sissy Training', description: 'Feminization, makeup practice, and identity exploration' },
    { id: 'obedience-service', name: 'Obedience & Service', description: 'Discipline, protocol training, and domestic servitude' },
    { id: 'cei-mastery', name: 'CEI Mastery', description: 'Progressive cum eating conditioning program' },
    { id: 'edging-endurance', name: 'Edging Endurance', description: 'Stamina building, edge-hold-release control drills' },
    { id: 'sph-conditioning', name: 'SPH Conditioning', description: 'Small penis humiliation and acceptance training' },
    { id: 'humiliation-marathon', name: 'Humiliation Marathon', description: 'Progressive degradation and shame exposure therapy' },
    { id: 'anal-mastery', name: 'Anal Training', description: 'Progressive anal conditioning with size milestones' },
    { id: 'body-worship', name: 'Body Worship', description: 'Foot worship, body part devotion rituals' },
    { id: 'pet-play', name: 'Pet Play Training', description: 'Puppy/kitten training, crawling, fetching, barking drills' },
    { id: 'bondage-self-tie', name: 'Self-Bondage', description: 'Rope work, restraint practice, and predicament bondage' },
    { id: 'pain-tolerance', name: 'Pain Tolerance', description: 'CBT, nipple torture, impact play conditioning' },
    { id: 'chastity-endurance', name: 'Chastity Endurance', description: 'Long-term cage wear, hygiene routines, denial milestones' },
    { id: 'body-writing', name: 'Body Writing', description: 'Degrading text written on body, photo verification' },
    { id: 'exhibitionism', name: 'Exhibitionism Training', description: 'Exposure tasks, public dares, and visibility challenges' },
    { id: 'orgasm-control', name: 'Orgasm Control', description: 'Ruined orgasms, timed releases, denial schedules' },
    { id: 'fitness-punishment', name: 'Fitness & Punishment', description: 'Exercise-based punishments, physical conditioning tasks' },
    { id: 'mental-conditioning', name: 'Mental Conditioning', description: 'Mantras, affirmations, journaling, mindset reshaping' },
    { id: 'wardrobe-control', name: 'Wardrobe Control', description: 'Clothing assignments, panty wearing, outfit protocols' },
    { id: 'financial-servitude', name: 'Financial Servitude', description: 'Tribute tasks, budget control, earning assignments' },
    { id: 'sensory-deprivation', name: 'Sensory Deprivation', description: 'Blindfold tasks, earplugs, isolation challenges' },
    { id: 'domestic-service', name: 'Domestic Service', description: 'Cleaning, cooking, household chore assignments' },
    { id: 'cock-worship', name: 'Cock Worship', description: 'Dildo training, deepthroat practice, oral servitude' },
    { id: 'nipple-training', name: 'Nipple Training', description: 'Sensitivity training, clamps, suction conditioning' },
    { id: 'posture-protocol', name: 'Posture & Protocol', description: 'Standing, kneeling, sitting positions, eye contact rules' },
    { id: 'degradation-exposure', name: 'Degradation Journaling', description: 'Writing confessions, shame journaling, self-assessment' },
] as const

// ── State Interface ─────────────────────────────────────────

interface OnboardingState {
    step: number // 1–11

    // Step 1: Welcome
    ageConfirmed: boolean
    termsAccepted: boolean

    // Step 2: Tier
    tier: Tier | null

    // Step 3: AI Personality
    aiPersonality: Persona | null

    // Step 4: Limits
    hardLimits: string[]
    softLimits: string[]

    // Step 5: Fetishes
    fetishProfile: string[]

    // Step 6: Physical
    physicalDetails: PhysicalDetails | null

    // Step 7: Regimens
    selectedRegimens: TrainingRegimen[]

    // Step 8: Psych Profile
    psychAnswers: Record<string, string>

    // Step 9: Lock Parameters
    initialLockGoalHours: number
    safeword: string

    // Step 10: Notifications
    notificationFrequency: 'low' | 'medium' | 'high' | 'extreme'
    standbyConsent: boolean

    // Actions
    setStep: (step: number) => void
    nextStep: () => void
    prevStep: () => void
    setAgeConfirmed: (v: boolean) => void
    setTermsAccepted: (v: boolean) => void
    setTier: (tier: Tier) => void
    setPersonality: (p: Persona) => void
    setHardLimits: (l: string[]) => void
    setSoftLimits: (l: string[]) => void
    setFetishProfile: (f: string[]) => void
    setPhysicalDetails: (d: PhysicalDetails) => void
    setSelectedRegimens: (r: TrainingRegimen[]) => void
    setPsychAnswer: (qId: string, answer: string) => void
    setInitialLockGoalHours: (h: number) => void
    setSafeword: (s: string) => void
    setNotificationFrequency: (f: 'low' | 'medium' | 'high' | 'extreme') => void
    setStandbyConsent: (v: boolean) => void
    reset: () => void
}

// ── Initial State ───────────────────────────────────────────

const initialState = {
    step: 1,
    ageConfirmed: false,
    termsAccepted: false,
    tier: null as Tier | null,
    aiPersonality: null as Persona | null,
    hardLimits: [] as string[],
    softLimits: [] as string[],
    fetishProfile: [] as string[],
    physicalDetails: null as PhysicalDetails | null,
    selectedRegimens: [] as TrainingRegimen[],
    psychAnswers: {} as Record<string, string>,
    initialLockGoalHours: 168,
    safeword: 'MERCY',
    notificationFrequency: 'medium' as const,
    standbyConsent: false,
}

// ── Store ───────────────────────────────────────────────────

export const useOnboarding = create<OnboardingState>()(
    persist(
        (set) => ({
            ...initialState,

            setStep: (step: number) => set({ step }),
            nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 11) })),
            prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 1) })),

            setAgeConfirmed: (ageConfirmed: boolean) => set({ ageConfirmed }),
            setTermsAccepted: (termsAccepted: boolean) => set({ termsAccepted }),
            setTier: (tier: Tier) => set({ tier }),
            setPersonality: (aiPersonality: Persona) => set({ aiPersonality }),
            setHardLimits: (hardLimits: string[]) => set({ hardLimits }),
            setSoftLimits: (softLimits: string[]) => set({ softLimits }),
            setFetishProfile: (fetishProfile: string[]) => set({ fetishProfile }),
            setPhysicalDetails: (physicalDetails: PhysicalDetails) => set({ physicalDetails }),
            setSelectedRegimens: (selectedRegimens: TrainingRegimen[]) => set({ selectedRegimens }),
            setPsychAnswer: (qId: string, answer: string) =>
                set((s) => ({ psychAnswers: { ...s.psychAnswers, [qId]: answer } })),
            setInitialLockGoalHours: (initialLockGoalHours: number) => set({ initialLockGoalHours }),
            setSafeword: (safeword: string) => set({ safeword }),
            setNotificationFrequency: (notificationFrequency: 'low' | 'medium' | 'high' | 'extreme') =>
                set({ notificationFrequency }),
            setStandbyConsent: (standbyConsent: boolean) => set({ standbyConsent }),

            reset: () => set(initialState),
        }),
        { name: 'lockedin-onboarding' },
    ),
)
