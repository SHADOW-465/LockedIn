'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboarding } from '@/lib/stores/onboarding-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, AlertTriangle } from 'lucide-react'

export default function LockGoalPage() {
    const router = useRouter()
    const { lockGoal, setLockGoal, setStep, tier } = useOnboarding()
    const [hours, setHours] = useState(lockGoal ?? 168)

    const days = Math.round(hours / 24)
    const releaseDate = useMemo(() => {
        const d = new Date()
        d.setHours(d.getHours() + hours)
        return d
    }, [hours])

    const formatDate = (d: Date) =>
        d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

    const getDurationLabel = () => {
        if (days <= 3) return { text: 'Warm-up', color: 'text-tier-newbie' }
        if (days <= 7) return { text: 'Standard', color: 'text-tier-slave' }
        if (days <= 14) return { text: 'Challenge', color: 'text-purple-primary' }
        if (days <= 30) return { text: 'Endurance', color: 'text-tier-slave' }
        if (days <= 60) return { text: 'Extreme', color: 'text-red-primary' }
        return { text: 'Destruction', color: 'text-red-primary' }
    }

    const label = getDurationLabel()

    const handleContinue = () => {
        setLockGoal(hours)
        setStep(8)
        router.push('/onboarding/notifications')
    }

    return (
        <div className="min-h-screen p-4 pb-20 bg-bg-primary">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Progress */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-1 flex-1 rounded-full overflow-hidden bg-bg-tertiary">
                        <div className="h-full w-[80%] bg-purple-primary rounded-full transition-all duration-500" />
                    </div>
                    <span className="text-xs text-text-tertiary font-mono">8/10</span>
                </div>

                <div className="text-center mb-8 animate-fade-in">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Calendar size={24} className="text-purple-primary" />
                        <h1 className="text-3xl font-bold">Lock Duration</h1>
                    </div>
                    <p className="text-text-secondary">
                        How long should your first lock session last?
                    </p>
                </div>

                {/* Duration Display */}
                <Card variant="hero" className="text-center">
                    <div className="text-6xl font-bold font-mono mb-1">
                        {days}
                    </div>
                    <div className="text-lg text-text-secondary mb-2">
                        day{days !== 1 ? 's' : ''} <span className="text-text-tertiary">({hours}h)</span>
                    </div>
                    <Badge variant="genre">
                        <span className={label.color}>{label.text}</span>
                    </Badge>
                </Card>

                {/* Slider */}
                <Card variant="raised" size="sm">
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs text-text-tertiary">
                            <span>1 day</span>
                            <span>90 days</span>
                        </div>
                        <input
                            type="range"
                            min={24} max={2160} step={24}
                            value={hours}
                            onChange={(e) => setHours(parseInt(e.target.value))}
                            className="w-full accent-purple-primary"
                        />
                        {/* Preset buttons */}
                        <div className="flex flex-wrap gap-2 pt-2">
                            {[
                                { label: '3d', h: 72 },
                                { label: '1w', h: 168 },
                                { label: '2w', h: 336 },
                                { label: '1m', h: 720 },
                                { label: '3m', h: 2160 },
                            ].map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={() => setHours(preset.h)}
                                    className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium transition-all cursor-pointer border ${hours === preset.h
                                        ? 'bg-purple-primary text-white border-purple-primary'
                                        : 'bg-bg-tertiary border-white/5 text-text-secondary hover:text-text-primary'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Calendar Preview */}
                <Card variant="raised" size="sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-text-tertiary" />
                            <span className="text-sm text-text-tertiary">Scheduled Release</span>
                        </div>
                        <span className="text-sm font-mono text-red-primary font-semibold">
                            {formatDate(releaseDate)}
                        </span>
                    </div>
                </Card>

                {/* AI Warning */}
                <Card variant="flat" size="sm" className="!min-h-0 border-tier-slave/20">
                    <div className="flex items-start gap-3">
                        <AlertTriangle size={16} className="text-tier-slave shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs text-text-secondary">
                                <span className="text-tier-slave font-semibold">Important:</span> The AI can and will
                                extend your lock time based on performance, punishment, and compliance.
                                This is a <em>starting</em> duration — not a guarantee.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Extreme Tier Warning */}
                {days > 30 && (
                    <Card variant="flat" size="sm" className="!min-h-0 border-red-primary/20">
                        <div className="flex items-start gap-3">
                            <AlertTriangle size={16} className="text-red-primary shrink-0 mt-0.5" />
                            <p className="text-xs text-red-primary">
                                {days > 60
                                    ? 'Beyond 60 days is Destruction-tier territory. Only choose this if you are ready to lose all autonomy.'
                                    : 'Extended locks are intense. Emergency release is always available but carries severe penalties.'
                                }
                            </p>
                        </div>
                    </Card>
                )}

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
