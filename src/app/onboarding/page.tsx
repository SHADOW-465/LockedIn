'use client'

import { useOnboarding } from '@/lib/stores/onboarding-store'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Lock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { getSupabase } from '@/lib/supabase/client'

// Step components
import WelcomeStep from '@/components/onboarding/step-1-welcome'
import TierStep from '@/components/onboarding/step-2-tier'
import PersonalityStep from '@/components/onboarding/step-3-personality'
import LimitsStep from '@/components/onboarding/step-4-limits'
import FetishStep from '@/components/onboarding/step-5-fetish'
import PhysicalStep from '@/components/onboarding/step-6-physical'
import RegimensStep from '@/components/onboarding/step-7-regimens'
import PsychStep from '@/components/onboarding/step-8-psych'
import LockGoalStep from '@/components/onboarding/step-9-lock-goal'
import NotificationsStep from '@/components/onboarding/step-10-notifications'
import FinalReviewStep from '@/components/onboarding/step-11-final-review'

const STEP_COMPONENTS = [
    WelcomeStep,       // 1
    TierStep,          // 2
    PersonalityStep,   // 3
    LimitsStep,        // 4
    FetishStep,        // 5
    PhysicalStep,      // 6
    RegimensStep,      // 7
    PsychStep,         // 8
    LockGoalStep,      // 9
    NotificationsStep, // 10
    FinalReviewStep,   // 11
]

const STEP_LABELS = [
    'Welcome', 'Tier', 'Persona', 'Limits', 'Fetishes',
    'Physical', 'Regimens', 'Profile', 'Lock Goal', 'Alerts', 'Lock In',
]

