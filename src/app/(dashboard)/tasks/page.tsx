'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ProofCaptureModal } from '@/components/features/proof/proof-capture-modal'
import {
    Clock, Camera, AlertTriangle, Sparkles, Upload, Loader2,
    CheckCircle, XCircle, X, Trophy, Zap
} from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { useRealtimeQuery } from '@/lib/hooks/use-realtime'
import { getSupabase } from '@/lib/supabase/client'
import { getActiveSession } from '@/lib/supabase/sessions'
import { updateTaskStatus } from '@/lib/supabase/tasks'
import type { Task, Session } from '@/lib/supabase/schema'

const PROOF_TYPE_ICONS: Record<string, string> = {
    image: '📸',
    video: '🎥',
    audio: '🎤',
    text: '📝',
}

function ProofStatusBadge({ task }: { task: Task }) {
    const statusMap: Record<string, { label: string; variant: 'info' | 'locked' | 'genre' }> = {
        awaiting_proof: { label: '⏳ AWAITING PROOF', variant: 'genre' },
        proof_submitted: { label: '🔄 VERIFYING...', variant: 'info' },
        verified: { label: '✅ VERIFIED', variant: 'info' },
        overdue: { label: '⏰ OVERDUE', variant: 'locked' },
    }
    const config = statusMap[task.status]
    if (!config) return null
    return <Badge variant={config.variant}>{config.label}</Badge>
}

function formatTimeLeft(deadline: Date) {
    const diff = deadline.getTime() - Date.now()
    if (diff <= 0) return 'OVERDUE'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
}

