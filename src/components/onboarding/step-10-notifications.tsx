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
        <div className="space-y-10">
            <div className="text-left space-y-4 border-l-4 border-white pl-6">
                <h2 className="text-4xl font-display font-bold tracking-tighter uppercase italic line-through decoration-[var(--color-accent)] decoration-2">Signal Frequency</h2>
                <p className="text-[var(--color-text-secondary)] font-mono text-xs uppercase tracking-widest opacity-60">
                    DEFINE THE PERSISTENCE OF SYSTEM-TO-SUB COMMUNICATION. AT LEAST 01 SIGNAL CHANNEL MUST REMAIN OPEN.
                </p>
            </div>

            {/* Frequency Selection Grid */}
            <div className="space-y-4">
                <label className="text-[10px] font-mono font-bold text-white uppercase tracking-[0.3em]">SIGNAL_VOLUME_CALIBRATION</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {FREQ_OPTIONS.map((opt) => {
                        const isSelected = notificationFrequency === opt.value

                        return (
                            <button
                                key={opt.value}
                                onClick={() => setNotificationFrequency(opt.value)}
                                className={`p-6 border transition-all duration-150 text-left relative cursor-pointer group ${isSelected
                                        ? 'bg-black border-[var(--color-accent)]'
                                        : 'bg-[#050505] border-[#141414] hover:border-[#333]'
                                    }`}
                            >
                                <div className="space-y-2">
                                    <span className={`block text-lg font-display font-bold tracking-tight uppercase ${isSelected ? 'text-white' : 'text-[#444]'}`}>
                                        {opt.label}
                                    </span>
                                    <p className={`text-[10px] font-mono leading-relaxed uppercase tracking-widest transition-opacity ${isSelected ? 'text-[var(--color-text-secondary)]' : 'text-[#222]'}`}>
                                        {opt.desc.toUpperCase()}
                                    </p>
                                </div>
                                {isSelected && (
                                    <div className="absolute top-0 right-0 w-2 h-2 bg-[var(--color-accent)]" />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Standby Mode / Sleep Surveillance */}
            <div className={`border p-8 space-y-6 transition-colors ${standbyConsent ? 'bg-black border-white' : 'bg-black border-[#141414]'}`}>
                <div className="flex items-center justify-between border-b border-[#141414] pb-4">
                    <span className={`text-xs font-display font-bold uppercase tracking-[0.2em] italic ${standbyConsent ? 'text-white' : 'text-[#444]'}`}>Circadian_Override_Protocol</span>
                    <div className={`px-2 py-0.5 text-[9px] font-mono font-bold ${standbyConsent ? 'bg-white text-black' : 'bg-[#141414] text-[#333]'}`}>
                        {standbyConsent ? 'ACTIVE' : 'INACTIVE'}
                    </div>
                </div>
                
                <p className={`text-[10px] font-mono leading-relaxed uppercase tracking-widest ${standbyConsent ? 'text-[var(--color-text-secondary)]' : 'text-[#222]'}`}>
                    ALLOW SYSTEM CHECK-INS DURING [02:00] — [05:00] WINDOW. RANDOMIZED COMPLIANCE DRILLS MAY BE INITIATED WITHOUT PRIOR ADVISORY.
                </p>

                <button
                    onClick={() => setStandbyConsent(!standbyConsent)}
                    className={`w-full py-5 border text-xs font-mono font-bold uppercase tracking-[0.3em] transition-all cursor-pointer ${standbyConsent
                            ? 'bg-white border-white text-black hover:bg-black hover:text-white'
                            : 'bg-black border-[#141414] text-[#333] hover:border-white hover:text-white'
                        }`}
                >
                    {standbyConsent ? 'DISABLE_SURVEILLANCE' : 'AUTHORIZE_SURVEILLANCE'}
                </button>
            </div>
        </div>
    )
}
