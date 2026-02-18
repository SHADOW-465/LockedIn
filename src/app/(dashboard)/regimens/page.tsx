'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Dumbbell, Plus, ChevronRight, Pause, Play, X, CheckCircle, Loader2, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { getUserRegimens, createRegimen, pauseRegimen, abandonRegimen } from '@/lib/supabase/regimens'
import type { Regimen } from '@/lib/supabase/schema'

const TEMPLATES = [
    { name: 'Endurance Protocol', description: 'Build tolerance through progressive denial training', days: 14 },
    { name: 'Obedience Bootcamp', description: 'Strict daily task completion with escalating difficulty', days: 7 },
    { name: 'Edge Control Mastery', description: 'Practice edge control with increasing session durations', days: 21 },
    { name: 'Mental Fortitude', description: 'Psychological conditioning through daily challenges', days: 30 },
    { name: 'Submission Training', description: 'Learn to accept and comply with any command given', days: 10 },
]

interface NextDayTask {
    title: string
    description: string
    difficulty?: number
}

interface AdvanceState {
    [regimenId: string]: {
        advancing: boolean
        error: string | null
        nextDayTask: NextDayTask | null
    }
}

export default function RegimensPage() {
    const { user } = useAuth()
    const [regimens, setRegimens] = useState<Regimen[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [creating, setCreating] = useState(false)
    const [advanceState, setAdvanceState] = useState<AdvanceState>({})

    useEffect(() => {
        if (user) loadRegimens()
    }, [user])

    async function loadRegimens() {
        if (!user) return
        const data = await getUserRegimens(user.id)
        setRegimens(data)
        setLoading(false)
    }

    async function handleCreate(template: typeof TEMPLATES[number]) {
        if (!user) return
        setCreating(true)
        await createRegimen(user.id, template.name, template.description, template.days)
        await loadRegimens()
        setCreating(false)
        setShowCreate(false)
    }

    async function handleAdvance(regimen: Regimen) {
        if (!user) return

        setAdvanceState(prev => ({
            ...prev,
            [regimen.id]: { advancing: true, error: null, nextDayTask: null },
        }))

        try {
            const res = await fetch('/api/regimens/complete-day', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    regimenId: regimen.id,
                    userId: user.id,
                    currentDay: regimen.current_day,
                }),
            })

            const data = await res.json()

            if (!res.ok || !data.advanced) {
                setAdvanceState(prev => ({
                    ...prev,
                    [regimen.id]: {
                        advancing: false,
                        error: data.reason || 'Failed to advance regimen.',
                        nextDayTask: null,
                    },
                }))
            } else {
                setAdvanceState(prev => ({
                    ...prev,
                    [regimen.id]: {
                        advancing: false,
                        error: null,
                        nextDayTask: data.nextDayTask || null,
                    },
                }))
                await loadRegimens()
            }
        } catch {
            setAdvanceState(prev => ({
                ...prev,
                [regimen.id]: {
                    advancing: false,
                    error: 'Connection error. Please try again.',
                    nextDayTask: null,
                },
            }))
        }
    }

    async function handlePause(regimenId: string) {
        await pauseRegimen(regimenId)
        await loadRegimens()
    }

    async function handleAbandon(regimenId: string) {
        await abandonRegimen(regimenId)
        await loadRegimens()
    }

    const active = regimens.filter((r) => r.status === 'active')
    const paused = regimens.filter((r) => r.status === 'paused')
    const completed = regimens.filter((r) => r.status === 'completed' || r.status === 'abandoned')

    return (
        <>
            <TopBar />

            <div className="min-h-screen pb-24 lg:pb-8 p-4">
                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Dumbbell size={28} className="text-purple-primary" />
                            Regimens
                        </h1>
                        <Button variant="primary" size="sm" onClick={() => setShowCreate(!showCreate)}>
                            <Plus size={14} className="mr-1" /> New
                        </Button>
                    </div>

                    {/* Template Picker */}
                    {showCreate && (
                        <Card variant="hero" className="space-y-3">
                            <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">
                                Choose a Training Program
                            </h3>
                            <div className="space-y-2">
                                {TEMPLATES.map((t) => (
                                    <button
                                        key={t.name}
                                        onClick={() => handleCreate(t)}
                                        disabled={creating}
                                        className="w-full text-left p-3 bg-bg-tertiary hover:bg-bg-hover rounded-[var(--radius-md)] border border-white/5 transition-colors cursor-pointer flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">{t.name}</p>
                                            <p className="text-xs text-text-tertiary">{t.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Badge variant="info">{t.days}d</Badge>
                                            <ChevronRight size={14} className="text-text-tertiary" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                            {creating && (
                                <div className="flex items-center gap-2 text-sm text-text-tertiary">
                                    <Loader2 size={14} className="animate-spin" /> Creating regimen...
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Active Regimens */}
                    {active.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">Active</h3>
                            {active.map((r) => (
                                <RegimenCard
                                    key={r.id}
                                    regimen={r}
                                    onAdvance={handleAdvance}
                                    onPause={handlePause}
                                    onAbandon={handleAbandon}
                                    advancing={advanceState[r.id]?.advancing ?? false}
                                    error={advanceState[r.id]?.error ?? null}
                                    nextDayTask={advanceState[r.id]?.nextDayTask ?? null}
                                />
                            ))}
                        </div>
                    )}

                    {/* Paused */}
                    {paused.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">Paused</h3>
                            {paused.map((r) => (
                                <RegimenCard
                                    key={r.id}
                                    regimen={r}
                                    onAdvance={handleAdvance}
                                    onPause={handlePause}
                                    onAbandon={handleAbandon}
                                    advancing={advanceState[r.id]?.advancing ?? false}
                                    error={advanceState[r.id]?.error ?? null}
                                    nextDayTask={advanceState[r.id]?.nextDayTask ?? null}
                                />
                            ))}
                        </div>
                    )}

                    {/* Completed / Abandoned */}
                    {completed.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">History</h3>
                            {completed.map((r) => (
                                <Card key={r.id} variant="flat" size="sm" className="!min-h-0 opacity-60">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium">{r.name}</p>
                                            <p className="text-xs text-text-tertiary">
                                                {r.status === 'completed' ? '✅ Completed' : '❌ Abandoned'} — Day {r.current_day}/{r.total_days}
                                            </p>
                                        </div>
                                        <Badge variant={r.status === 'completed' ? 'info' : 'locked'}>{r.status}</Badge>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && regimens.length === 0 && !showCreate && (
                        <Card variant="flat" className="text-center py-12">
                            <Dumbbell size={40} className="mx-auto text-text-tertiary mb-3" />
                            <p className="text-text-tertiary text-sm mb-4">No training regimens yet.</p>
                            <Button variant="primary" onClick={() => setShowCreate(true)}>
                                <Plus size={14} className="mr-1" /> Start a Regimen
                            </Button>
                        </Card>
                    )}

                    {loading && (
                        <div className="text-center py-8 text-text-tertiary text-sm">Loading...</div>
                    )}
                </div>
            </div>

            <BottomNav />
        </>
    )
}

function RegimenCard({
    regimen,
    onAdvance,
    onPause,
    onAbandon,
    advancing,
    error,
    nextDayTask,
}: {
    regimen: Regimen
    onAdvance: (r: Regimen) => void
    onPause: (id: string) => void
    onAbandon: (id: string) => void
    advancing: boolean
    error: string | null
    nextDayTask: NextDayTask | null
}) {
    const progress = Math.round((regimen.current_day / regimen.total_days) * 100)
    const isActive = regimen.status === 'active'

    return (
        <Card variant="raised" className="space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h4 className="text-lg font-semibold">{regimen.name}</h4>
                    {regimen.description && (
                        <p className="text-xs text-text-tertiary mt-1">{regimen.description}</p>
                    )}
                </div>
                <Badge variant={isActive ? 'tier2' : 'warning'}>
                    {isActive ? 'ACTIVE' : 'PAUSED'}
                </Badge>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-xs text-text-tertiary">
                    <span>Day {regimen.current_day} of {regimen.total_days}</span>
                    <span className="font-mono">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-purple-primary rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Task quota gate message */}
            {error && (
                <div className="flex items-start gap-2 p-3 bg-red-primary/10 border border-red-primary/20 rounded-lg">
                    <AlertTriangle size={14} className="text-red-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-red-primary">{error}</p>
                </div>
            )}

            {/* AI-generated next day task preview */}
            {nextDayTask && (
                <div className="p-3 bg-purple-primary/10 border border-purple-primary/20 rounded-lg space-y-1">
                    <p className="text-xs font-semibold text-purple-primary">Tomorrow&apos;s Task</p>
                    <p className="text-xs font-medium">{nextDayTask.title}</p>
                    <p className="text-xs text-text-tertiary line-clamp-2">{nextDayTask.description}</p>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                {isActive ? (
                    <>
                        <Button
                            variant="primary"
                            size="sm"
                            className="flex-1"
                            disabled={advancing}
                            onClick={() => onAdvance(regimen)}
                        >
                            {advancing ? (
                                <><Loader2 size={14} className="mr-1 animate-spin" /> Checking...</>
                            ) : (
                                <><CheckCircle size={14} className="mr-1" />
                                    {regimen.current_day >= regimen.total_days ? 'Complete' : 'Day Done'}</>
                            )}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onPause(regimen.id)}>
                            <Pause size={14} />
                        </Button>
                    </>
                ) : (
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => onAdvance(regimen)}>
                        <Play size={14} className="mr-1" /> Resume
                    </Button>
                )}
                <Button variant="ghost" size="sm" className="text-red-primary" onClick={() => onAbandon(regimen.id)}>
                    <X size={14} />
                </Button>
            </div>
        </Card>
    )
}
