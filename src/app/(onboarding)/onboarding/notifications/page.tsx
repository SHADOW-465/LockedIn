'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboarding } from '@/lib/stores/onboarding-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Moon, Sun, Check } from 'lucide-react'

const frequencies = [
    {
        id: 'low',
        label: 'Low',
        description: '2-4 notifications per day. Gentle check-ins.',
        icon: '🔔',
    },
    {
        id: 'medium',
        label: 'Medium',
        description: '6-10 notifications per day. Regular reminders and tasks.',
        icon: '🔔🔔',
    },
    {
        id: 'high',
        label: 'High',
        description: '12-20 notifications per day. Frequent commands and demands.',
        icon: '🔔🔔🔔',
    },
    {
        id: 'extreme',
        label: 'Extreme',
        description: 'Constant interruptions. Your phone becomes a leash.',
        icon: '⚡',
    },
] as const

export default function NotificationsPage() {
    const router = useRouter()
    const { notificationFrequency, setNotificationFrequency, setStep } = useOnboarding()
    const [freq, setFreq] = useState<'low' | 'medium' | 'high' | 'extreme'>(notificationFrequency ?? 'medium')
    const [quietStart, setQuietStart] = useState('23:00')
    const [quietEnd, setQuietEnd] = useState('07:00')
    const [quietEnabled, setQuietEnabled] = useState(true)

    const handleContinue = () => {
        setNotificationFrequency(freq)
        setStep(9)
        router.push('/onboarding/review')
    }

    return (
        <div className="min-h-screen p-4 pb-20 bg-bg-primary">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Progress */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-1 flex-1 rounded-full overflow-hidden bg-bg-tertiary">
                        <div className="h-full w-[90%] bg-purple-primary rounded-full transition-all duration-500" />
                    </div>
                    <span className="text-xs text-text-tertiary font-mono">9/10</span>
                </div>

                <div className="text-center mb-8 animate-fade-in">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Bell size={24} className="text-purple-primary" />
                        <h1 className="text-3xl font-bold">Notifications</h1>
                    </div>
                    <p className="text-text-secondary">
                        How aggressively should your AI interrupt your day?
                    </p>
                </div>

                {/* Frequency Options */}
                <div className="space-y-3">
                    {frequencies.map((option) => {
                        const isSelected = freq === option.id
                        return (
                            <Card
                                key={option.id}
                                variant="flat"
                                size="sm"
                                className={`!min-h-0 py-4 cursor-pointer transition-all duration-200 ${isSelected
                                    ? 'border-purple-primary/50 bg-purple-primary/10'
                                    : 'hover:bg-bg-tertiary'
                                    }`}
                                onClick={() => setFreq(option.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{option.icon}</span>
                                        <div>
                                            <span className="text-sm font-medium">{option.label}</span>
                                            <p className="text-xs text-text-tertiary mt-0.5">
                                                {option.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                                        ? 'border-purple-primary bg-purple-primary'
                                        : 'border-white/10'
                                        }`}>
                                        {isSelected && <Check size={12} className="text-white" />}
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>

                {/* Quiet Hours */}
                <Card variant="raised" size="sm">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Moon size={16} className="text-text-tertiary" />
                                <span className="text-sm font-medium">Quiet Hours</span>
                            </div>
                            <button
                                onClick={() => setQuietEnabled(!quietEnabled)}
                                className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${quietEnabled ? 'bg-purple-primary' : 'bg-bg-tertiary'
                                    }`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-1 ${quietEnabled ? 'translate-x-4' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>

                        {quietEnabled && (
                            <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                                <div className="flex-1">
                                    <label className="text-xs text-text-tertiary flex items-center gap-1 mb-1">
                                        <Moon size={12} /> Start
                                    </label>
                                    <input
                                        type="time"
                                        value={quietStart}
                                        onChange={(e) => setQuietStart(e.target.value)}
                                        className="w-full bg-bg-primary rounded-[var(--radius-md)] px-3 py-2 text-sm font-mono border border-white/5 focus:outline-none focus:ring-1 focus:ring-purple-primary/50"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-text-tertiary flex items-center gap-1 mb-1">
                                        <Sun size={12} /> End
                                    </label>
                                    <input
                                        type="time"
                                        value={quietEnd}
                                        onChange={(e) => setQuietEnd(e.target.value)}
                                        className="w-full bg-bg-primary rounded-[var(--radius-md)] px-3 py-2 text-sm font-mono border border-white/5 focus:outline-none focus:ring-1 focus:ring-purple-primary/50"
                                    />
                                </div>
                            </div>
                        )}

                        <p className="text-xs text-text-tertiary">
                            No notifications during quiet hours — unless your tier overrides it.
                        </p>
                    </div>
                </Card>

                {/* Extreme Tier Warning */}
                {freq === 'extreme' && (
                    <Card variant="flat" size="sm" className="!min-h-0 border-red-primary/20">
                        <p className="text-xs text-red-primary">
                            ⚠️ Extreme notifications are relentless. Your phone will vibrate constantly.
                            Quiet hours may be partially ignored at higher tiers.
                        </p>
                    </Card>
                )}

                <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleContinue}
                >
                    Final Review →
                </Button>
            </div>
        </div>
    )
}
