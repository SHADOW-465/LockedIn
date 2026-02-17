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
        <div className="space-y-6 max-w-md mx-auto">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold font-mono">Choose Your Tier</h2>
                <p className="text-text-secondary text-sm">
                    This determines the intensity of your training. You can change this later.
                </p>
            </div>

            <div className="space-y-3">
                {TIERS.map((t) => {
                    const config = TIER_CONFIG[t]
                    const Icon = config.icon
                    const isSelected = tier === t

                    return (
                        <button
                            key={t}
                            onClick={() => setTier(t)}
                            className={`w-full text-left p-4 rounded-[var(--radius-lg)] border transition-all duration-200 cursor-pointer ${isSelected
                                    ? 'border-white/20 bg-bg-secondary'
                                    : 'border-white/5 bg-bg-secondary/50 hover:bg-bg-secondary hover:border-white/10'
                                }`}
                            style={isSelected ? { boxShadow: config.glow } : {}}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ background: `${config.color}20`, border: `1px solid ${config.color}40` }}
                                >
                                    <Icon size={18} style={{ color: config.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-sm" style={isSelected ? { color: config.color } : {}}>
                                            {t}
                                        </span>
                                        <span
                                            className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
                                            style={{ background: `${config.color}15`, color: config.color }}
                                        >
                                            {config.intensity}
                                        </span>
                                    </div>
                                    <p className="text-text-tertiary text-xs mt-1 leading-relaxed">{config.desc}</p>
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
