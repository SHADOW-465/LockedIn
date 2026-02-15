'use client'

import { useEffect, useState } from 'react'
import { TimerCard } from '@/components/features/timer/timer-card'
import { BentoGrid, BentoItem } from '@/components/layout/bento-grid'
import { TopBar } from '@/components/layout/top-bar'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Flame, TrendingUp, AlertTriangle, Calendar, Target, Zap, Play, Trophy, Dumbbell } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import Link from 'next/link'
import { getActiveSession, createSession } from '@/lib/supabase/sessions'
import { getActiveTasks } from '@/lib/supabase/tasks'
import type { Session, Task } from '@/lib/supabase/schema'

export default function DashboardPage() {
    const { user, profile } = useAuth()
    const [session, setSession] = useState<Session | null>(null)
    const [currentTask, setCurrentTask] = useState<Task | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) return

        async function loadDashboard() {
            const activeSession = await getActiveSession(user!.id)
            setSession(activeSession)

            const tasks = await getActiveTasks(user!.id)
            const active = tasks.find((t) => t.status === 'active') ?? tasks[0] ?? null
            setCurrentTask(active)

            setLoading(false)
        }

        loadDashboard()
    }, [user])

    const handleStartSession = async () => {
        if (!user || !profile) return
        const newSession = await createSession(
            user.id,
            profile.tier ?? 'Newbie',
            168,
            profile.ai_personality
        )
        if (newSession) setSession(newSession)
    }

    const tier = profile?.tier ?? 'Newbie'
    const willpowerScore = profile?.willpower_score ?? 50
    const complianceStreak = profile?.compliance_streak ?? 0

    return (
        <>
            <TopBar />

            <div className="min-h-screen pb-24 lg:pb-8">
                <BentoGrid>
                    {/* Hero Timer */}
                    <BentoItem span="hero" className="!bg-transparent !shadow-none !border-none !p-0">
                        {session ? (
                            <TimerCard
                                endTime={new Date(session.scheduled_end_time)}
                                tier={tier}
                                status={session.total_punishments > 0 ? 'punishment' : 'locked'}
                            />
                        ) : (
                            <Card variant="hero" className="text-center py-12">
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-bold">No Active Session</h2>
                                    <p className="text-text-secondary text-sm">
                                        Start a new lock session to begin your training.
                                    </p>
                                    <Button variant="primary" onClick={handleStartSession} className="mx-auto">
                                        <Play size={16} className="mr-2" /> Start Session
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </BentoItem>

                    {/* Willpower */}
                    <BentoItem>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">
                                    Willpower
                                </h3>
                                <Zap size={16} className="text-purple-primary" />
                            </div>
                            <div className="relative w-28 h-28 mx-auto">
                                <svg className="transform -rotate-90 w-28 h-28">
                                    <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="6" fill="none" className="text-bg-tertiary" />
                                    <circle
                                        cx="56" cy="56" r="48"
                                        stroke="currentColor" strokeWidth="6" fill="none"
                                        strokeDasharray={2 * Math.PI * 48}
                                        strokeDashoffset={2 * Math.PI * 48 * (1 - willpowerScore / 100)}
                                        className="text-purple-primary transition-all duration-1000"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-3xl font-bold font-mono">
                                        {willpowerScore}
                                    </span>
                                </div>
                            </div>
                            <p className="text-center text-xs text-text-tertiary">
                                {willpowerScore >= 70
                                    ? 'Strong resistance'
                                    : willpowerScore >= 40
                                        ? 'Moderate resolve'
                                        : 'Breaking point near'}
                            </p>
                        </div>
                    </BentoItem>

                    {/* Current Task */}
                    <BentoItem span="wide">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Target size={16} className="text-red-primary" />
                                    <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">
                                        Current Task
                                    </h3>
                                </div>
                                {currentTask && (
                                    <div className="flex gap-2">
                                        {currentTask.genres.map((g) => (
                                            <Badge key={g} variant="genre">{g}</Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {currentTask ? (
                                <>
                                    <h4 className="text-lg font-semibold">{currentTask.title}</h4>
                                    <p className="text-text-secondary text-sm leading-relaxed line-clamp-3">
                                        {currentTask.description}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={currentTask.cage_status === 'uncaged' ? 'uncaged' : 'caged'}>
                                            {currentTask.cage_status === 'uncaged' ? '🗝️' : '🔒'} {currentTask.cage_status.toUpperCase()}
                                        </Badge>
                                        {currentTask.deadline && (
                                            <span className="text-sm text-text-tertiary font-mono">
                                                Deadline: {formatTimeLeft(new Date(currentTask.deadline))}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        <Button variant="primary" className="flex-1">
                                            Submit Proof
                                        </Button>
                                        <Button variant="ghost" size="sm">
                                            Details
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <p className="text-text-tertiary text-sm">No active task. Generate one from the Tasks page.</p>
                            )}
                        </div>
                    </BentoItem>

                    {/* Compliance Streak */}
                    <BentoItem>
                        <div className="text-center space-y-3">
                            <Flame size={32} className="mx-auto text-tier-slave" />
                            <div>
                                <div className="text-4xl font-bold font-mono">
                                    {complianceStreak}
                                </div>
                                <div className="text-sm text-text-secondary mt-1">Day Streak</div>
                            </div>
                            <div className="flex justify-center gap-1">
                                {Array.from({ length: 7 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-3 h-3 rounded-full ${i < complianceStreak % 7
                                            ? 'bg-tier-slave'
                                            : 'bg-bg-tertiary'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </BentoItem>

                    {/* Next Release */}
                    <BentoItem>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-teal-primary" />
                                <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">
                                    Next Release
                                </h3>
                            </div>
                            <div className="text-2xl font-bold font-mono">
                                {session
                                    ? new Date(session.scheduled_end_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                    : '—'}
                            </div>
                            <p className="text-xs text-text-secondary">
                                {session ? 'Based on current compliance. Subject to AI adjustments.' : 'Start a session to see your release date.'}
                            </p>
                            <Badge variant="info">Dynamic</Badge>
                        </div>
                    </BentoItem>

                    {/* Future Crime Prediction */}
                    <BentoItem>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={16} className="text-tier-slave" />
                                <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">
                                    Future Crime
                                </h3>
                            </div>
                            <p className="text-sm text-red-primary font-medium">
                                {willpowerScore < 40
                                    ? 'High violation risk detected'
                                    : 'Late night check-in predicted'}
                            </p>
                            <p className="text-xs text-text-tertiary">
                                AI predicts next violation window: 11 PM – 2 AM
                            </p>
                            <Badge variant={willpowerScore < 40 ? 'locked' : 'warning'}>
                                {willpowerScore < 40 ? 'High Risk' : 'Medium Risk'}
                            </Badge>
                        </div>
                    </BentoItem>

                    {/* Session Stats */}
                    <BentoItem>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={16} className="text-teal-primary" />
                                <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">
                                    Session Stats
                                </h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="text-lg font-bold font-mono">
                                        {session?.total_tasks_completed ?? profile?.total_sessions ?? 0}
                                    </div>
                                    <div className="text-xs text-text-tertiary">Tasks Done</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold font-mono">
                                        {session?.total_tasks_failed ?? 0}
                                    </div>
                                    <div className="text-xs text-text-tertiary">Violations</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold font-mono">
                                        {profile?.total_denial_hours ?? 0}h
                                    </div>
                                    <div className="text-xs text-text-tertiary">Total Denial</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold font-mono">
                                        {profile?.total_edges ?? 0}
                                    </div>
                                    <div className="text-xs text-text-tertiary">Total Edges</div>
                                </div>
                            </div>
                        </div>
                    </BentoItem>

                    {/* Quick Links */}
                    <BentoItem>
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">Quick Access</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <Link href="/achievements" className="p-3 bg-bg-tertiary hover:bg-bg-hover rounded-[var(--radius-md)] border border-white/5 transition-colors flex items-center gap-2">
                                    <Trophy size={16} className="text-tier-slave" />
                                    <span className="text-sm font-medium">Achievements</span>
                                </Link>
                                <Link href="/regimens" className="p-3 bg-bg-tertiary hover:bg-bg-hover rounded-[var(--radius-md)] border border-white/5 transition-colors flex items-center gap-2">
                                    <Dumbbell size={16} className="text-purple-primary" />
                                    <span className="text-sm font-medium">Regimens</span>
                                </Link>
                            </div>
                        </div>
                    </BentoItem>
                </BentoGrid>
            </div>

            <BottomNav />
        </>
    )
}

function formatTimeLeft(deadline: Date) {
    const diff = deadline.getTime() - Date.now()
    if (diff <= 0) return 'OVERDUE'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
}
