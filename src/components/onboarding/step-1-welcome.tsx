'use client'

import { useOnboarding } from '@/lib/stores/onboarding-store'
import { Shield, AlertTriangle } from 'lucide-react'
import { useEffect } from 'react'

interface StepProps {
    onValid: (valid: boolean) => void
}

export default function WelcomeStep({ onValid }: StepProps) {
    const { ageConfirmed, termsAccepted, setAgeConfirmed, setTermsAccepted } = useOnboarding()

    useEffect(() => {
        onValid(ageConfirmed && termsAccepted)
    }, [ageConfirmed, termsAccepted, onValid])

    return (
        <div className="space-y-8 max-w-md mx-auto">
            {/* Title */}
            <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold font-mono">
                    Welcome to <span className="text-red-primary text-glow-red">LockedIn</span>
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed">
                    You&apos;re about to submit yourself to an AI-driven chastity and conditioning program.
                    This process is <span className="text-red-primary font-semibold">irreversible</span> once
                    locked in &mdash; though emergency release is always available.
                </p>
            </div>

            {/* Warning Card */}
            <div className="bg-red-primary/5 border border-red-primary/20 rounded-[var(--radius-lg)] p-5 space-y-3">
                <div className="flex items-center gap-2 text-red-primary">
                    <AlertTriangle size={18} />
                    <span className="font-semibold text-sm uppercase tracking-wide">Content Warning</span>
                </div>
                <p className="text-text-secondary text-xs leading-relaxed">
                    This platform contains explicit adult content including BDSM, chastity,
                    humiliation, and psychological conditioning elements. All activities are
                    consensual and feature robust safety controls.
                </p>
            </div>

            {/* Checkboxes */}
            <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                    <div
                        className={`w-5 h-5 rounded-[var(--radius-sm)] border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${ageConfirmed
                                ? 'bg-red-primary border-red-primary'
                                : 'border-text-tertiary group-hover:border-text-secondary'
                            }`}
                        onClick={() => setAgeConfirmed(!ageConfirmed)}
                    >
                        {ageConfirmed && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </div>
                    <span className="text-text-secondary text-sm leading-relaxed" onClick={() => setAgeConfirmed(!ageConfirmed)}>
                        I confirm that I am <span className="text-text-primary font-semibold">18 years or older</span> and
                        legally able to access adult content in my jurisdiction.
                    </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                    <div
                        className={`w-5 h-5 rounded-[var(--radius-sm)] border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${termsAccepted
                                ? 'bg-red-primary border-red-primary'
                                : 'border-text-tertiary group-hover:border-text-secondary'
                            }`}
                        onClick={() => setTermsAccepted(!termsAccepted)}
                    >
                        {termsAccepted && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </div>
                    <span className="text-text-secondary text-sm leading-relaxed" onClick={() => setTermsAccepted(!termsAccepted)}>
                        I understand and accept that this platform uses <span className="text-text-primary font-semibold">AI-driven psychological conditioning</span>,
                        and I consent to participate.
                    </span>
                </label>
            </div>

            {/* Safety Assurance */}
            <div className="bg-teal-primary/5 border border-teal-primary/20 rounded-[var(--radius-lg)] p-4 flex items-start gap-3">
                <Shield size={18} className="text-teal-primary flex-shrink-0 mt-0.5" />
                <p className="text-text-secondary text-xs leading-relaxed">
                    <span className="text-teal-primary font-semibold">Your safety matters.</span> Emergency Release is
                    always accessible. Your safeword instantly activates Care Mode. Hard limits are
                    strictly enforced and cannot be overridden by the AI.
                </p>
            </div>
        </div>
    )
}
