'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboarding } from '@/lib/stores/onboarding-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/contexts/auth-context'
import { getSupabase } from '@/lib/supabase/client'
import { createSession } from '@/lib/supabase/sessions'
import { Lock, Check, AlertTriangle } from 'lucide-react'

export default function ReviewPage() {
    const router = useRouter()
    const { user } = useAuth()
    const store = useOnboarding()
    const [isLocking, setIsLocking] = useState(false)
    const [lockComplete, setLockComplete] = useState(false)


    const handleLockIn = async () => {
        if (!user) return
        setIsLocking(true)

        try {
            const supabase = getSupabase()

            // Update profile with tier, AI personality, and mark onboarding as done
            await supabase
                .from('profiles')
                .update({
                    tier: store.tier,
                    ai_personality: store.aiPersonality,
                    onboarding_completed: true,
                })
                .eq('id', user.id)

            // Upsert preferences
            await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    hard_limits: store.hardLimits,
                    soft_limits: store.softLimits,
                    fetish_tags: store.fetishTags,
                    physical_details: store.physicalDetails,
                    notification_frequency: store.notificationFreq,
                    quiet_hours: null,
                    profile_answers: store.profileAnswers,
                }, { onConflict: 'user_id' })

            // Auto-create first lock session (168h / 1 week default)
            await createSession(
                user.id,
                store.tier ?? 'Newbie',
                168,
                store.aiPersonality ?? null
            )

            // Animate the lock-in
            setTimeout(() => {
                setLockComplete(true)
                // Redirect after animation
                setTimeout(() => {
                    store.reset()
                    router.push('/home')
                }, 2000)
            }, 1500)
        } catch (error) {
            console.error('Error saving onboarding data:', error)
            setIsLocking(false)
        }
    }

    const tierBadge = (tier: string | null) => {
        switch (tier) {
            case 'Newbie': return 'tier1'
            case 'Slave': return 'tier2'
            case 'Hardcore': return 'tier3'
            case 'Extreme': return 'tier4'
            case 'Destruction': return 'tier5'
            default: return 'genre'
        }
    }

    return (
        <div className="min-h-screen p-4 pb-20 bg-bg-primary">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Progress */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-1 flex-1 rounded-full overflow-hidden bg-bg-tertiary">
                        <div className="h-full w-full bg-purple-primary rounded-full transition-all duration-500" />
                    </div>
                    <span className="text-xs text-text-tertiary font-mono">7/7</span>
                </div>

                <div className="text-center mb-8 animate-fade-in">
                    <h1 className="text-3xl font-bold mb-2">Final Review</h1>
                    <p className="text-text-secondary">
                        Review your configuration. Once you lock in, these settings are bound.
                    </p>
                </div>

                {/* Review Cards */}
                <Card variant="raised" size="sm">
                    <div className="flex items-center justify-between">
                        <span className="text-text-tertiary text-sm">Tier</span>
                        <Badge variant={tierBadge(store.tier) as 'tier1'}>
                            {store.tier?.toUpperCase() || 'NOT SET'}
                        </Badge>
                    </div>
                </Card>

                <Card variant="raised" size="sm">
                    <div className="flex items-center justify-between">
                        <span className="text-text-tertiary text-sm">AI Personality</span>
                        <span className="text-text-primary font-medium text-sm">
                            {store.aiPersonality?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'NOT SET'}
                        </span>
                    </div>
                </Card>

                <Card variant="raised" size="sm">
                    <div className="space-y-2">
                        <span className="text-text-tertiary text-sm">Hard Limits ({store.hardLimits.length})</span>
                        <div className="flex flex-wrap gap-2">
                            {store.hardLimits.length > 0 ? (
                                store.hardLimits.map((limit) => (
                                    <Badge key={limit} variant="locked">{limit}</Badge>
                                ))
                            ) : (
                                <span className="text-xs text-text-tertiary">No hard limits set</span>
                            )}
                        </div>
                    </div>
                </Card>

                <Card variant="raised" size="sm">
                    <div className="space-y-2">
                        <span className="text-text-tertiary text-sm">Soft Limits ({store.softLimits.length})</span>
                        <div className="flex flex-wrap gap-2">
                            {store.softLimits.length > 0 ? (
                                store.softLimits.map((limit) => (
                                    <Badge key={limit} variant="warning">{limit}</Badge>
                                ))
                            ) : (
                                <span className="text-xs text-text-tertiary">No soft limits set</span>
                            )}
                        </div>
                    </div>
                </Card>

                <Card variant="raised" size="sm">
                    <div className="flex items-center justify-between">
                        <span className="text-text-tertiary text-sm">Profile Questions Answered</span>
                        <span className="text-text-primary font-medium text-sm">
                            {Object.keys(store.profileAnswers).length}
                        </span>
                    </div>
                </Card>

                {/* Warning */}
                {store.tier === 'Destruction' && (
                    <div className="bg-red-primary/10 border border-red-primary/30 rounded-[var(--radius-lg)] p-4 flex items-start gap-3">
                        <AlertTriangle size={20} className="text-red-primary shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-red-primary font-semibold">DESTRUCTION TIER WARNING</p>
                            <p className="text-xs text-text-secondary mt-1">
                                You have selected the most extreme tier. This is designed to destroy
                                your sense of self. There is no affection, no mercy, no escape except
                                emergency release.
                            </p>
                        </div>
                    </div>
                )}

                {/* Lock In Button */}
                <div className="text-center pt-4">
                    {!lockComplete ? (
                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full text-xl py-5 relative overflow-hidden"
                            onClick={handleLockIn}
                            disabled={isLocking || !store.tier}
                        >
                            {isLocking ? (
                                <span className="flex items-center gap-2">
                                    <Lock size={20} className="animate-spin" />
                                    Locking...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Lock size={20} />
                                    Lock In
                                </span>
                            )}
                        </Button>
                    ) : (
                        <div className="animate-scale-in">
                            <div className="w-20 h-20 mx-auto rounded-full bg-teal-primary/20 flex items-center justify-center mb-4 glow-teal">
                                <Check size={36} className="text-teal-primary" />
                            </div>
                            <h2 className="text-3xl font-bold font-mono">
                                Locked<span className="text-red-primary text-glow-red">In</span>
                            </h2>
                            <p className="text-text-secondary mt-2">You are now under AI control.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
