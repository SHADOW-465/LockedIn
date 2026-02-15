'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboarding } from '@/lib/stores/onboarding-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, Check } from 'lucide-react'

const ALL_REGIMENS = [
    { name: 'Sissy Training', description: 'Feminization, dressing, makeup humiliation', tier: 'Slave' },
    { name: 'Obedience & Service', description: 'Task compliance, protocol drilling', tier: 'Newbie' },
    { name: 'Bi/Fluidity Training', description: 'Gradual bi-curiosity expansion', tier: 'Slave' },
    { name: 'SPH Conditioning', description: 'Size-based humiliation & acceptance', tier: 'Slave' },
    { name: 'CEI Mastery', description: 'Cum eating instruction progression', tier: 'Hardcore' },
    { name: 'Pain Tolerance', description: 'CBT & impact play escalation', tier: 'Hardcore' },
    { name: 'Anal Mastery', description: 'Plugging, stretching, prostate training', tier: 'Hardcore' },
    { name: 'Edging Endurance', description: 'Edge counting & denial stamina', tier: 'Newbie' },
    { name: 'Worship & Devotion', description: 'Foot, body, cock worship protocols', tier: 'Slave' },
    { name: 'Mind-Break', description: 'Psychological overwhelm & ego dissolution', tier: 'Extreme' },
    { name: 'Gay Transformation', description: 'Straight-to-gay conversion pathway', tier: 'Extreme' },
    { name: 'TPE (Total Power Exchange)', description: 'Complete schedule & life control', tier: 'Extreme' },
    { name: 'Humiliation Marathon', description: 'Public, social, verbal humiliation', tier: 'Hardcore' },
    { name: 'Gooning', description: 'Extended porn-trance & brain melting', tier: 'Slave' },
    { name: 'Findom', description: 'Financial domination & tribute training', tier: 'Extreme' },
]

const tierColors: Record<string, string> = {
    Newbie: 'text-tier-newbie',
    Slave: 'text-tier-slave',
    Hardcore: 'text-purple-primary',
    Extreme: 'text-red-primary',
}

export default function RegimensPage() {
    const router = useRouter()
    const { preferredRegimens, setPreferredRegimens, setStep } = useOnboarding()
    const [selected, setSelected] = useState<string[]>(preferredRegimens ?? [])

    const toggleRegimen = (name: string) => {
        setSelected(prev =>
            prev.includes(name)
                ? prev.filter(r => r !== name)
                : [...prev, name]
        )
    }

    const handleContinue = () => {
        setPreferredRegimens(selected)
        setStep(6)
        router.push('/onboarding/profile')
    }

    return (
        <div className="min-h-screen p-4 pb-20 bg-bg-primary">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Progress */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-1 flex-1 rounded-full overflow-hidden bg-bg-tertiary">
                        <div className="h-full w-[60%] bg-purple-primary rounded-full transition-all duration-500" />
                    </div>
                    <span className="text-xs text-text-tertiary font-mono">6/10</span>
                </div>

                <div className="text-center mb-8 animate-fade-in">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Dumbbell size={24} className="text-purple-primary" />
                        <h1 className="text-3xl font-bold">Training Regimens</h1>
                    </div>
                    <p className="text-text-secondary">
                        Select the training pathways that interest you. Your AI will build sessions around these.
                    </p>
                    <p className="text-xs text-text-tertiary mt-2">
                        Select at least 1. You can change these later in settings.
                    </p>
                </div>

                {/* Regimen Tags Grid */}
                <div className="space-y-3">
                    {ALL_REGIMENS.map((regimen) => {
                        const isSelected = selected.includes(regimen.name)
                        return (
                            <Card
                                key={regimen.name}
                                variant="flat"
                                size="sm"
                                className={`!min-h-0 py-3 cursor-pointer transition-all duration-200 ${isSelected
                                    ? 'border-purple-primary/50 bg-purple-primary/10'
                                    : 'hover:bg-bg-tertiary'
                                    }`}
                                onClick={() => toggleRegimen(regimen.name)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{regimen.name}</span>
                                            <Badge variant="genre">
                                                <span className={tierColors[regimen.tier] ?? 'text-text-tertiary'}>
                                                    {regimen.tier}+
                                                </span>
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-text-tertiary mt-0.5">
                                            {regimen.description}
                                        </p>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ml-3 ${isSelected
                                        ? 'border-purple-primary bg-purple-primary'
                                        : 'border-white/10'
                                        }`}>
                                        {isSelected && <Check size={14} className="text-white" />}
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>

                {/* Selected count */}
                <div className="text-center">
                    <span className="text-xs text-text-tertiary">
                        {selected.length} regimen{selected.length !== 1 ? 's' : ''} selected
                    </span>
                </div>

                <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleContinue}
                    disabled={selected.length === 0}
                >
                    Continue
                </Button>
            </div>
        </div>
    )
}
