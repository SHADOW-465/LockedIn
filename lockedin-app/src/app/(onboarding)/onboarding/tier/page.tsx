'use client'

import { useRouter } from 'next/navigation'
import { useOnboarding } from '@/lib/stores/onboarding-store'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ChevronRight } from 'lucide-react'

const tiers = [
    {
        id: 'Newbie',
        name: 'TIER 1: NEWBIE',
        badge: 'tier1' as const,
        description: 'Curious beginner exploring submission',
        punishments: 'Mild discomfort, +30min-2h time additions',
        tasks: '1-3 edges, light CEI, basic grooming',
        language: '"Good boy", "Try harder"',
        caged: '~30% of the time',
        affection: '30% supportive interactions',
    },
    {
        id: 'Slave',
        name: 'TIER 2: SLAVE',
        badge: 'tier2' as const,
        description: 'Committed submissive seeking firm control',
        punishments: 'Moderate pain, +2-8h time additions',
        tasks: '5-10 edges, full CEI, CBT, anal plug',
        language: '"Slave", "Pathetic", "Worthless toy"',
        caged: '~50% of the time',
        affection: '15% rare approval moments',
    },
    {
        id: 'Hardcore',
        name: 'TIER 3: HARDCORE',
        badge: 'tier3' as const,
        description: 'Extreme masochist craving intense suffering',
        punishments: 'Severe pain, +12-48h extensions',
        tasks: '20-50 edges, ballbusting, exposure humiliation',
        language: '"Worthless pig", "Filthy cum dumpster"',
        caged: '~70% of the time',
        affection: '5% rare glimpses after extreme suffering',
    },
    {
        id: 'Extreme',
        name: 'TIER 4: EXTREME',
        badge: 'tier4' as const,
        description: 'Total devotion, life-altering control',
        punishments: 'Brutal torture, indefinite lock extensions',
        tasks: '100+ edges/day, gooning marathons, TPE',
        language: '"Subhuman slave", "Broken fucktoy"',
        caged: '~90% of the time',
        affection: '2% extremely rare soft moments',
    },
    {
        id: 'Destruction',
        name: 'TIER 5: DESTRUCTION',
        badge: 'tier5' as const,
        description: 'Complete annihilation of self and identity',
        punishments: 'Absolutely merciless, identity destruction',
        tasks: '24/7 edge state, permanent modifications, mind obliteration',
        language: 'Addressed as "it", "thing", "object"',
        caged: '24/7/permanent lock',
        affection: '0% — no affection, no kindness, ever',
        warning:
            'This tier is designed to destroy your sense of self. Do not choose unless you fully accept permanent psychological changes.',
    },
]

export default function TierSelectionPage() {
    const router = useRouter()
    const { setTier, setStep } = useOnboarding()

    const handleSelect = (tierId: string) => {
        setTier(tierId)
        setStep(1)
        router.push('/onboarding/personality')
    }

    return (
        <div className="min-h-screen p-4 pb-20 bg-bg-primary">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Progress indicator */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-1 flex-1 rounded-full overflow-hidden bg-bg-tertiary">
                        <div className="h-full w-[14%] bg-purple-primary rounded-full transition-all duration-500" />
                    </div>
                    <span className="text-xs text-text-tertiary font-mono">1/7</span>
                </div>

                {/* Header */}
                <div className="text-center mb-8 animate-fade-in">
                    <h1 className="text-3xl font-bold mb-2">Choose Your Tier</h1>
                    <p className="text-text-secondary">
                        Select your intensity level. This determines AI cruelty, punishment
                        severity, and task difficulty.
                    </p>
                </div>

                {/* Tiers */}
                <div className="space-y-4">
                    {tiers.map((tier, index) => (
                        <Card
                            key={tier.id}
                            variant="raised"
                            className="cursor-pointer hover:border-purple-primary/50 transition-all group"
                            onClick={() => handleSelect(tier.id)}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                                    <p className="text-text-secondary text-sm">{tier.description}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={tier.badge}>{tier.id.toUpperCase()}</Badge>
                                    <ChevronRight
                                        size={20}
                                        className="text-text-tertiary group-hover:text-purple-primary transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-text-tertiary text-xs uppercase tracking-wide">
                                        Punishments
                                    </span>
                                    <p className="text-text-secondary mt-0.5">{tier.punishments}</p>
                                </div>
                                <div>
                                    <span className="text-text-tertiary text-xs uppercase tracking-wide">
                                        Typical Tasks
                                    </span>
                                    <p className="text-text-secondary mt-0.5">{tier.tasks}</p>
                                </div>
                                <div>
                                    <span className="text-text-tertiary text-xs uppercase tracking-wide">
                                        Language
                                    </span>
                                    <p className="text-text-secondary mt-0.5">{tier.language}</p>
                                </div>
                                <div>
                                    <span className="text-text-tertiary text-xs uppercase tracking-wide">
                                        Caged
                                    </span>
                                    <p className="text-text-secondary mt-0.5">{tier.caged}</p>
                                </div>
                            </div>

                            <div className="mt-3">
                                <span className="text-text-tertiary text-xs uppercase tracking-wide">
                                    Affection
                                </span>
                                <p className="text-text-secondary text-sm mt-0.5">{tier.affection}</p>
                            </div>

                            {tier.warning && (
                                <div className="mt-4 bg-red-primary/10 border border-red-primary/30 rounded-[var(--radius-md)] p-3 flex items-start gap-2">
                                    <AlertTriangle size={14} className="text-red-primary mt-0.5 shrink-0" />
                                    <p className="text-xs text-red-primary">{tier.warning}</p>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
