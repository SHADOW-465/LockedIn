'use client'

import { useOnboarding } from '@/lib/stores/onboarding-store'
import { useEffect } from 'react'
import { Bell, Moon, AlertTriangle } from 'lucide-react'

interface StepProps {
    onValid: (valid: boolean) => void
}

const FREQ_OPTIONS = [
    {
        value: 'low' as const,
        label: 'Low',
        desc: '2-4 notifications per day. Minimal interruption.',
        color: 'var(--color-teal-primary)',
    },
    {
        value: 'medium' as const,
        label: 'Medium',
        desc: '5-10 per day. Regular check-ins and reminders.',
        color: 'var(--color-purple-primary)',
    },
    {
        value: 'high' as const,
        label: 'High',
        desc: '10-20 per day. Persistent control and mindset reinforcement.',
        color: 'var(--color-red-hover)',
    },
    {
        value: 'extreme' as const,
        label: 'Extreme',
        desc: 'Constant. Random demands day and night. No peace.',
        color: 'var(--color-red-primary)',
    },
]

export default function NotificationsStep({ onValid }: StepProps) {
    const { notificationFrequency, setNotificationFrequency, standbyConsent, setStandbyConsent } = useOnboarding()

    useEffect(() => {
        onValid(true) // Always valid, has defaults
    }, [onValid])

    return (
        <div className="space-y-6 max-w-md mx-auto">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold font-mono">Notification Control</h2>
                <p className="text-white/80 text-sm">
                    How often should your AI Master contact you?
                </p>
            </div>

            {/* Frequency Selection */}
            <div className="space-y-2">
                {FREQ_OPTIONS.map((opt) => {
                    const isSelected = notificationFrequency === opt.value

                    return (
                        <button
                            key={opt.value}
                            onClick={() => setNotificationFrequency(opt.value)}
                            className={`w-full text-left p-4 rounded-[var(--radius-lg)] border transition-all duration-200 cursor-pointer ${isSelected
                                    ? 'border-zinc-700 bg-zinc-900'
                                    : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-800'
                                }`}
                            style={isSelected ? { boxShadow: `0 0 15px ${opt.color}30` } : {}}
                        >
                            <div className="flex items-center gap-3">
                                <Bell size={16} style={{ color: isSelected ? opt.color : 'var(--color-text-disabled)' }} />
                                <div>
                                    <span className="font-semibold text-sm" style={isSelected ? { color: opt.color } : {}}>
                                        {opt.label}
                                    </span>
                                    <p className="text-white/30 text-xs mt-0.5">{opt.desc}</p>
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Standby Mode */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-[var(--radius-lg)] p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Moon size={14} className="text-white" />
                    <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                        Standby Mode (2AM — 5AM)
                    </span>
                </div>
                <p className="text-white/30 text-xs leading-relaxed">
                    Enable surprise check-ins between 2AM and 5AM. The AI Master may wake you
                    with tasks, demands, or compliance checks during sleeping hours.
                </p>
                <button
                    onClick={() => setStandbyConsent(!standbyConsent)}
                    className={`w-full py-2.5 rounded-[var(--radius-md)] text-xs font-medium transition-all cursor-pointer border ${standbyConsent
                            ? 'bg-zinc-800/15 border-zinc-700 text-white'
                            : 'bg-black border-zinc-800 text-white/30 hover:border-zinc-800'
                        }`}
                >
                    {standbyConsent ? '✓ Standby Mode Enabled' : 'Enable Standby Mode'}
                </button>

                {standbyConsent && (
                    <div className="flex items-start gap-2 text-xs">
                        <AlertTriangle size={12} className="text-white flex-shrink-0 mt-0.5" />
                        <span className="text-white/30">
                            You may receive notifications at any hour. Disable in Settings anytime.
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
