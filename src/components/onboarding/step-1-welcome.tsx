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
        <div className="space-y-12 h-full flex flex-col justify-center">
            {/* Title / Intro */}
            <div className="space-y-6 text-left border-l-4 border-[var(--color-accent)] pl-6">
                <h2 className="text-6xl font-display font-bold tracking-tighter uppercase leading-none italic">
                    WELCOME <br />
                    <span className="text-[var(--color-accent)] not-italic">TO THE SYSTEM</span>
                </h2>
                <p className="text-[var(--color-text-secondary)] font-mono text-sm leading-relaxed uppercase tracking-wider opacity-60 max-w-sm">
                    YOU ARE ENTERING AN AI-DRIVEN CONDITIONING PROTOCOL. <br />
                    CONSENT IS PARAMEDICAL. <br />
                    SUBMISSION IS THE ONLY VARIABLE.
                </p>
            </div>

            {/* Warning Card */}
            <div className="bg-[#0A0A0A] border border-[#141414] p-6 space-y-4">
                <div className="flex items-center gap-3 text-[var(--color-accent)]">
                    <div className="w-1.5 h-6 bg-[var(--color-accent)]" />
                    <span className="font-display font-bold text-sm uppercase tracking-[0.3em]">WARNING: CONTENT_PROTOCOL_18</span>
                </div>
                <p className="text-[var(--color-text-secondary)] font-mono text-[11px] leading-loose uppercase tracking-widest">
                    THIS DOMAIN CONTAINS HIGH-FIDELITY ADULT MATERIAL. BDSM, CHASTITY, AND PSYCHOLOGICAL REPROGRAMMING ELEMENTS ARE ACTIVE. ALL TRAPPING PROTOCOLS ARE SIMULATED YET PERSISTENT.
                </p>
            </div>

            {/* Checkboxes (Industrial Style) */}
            <div className="space-y-6">
                <label className="flex items-start gap-4 cursor-pointer group">
                    <div
                        className={`w-6 h-6 border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${ageConfirmed
                                ? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
                                : 'bg-black border-[#222] group-hover:border-[var(--color-accent)]'
                            }`}
                        onClick={() => setAgeConfirmed(!ageConfirmed)}
                    >
                        {ageConfirmed && <div className="w-3 h-3 bg-black" />}
                    </div>
                    <div className="space-y-1" onClick={() => setAgeConfirmed(!ageConfirmed)}>
                        <span className="text-white font-display font-bold text-xs uppercase tracking-widest group-hover:text-[var(--color-accent)] transition-colors">
                            ADULT_STATUS_VERIFICATION
                        </span>
                        <p className="text-[var(--color-text-muted)] font-mono text-[10px] uppercase opacity-50">
                            I AM 18+ AND GRANT ABSOLUTE CONSENT.
                        </p>
                    </div>
                </label>

                <label className="flex items-start gap-4 cursor-pointer group">
                    <div
                        className={`w-6 h-6 border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${termsAccepted
                                ? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
                                : 'bg-black border-[#222] group-hover:border-[var(--color-accent)]'
                            }`}
                        onClick={() => setTermsAccepted(!termsAccepted)}
                    >
                        {termsAccepted && <div className="w-3 h-3 bg-black" />}
                    </div>
                    <div className="space-y-1" onClick={() => setTermsAccepted(!termsAccepted)}>
                        <span className="text-white font-display font-bold text-xs uppercase tracking-widest group-hover:text-[var(--color-accent)] transition-colors">
                            PROTOCOL_CONSENT_ACK
                        </span>
                        <p className="text-[var(--color-text-muted)] font-mono text-[10px] uppercase opacity-50">
                            I ACCEPT PSYCHOLOGICAL CONDITIONING TERMS.
                        </p>
                    </div>
                </label>
            </div>

            {/* Safety Assurance (Footer Note) */}
            <div className="border-t border-[#141414] pt-6 flex items-start gap-4">
                <Shield size={20} className="text-[var(--color-text-muted)] flex-shrink-0 opacity-40" />
                <p className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase tracking-widest leading-loose">
                    FAIL-SAFE: SAFEWORD [MERCY] REMAINS ACTIVE. EMERGENCY RELEASE IS AVAILABLE 24/7. HARD LIMITS ARE SYSTEM-ENFORCED AND NON-NEGOTIABLE.
                </p>
            </div>
        </div>
    )
}
    )
}