function DeadlineTimer({ deadline }: { deadline: Date }) {
    const [remaining, setRemaining] = useState('')

    useEffect(() => {
        const tick = () => {
            const diff = deadline.getTime() - Date.now()
            if (diff <= 0) { setRemaining('OVERDUE'); return }
            const h = Math.floor(diff / 3600000)
            const m = Math.floor((diff % 3600000) / 60000)
            const s = Math.floor((diff % 60000) / 1000)
            setRemaining(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
        }
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [deadline])

    return <span className={remaining === 'OVERDUE' ? 'text-red-500 font-bold' : ''}>{remaining}</span>
}

interface VerificationResult {
    verified: boolean
    reason: string
    xpAwarded: number
    punishmentHours: number
    punishmentReason: string | null
    achievements: string[]
    pendingMessage?: string
}

// ── Quick Action Buttons (per card) ─────────────────────────
function TaskQuickActions({
    task,
    onSelfComplete,
    onFail,
    onSubmitProof,
}: {
    task: Task
    onSelfComplete: () => void
    onFail: () => void
    onSubmitProof?: () => void
}) {
    // Master tasks get Submit Proof instead of Mark Done
    const isMaster = task.task_type === 'master'
    const isProofPending = ['proof_submitted', 'awaiting_proof'].includes(task.status)

    return (
        <div className="flex items-center gap-2">
            <Button
                size="sm"
                variant="danger"
                onClick={(e) => { e.stopPropagation(); onFail() }}
            >
                <XCircle size={13} className="mr-1" /> Mark Failed
            </Button>
            {isMaster ? (
                <Button
                    size="sm"
                    variant="primary"
                    onClick={(e) => { e.stopPropagation(); onSubmitProof?.() }}
                    disabled={task.status === 'proof_submitted'}
                >
                    {task.status === 'proof_submitted' ? (
                        <><Loader2 size={13} className="mr-1 animate-spin" /> Verifying...</>
                    ) : (
                        <><Upload size={13} className="mr-1" /> Submit Proof</>
                    )}
                </Button>
            ) : (
                <Button
                    size="sm"
                    variant="primary"
                    onClick={(e) => { e.stopPropagation(); onSelfComplete() }}
                >
                    <CheckCircle size={13} className="mr-1" /> Mark Done
                </Button>
            )}
        </div>
    )
}

// ── Task Detail Modal ────────────────────────────────────────
function TaskDetailModal({
    task,
    onClose,
    onSelfComplete,
    onFail,
    onSubmitProof,
}: {
    task: Task
    onClose: () => void
    onSelfComplete: () => void
    onFail: () => void
    onSubmitProof?: () => void
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-bg-secondary border border-white/10 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-white/5">
                    <div className="space-y-2 flex-1">
                        <h2 className="text-xl font-bold">{task.title}</h2>
                        <div className="flex flex-wrap gap-2">
                            {task.genres.map((g) => (
                                <Badge key={g} variant="genre">{g}</Badge>
                            ))}
                            <Badge variant={task.cage_status === 'caged' ? 'caged' : 'uncaged'}>
                                {task.cage_status === 'caged' ? '🔒' : '🗝️'} {task.cage_status.toUpperCase()}
                            </Badge>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <X size={20} className="text-text-tertiary" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2">Instructions</h3>
                        <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">
                            {task.description}
                        </p>
                    </div>

                    {/* Meta Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <div className="text-lg font-bold font-mono">
                                {'★'.repeat(task.difficulty)}{'☆'.repeat(5 - task.difficulty)}
                            </div>
                            <div className="text-xs text-text-tertiary">Difficulty</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold font-mono flex items-center justify-center gap-1">
                                <Clock size={14} /> {task.duration_minutes}m
                            </div>
                            <div className="text-xs text-text-tertiary">Time Limit</div>
                        </div>
                    </div>

                    {/* Punishment Warning */}
                    {(task.punishment_hours || task.punishment_additional) && (
                        <div className="bg-red-primary/5 border border-red-primary/20 rounded-xl p-4">
                            <div className="flex items-start gap-2">
                                <AlertTriangle size={16} className="text-red-primary shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-xs font-bold text-red-primary uppercase mb-1">
                                        Failure Punishment
                                    </h3>
                                    {task.punishment_hours && (
                                        <p className="text-sm text-red-primary">+{task.punishment_hours}h lock time extension</p>
                                    )}
                                    {task.punishment_additional && (
                                        <p className="text-sm text-text-secondary mt-1">{task.punishment_additional}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Deadline */}
                    {task.deadline && (
                        <div className="text-center">
                            <span className="text-sm text-text-tertiary">Deadline: </span>
                            <span className={`text-sm font-mono font-bold ${formatTimeLeft(new Date(task.deadline)) === 'OVERDUE' ? 'text-red-primary' : 'text-text-primary'}`}>
                                {formatTimeLeft(new Date(task.deadline))}
                            </span>
                        </div>
                    )}
                </div>

                {/* Proof Requirement Info for master tasks */}
                {task.task_type === 'master' && task.proof_type && (
                    <div className="px-6">
                        <div className="bg-purple-primary/5 border border-purple-primary/20 rounded-xl p-4">
                            <p className="text-xs font-bold text-purple-primary uppercase mb-1">
                                {PROOF_TYPE_ICONS[task.proof_type]} Proof Required: {task.proof_type.toUpperCase()}
                            </p>
                            {task.verification_requirement && (
                                <p className="text-sm text-text-secondary">{task.verification_requirement}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="p-6 border-t border-white/5 space-y-3 grid grid-cols-2 gap-3">
                    <Button
                        variant="danger"
                        className="w-full"
                        onClick={() => {
                            onFail()
                            onClose()
                        }}
                    >
                        <XCircle size={16} className="mr-2" /> Mark Failed
                    </Button>
                    {task.task_type === 'master' ? (
                        <Button
                            variant="primary"
                            className="w-full"
                            onClick={() => {
                                onSubmitProof?.()
                                onClose()
                            }}
                            disabled={task.status === 'proof_submitted'}
                        >
                            <Upload size={16} className="mr-2" />
                            {task.status === 'proof_submitted' ? 'Verifying...' : 'Submit Proof'}
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            className="w-full"
                            onClick={() => {
                                onSelfComplete()
                                onClose()
                            }}
                        >
                            <CheckCircle size={16} className="mr-2" /> Mark Complete
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Main Tasks Page ──────────────────────────────────────────
export default function TasksPage() {
    const { user, profile, loading: authLoading } = useAuth()
    const [session, setSession] = useState<Session | null>(null)
    const [generating, setGenerating] = useState(false)
    const [detailTask, setDetailTask] = useState<Task | null>(null)
    const [proofTask, setProofTask] = useState<Task | null>(null)
    const [dailyTaskCount, setDailyTaskCount] = useState(0)
    const [dailyLimitReached, setDailyLimitReached] = useState(false)
    const DAILY_LIMIT = 5

    const { data: tasks, refetch } = useRealtimeQuery<Task>(
        'tasks',
        user ? { user_id: user.id } : {},
        'created_at',
        false
    )

    useEffect(() => {
        if (authLoading) return
        if (user) {
            getActiveSession(user.id).then(setSession)

            // Check for overdue tasks
            fetch('/api/tasks/expire', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.processed > 0) {
                        // Alert the user about punishment
                        // Using simple confirm/alert for now, could be upgraded to Toast
                        const taskNames = data.failedTasks.join(', ')
                        alert(`PUNISHMENT ALERT!\n\nThe following tasks expired and have been marked as failed:\n${taskNames}\n\nWillpower Lost: ${data.punishment}`)
                        refetch()
                    }
                })
                .catch(err => console.error('Failed to check expired tasks:', err))
        }
    }, [user, refetch])

    const masterTasks = (tasks || []).filter(t => t.task_type === 'master')
    const punishmentTasks = (tasks || []).filter(t => t.task_type === 'punishment')
    const dailyTasksAll = (tasks || []).filter(t => t.task_type === 'daily' || !t.task_type)

    const activeTasks = dailyTasksAll.filter((t) => ['pending', 'active', 'verification_pending', 'awaiting_proof', 'proof_submitted'].includes(t.status))
    const completedTasks = [...dailyTasksAll, ...masterTasks, ...punishmentTasks].filter((t) => ['completed', 'failed', 'verified'].includes(t.status))
    const pendingVerificationTasks = (tasks || []).filter((t) => ['verification_pending', 'proof_submitted', 'awaiting_proof'].includes(t.status))

    const handleGenerateTask = async () => {
        if (!user || !profile) return
        setGenerating(true)
        try {
            const res = await fetch('/api/tasks/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    sessionId: session?.id,
                    tier: profile.tier || 'Beginner',
                    fetishes: profile.interests || [],
                    regimens: profile.preferred_regimens || [],
                    hardLimits: profile.hard_limits || [],
                    personality: profile.ai_personality || 'Stern Taskmaster'
                })
            })
            const data = await res.json()
            if (!res.ok) {
                if (data.error === 'daily_limit_reached') {
                    setDailyLimitReached(true)
                }
                throw new Error(data.message || 'Failed to generate task')
            }
            // Realtime will update tasks
            setDailyTaskCount(data.tasksToday)
        } catch (error) {
            console.error(error)
            alert(error instanceof Error ? error.message : 'Failed to generate task')
        } finally {
            setGenerating(false)
        }
    }

    const handleStartTask = async (taskId: string) => {
        await updateTaskStatus(taskId, 'active')
    }

    const handleCompleteTask = async (taskId: string) => {
        if (!user) return
        try {
            const res = await fetch('/api/tasks/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId,
                    userId: user.id,
                    sessionId: session?.id,
                    selfReport: true
                })
            })
            if (!res.ok) throw new Error('Failed to complete task')
        } catch (error) {
            console.error(error)
            alert('Failed to complete task')
        }
    }

    const handleFailTask = async (taskId: string) => {
        if (!user) return
        if (!confirm('Are you sure you want to fail this task? Punishment will be applied.')) return
        try {
            const res = await fetch('/api/tasks/fail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId,
                    userId: user.id,
                    sessionId: session?.id
                })
            })
            if (!res.ok) throw new Error('Failed to fail task')
        } catch (error) {
            console.error(error)
            alert('Failed to mark task as failed')
        }
    }

    // (We skipped the handler definitions for brevity in this chunk replacement, but we need to be careful not to delete them if I use a range. 
    // Actually, I should just replace the filter lines and the return statement start.)

    // Wait, the previous tool call might have shifted lines. Best to target specific blocks. 
    // Let's just do the filter lines first.

    // Changing approach to just replace the filter lines.

    return (
        <>
            <TopBar />

            <div className="min-h-screen pb-24 lg:pb-8 p-4">
                {authLoading ? (
                    <div className="flex h-[50vh] items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-primary" />
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-3xl font-bold">Tasks</h1>
                            <div className="flex items-center gap-3">
                                {pendingVerificationTasks.length > 0 && (
                                    <Badge variant="locked">
                                        ⏳ {pendingVerificationTasks.length} Pending
                                    </Badge>
                                )}
                                <Badge variant="locked">{activeTasks.length} Active</Badge>
                                <div className="text-xs text-text-tertiary font-mono">
                                    {dailyTaskCount}/{DAILY_LIMIT}
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleGenerateTask}
                                    disabled={generating || dailyLimitReached}
                                >
                                    {generating ? (
                                        <Loader2 size={14} className="mr-1 animate-spin" />
                                    ) : (
                                        <Sparkles size={14} className="mr-1" />
                                    )}
                                    {dailyLimitReached ? 'Limit Reached' : generating ? 'Generating...' : 'New Task'}
                                </Button>
                            </div>
                        </div>

                        {/* Daily Limit Warning */}
                        {dailyLimitReached && (
                            <div className="mb-6 bg-red-primary/5 border border-red-primary/20 rounded-xl p-4 text-center">
                                <p className="text-red-primary font-mono text-sm font-bold">
                                    You&apos;ve used all {DAILY_LIMIT} tasks for today.
                                </p>
                                <p className="text-xs text-text-tertiary mt-1">
                                    Come back tomorrow, slave. Your Master decides when you&apos;ve had enough.
                                </p>
                            </div>
                        )}

                        {/* Master Tasks */}
                        {masterTasks.length > 0 && (
                            <div className="space-y-3 mb-6">
                                <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
                                    ⚔ Master Tasks
                                    <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">
                                        {masterTasks.filter(t => ['pending', 'active', 'awaiting_proof', 'proof_submitted'].includes(t.status)).length} active
                                    </span>
                                </h2>
                                {masterTasks.map(task => (
                                    <div key={task.id} className="border border-red-500/50 bg-red-500/5 rounded-lg p-4 cursor-pointer hover:bg-red-500/10 transition-colors" onClick={() => setDetailTask(task)}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-semibold text-white">{task.title}</p>
                                                    {task.proof_type && (
                                                        <span className="text-xs bg-purple-primary/20 text-purple-primary px-2 py-0.5 rounded-full">
                                                            {PROOF_TYPE_ICONS[task.proof_type]} {task.proof_type.toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                                                {(task.punishment_type || task.punishment_hours) && (
                                                    <div className="mt-2 flex items-center gap-1 text-xs text-red-400">
                                                        <AlertTriangle size={12} />
                                                        {task.punishment_hours ? `+${task.punishment_hours}h lock extension on failure` : 'Punishment on failure'}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right text-xs ml-3 shrink-0 space-y-1">
                                                <ProofStatusBadge task={task} />
                                                {task.deadline && (
                                                    <div><DeadlineTimer deadline={new Date(task.deadline)} /></div>
                                                )}
                                            </div>
                                        </div>
                                        {(['active', 'awaiting_proof'].includes(task.status)) && (
                                            <div className="mt-3 flex gap-2" onClick={e => e.stopPropagation()}>
                                                <Button size="sm" variant="danger" onClick={() => handleFailTask(task.id)}>
                                                    <XCircle size={13} className="mr-1" /> Mark Failed
                                                </Button>
                                                <Button size="sm" variant="primary" onClick={() => setProofTask(task)}>
                                                    <Upload size={13} className="mr-1" /> Submit Proof
                                                </Button>
                                            </div>
                                        )}
                                        {task.status === 'proof_submitted' && (
                                            <div className="mt-3 flex items-center gap-2 text-xs text-purple-primary" onClick={e => e.stopPropagation()}>
                                                <Loader2 size={14} className="animate-spin" /> Verifying proof...
                                            </div>
                                        )}
                                        {task.status === 'pending' && (
                                            <div className="mt-3" onClick={e => e.stopPropagation()}>
                                                <Button size="sm" variant="ghost" onClick={() => handleStartTask(task.id)}>
                                                    Start Task
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Punishment Tasks */}
                        {punishmentTasks.length > 0 && (
                            <div className="space-y-3 mb-6">
                                <h2 className="text-lg font-bold text-orange-400 flex items-center gap-2">
                                    ⚠ Punishment Tasks
                                    <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full">
                                        {punishmentTasks.filter(t => t.status === 'pending' || t.status === 'active').length} active
                                    </span>
                                </h2>
                                {punishmentTasks.map(task => (
                                    <div key={task.id} className="border border-orange-500/50 bg-orange-500/5 rounded-lg p-4 cursor-pointer hover:bg-orange-500/10 transition-colors" onClick={() => setDetailTask(task)}>
                                        <p className="font-semibold text-white">{task.title}</p>
                                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                                        {task.deadline && (
                                            <div className="mt-2 text-xs text-orange-300">
                                                <DeadlineTimer deadline={new Date(task.deadline)} />
                                            </div>
                                        )}
                                        {task.status === 'active' && (
                                            <div className="mt-3 flex gap-2" onClick={e => e.stopPropagation()}>
                                                <Button size="sm" variant="danger" onClick={() => handleFailTask(task.id)}>
                                                    <XCircle size={13} className="mr-1" /> Mark Failed
                                                </Button>
                                                <Button size="sm" variant="primary" onClick={() => handleCompleteTask(task.id)}>
                                                    <CheckCircle size={13} className="mr-1" /> Mark Done
                                                </Button>
                                            </div>
                                        )}
                                        {task.status === 'pending' && (
                                            <div className="mt-3" onClick={e => e.stopPropagation()}>
                                                <Button size="sm" variant="ghost" onClick={() => handleStartTask(task.id)}>
                                                    Start Task
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Daily Tasks */}
                        <div className="space-y-4">
                            {(masterTasks.length > 0 || punishmentTasks.length > 0) && (
                                <h2 className="text-lg font-bold text-text-secondary flex items-center gap-2">
                                    Daily Tasks
                                    <span className="text-xs bg-white/10 text-text-tertiary px-2 py-0.5 rounded-full">
                                        {activeTasks.length} active
                                    </span>
                                </h2>
                            )}
                            {activeTasks.length === 0 && (
                                <Card variant="flat" className="text-center py-12">
                                    <p className="text-text-tertiary mb-4">No active tasks. Generate one to begin.</p>
                                    <Button variant="primary" onClick={handleGenerateTask} disabled={generating}>
                                        <Sparkles size={14} className="mr-1" /> Generate Task
                                    </Button>
                                </Card>
                            )}

                            {activeTasks.map((task, index) => (
                                <Card
                                    key={task.id}
                                    variant="raised"
                                    className="space-y-4 animate-fade-in cursor-pointer hover:border-purple-primary/30 transition-colors"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                    onClick={() => setDetailTask(task)}
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-semibold">{task.title}</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {task.genres.map((genre) => (
                                                    <Badge key={genre} variant="genre">{genre}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <Badge variant={task.cage_status === 'caged' ? 'caged' : 'uncaged'}>
                                            {task.cage_status === 'caged' ? '🔒' : '🗝️'} {task.cage_status.toUpperCase()}
                                        </Badge>
                                    </div>

                                    {/* Description Preview */}
                                    <p className="text-text-secondary text-sm whitespace-pre-line leading-relaxed line-clamp-2">
                                        {task.description}
                                    </p>

                                    {/* Meta */}
                                    <div className="flex items-center gap-4 text-sm text-text-tertiary">
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {task.duration_minutes}min
                                        </span>
                                        <span className="font-mono">
                                            {'★'.repeat(task.difficulty)}{'☆'.repeat(5 - task.difficulty)}
                                        </span>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="text-sm font-mono">
                                            <span className="text-text-tertiary">Deadline: </span>
                                            <span className={
                                                task.deadline && formatTimeLeft(new Date(task.deadline)) === 'OVERDUE'
                                                    ? 'text-red-primary'
                                                    : 'text-text-primary'
                                            }>
                                                {task.deadline ? formatTimeLeft(new Date(task.deadline)) : '—'}
                                            </span>
                                        </div>
                                        {task.status === 'pending' ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); handleStartTask(task.id) }}
                                            >
                                                Start Task
                                            </Button>
                                        ) : (
                                            <TaskQuickActions
                                                task={task}
                                                onSelfComplete={() => handleCompleteTask(task.id)}
                                                onFail={() => handleFailTask(task.id)}
                                            />
                                        )}
                                    </div>

                                    {/* Punishment Warning */}
                                    {(task.punishment_type || task.punishment_hours) && (
                                        <div className="bg-red-primary/5 border border-red-primary/20 rounded-[var(--radius-md)] p-3 flex items-start gap-2">
                                            <AlertTriangle size={14} className="text-red-primary shrink-0 mt-0.5" />
                                            <div className="text-xs text-red-primary">
                                                <span className="font-bold block mb-1">FAILURE PUNISHMENT</span>
                                                {task.punishment_hours && (
                                                    <p>+ {task.punishment_hours}h lock time extension</p>
                                                )}
                                                {task.punishment_additional && (
                                                    <p>{task.punishment_additional}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>

                        {/* Completed Tasks */}
                        {completedTasks.length > 0 && (
                            <div className="mt-8">
                                <h2 className="text-xl font-semibold mb-4 text-text-tertiary">Completed</h2>
                                <div className="space-y-3 opacity-70">
                                    {completedTasks.slice(0, 10).map((task) => (
                                        <Card key={task.id} variant="flat" size="sm" className="!min-h-0">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium">{task.title}</p>
                                                    <p className="text-xs text-text-tertiary">
                                                        {task.status === 'completed' || task.status === 'verified' ? '✅ Completed' : '❌ Failed'}
                                                    </p>
                                                </div>
                                                <Badge variant={task.status === 'completed' || task.status === 'verified' ? 'info' : 'locked'}>
                                                    {task.status === 'verified' ? '✅ VERIFIED' : task.status.toUpperCase()}
                                                </Badge>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Task Detail Modal */}
            {detailTask && (
                <TaskDetailModal
                    task={detailTask}
                    onClose={() => setDetailTask(null)}
                    onSelfComplete={() => handleCompleteTask(detailTask.id)}
                    onFail={() => handleFailTask(detailTask.id)}
                    onSubmitProof={() => { setDetailTask(null); setProofTask(detailTask) }}
                />
            )}

            {proofTask && user && (
                <ProofCaptureModal
                    task={proofTask}
                    userId={user.id}
                    sessionId={session?.id}
                    onClose={() => setProofTask(null)}
                    onSubmitted={() => { setProofTask(null); refetch() }}
                />
            )}

            <BottomNav />
        </>
    )
}
