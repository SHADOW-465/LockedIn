'use client'

import { useOnboarding } from '@/lib/stores/onboarding-store'
import { useEffect, useState } from 'react'
import { ShieldOff, ShieldCheck, X } from 'lucide-react'

interface StepProps {
    onValid: (valid: boolean) => void
}

const LIMIT_PRESETS = [
    'Blood/Gore', 'Scat', 'Vomit', 'Age Play', 'Bestiality', 'Incest References',
    'Permanent Marks', 'Public Exposure (Real)', 'Blackmail (Real)', 'Needle Play',
    'Breath Play', 'Sleep Deprivation', 'Financial Ruin', 'Family Involvement',
    'Workplace Involvement', 'Forced Bi (Real)', 'Extreme Pain', 'Permanent Chastity',
]

export default function LimitsStep({ onValid }: StepProps) {
    const { hardLimits, softLimits, setHardLimits, setSoftLimits } = useOnboarding()
    const [customLimit, setCustomLimit] = useState('')

    useEffect(() => {
        // At least 1 hard limit required for safety
        onValid(hardLimits.length >= 1)
    }, [hardLimits, onValid])

    const toggleHardLimit = (limit: string) => {
        if (hardLimits.includes(limit)) {
            setHardLimits(hardLimits.filter((l) => l !== limit))
        } else {
            // Remove from soft limits if present
            setSoftLimits(softLimits.filter((l) => l !== limit))
            setHardLimits([...hardLimits, limit])
        }
    }

    const toggleSoftLimit = (limit: string) => {
        if (softLimits.includes(limit)) {
            setSoftLimits(softLimits.filter((l) => l !== limit))
        } else {
            // Remove from hard limits if present
            setHardLimits(hardLimits.filter((l) => l !== limit))
            setSoftLimits([...softLimits, limit])
        }
    }

    const addCustom = () => {
        const trimmed = customLimit.trim()
        if (trimmed && !hardLimits.includes(trimmed) && !softLimits.includes(trimmed)) {
            setHardLimits([...hardLimits, trimmed])
            setCustomLimit('')
        }
    }

    return (
        <div className="space-y-6 max-w-md mx-auto">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold font-mono">Set Your Limits</h2>
                <p className="text-text-secondary text-sm">
                    <span className="text-red-primary font-semibold">Hard limits</span> are NEVER crossed.{' '}
                    <span className="text-purple-primary font-semibold">Soft limits</span> may be gently pushed.
                </p>
            </div>

            {/* Legend */}
            <div className="flex gap-4 justify-center">
                <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-3 h-3 rounded-full bg-red-primary" />
                    <span className="text-text-secondary">Hard Limit</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-3 h-3 rounded-full bg-purple-primary" />
                    <span className="text-text-secondary">Soft Limit</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-3 h-3 rounded-full bg-bg-tertiary" />
                    <span className="text-text-secondary">Allowed</span>
                </div>
            </div>

            {/* Presets Grid */}
            <div className="flex flex-wrap gap-2">
                {LIMIT_PRESETS.map((limit) => {
                    const isHard = hardLimits.includes(limit)
                    const isSoft = softLimits.includes(limit)

                    return (
                        <button
                            key={limit}
                            onClick={() => {
                                if (!isHard && !isSoft) toggleHardLimit(limit)
                                else if (isHard) toggleSoftLimit(limit)
                                else setSoftLimits(softLimits.filter((l) => l !== limit))
                            }}
                            className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium transition-all cursor-pointer border ${isHard
                                    ? 'bg-red-primary/15 border-red-primary/40 text-red-primary'
                                    : isSoft
                                        ? 'bg-purple-primary/15 border-purple-primary/40 text-purple-primary'
                                        : 'bg-bg-tertiary/50 border-white/5 text-text-tertiary hover:border-white/10'
                                }`}
                        >
                            {isHard && <ShieldOff size={10} className="inline mr-1" />}
                            {isSoft && <ShieldCheck size={10} className="inline mr-1" />}
                            {limit}
                        </button>
                    )
                })}
            </div>

            {/* Custom Limit Input */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={customLimit}
                    onChange={(e) => setCustomLimit(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustom()}
                    placeholder="Add a custom limit..."
                    className="flex-1 px-4 py-2.5 rounded-[var(--radius-lg)] bg-bg-secondary border border-white/5 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-red-primary/40"
                />
                <button
                    onClick={addCustom}
                    className="px-4 py-2.5 rounded-[var(--radius-lg)] bg-bg-tertiary text-text-secondary text-sm hover:bg-bg-hover transition-colors cursor-pointer"
                >
                    Add
                </button>
            </div>

            {/* Summary */}
            {(hardLimits.length > 0 || softLimits.length > 0) && (
                <div className="space-y-2 text-xs">
                    {hardLimits.length > 0 && (
                        <div className="flex items-start gap-2">
                            <ShieldOff size={14} className="text-red-primary flex-shrink-0 mt-0.5" />
                            <span className="text-text-secondary">
                                <span className="text-red-primary font-semibold">{hardLimits.length}</span> hard limit{hardLimits.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                    {softLimits.length > 0 && (
                        <div className="flex items-start gap-2">
                            <ShieldCheck size={14} className="text-purple-primary flex-shrink-0 mt-0.5" />
                            <span className="text-text-secondary">
                                <span className="text-purple-primary font-semibold">{softLimits.length}</span> soft limit{softLimits.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
