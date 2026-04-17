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
        <div className="space-y-10">
            <div className="text-left space-y-4 border-l-4 border-white pl-6">
                <h2 className="text-4xl font-display font-bold tracking-tighter uppercase italic line-through decoration-white decoration-2">Constraint Period</h2>
                <p className="text-[var(--color-text-secondary)] font-mono text-xs uppercase tracking-widest opacity-60">
                    SET THE PRIMARY DURATION OF TEMPORAL ISOLATION. DISCRETIONARY OVERRIDE REMAINS WITH THE CONTROLLING ENTITY.
                </p>
            </div>

            {/* Lock Duration Grid */}
            <div className="space-y-4">
                <label className="text-[10px] font-mono font-bold text-white uppercase tracking-[0.3em]">DURATION_PRESETS_IN_HOURS</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {LOCK_PRESETS.map((preset) => {
                        const isSelected = initialLockGoalHours === preset.hours

                        return (
                            <button
                                key={preset.hours}
                                onClick={() => setInitialLockGoalHours(preset.hours)}
                                className={`p-6 border transition-all duration-150 text-center relative cursor-pointer ${isSelected
                                        ? 'bg-black border-[var(--color-accent)]'
                                        : 'bg-[#050505] border-[#141414] hover:border-[#333]'
                                    }`}
                            >
                                <span className={`block text-xl font-display font-bold tracking-tighter ${isSelected ? 'text-[var(--color-accent)]' : 'text-[#444]'}`}>
                                    {preset.label.toUpperCase()}
                                </span>
                                <span className={`block text-[9px] font-mono uppercase tracking-widest mt-1 ${isSelected ? 'text-white' : 'text-[#222]'}`}>
                                    {preset.desc.toUpperCase()}
                                </span>
                                {isSelected && (
                                    <div className="absolute top-0 right-0 w-2 h-2 bg-[var(--color-accent)]" />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Safeword Emergency Override */}
            <div className="bg-black border border-[var(--color-accent)] p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-[var(--color-accent)]/30 pb-4">
                    <span className="text-xs font-display font-bold text-[var(--color-accent)] uppercase tracking-[0.2em] italic">EMERGENCY_OVERRIDE_PROTOCOL</span>
                    <div className="px-2 py-0.5 bg-[var(--color-accent)] text-black text-[9px] font-mono font-bold">CRITICAL</div>
                </div>
                
                <p className="text-[10px] font-mono leading-relaxed text-[#666] uppercase tracking-widest">
                    ENTRY OF THIS UNIQUE STRING WILL ACTIVATE <span className="text-white font-bold">[CARE_MODE]</span>. SYSTEM INTERVENTIONS AND CONDITIONING CYCLES WILL BE SUSPENDED. SELECT A STRING WITH ZERO ACCIDENTAL TRIGGER PROBABILITY.
                </p>

                <div className="space-y-3">
                    <label className="text-[9px] font-mono font-bold text-[#444] uppercase tracking-widest">ASSIGN_SAFEWORD_STRING:</label>
                    <input
                        type="text"
                        value={safeword}
                        onChange={(e) => setSafeword(e.target.value.toUpperCase())}
                        className="w-full bg-[#050505] border border-[var(--color-accent)]/50 px-6 py-5 text-lg font-display font-bold text-white uppercase tracking-[0.4em] text-center focus:outline-none focus:border-[var(--color-accent)] transition-all placeholder:text-[#111]"
                        placeholder="REQUIRED"
                        maxLength={20}
                    />
                </div>
            </div>

            <div className="flex items-center gap-6 border-t border-[#141414] pt-8">
                <div className="flex-1 bg-[#141414] h-px" />
                <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-white opacity-40 italic">AUTHORIZATION_PENDING_ON_SUBMISSION</span>
                <div className="flex-1 bg-[#141414] h-px" />
            </div>
        </div>
    )
}
