'use client'

import { useOnboarding } from '@/lib/stores/onboarding-store'
import { useEffect } from 'react'
import { Lock, Clock } from 'lucide-react'

interface StepProps {
    onValid: (valid: boolean) => void
}

const LOCK_PRESETS = [
    { hours: 24, label: '1 Day', desc: 'Quick trial' },
    { hours: 72, label: '3 Days', desc: 'Introductory' },
    { hours: 168, label: '7 Days', desc: 'Standard (Recommended)' },
    { hours: 336, label: '14 Days', desc: 'Committed' },
    { hours: 720, label: '30 Days', desc: 'Hardcore' },
    { hours: 2160, label: '90 Days', desc: 'Extreme' },
]

export default function LockGoalStep({ onValid }: StepProps) {
    const { initialLockGoalHours, setInitialLockGoalHours, safeword, setSafeword } = useOnboarding()

    useEffect(() => {
        onValid(initialLockGoalHours > 0 && safeword.trim().length >= 3)
    }, [initialLockGoalHours, safeword, onValid])

    return (
        <div className="space-y-6 max-w-md mx-auto">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold font-mono">Lock Goal & Safety</h2>
                <p className="text-white/80 text-sm">
                    Set your initial lock duration and emergency safeword.
                </p>
            </div>

            {/* Lock Duration */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Clock size={14} className="text-white" />
                    <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                        Lock Duration
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {LOCK_PRESETS.map((preset) => {
                        const isSelected = initialLockGoalHours === preset.hours

                        return (
                            <button
                                key={preset.hours}
                                onClick={() => setInitialLockGoalHours(preset.hours)}
                                className={`p-3 rounded-[var(--radius-lg)] border text-center transition-all cursor-pointer ${isSelected
                                        ? 'border-zinc-700 bg-zinc-800/10 '
                                        : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-800'
                                    }`}
                            >
                                <span className={`block text-sm font-bold font-mono ${isSelected ? 'text-white' : ''}`}>
                                    {preset.label}
                                </span>
                                <span className="block text-[10px] text-white/30 mt-0.5">{preset.desc}</span>
                            </button>
                        )
                    })}
                </div>

                <p className="text-center text-xs text-white/30">
                    AI may adjust this based on your performance.
                </p>
            </div>

            {/* Safeword */}
            <div className="space-y-3 bg-teal-primary/5 border border-teal-primary/20 rounded-[var(--radius-lg)] p-4">
                <div className="flex items-center gap-2">
                    <Lock size={14} className="text-white" />
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">
                        Safeword
                    </span>
                </div>
                <p className="text-white/80 text-xs">
                    Typing this word in chat instantly activates <span className="text-white font-semibold">Care Mode</span>,
                    pausing all tasks and punishment. Choose something you won&apos;t type accidentally.
                </p>
                <input
                    type="text"
                    value={safeword}
                    onChange={(e) => setSafeword(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 rounded-[var(--radius-md)] bg-black border border-teal-primary/20 text-sm text-white font-mono uppercase tracking-wider text-center focus:outline-none focus:border-zinc-700/40"
                    placeholder="MERCY"
                    maxLength={20}
                />
            </div>
        </div>
    )
}
