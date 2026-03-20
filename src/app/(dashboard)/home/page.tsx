'use client'

import { useEffect, useState } from 'react'
import { TimerCard } from '@/components/features/timer/timer-card'
import { BentoGrid, BentoItem } from '@/components/layout/bento-grid'
import { TopBar } from '@/components/layout/top-bar'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Flame, TrendingUp, AlertTriangle, Calendar, Target, Zap, Play, Trophy, Dumbbell, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getActiveSession } from '@/lib/supabase/sessions'
import { getActiveTasks } from '@/lib/supabase/tasks'
import type { Session, Task } from '@/lib/supabase/schema'
import { SessionStartFlow } from '@/components/features/session-start-flow'
import type { SessionConfig } from '@/components/features/session-start-flow'
import { getSupabase } from '@/lib/supabase/client'
import { archiveSession } from '@/lib/local-storage/session-archive'
import { MoodCheckinModal } from '@/components/features/mood/mood-checkin-modal'

// ── Session Summary Overlay ──────────────────────────────────
function SessionSummaryOverlay({
    summary,
    isArchiving,
    onContinue,
}: {
    summary: Record<string, unknown>
    isArchiving: boolean
    onContinue: () => void
}) {
    const grade = typeof summary.performance_grade === 'string' ? summary.performance_grade : ''
    const compliance = typeof summary.compliance_rate === 'number' ? summary.compliance_rate : null
    const narrative = typeof summary.narrative === 'string' ? summary.narrative : null
    const highlights = Array.isArray(summary.highlights) ? (summary.highlights as string[]) : []
    const improvements = Array.isArray(summary.improvement_areas) ? (summary.improvement_areas as string[]) : []

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 overflow-y-auto">
            <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-lg w-full p-6 space-y-4 my-4">
                <div className="text-center">
                    <div className="text-4xl mb-2">🏁</div>
                    <h2 className="text-2xl font-bold">Session Complete</h2>
                    <p className="text-gray-400 text-sm mt-1">
                        {grade && <>Grade: <span className="text-white font-bold text-lg">{grade}</span>{' · '}</>}
                        {compliance !== null && <>Compliance: <span className="text-white">{compliance}%</span></>}
                    </p>
                </div>

                {narrative && (
                    <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-200 italic leading-relaxed">
                        {narrative}
                    </div>
                )}

                {highlights.length > 0 && (
                    <div>
                        <p className="text-sm font-semibold text-green-400 mb-2">Highlights</p>
                        <ul className="space-y-1">
                            {highlights.map((h, i) => (
                                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                    <span className="text-green-400 mt-0.5">✓</span> {h}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {improvements.length > 0 && (
                    <div>
                        <p className="text-sm font-semibold text-yellow-400 mb-2">Areas to Improve</p>
                        <ul className="space-y-1">
                            {improvements.map((a, i) => (
                                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                    <span className="text-yellow-400 mt-0.5">→</span> {a}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {isArchiving && (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                        <Loader2 size={14} className="animate-spin" />
                        Archiving session data...
                    </div>
                )}

                <button
                    onClick={onContinue}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                    Continue
                </button>
            </div>
        </div>
    )
}

export default function DashboardPage() {
    const { user, profile, loading: authLoading } = useAuth()
    const router = useRouter()
    const [session, setSession] = useState<Session | null>(null)
    const [currentTask, setCurrentTask] = useState<Task | null>(null)
    const [loading, setLoading] = useState(true)
    const [showSessionFlow, setShowSessionFlow] = useState(false)
    const [isArchiving, setIsArchiving] = useState(false)
    const [sessionSummary, setSessionSummary] = useState<Record<string, unknown> | null>(null)
    const [showMoodModal, setShowMoodModal] = useState(false)

    useEffect(() => {
        if (authLoading || !user) return

        async function loadDashboard() {
            try {
                const activeSession = await getActiveSession(user!.id)
                setSession(activeSession)

                const tasks = await getActiveTasks(user!.id)
                const active = tasks.find((t) => t.status === 'active') ?? tasks[0] ?? null
                setCurrentTask(active)

                // Auto-show mood modal if active session and not skipped/checked-in today
                if (activeSession) {
                    const skipKey = `mood_skip_${activeSession.id}`
                    const alreadySkipped = sessionStorage.getItem(skipKey) === '1'
                    if (!alreadySkipped) {
                        const today = new Date().toISOString().slice(0, 10)
                        const supabase = getSupabase()
                        const { data: existing } = await supabase
                            .from('mood_checkins')
                            .select('id')
                            .eq('user_id', user!.id)
                            .eq('date', today)
                            .maybeSingle()
                        if (!existing) setShowMoodModal(true)
                    }
                }
            } catch (err) {
                console.error('[Home] loadDashboard error:', err)
            } finally {
                setLoading(false)
            }
        }

        loadDashboard()
    }, [user, authLoading])

    useEffect(() => {
        if (!session || session.status !== 'completing' || isArchiving) return

        const runArchival = async () => {
            setIsArchiving(true)
            try {
                // 1. Fetch all session data from Supabase
                const supabase = getSupabase()
                const [chatRes, tasksRes, eventsRes, proofsRes] = await Promise.all([
                    supabase.from('chat_messages').select('*').eq('session_id', session.id),
                    supabase.from('tasks').select('*').eq('session_id', session.id),
                    supabase.from('session_events').select('*').eq('session_id', session.id),
                    supabase.from('proof_documents').select('*').eq('session_id', session.id),
                ])

                // 2. Request persistent storage
                if (navigator.storage?.persist) {
                    await navigator.storage.persist()
                }

                // 3. Archive to IndexedDB
                await archiveSession(session.id, session.user_id, {
                    session_data: session as unknown as Record<string, unknown>,
                    chat_messages: chatRes.data ?? [],
                    tasks: tasksRes.data ?? [],
                    session_events: eventsRes.data ?? [],
                    proof_documents: proofsRes.data ?? [],
                    summary: null,
                })

                // 4. Generate AI summary
                const completedTasks = (tasksRes.data ?? []).filter((t: { status: string }) => t.status === 'completed')
                const failedTasks = (tasksRes.data ?? []).filter((t: { status: string }) => t.status === 'failed' || t.status === 'overdue')
                const masterCompleted = (tasksRes.data ?? []).filter((t: { task_type: string; status: string }) => t.task_type === 'master' && t.status === 'completed')
                const masterFailed = (tasksRes.data ?? []).filter((t: { task_type: string; status: string }) => t.task_type === 'master' && (t.status === 'failed' || t.status === 'overdue'))
                const punishments = (tasksRes.data ?? []).filter((t: { task_type: string }) => t.task_type === 'punishment')

                const startWillpower = profile?.willpower_score ?? 50
                const plannedMs = session.total_duration_minutes * 60 * 1000
                const actualMs = session.actual_end_time
                    ? new Date(session.actual_end_time).getTime() - new Date(session.start_time).getTime()
                    : plannedMs

                const summaryRes = await fetch('/api/sessions/summary', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: session.id,
                        userId: session.user_id,
                        sessionData: {
                            actual_minutes: Math.floor(actualMs / 60000),
                            planned_minutes: session.total_duration_minutes,
                            tasks_completed: completedTasks.length,
                            tasks_assigned: (tasksRes.data ?? []).length,
                            tasks_failed: failedTasks.length,
                            master_completed: masterCompleted.length,
                            master_failed: masterFailed.length,
                            punishment_count: punishments.length,
                            compliance_rate: (tasksRes.data ?? []).length > 0
                                ? Math.round((completedTasks.length / (tasksRes.data ?? []).length) * 100)
                                : 100,
                            willpower_start: startWillpower,
                            willpower_end: profile?.willpower_score ?? startWillpower,
                            streak_change: 1,
                        },
                    }),
                })

                if (summaryRes.ok) {
                    const { summary: aiSummary } = await summaryRes.json()
                    setSessionSummary(aiSummary)
                }

                // 5. Purge Supabase heavy data
                await fetch('/api/sessions/purge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: session.id, userId: session.user_id }),
                })

                // 6. Mark session completed
                await fetch('/api/sessions/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: session.id, userId: session.user_id }),
                })

            } catch (err) {
                console.error('[Home] Archival error:', err)
            } finally {
                setIsArchiving(false)
            }
        }

        runArchival()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.status])

    const handleStartSession = async (config: SessionConfig) => {
        if (!user) return
        const res = await fetch('/api/sessions/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, config }),
        })
        if (!res.ok) {
            const err = await res.json()
            if (err.error === 'active_session_exists') {
                // Session already exists - just close the flow and refresh
                setShowSessionFlow(false)
                router.refresh()
                return
            }
            throw new Error(err.error || 'Failed to start session')
        }
        router.refresh()
        setShowSessionFlow(false)
    }

    const tier = profile?.tier ?? 'Newbie'
    const willpowerScore = profile?.willpower_score ?? 50
    const complianceStreak = profile?.compliance_streak ?? 0
    const onboardingCompleted = profile?.onboarding_completed ?? false

    return (
        <>
            <TopBar />

            {showSessionFlow && profile && (
                <SessionStartFlow
                    profile={profile}
                    onStart={handleStartSession}
                    onCancel={() => setShowSessionFlow(false)}
                />
            )}

            {showMoodModal && session && user && (
                <MoodCheckinModal
                    userId={user.id}
                    sessionId={session.id}
                    onClose={() => setShowMoodModal(false)}
                    onSubmit={() => setShowMoodModal(false)}
                />
            )}

            <div className="min-h-screen pb-24 lg:pb-8">
                {/* Progressive Onboarding Banner removed */}

                {(authLoading || (loading && user)) ? (
                    <div className="flex h-[50vh] items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-primary" />
                    </div>
                ) : (
                    <BentoGrid>
                        {/* Hero Timer */}
                        <BentoItem span="hero" className="!bg-transparent !shadow-none !border-none !p-0">
                            {session ? (
                                <TimerCard
                                    endTime={new Date(session.scheduled_end_time)}
                                    startTime={new Date(session.start_time)}
                                    totalDurationMinutes={session.total_duration_minutes ?? 10080}
                                    tier={session.tier}
                                    status={session.status}
                                    punishmentActive={(session.total_punishments ?? 0) > 0}
                                    onAddTime={async (minutes: number) => {
                                        if (!user || !session) return
                                        const res = await fetch('/api/sessions/extend', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                sessionId: session.id,
                                                userId: user.id,
                                                deltaMinutes: minutes,
                                                reason: 'User voluntarily added time',
                                            }),
                                        })
                                        if (res.ok) {
                                            const { session: updatedSession } = await res.json()
                                            // Merge API response into existing session to preserve all fields
                                            setSession(prev => prev ? { ...prev, ...updatedSession } : updatedSession)
                                            // Re-fetch from DB as safety net for full consistency
                                            const fresh = await getActiveSession(user.id)
                                            if (fresh) setSession(fresh)
                                        }
                                    }}
                                />
                            ) : (
                                <Card variant="hero" className="text-center py-12">
                                    <div className="space-y-4">
                                        <h2 className="text-2xl font-bold">No Active Session</h2>
                                        <p className="text-text-secondary text-sm">
                                            Start a new lock session to begin your training.
                                        </p>
                                        <Button variant="primary" onClick={() => setShowSessionFlow(true)} className="mx-auto">
                                            <Play size={16} className="mr-2" />
                                            Start Session
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
                                            <Button variant="primary" className="flex-1" onClick={() => router.push('/tasks')}>
                                                View Tasks
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => router.push('/tasks')}>
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
                                    {session && (
                                        <button
                                            onClick={() => setShowMoodModal(true)}
                                            className="p-3 bg-bg-tertiary hover:bg-bg-hover rounded-[var(--radius-md)] border border-white/5 transition-colors flex items-center gap-2"
                                        >
                                            <Zap size={16} className="text-teal-primary" />
                                            <span className="text-sm font-medium">Check In</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </BentoItem>
                    </BentoGrid>
                )}
            </div>

            {/* Session Summary Overlay */}
            {sessionSummary && (
                <SessionSummaryOverlay
                    summary={sessionSummary}
                    isArchiving={isArchiving}
                    onContinue={() => { setSessionSummary(null); router.refresh() }}
                />
            )}

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
