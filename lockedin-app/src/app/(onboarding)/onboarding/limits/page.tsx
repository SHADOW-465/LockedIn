'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboarding } from '@/lib/stores/onboarding-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, ShieldOff } from 'lucide-react'

const allLimits = [
    'CBT (Cock & Ball Torture)',
    'CEI (Cum Eating Instructions)',
    'Sissy / Feminization',
    'Bi / Gay Content',
    'Anal Training',
    'SPH (Small Penis Humiliation)',
    'Public Humiliation',
    'Exposure Tasks',
    'Financial Domination',
    'Sleep Deprivation',
    'Extreme Pain',
    'Body Modification',
    'Face/Identity Exposure',
    'Self-Harm (Extreme CBT)',
    'Permanent Changes',
    'Hypnosis / Mind Control',
    'Foot Worship',
    'Gooning / Porn Addiction',
    'Worship / Devotion',
    'Ruined Orgasms',
]

export default function LimitsPage() {
    const router = useRouter()
    const { hardLimits, softLimits, setHardLimits, setSoftLimits, setStep } =
        useOnboarding()
    const [localHard, setLocalHard] = useState<string[]>(hardLimits)
    const [localSoft, setLocalSoft] = useState<string[]>(softLimits)

    const toggleHardLimit = (limit: string) => {
        if (localHard.includes(limit)) {
            setLocalHard(localHard.filter((l) => l !== limit))
        } else {
            // Remove from soft if adding to hard
            setLocalSoft(localSoft.filter((l) => l !== limit))
            setLocalHard([...localHard, limit])
        }
    }

    const toggleSoftLimit = (limit: string) => {
        if (localSoft.includes(limit)) {
            setLocalSoft(localSoft.filter((l) => l !== limit))
        } else {
            // Remove from hard if adding to soft
            setLocalHard(localHard.filter((l) => l !== limit))
            setLocalSoft([...localSoft, limit])
        }
    }

    const getStatus = (limit: string) => {
        if (localHard.includes(limit)) return 'hard'
        if (localSoft.includes(limit)) return 'soft'
        return 'none'
    }

    const handleContinue = () => {
        setHardLimits(localHard)
        setSoftLimits(localSoft)
        setStep(3)
        router.push('/onboarding/profile')
    }

    return (
        <div className="min-h-screen p-4 pb-20 bg-bg-primary">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Progress */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-1 flex-1 rounded-full overflow-hidden bg-bg-tertiary">
                        <div className="h-full w-[42%] bg-purple-primary rounded-full transition-all duration-500" />
                    </div>
                    <span className="text-xs text-text-tertiary font-mono">3/7</span>
                </div>

                <div className="text-center mb-8 animate-fade-in">
                    <h1 className="text-3xl font-bold mb-2">Set Your Limits</h1>
                    <p className="text-text-secondary">
                        Hard limits are <strong className="text-red-primary">never</strong> violated.
                        Soft limits may be pushed gradually.
                    </p>
                </div>

                {/* Legend */}
                <div className="flex gap-4 justify-center">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-primary" />
                        <span className="text-xs text-text-secondary">Hard Limit</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-tier-slave" />
                        <span className="text-xs text-text-secondary">Soft Limit</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-bg-tertiary border border-white/10" />
                        <span className="text-xs text-text-secondary">No Limit</span>
                    </div>
                </div>

                {/* Safety Note */}
                <Card variant="flat" size="sm" className="!min-h-0">
                    <div className="flex items-start gap-3">
                        <Shield size={18} className="text-teal-primary shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-teal-primary">Safety Guarantee</p>
                            <p className="text-xs text-text-secondary mt-1">
                                Hard limits are absolute. The AI will never cross them, regardless of tier
                                or session. You can always update limits in Settings.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Limits Grid */}
                <div className="space-y-3">
                    {allLimits.map((limit) => {
                        const status = getStatus(limit)
                        return (
                            <Card
                                key={limit}
                                variant="flat"
                                size="sm"
                                className={`!min-h-0 py-3 transition-all ${status === 'hard'
                                        ? 'border-red-primary/50 bg-red-primary/5'
                                        : status === 'soft'
                                            ? 'border-tier-slave/50 bg-tier-slave/5'
                                            : ''
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{limit}</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => toggleSoftLimit(limit)}
                                            className={`px-3 py-1 rounded-[var(--radius-pill)] text-xs font-medium transition-all cursor-pointer ${status === 'soft'
                                                    ? 'bg-tier-slave text-black'
                                                    : 'bg-bg-tertiary text-text-tertiary hover:text-text-primary'
                                                }`}
                                        >
                                            <ShieldOff size={12} className="inline mr-1" />
                                            Soft
                                        </button>
                                        <button
                                            onClick={() => toggleHardLimit(limit)}
                                            className={`px-3 py-1 rounded-[var(--radius-pill)] text-xs font-medium transition-all cursor-pointer ${status === 'hard'
                                                    ? 'bg-red-primary text-white'
                                                    : 'bg-bg-tertiary text-text-tertiary hover:text-text-primary'
                                                }`}
                                        >
                                            <Shield size={12} className="inline mr-1" />
                                            Hard
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>

                {/* Summary */}
                <div className="flex gap-3">
                    <Badge variant="locked">{localHard.length} Hard Limits</Badge>
                    <Badge variant="warning">{localSoft.length} Soft Limits</Badge>
                    <Badge variant="genre">
                        {allLimits.length - localHard.length - localSoft.length} Open
                    </Badge>
                </div>

                <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleContinue}
                >
                    Continue
                </Button>
            </div>
        </div>
    )
}
