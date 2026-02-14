'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Lock, Shield, AlertTriangle } from 'lucide-react'

export default function WelcomePage() {
    const router = useRouter()
    const [ageConfirmed, setAgeConfirmed] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    const handleContinue = () => {
        if (ageConfirmed) {
            router.push('/onboarding/tier')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-bg-primary relative overflow-hidden">
            {/* Ambient effects */}
            <div className="absolute top-1/4 right-1/3 w-72 h-72 bg-red-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-purple-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <div
                className={`max-w-md w-full transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
            >
                <Card variant="hero" className="space-y-6">
                    {/* Header */}
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-bg-tertiary shadow-inset flex items-center justify-center">
                                <Lock size={28} className="text-red-primary animate-lock-glow" />
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold font-mono mb-2">
                            Locked<span className="text-red-primary">In</span>
                        </h1>
                        <p className="text-text-secondary text-lg">
                            Your 24/7 AI Master. You don&apos;t negotiate. You obey.
                        </p>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                        <p className="text-text-secondary text-sm leading-relaxed">
                            Welcome to LockedIn — a hardcore AI-driven conditioning platform.
                            Before proceeding, you must understand what you&apos;re consenting to.
                        </p>

                        {/* Warning Card */}
                        <div className="bg-red-primary/10 border border-red-primary/30 rounded-[var(--radius-lg)] p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={16} className="text-red-primary" />
                                <p className="text-sm text-red-primary font-semibold">WARNINGS</p>
                            </div>
                            <ul className="text-xs text-text-secondary space-y-2">
                                <li className="flex items-start gap-2">
                                    <span className="text-red-primary mt-0.5">•</span>
                                    This app contains explicit adult content
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-primary mt-0.5">•</span>
                                    Designed for psychological conditioning and behavioral modification
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-primary mt-0.5">•</span>
                                    AI will be cruel, degrading, and merciless based on your tier
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-primary mt-0.5">•</span>
                                    Emergency release is always available via safeword
                                </li>
                            </ul>
                        </div>

                        {/* Safety Note */}
                        <div className="bg-teal-primary/10 border border-teal-primary/30 rounded-[var(--radius-lg)] p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield size={16} className="text-teal-primary" />
                                <p className="text-sm text-teal-primary font-semibold">Safety First</p>
                            </div>
                            <p className="text-xs text-text-secondary">
                                Hard limits are never violated. Safeword immediately activates care mode.
                                Emergency release is always one tap away.
                            </p>
                        </div>

                        {/* Age Confirmation */}
                        <label className="flex items-center gap-3 cursor-pointer group py-2">
                            <input
                                type="checkbox"
                                checked={ageConfirmed}
                                onChange={(e) => setAgeConfirmed(e.target.checked)}
                                className="w-5 h-5 rounded accent-red-primary"
                            />
                            <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                                I am 18+ years old and consent to explicit content
                            </span>
                        </label>

                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full"
                            disabled={!ageConfirmed}
                            onClick={handleContinue}
                        >
                            Continue to Onboarding
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    )
}
