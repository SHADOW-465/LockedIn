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
import { Lock, LockOpen, LockKeyhole, Check, AlertTriangle, Ruler, Dumbbell, Bell, Calendar } from 'lucide-react'

export default function ReviewPage() {
    const router = useRouter()
    const { user } = useAuth()
    const store = useOnboarding()
    const [isLocking, setIsLocking] = useState(false)
    const [lockComplete, setLockComplete] = useState(false)
    const [lockSealed, setLockSealed] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleLockIn = async () => {
        if (!user) return
        setIsLocking(true)
        setError(null)

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out - please check your connection')), 15000)
        )

        try {
            console.log('Starting Lock In process for user:', user.id)
            const supabase = getSupabase()

            // Verify auth state matches
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser || authUser.id !== user.id) {
                console.error('Auth mismatch:', { contextUser: user.id, authUser: authUser?.id })
                throw new Error('Authentication sync error. Please refresh the page.')
            }

            // 1. Update profile
            console.log('Step 1: Updating profile...')
            const profileUpdate = supabase
                .from('profiles')
                .update({
                    tier: store.tier,
                    ai_personality: store.aiPersonality,
                    onboarding_completed: true,
                })
                .eq('id', user.id)
                .select() // Select to verify update happened

            const { data: profileData, error: profileError } = await Promise.race([
                profileUpdate,
                timeoutPromise
            ]) as any

            if (profileError) {
                console.error('Profile update error:', profileError)
                throw new Error('Failed to save profile settings: ' + profileError.message)
            }
            if (!profileData || profileData.length === 0) {
                console.error('Profile update returned no rows - RLS mismatch?')
                throw new Error('Profile update failed. Please sign out and sign in again.')
            }
            console.log('Step 1 Complete. Profile updated.')

            // 2. Upsert preferences — send fetish_tags as string[] not {tag,intensity}[]
            const fetishTagNames = store.fetishTags?.map(t =>
                typeof t === 'string' ? t : t.tag
            ) ?? []

            console.log('Step 2: Upserting preferences...')
            const prefsUpsert = supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    hard_limits: store.hardLimits,
                    soft_limits: store.softLimits,
                    fetish_tags: fetishTagNames,
                    physical_details: store.physicalDetails ?? {},
                    notification_frequency: store.notificationFreq,
                    quiet_hours: null,
                    profile_answers: store.profileAnswers,
                    preferred_regimens: store.preferredRegimens ?? [],
                }, { onConflict: 'user_id' })

            const { error: prefsError } = await Promise.race([
                prefsUpsert,
                timeoutPromise
            ]) as any

            if (prefsError) {
                console.error('Preferences upsert error:', prefsError)
                throw new Error('Failed to save preferences')
            }
            console.log('Step 2 Complete. Preferences saved.')

            // 3. Create first session with user's chosen lock duration
            console.log('Step 3: Creating session...')
            const lockHours = store.lockGoal ?? 168

            // We don't wrap createSession in race because it's a wrapper itself, 
            // but we assume it's fast. Let's trust it for now.
            const session = await createSession(
                user.id,
                store.tier ?? 'Newbie',
                lockHours,
                store.aiPersonality ?? null
            )

            if (!session) {
                console.error('Session creation returned null')
                // Non-blocking — proceed even if session fails
            }
            console.log('Step 3 Complete. Session created.')

            // 4. Phase 2: Locking animation (icon morphs, shimmer)
            console.log('Starting animation sequence...')
            setLockComplete(true)

            // Phase 3: After 800ms, seal — "ed" slides in, glow pulse
            setTimeout(() => {
                setLockSealed(true)
            }, 800)

            // Redirect after full animation plays
            setTimeout(() => {
                console.log('Animation done, resetting store and redirecting...')
                store.reset()
                // Use router with refresh to avoid race condition
                router.refresh() // Refresh server components to get updated profile
                router.replace('/home')
            }, 3200)
        } catch (err) {
            console.error('Error saving onboarding data:', err)
            setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
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

    const getSizeBucket = () => {
        if (!store.physicalDetails?.penisSize) return null
        const len = store.physicalDetails.penisSize.erectLength
        if (len < 3) return '<3"'
        if (len < 4) return '3–4"'
        if (len < 5) return '4–5"'
        if (len < 6) return '5–6"'
        if (len < 7) return '6–7"'
        return '7"+'
    }

    const lockDays = Math.round((store.lockGoal ?? 168) / 24)

    return (
        <div className="min-h-screen p-4 pb-20 bg-bg-primary">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Progress */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-1 flex-1 rounded-full overflow-hidden bg-bg-tertiary">
                        <div className="h-full w-full bg-purple-primary rounded-full transition-all duration-500" />
                    </div>
                    <span className="text-xs text-text-tertiary font-mono">10/10</span>
                </div>

                <div className="text-center mb-8 animate-fade-in">
                    <h1 className="text-3xl font-bold mb-2">Final Review</h1>
                    <p className="text-text-secondary">
                        Review your configuration. Once you lock in, these settings are bound.
                    </p>
                </div>

                {/* Tier */}
                <Card variant="raised" size="sm">
                    <div className="flex items-center justify-between">
                        <span className="text-text-tertiary text-sm">Tier</span>
                        <Badge variant={tierBadge(store.tier) as 'tier1'}>
                            {store.tier?.toUpperCase() || 'NOT SET'}
                        </Badge>
                    </div>
                </Card>

                {/* AI Personality */}
                <Card variant="raised" size="sm">
                    <div className="flex items-center justify-between">
                        <span className="text-text-tertiary text-sm">AI Personality</span>
                        <span className="text-text-primary font-medium text-sm">
                            {store.aiPersonality?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'NOT SET'}
                        </span>
                    </div>
                </Card>

                {/* Hard Limits */}
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

                {/* Soft Limits */}
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

                {/* Physical Details */}
                {store.physicalDetails && (
                    <Card variant="raised" size="sm">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Ruler size={14} className="text-text-tertiary" />
                                <span className="text-text-tertiary text-sm">Physical Details</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-text-tertiary">Erect: </span>
                                    <span className="text-text-primary font-medium">
                                        {store.physicalDetails.penisSize.erectLength}" × {store.physicalDetails.penisSize.erectGirth}"
                                    </span>
                                </div>
                                <div>
                                    <span className="text-text-tertiary">Type: </span>
                                    <span className="text-text-primary font-medium capitalize">
                                        {store.physicalDetails.penisSize.growerOrShower}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-text-tertiary">Size: </span>
                                    <Badge variant="genre">{getSizeBucket()}</Badge>
                                </div>
                                <div>
                                    <span className="text-text-tertiary">Age: </span>
                                    <span className="text-text-primary font-medium">{store.physicalDetails.age}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Preferred Regimens */}
                {(store.preferredRegimens?.length ?? 0) > 0 && (
                    <Card variant="raised" size="sm">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Dumbbell size={14} className="text-text-tertiary" />
                                <span className="text-text-tertiary text-sm">Preferred Regimens ({store.preferredRegimens?.length})</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {store.preferredRegimens?.map((r) => (
                                    <Badge key={r} variant="genre">{r}</Badge>
                                ))}
                            </div>
                        </div>
                    </Card>
                )}

                {/* Profile Questions */}
                <Card variant="raised" size="sm">
                    <div className="flex items-center justify-between">
                        <span className="text-text-tertiary text-sm">Profile Questions Answered</span>
                        <span className="text-text-primary font-medium text-sm">
                            {Object.keys(store.profileAnswers).length}
                        </span>
                    </div>
                </Card>

                {/* Lock Goal */}
                <Card variant="raised" size="sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-text-tertiary" />
                            <span className="text-text-tertiary text-sm">Initial Lock Duration</span>
                        </div>
                        <Badge variant="locked">{lockDays} days</Badge>
                    </div>
                </Card>

                {/* Notification Frequency */}
                <Card variant="raised" size="sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bell size={14} className="text-text-tertiary" />
                            <span className="text-text-tertiary text-sm">Notifications</span>
                        </div>
                        <span className="text-text-primary font-medium text-sm capitalize">
                            {store.notificationFreq}
                        </span>
                    </div>
                </Card>

                {/* Destruction Warning */}
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

                {/* Error Message */}
                {error && (
                    <div className="bg-red-primary/10 border border-red-primary/30 rounded-[var(--radius-lg)] p-4 text-center">
                        <p className="text-sm text-red-primary">{error}</p>
                        <p className="text-xs text-text-tertiary mt-1">Check your connection and try again.</p>
                    </div>
                )}

                {/* Lock In Button — §11.2 Animation */}
                <div className="text-center pt-4">
                    {!lockSealed ? (
                        <button
                            className={`
                                w-full py-5 rounded-[var(--radius-pill)] text-xl font-bold
                                relative overflow-hidden transition-all duration-500 cursor-pointer
                                flex items-center justify-center gap-3
                                ${lockComplete
                                    ? 'bg-red-primary/20 border-2 border-red-primary/50 text-red-primary'
                                    : 'bg-purple-primary hover:bg-purple-primary/90 text-white border-2 border-transparent'
                                }
                                disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                            onClick={handleLockIn}
                            disabled={isLocking || !store.tier}
                        >
                            {/* Shimmer sweep on locking */}
                            {lockComplete && (
                                <span
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                                    style={{ animation: 'lockin-shimmer-sweep 0.8s ease-out forwards' }}
                                />
                            )}

                            {/* Lock icon: LockOpen → LockKeyhole (animating closed) */}
                            <span className="relative" style={lockComplete ? { animation: 'lock-shackle-close 0.6s ease-out forwards' } : undefined}>
                                {lockComplete ? (
                                    <LockKeyhole size={22} />
                                ) : isLocking ? (
                                    <Lock size={22} className="animate-spin" />
                                ) : (
                                    <LockOpen size={22} />
                                )}
                            </span>

                            {/* Text: "Lock In" → "Locking..." → morphs next phase */}
                            <span className="relative font-mono tracking-wide">
                                {isLocking && !lockComplete ? 'Locking...' : 'Lock In'}
                            </span>
                        </button>
                    ) : (
                        /* Phase 3: Sealed — "Lock" + "ed" slides in + "In" stays */
                        <div className="space-y-5">
                            {/* The sealed lock icon with glow */}
                            <div
                                className="w-20 h-20 mx-auto rounded-full bg-red-primary/10 border-2 border-red-primary/40 flex items-center justify-center"
                                style={{ animation: 'lockin-pulse 2s ease-in-out infinite' }}
                            >
                                <Lock size={36} className="text-red-primary" />
                            </div>

                            {/* "Lock" + "ed" slides in + "In" — the signature animation */}
                            <h2 className="text-4xl font-bold font-mono inline-flex items-baseline justify-center w-full">
                                <span>Lock</span>
                                <span
                                    className="inline-block overflow-hidden"
                                    style={{ animation: 'lockin-ed-slide 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
                                >
                                    ed
                                </span>
                                <span className="text-red-primary" style={{ textShadow: '0 0 12px rgba(211,47,47,0.5)' }}>In</span>
                            </h2>

                            <p
                                className="text-text-secondary text-sm"
                                style={{ animation: 'lockin-fade-text 0.6s ease-out 0.4s both' }}
                            >
                                You are now under AI control.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
