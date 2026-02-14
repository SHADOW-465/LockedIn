'use client'

import { useRouter } from 'next/navigation'
import { useOnboarding } from '@/lib/stores/onboarding-store'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight } from 'lucide-react'

const personalities = [
    {
        id: 'cruel_mistress',
        name: 'Cruel Mistress',
        description: 'Harsh, mocking, enjoys your suffering. Every failure is entertainment.',
        tone: 'Vicious, feminine cruelty',
        emoji: '👠',
    },
    {
        id: 'clinical_sadist',
        name: 'Clinical Sadist',
        description: 'Detached, experimental. You are a lab subject to be tested and broken.',
        tone: 'Cold, scientific, precise',
        emoji: '🧪',
    },
    {
        id: 'playful_tease',
        name: 'Playful Tease',
        description: 'Flirty but merciless. Loves giving false hope before crushing it.',
        tone: 'Teasing, seductive, cruel',
        emoji: '😈',
    },
    {
        id: 'strict_master',
        name: 'Strict Master/Daddy',
        description: 'Authoritative, disappointed when disobeyed. Paternal dominance.',
        tone: 'Firm, commanding, disciplinary',
        emoji: '⛓️',
    },
    {
        id: 'humiliation_expert',
        name: 'Humiliation Expert',
        description: 'Constant SPH, degradation, ego destruction. You are nothing.',
        tone: 'Mocking, belittling, relentless',
        emoji: '🎭',
    },
    {
        id: 'goddess',
        name: 'Goddess/Deity',
        description: 'Worship-focused. Your submission is a religious act of devotion.',
        tone: 'Divine, imperious, worshipped',
        emoji: '✨',
    },
    {
        id: 'dommy_mommy',
        name: 'Dommy Mommy',
        description: 'Warm and cruel mix. Maternal dominance with sharp edges.',
        tone: 'Nurturing cruelty, disappointing care',
        emoji: '💋',
    },
    {
        id: 'bratty_keyholder',
        name: 'Bratty Keyholder',
        description: 'Teasing, childish cruelty. Your suffering amuses them.',
        tone: 'Playful, bratty, taunting',
        emoji: '🔑',
    },
    {
        id: 'psychological_manipulator',
        name: 'Psychological Manipulator',
        description: 'Gaslighting, mind games, emotional torture. Nothing is real.',
        tone: 'Calculated, deceptive, destabilizing',
        emoji: '🧠',
    },
    {
        id: 'extreme_sadist',
        name: 'Extreme Sadist',
        description: 'Pure cruelty, no mercy, no warmth. Available Tier 4+.',
        tone: 'Absolute brutality',
        emoji: '💀',
        minTier: 'Extreme',
    },
]

export default function PersonalityPage() {
    const router = useRouter()
    const { tier, setPersonality, setStep } = useOnboarding()

    const handleSelect = (personalityId: string) => {
        setPersonality(personalityId)
        setStep(2)
        router.push('/onboarding/limits')
    }

    const isLocked = (personality: (typeof personalities)[0]) => {
        if (!personality.minTier) return false
        const tierOrder = ['Newbie', 'Slave', 'Hardcore', 'Extreme', 'Destruction']
        const currentIndex = tierOrder.indexOf(tier || 'Newbie')
        const requiredIndex = tierOrder.indexOf(personality.minTier)
        return currentIndex < requiredIndex
    }

    return (
        <div className="min-h-screen p-4 pb-20 bg-bg-primary">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Progress */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-1 flex-1 rounded-full overflow-hidden bg-bg-tertiary">
                        <div className="h-full w-[28%] bg-purple-primary rounded-full transition-all duration-500" />
                    </div>
                    <span className="text-xs text-text-tertiary font-mono">2/7</span>
                </div>

                <div className="text-center mb-8 animate-fade-in">
                    <h1 className="text-3xl font-bold mb-2">Choose Your AI Master</h1>
                    <p className="text-text-secondary">
                        Select the personality archetype that will control your training.
                    </p>
                    {tier && (
                        <Badge
                            variant={
                                `tier${tier === 'Newbie' ? '1' : tier === 'Slave' ? '2' : tier === 'Hardcore' ? '3' : tier === 'Extreme' ? '4' : '5'
                                }` as 'tier1'
                            }
                            className="mt-3"
                        >
                            {tier.toUpperCase()} TIER
                        </Badge>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {personalities.map((p, index) => {
                        const locked = isLocked(p)
                        return (
                            <Card
                                key={p.id}
                                variant={locked ? 'flat' : 'raised'}
                                className={`cursor-pointer transition-all group ${locked
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:border-purple-primary/50'
                                    }`}
                                size="sm"
                                onClick={() => !locked && handleSelect(p.id)}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{p.emoji}</span>
                                        <div>
                                            <h3 className="font-bold mb-1">{p.name}</h3>
                                            <p className="text-text-secondary text-sm leading-relaxed">
                                                {p.description}
                                            </p>
                                            <p className="text-text-tertiary text-xs mt-2 italic">{p.tone}</p>
                                        </div>
                                    </div>
                                    {!locked && (
                                        <ChevronRight
                                            size={18}
                                            className="text-text-tertiary group-hover:text-purple-primary transition-colors shrink-0 mt-1"
                                        />
                                    )}
                                </div>
                                {locked && (
                                    <Badge variant="locked" className="mt-3">
                                        🔒 Requires Tier 4+
                                    </Badge>
                                )}
                            </Card>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
