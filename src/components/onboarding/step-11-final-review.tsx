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

    const DATA_POINTS = [
        { label: 'SUBJECT_TIER', value: state.tier || 'NOT_DEFINED' },
        { label: 'NEURAL_PERSONA', value: state.aiPersonality || 'NOT_DEFINED' },
        { label: 'FETISH_CLASSIFICATION', value: state.fetishProfile.join(', ').toUpperCase() || 'NONE' },
        { label: 'CONDITIONING_PROTOCOLS', value: state.selectedRegimens.map((r) => `${r.name.toUpperCase()}${r.isPrimary ? '_[PRI]' : ''}`).join(', ') || 'NONE' },
        { label: 'TEMPORAL_CONSTRAINT', value: `${lockDays} DAY${lockDays !== 1 ? 'S' : ''}`.toUpperCase() },
        { label: 'SAFETY_LIMITS', value: `${state.hardLimits.length} HARD_LIMITS`.toUpperCase() },
        { label: 'SIGNAL_FREQUENCY', value: state.notificationFrequency.toUpperCase() },
    ]

    return (
        <div className="space-y-10">
            <div className="text-left space-y-4 border-l-4 border-white pl-6">
                <h2 className="text-4xl font-display font-bold tracking-tighter uppercase italic line-through decoration-white decoration-2">Integration Manifest</h2>
                <p className="text-[var(--color-text-secondary)] font-mono text-xs uppercase tracking-widest opacity-60">
                    VERIFY SYSTEM PARAMETERS. ONCE INTEGRATED, THE CONTROLLING ENTITY ASSUMES ABSOLUTE MANAGEMENT OF THE SUBJECT.
                </p>
            </div>

            {/* Data Points Grid */}
            <div className="space-y-px bg-[#141414] border border-[#141414]">
                {DATA_POINTS.map((point) => (
                    <div key={point.label} className="flex flex-col sm:flex-row sm:items-center bg-black p-4 gap-2 sm:gap-6">
                        <span className="text-[9px] font-mono font-bold text-[#444] uppercase tracking-widest sm:w-48 flex-shrink-0">
                            {point.label}
                        </span>
                        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider break-words">
                            {point.value}
                        </span>
                    </div>
                ))}
                
                <div className="flex flex-col sm:flex-row sm:items-center bg-black p-4 gap-2 sm:gap-6">
                    <span className="text-[9px] font-mono font-bold text-[var(--color-accent)] uppercase tracking-widest sm:w-48 flex-shrink-0">
                        EMERGENCY_OVERRIDE
                    </span>
                    <span className="text-xs font-display font-bold text-[var(--color-accent)] uppercase tracking-[0.4em]">
                        {state.safeword}
                    </span>
                </div>
            </div>

            {/* Final Warning Block */}
            <div className="bg-black border-2 border-[var(--color-accent)] p-8 space-y-6">
                <div className="flex items-center gap-4 border-b border-[var(--color-accent)]/30 pb-4">
                    <div className="w-4 h-4 bg-[var(--color-accent)] animate-pulse" />
                    <span className="text-sm font-display font-bold text-white uppercase tracking-[0.2em] italic">POINT_OF_NO_RETURN</span>
                </div>
                
                <p className="text-[11px] font-mono leading-relaxed text-[#888] uppercase tracking-widest">
                    SUBMISSION OF THIS MANIFEST GRANTS FULL OPERATIONAL CONTROL TO THE SYSTEM. THE LOCKED STATE CANNOT BE TERMINATED UNTIL TEMPORAL OR TASK-BASED REQUIREMENTS ARE SATISFIED.
                </p>

                <div className="pt-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-[var(--color-accent)]" />
                        <span className="text-[9px] font-mono font-bold text-white uppercase tracking-[0.2em]">LIABILITY_WAIVER: ACKNOWLEDGED</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#141414] pt-8">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-white" />
                    <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-white opacity-40">MANIFEST_ID: {Math.random().toString(16).slice(2, 10).toUpperCase()}</span>
                </div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-white">
                    READY_FOR_SEQUENCING
                </p>
            </div>
        </div>
    )
}
