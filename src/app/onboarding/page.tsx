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

            // Timeout failsafe: force saving=false after 10s
            const timeoutId = setTimeout(() => {
                setSaving(false)
                setSaveError('Save timed out. Please try again.')
            }, 10000)

            try {
                const supabase = getSupabase()

                // Upsert the profile with all onboarding data
                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: user.id,
                    email: user.email,
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
                    console.error('Error saving profile:', profileError)
                    clearTimeout(timeoutId)
                    setSaving(false)
                    setSaveError('Failed to save profile. Please try again.')
                    return
                }

                // Save user preferences (non-blocking — don't let this prevent redirect)
                const { error: prefsError } = await supabase.from('user_preferences').upsert({
                    user_id: user.id,
                    safeword: state.safeword || 'MERCY',
                    notification_frequency: state.notificationFrequency,
                    standby_consent: state.standbyConsent ?? false,
                    hard_limits: state.hardLimits,
                    soft_limits: state.softLimits,
                }, { onConflict: 'user_id' })

                if (prefsError) {
                    console.warn('Warning saving preferences (non-fatal):', prefsError)
                }

                clearTimeout(timeoutId)
                await refreshProfile()
                router.replace('/home')
            } catch (err) {
                console.error('Onboarding save error:', err)
                clearTimeout(timeoutId)
                setSaving(false)
                setSaveError('An unexpected error occurred. Please try again.')
            }
            return
        }
        setDirection('next')
        nextStep()
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
        <div className="min-h-screen flex flex-col bg-bg-primary relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-red-primary/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-1/3 right-0 w-[500px] h-[500px] bg-purple-primary/5 rounded-full blur-[150px] pointer-events-none" />

            {/* Top Bar */}
            <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-bg-secondary border border-white/10 flex items-center justify-center">
                        <Lock size={14} className="text-red-primary" />
                    </div>
                    <span className="font-mono font-bold text-sm tracking-wide">
                        Locked<span className="text-red-primary">In</span>
                    </span>
                </div>
                <span className="text-text-tertiary text-xs font-mono">
                    {step} / 11
                </span>
            </header>

            {/* Progress Bar */}
            <div className="relative z-10 px-6 pt-4 pb-2">
                <div className="flex gap-1">
                    {Array.from({ length: 11 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-all duration-500"
                            style={{
                                background:
                                    i < step
                                        ? 'var(--color-red-primary)'
                                        : i === step - 1
                                            ? 'var(--color-purple-primary)'
                                            : 'var(--color-bg-tertiary)',
                                opacity: i < step ? 1 : 0.4,
                            }}
                        />
                    ))}
                </div>
                <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-text-tertiary">{STEP_LABELS[step - 1]}</span>
                    <span className="text-[10px] text-text-tertiary">{Math.round((step / 11) * 100)}%</span>
                </div>
            </div>

            {/* Step Content */}
            <main className="relative z-10 flex-1 overflow-y-auto px-6 py-6">
                <div
                    key={animKey}
                    className={`transition-all duration-300 ${direction === 'next' ? 'animate-slide-in-right' : 'animate-slide-in-left'
                        }`}
                >
                    <StepComponent onValid={setCanProceed} />
                </div>
            </main>

            {/* Save Error Banner */}
            {saveError && (
                <div className="relative z-10 mx-6 mb-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono text-center">
                    {saveError}
                </div>
            )}

            {/* Bottom Navigation */}
            <footer className="relative z-10 px-6 py-4 border-t border-white/5 flex items-center justify-between">
                <button
                    onClick={handlePrev}
                    disabled={isFirst}
                    className="flex items-center gap-2 px-5 py-3 rounded-[var(--radius-pill)] bg-bg-secondary text-text-secondary font-medium text-sm border border-white/5 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-bg-tertiary transition-colors cursor-pointer"
                >
                    <ChevronLeft size={16} />
                    Back
                </button>

                <button
                    onClick={handleNext}
                    disabled={!canProceed || saving}
                    className={`flex items-center gap-2 px-6 py-3 rounded-[var(--radius-pill)] font-semibold text-sm uppercase tracking-wide transition-all duration-200 cursor-pointer ${canProceed && !saving
                        ? isLast
                            ? 'bg-red-primary text-white glow-red hover:bg-red-hover hover:shadow-raised-hover'
                            : 'bg-purple-primary text-white glow-purple hover:bg-purple-hover hover:shadow-raised-hover'
                        : 'bg-bg-tertiary text-text-disabled cursor-not-allowed'
                        }`}
                >
                    {saving ? (
                        <><Loader2 size={16} className="animate-spin" /> Saving...</>
                    ) : isLast ? 'Lock In' : 'Continue'}
                    {!isLast && !saving && <ChevronRight size={16} />}
                </button>
            </footer>
        </div>
    )
}