export default function OnboardingPage() {
    const state = useOnboarding()
    const { step, nextStep, prevStep } = state
    const { user, refreshProfile } = useAuth()
    const router = useRouter()
    const [canProceed, setCanProceed] = useState(false)
    const [direction, setDirection] = useState<'next' | 'prev'>('next')
    const [saving, setSaving] = useState(false)

    const StepComponent = STEP_COMPONENTS[step - 1]
    const isFirst = step === 1
    const isLast = step === 11

    const [saveError, setSaveError] = useState('')

    const handleNext = async () => {
        if (isLast) {
            if (!user) return
            setSaving(true)
            setSaveError('')

            const MAX_RETRIES = 3
            const TIMEOUT_MS = 30000

            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    const result = await Promise.race([
                        saveOnboardingData(),
                        new Promise<'timeout'>((resolve) =>
                            setTimeout(() => resolve('timeout'), TIMEOUT_MS)
                        ),
                    ])

                    if (result === 'timeout') {
                        if (attempt < MAX_RETRIES) {
                            console.warn(`Save attempt ${attempt} timed out, retrying...`)
                            continue
                        }
                        setSaving(false)
                        setSaveError(`FATAL_ERROR: Connection timed out. Retry protocol initiated.`)
                        return
                    }

                    // Success — redirect
                    await refreshProfile()
                    router.replace('/home')
                    return
                } catch (err) {
                    console.error(`Onboarding save attempt ${attempt} failed:`, err)
                    if (attempt >= MAX_RETRIES) {
                        setSaving(false)
                        const msg = err instanceof Error ? err.message : 'Unknown error'
                        setSaveError(`SYSTEM_FAILURE: ${msg.toUpperCase()}`)
                        return
                    }
                    // Brief pause before retry
                    await new Promise(r => setTimeout(r, 1000))
                }
            }
            return
        }
        setDirection('next')
        nextStep()
    }

    /** Save both profile + preferences. Throws on failure. */
    async function saveOnboardingData(): Promise<'ok'> {
        const supabase = getSupabase()

        // Upsert the profile with all onboarding data
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: user!.id,
            email: user!.email,
            tier: state.tier || 'Newbie',
            ai_personality: state.aiPersonality,
            hard_limits: state.hardLimits,
            soft_limits: state.softLimits,
            interests: state.fetishProfile,
            physical_details: state.physicalDetails || {},
            preferred_regimens: state.selectedRegimens.map(r => r.name),
            initial_lock_goal_hours: state.initialLockGoalHours,
            notification_frequency: state.notificationFrequency,
            onboarding_completed: true,
            onboarding_step: 11,
        }, { onConflict: 'id' })

        if (profileError) {
            throw new Error(`Profile save failed: ${profileError.message}`)
        }

        // Save user preferences (non-blocking — warn but don't fail)
        const { error: prefsError } = await supabase.from('user_preferences').upsert({
            user_id: user!.id,
            safeword: state.safeword || 'MERCY',
            notification_frequency: state.notificationFrequency,
            standby_consent: state.standbyConsent ?? false,
            hard_limits: state.hardLimits,
            soft_limits: state.softLimits,
        }, { onConflict: 'user_id' })

        if (prefsError) {
            console.warn('Warning saving preferences (non-fatal):', prefsError)
        }

        return 'ok'
    }

    const handlePrev = () => {
        if (isFirst) return
        setDirection('prev')
        prevStep()
    }

    // Reset animation on step change
    const [animKey, setAnimKey] = useState(0)
    useEffect(() => {
        setAnimKey((k) => k + 1)
        setCanProceed(false)
    }, [step])

    return (
        <div className="min-h-screen flex flex-col bg-black relative overflow-hidden text-white">
            {/* Scanlines / CRT Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-50 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
            </div>

            {/* Top Bar */}
            <header className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-[#141414] bg-black/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[var(--color-accent)] flex items-center justify-center">
                        <Lock size={18} className="text-black" />
                    </div>
                    <div>
                        <span className="font-display font-bold text-xl tracking-tighter uppercase">
                            Locked<span className="text-[var(--color-accent)]">In</span>
                        </span>
                        <div className="text-[9px] font-mono font-bold tracking-[0.3em] text-[var(--color-text-muted)] uppercase mt-0.5">
                            Processing Phase [ {step.toString().padStart(2, '0')} / 11 ]
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                    <span className="text-[10px] font-mono font-bold tracking-widest text-[var(--color-accent)] uppercase">Live Uplink</span>
                </div>
            </header>

            {/* Progress Grid (Clinical Segmented Blocks) */}
            <div className="relative z-10 grid grid-cols-11 gap-1 px-6 pt-6 pb-2">
                {Array.from({ length: 11 }).map((_, i) => (
                    <div
                        key={i}
                        className={`h-2 transition-all duration-300 ${i < step ? 'bg-[var(--color-accent)]' : 'bg-[#141414]'}`}
                    />
                ))}
            </div>
            <div className="relative z-10 px-6 flex justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
                    {STEP_LABELS[step - 1]}
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                    {Math.round((step / 11) * 100)}% Complete
                </span>
            </div>

            {/* Step Content Shell */}
            <main className="relative z-10 flex-1 overflow-y-auto px-6 py-8">
                <div
                    key={animKey}
                    className={`h-full transition-all duration-300 ${direction === 'next' ? 'animate-[fadeIn_0.3s_ease-out]' : 'animate-[fadeIn_0.3s_ease-out]'}`}
                >
                    <div className="max-w-xl mx-auto h-full">
                        <StepComponent onValid={setCanProceed} />
                    </div>
                </div>
            </main>

            {/* Save Error Banner */}
            {saveError && (
                <div className="relative z-10 mx-6 mb-4 px-6 py-4 bg-[var(--color-accent)]/10 border border-[var(--color-accent)] text-[var(--color-accent)] text-xs font-mono font-bold tracking-widest uppercase">
                    [!] {saveError}
                </div>
            )}

            {/* Bottom Navigation */}
            <footer className="relative z-10 px-6 py-6 border-t border-[#141414] bg-black/80 backdrop-blur-md flex items-center justify-between">
                <button
                    onClick={handlePrev}
                    disabled={isFirst}
                    className="flex items-center gap-3 px-8 py-4 bg-transparent text-[var(--color-text-secondary)] font-display font-bold text-xs uppercase tracking-[0.2em] border border-[#141414] disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/5 transition-colors cursor-pointer"
                >
                    <ChevronLeft size={16} />
                    Retract
                </button>

                <button
                    onClick={handleNext}
                    disabled={!canProceed || saving}
                    className={`flex items-center gap-3 px-10 py-4 font-display font-bold text-sm uppercase tracking-[0.2em] transition-all duration-200 cursor-pointer ${canProceed && !saving
                        ? 'bg-[var(--color-accent)] text-black hover:scale-[0.98]'
                        : 'bg-[#141414] text-[#333] cursor-not-allowed'
                        }`}
                >
                    {saving ? (
                        <><Loader2 size={18} className="animate-spin" /> Finalizing...</>
                    ) : isLast ? 'Commit' : 'Next Protocol'}
                    {!isLast && !saving && <ChevronRight size={18} />}
                </button>
            </footer>
        </div>
    )
}

    )
}
