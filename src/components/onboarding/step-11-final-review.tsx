'use client'

import { useOnboarding } from '@/lib/stores/onboarding-store'
import { useEffect } from 'react'
import { Lock, Shield, Heart, Brain, Clock, Bell, Star, AlertTriangle } from 'lucide-react'

interface StepProps {
    onValid: (valid: boolean) => void
}

export default function FinalReviewStep({ onValid }: StepProps) {
    const state = useOnboarding()

    useEffect(() => {
        // Valid if all required steps are filled
        const isComplete =
            state.ageConfirmed &&
            state.termsAccepted &&
            state.tier !== null &&
            state.aiPersonality !== null &&
            state.hardLimits.length >= 1 &&
            state.fetishProfile.length >= 1 &&
            state.selectedRegimens.length >= 1 &&
            Object.keys(state.psychAnswers).length >= 7 &&
            state.safeword.trim().length >= 3

        onValid(isComplete)
    }, [state, onValid])

    const lockDays = Math.round(state.initialLockGoalHours / 24)

    return (
        <div className="space-y-5 max-w-md mx-auto">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold font-mono text-red-primary text-glow-red">
                    Final Review
                </h2>
                <p className="text-text-secondary text-sm">
                    Confirm your configuration. Once you lock in, the AI Master takes control.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="space-y-2">
                {/* Tier */}
                <div className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] bg-bg-secondary/50 border border-white/5">
                    <Shield size={16} className="text-red-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Tier</span>
                        <p className="text-sm font-semibold">{state.tier || '—'}</p>
                    </div>
                </div>

                {/* Persona */}
                <div className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] bg-bg-secondary/50 border border-white/5">
                    <Brain size={16} className="text-purple-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-text-tertiary uppercase tracking-wider">AI Persona</span>
                        <p className="text-sm font-semibold">{state.aiPersonality || '—'}</p>
                    </div>
                </div>

                {/* Fetishes */}
                <div className="flex items-start gap-3 p-3 rounded-[var(--radius-lg)] bg-bg-secondary/50 border border-white/5">
                    <Heart size={16} className="text-red-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-text-tertiary uppercase tracking-wider">
                            Fetishes ({state.fetishProfile.length})
                        </span>
                        <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                            {state.fetishProfile.join(', ') || '—'}
                        </p>
                    </div>
                </div>

                {/* Regimens */}
                <div className="flex items-start gap-3 p-3 rounded-[var(--radius-lg)] bg-bg-secondary/50 border border-white/5">
                    <Star size={16} className="text-purple-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-text-tertiary uppercase tracking-wider">
                            Regimens ({state.selectedRegimens.length})
                        </span>
                        <p className="text-xs text-text-secondary mt-0.5">
                            {state.selectedRegimens.map((r) => `${r.name}${r.isPrimary ? ' ★' : ''}`).join(', ') || '—'}
                        </p>
                    </div>
                </div>

                {/* Lock Duration */}
                <div className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] bg-bg-secondary/50 border border-white/5">
                    <Clock size={16} className="text-red-primary flex-shrink-0" />
                    <div className="flex-1">
                        <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Lock Duration</span>
                        <p className="text-sm font-semibold font-mono">{lockDays} day{lockDays !== 1 ? 's' : ''}</p>
                    </div>
                </div>

                {/* Limits */}
                <div className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] bg-bg-secondary/50 border border-white/5">
                    <Lock size={16} className="text-teal-primary flex-shrink-0" />
                    <div className="flex-1">
                        <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Safety</span>
                        <p className="text-xs text-text-secondary">
                            {state.hardLimits.length} hard limit{state.hardLimits.length !== 1 ? 's' : ''} •
                            Safeword: <span className="font-mono text-teal-primary">{state.safeword}</span>
                        </p>
                    </div>
                </div>

                {/* Notifications */}
                <div className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] bg-bg-secondary/50 border border-white/5">
                    <Bell size={16} className="text-purple-primary flex-shrink-0" />
                    <div className="flex-1">
                        <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Notifications</span>
                        <p className="text-xs text-text-secondary capitalize">
                            {state.notificationFrequency} frequency
                            {state.standbyConsent ? ' • Standby Mode ON' : ''}
                        </p>
                    </div>
                </div>
            </div>

            {/* Final Warning */}
            <div className="bg-red-primary/5 border border-red-primary/20 rounded-[var(--radius-lg)] p-4 space-y-2">
                <div className="flex items-center gap-2 text-red-primary">
                    <AlertTriangle size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Point of No Return</span>
                </div>
                <p className="text-text-secondary text-xs leading-relaxed">
                    Pressing <span className="text-red-primary font-bold">&ldquo;Lock In&rdquo;</span> activates your AI Master.
                    Your lock timer begins immediately. Emergency Release is always available in Settings.
                </p>
            </div>
        </div>
    )
}
