'use client'

import { useOnboarding, TIERS, type Tier } from '@/lib/stores/onboarding-store'
import { useEffect } from 'react'
import { Shield, Flame, Skull, Zap, Crown } from 'lucide-react'

interface StepProps {
    onValid: (valid: boolean) => void
}

const TIER_CONFIG: Record<Tier, { icon: typeof Shield; color: string; glow: string; desc: string; intensity: string }> = {
    Newbie: {
        icon: Shield,
        color: 'var(--color-tier-newbie)',
        glow: '0 0 20px rgba(76,175,80,0.3)',
        desc: 'Gentle introduction. Shorter tasks, lighter punishment, lots of encouragement.',
        intensity: 'Mild',
    },
    Slave: {
        icon: Flame,
        color: 'var(--color-tier-slave)',
        glow: '0 0 20px rgba(255,152,0,0.3)',
        desc: 'Regular obedience training. Moderate tasks, proper punishments, earning rewards.',
        intensity: 'Moderate',
    },
    Hardcore: {
        icon: Zap,
        color: 'var(--color-tier-hardcore)',
        glow: '0 0 20px rgba(244,67,54,0.3)',
        desc: 'Intense conditioning. Demanding tasks, severe punishments, strict rules.',
        intensity: 'High',
    },
    Extreme: {
        icon: Skull,
        color: 'var(--color-tier-extreme)',
        glow: '0 0 20px rgba(156,39,176,0.3)',
        desc: 'Maximum intensity. Brutal tasks, relentless punishment, total submission required.',
        intensity: 'Extreme',
    },
    'Total Destruction': {
        icon: Crown,
        color: '#000',
        glow: '0 0 20px rgba(211,47,47,0.5), 0 0 40px rgba(124,77,255,0.3)',
        desc: 'No mercy. Designed to completely break and rebuild. Only for the most dedicated.',
        intensity: 'Absolute',
    },
}

export default function TierStep({ onValid }: StepProps) {
    const { tier, setTier } = useOnboarding()

    useEffect(() => {
        onValid(tier !== null)
    }, [tier, onValid])

    return (
        <div className="space-y-10">
            <div className="text-left space-y-4 border-l-4 border-white pl-6">
                <h2 className="text-4xl font-display font-bold tracking-tighter uppercase italic">Intensity Selection</h2>
                <p className="text-[var(--color-text-secondary)] font-mono text-xs uppercase tracking-widest opacity-60">
                    DEFINE THE DEPTH OF SYSTEM INTERVENTION. THIS PARAMETER INFLUENCES ALL FUTURE CONDITIONING CYCLES.
                </p>
            </div>

            <div className="space-y-4">
                {TIERS.map((t) => {
                    const config = TIER_CONFIG[t]
                    const Icon = config.icon
                    const isSelected = tier === t

                    return (
                        <button
                            key={t}
                            onClick={() => setTier(t)}
                            className={`w-full text-left p-6 border transition-all duration-150 cursor-pointer relative group ${isSelected
                                    ? 'bg-black border-[var(--color-accent)]'
                                    : 'bg-[#050505] border-[#141414] hover:border-[#333]'
                                }`}
                        >
                            {isSelected && (
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[var(--color-accent)]" />
                            )}

                            <div className="flex items-start gap-6">
                                <div
                                    className={`w-12 h-12 flex items-center justify-center flex-shrink-0 border ${isSelected ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10' : 'border-[#141414] bg-black'}`}
                                >
                                    <Icon size={20} className={isSelected ? 'text-[var(--color-accent)]' : 'text-[#333]'} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`font-display font-bold text-lg uppercase tracking-tight ${isSelected ? 'text-white' : 'text-[#444]'}`}>
                                            {t}
                                        </span>
                                        <div className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-[0.2em] border ${isSelected ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-[#141414] text-[#333]'}`}>
                                            INTENSITY: {config.intensity.toUpperCase()}
                                        </div>
                                    </div>
                                    <p className={`text-[11px] font-mono leading-relaxed uppercase tracking-widest transition-opacity ${isSelected ? 'text-[var(--color-text-secondary)]' : 'text-[#222]'}`}>
                                        {config.desc.toUpperCase()}
                                    </p>
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
