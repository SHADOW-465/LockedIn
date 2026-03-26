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
    CheckCircle, XCircle, X, Trophy, Zap, Plus, BookOpen, ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/auth-context'
import { useRealtimeQuery } from '@/lib/hooks/use-realtime'
import { getSupabase } from '@/lib/supabase/client'
import { getActiveSession } from '@/lib/supabase/sessions'
import { updateTaskStatus } from '@/lib/supabase/tasks'
import type { Task, Session } from '@/lib/supabase/schema'
import { getDriveState } from '@/lib/google-drive/drive-client'
import { uploadProofAfterVerification } from '@/lib/google-drive/proof-uploader'
import { buildSessionFolderName, buildProofFilename } from '@/lib/google-drive/drive-utils'

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

    return <span className={remaining === 'OVERDUE' ? 'text-[var(--accent)] font-bold' : ''}>{remaining}</span>
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
    // Tasks with proof_type get Submit Proof instead of Mark Done
    const requiresProof = !!task.proof_type
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
            {requiresProof ? (
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full max-h-[90dvh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-zinc-800">
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
                        <X size={20} className="text-white/30" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wide mb-2">Instructions</h3>
                        <p className="text-sm text-white/85 whitespace-pre-line leading-relaxed">
                            {task.description}
                        </p>
                    </div>

                    {/* Meta Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <div className="text-lg font-bold font-mono">
                                {'★'.repeat(task.difficulty)}{'☆'.repeat(5 - task.difficulty)}
                            </div>
                            <div className="text-xs text-white/30">Difficulty</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold font-mono flex items-center justify-center gap-1">
                                <Clock size={14} /> {task.duration_minutes}m
                            </div>
                            <div className="text-xs text-white/30">Time Limit</div>
                        </div>
                    </div>

                    {/* Punishment Warning */}
                    {(task.punishment_hours || task.punishment_additional) && (
                        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                            <div className="flex items-start gap-2">
                                <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-xs font-bold text-red-500 uppercase mb-1">
                                        Failure Punishment
                                    </h3>
                                    {task.punishment_hours && (
                                        <p className="text-sm text-red-500">+{task.punishment_hours}h lock time extension</p>
                                    )}
                                    {task.punishment_additional && (
                                        <p className="text-sm text-white/85 mt-1">{task.punishment_additional}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Deadline */}
                    {task.deadline && (
                        <div className="text-center">
                            <span className="text-sm text-white/30">Deadline: </span>
                            <span className={`text-sm font-mono font-bold ${formatTimeLeft(new Date(task.deadline)) === 'OVERDUE' ? 'text-[var(--accent)]' : 'text-white'}`}>
                                {formatTimeLeft(new Date(task.deadline))}
                            </span>
                        </div>
                    )}
                </div>

                {/* Proof Requirement Info for master tasks */}
                {task.proof_type && (
                    <div className="px-6 space-y-3 mb-6">
                        <div className="bg-zinc-800 rounded-xl p-4">
                            <p className="text-xs font-bold text-white/60 uppercase mb-1">
                                {PROOF_TYPE_ICONS[task.proof_type]} Proof Required: {task.proof_type.toUpperCase()}
                            </p>
                            {task.verification_requirement && (
                                <p className="text-sm text-white/85">{task.verification_requirement}</p>
                            )}
                        </div>
                        {task.status === 'awaiting_proof' && task.ai_verification_reason && task.ai_verification_reason.toUpperCase().includes('FAIL') && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                                <p className="text-xs font-bold text-red-500 uppercase mb-1">Proof Rejected</p>
                                <p className="text-sm text-red-200 whitespace-pre-line">{task.ai_verification_reason}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="p-6 border-t border-zinc-800 space-y-3 grid grid-cols-2 gap-3">
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
                    {task.proof_type ? (
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

// XP by difficulty (1→5, 2→10, 3→20, 4→40, 5→80)
const XP_BY_DIFFICULTY = [0, 5, 10, 20, 40, 80]

const TASK_TYPE_LABELS: Record<string, string> = {
    master: '⚔ Master Task',
    punishment: '⚠ Punishment Task',
    checkin: '🔒 Check-in',
    daily: '📋 Daily Task',
}

// ── History Detail Modal (read-only, for completed/failed/overdue tasks) ──
function HistoryTaskDetailModal({
    task,
    onClose,
}: {
    task: Task
    onClose: () => void
}) {
    const isCompleted = ['completed', 'verified'].includes(task.status)
    const isFailed = task.status === 'failed'
    const isOverdue = task.status === 'overdue'

    const willpowerDelta = isCompleted
        ? `+${Math.ceil(task.difficulty * 3)}`
        : `-${Math.ceil(task.difficulty * 2)}`
    const xp = XP_BY_DIFFICULTY[task.difficulty] ?? 0

    const outcomeColor = isCompleted
        ? 'text-teal-400 border-teal-400/20 bg-teal-400/5'
        : 'text-red-500 border-red-500/20 bg-red-500/5'

    const outcomeLabel = task.status === 'verified'
        ? '✅ Verified by AI'
        : isCompleted
            ? '✅ Completed'
            : isFailed
                ? '❌ Failed'
                : '⏰ Overdue'

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full max-h-[90dvh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-zinc-800">
                    <div className="space-y-2 flex-1 pr-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-white/30 uppercase">
                                {TASK_TYPE_LABELS[task.task_type] ?? '📋 Task'}
                            </span>
                        </div>
                        <h2 className="text-xl font-bold leading-tight">{task.title}</h2>
                        <div className="flex flex-wrap gap-2">
                            {task.genres?.map((g) => (
                                <Badge key={g} variant="genre">{g}</Badge>
                            ))}
                            {task.cage_status && (
                                <Badge variant={task.cage_status === 'caged' ? 'caged' : 'uncaged'}>
                                    {task.cage_status === 'caged' ? '🔒' : '🗝️'} {task.cage_status.toUpperCase()}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors shrink-0">
                        <X size={20} className="text-white/30" />
                    </button>
                </div>

                {/* Outcome Banner */}
                <div className={`mx-6 mt-5 rounded-xl border p-4 ${outcomeColor}`}>
                    <p className="text-sm font-bold">{outcomeLabel}</p>
                    {isCompleted && (
                        <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className="flex items-center gap-1">
                                <Zap size={12} /> {willpowerDelta} Willpower
                            </span>
                            <span className="flex items-center gap-1">
                                <Trophy size={12} /> +{xp} XP
                            </span>
                        </div>
                    )}
                    {(isFailed || isOverdue) && (
                        <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className="flex items-center gap-1">
                                <Zap size={12} /> {willpowerDelta} Willpower
                            </span>
                            {task.punishment_hours && (
                                <span className="flex items-center gap-1">
                                    <Clock size={12} /> +{task.punishment_hours}h lock added
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Instructions */}
                    <div>
                        <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wide mb-2">Instructions</h3>
                        <p className="text-sm text-white/85 whitespace-pre-line leading-relaxed">
                            {task.description || '—'}
                        </p>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-zinc-800 rounded-xl p-3 text-center">
                            <div className="text-base font-bold font-mono">
                                {'★'.repeat(task.difficulty)}{'☆'.repeat(5 - task.difficulty)}
                            </div>
                            <div className="text-[10px] text-white/30 mt-1">Difficulty</div>
                        </div>
                        <div className="bg-zinc-800 rounded-xl p-3 text-center">
                            <div className="text-base font-bold font-mono flex items-center justify-center gap-1">
                                <Clock size={13} /> {task.duration_minutes}m
                            </div>
                            <div className="text-[10px] text-white/30 mt-1">Duration</div>
                        </div>
                        <div className="bg-zinc-800 rounded-xl p-3 text-center">
                            <div className="text-base font-bold">
                                {isCompleted ? (
                                    <span className="text-teal-400">+{xp}</span>
                                ) : (
                                    <span className="text-red-500">0</span>
                                )}
                            </div>
                            <div className="text-[10px] text-white/30 mt-1">XP Earned</div>
                        </div>
                    </div>

                    {/* Proof type */}
                    {task.proof_type && (
                        <div className="bg-zinc-800 rounded-xl p-4">
                            <p className="text-xs font-bold text-white/60 uppercase mb-1">
                                {PROOF_TYPE_ICONS[task.proof_type]} Proof Required: {task.proof_type.toUpperCase()}
                            </p>
                            {task.verification_requirement && (
                                <p className="text-sm text-white/85 mt-1">{task.verification_requirement}</p>
                            )}
                        </div>
                    )}

                    {/* AI feedback on verification */}
                    {task.ai_verification_reason && (
                        <div className={`rounded-xl border p-4 ${isCompleted ? 'bg-teal-400/5 border-teal-400/20' : 'bg-red-500/5 border-red-500/20'}`}>
                            <p className={`text-xs font-bold uppercase mb-2 ${isCompleted ? 'text-teal-400' : 'text-red-500'}`}>
                                AI Feedback
                            </p>
                            <p className="text-sm text-white/85 whitespace-pre-line leading-relaxed">
                                {task.ai_verification_reason}
                            </p>
                        </div>
                    )}

                    {/* Punishment applied */}
                    {(task.punishment_hours || task.punishment_additional) && (
                        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                            <div className="flex items-start gap-2">
                                <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-red-500 uppercase mb-1">
                                        Punishment Applied
                                    </p>
                                    {task.punishment_hours && (
                                        <p className="text-sm text-red-500">+{task.punishment_hours}h lock extension</p>
                                    )}
                                    {task.punishment_additional && (
                                        <p className="text-sm text-white/85 mt-1">{task.punishment_additional}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Deadline (when it was due) */}
                    {task.deadline && (
                        <div className="text-xs text-white/30 font-mono text-center">
                            Deadline was: {new Date(task.deadline).toLocaleString()}
                        </div>
                    )}
                </div>

                <div className="p-6 pt-0">
                    <Button variant="ghost" className="w-full" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ── Main Tasks Page ──────────────────────────────────────────
export default function TasksPage() {
    const { user, profile, loading: authLoading } = useAuth()
    const [session, setSession] = useState<Session | null>(null)
    const [localHour] = useState(() => new Date().getHours())
    const [generating, setGenerating] = useState(false)
    const [detailTask, setDetailTask] = useState<Task | null>(null)
    const [historyTask, setHistoryTask] = useState<Task | null>(null)
    const [proofTask, setProofTask] = useState<Task | null>(null)
    const [dailyTaskCount, setDailyTaskCount] = useState(0)
    const [dailyLimitReached, setDailyLimitReached] = useState(false)
    const DAILY_LIMIT = 5
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [createType, setCreateType] = useState<'task' | 'journal'>('journal')
    const [createTitle, setCreateTitle] = useState('')
    const [createNotes, setCreateNotes] = useState('')
    const [createDifficulty, setCreateDifficulty] = useState(2)
    const [creating, setCreating] = useState(false)
    const checkinPromptedRef = useRef(false)

    const { data: tasks, refetch, setData: setTasks } = useRealtimeQuery<Task>(
        'tasks',
        user ? { user_id: user.id } : {},
        'created_at',
        false
    )

    useEffect(() => {
        if (authLoading) return
        if (user) {
            getActiveSession(user.id).then(sess => {
            setSession(sess)
            if (sess) {
                fetch('/api/checkin/ensure', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user.id,
                        sessionId: sess.id,
                        date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD in local tz
                    }),
                }).then(() => refetch()).catch(console.error)
            }
        })

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

    const activeStatuses = ['pending', 'active', 'verification_pending', 'awaiting_proof', 'proof_submitted']
    const masterTasks = (tasks || []).filter(t => t.task_type === 'master' && activeStatuses.includes(t.status))
    const punishmentTasks = (tasks || []).filter(t => t.task_type === 'punishment' && activeStatuses.includes(t.status))
    const checkinTasks = (tasks || []).filter(t => t.task_type === 'checkin')
    // Most recently created check-in task for each window (tasks are ordered descending by created_at)
    const morningCheckin = checkinTasks.find(t => t.title === 'Morning Check-in') ?? null
    const nightCheckin = checkinTasks.find(t => t.title === 'Night Check-in') ?? null

    // Auto-open proof modal when a check-in task is due and user hasn't been prompted yet this session
    useEffect(() => {
        if (!session || !tasks?.length || checkinPromptedRef.current || proofTask) return
        const actionable = ['pending', 'active', 'awaiting_proof']
        const target = morningCheckin ?? nightCheckin
        if (target && actionable.includes(target.status)) {
            checkinPromptedRef.current = true
            setProofTask(target)
        }
    }, [morningCheckin, nightCheckin, session, tasks, proofTask])
    const dailyTasksAll = (tasks || []).filter(t => t.task_type === 'daily' || !t.task_type)

    const activeTasks = dailyTasksAll.filter((t) => activeStatuses.includes(t.status))
    const completedTasks = (tasks || []).filter((t) => ['completed', 'verified'].includes(t.status))
    const failedTasks = (tasks || []).filter((t) => t.status === 'failed')
    const overdueTasks = (tasks || []).filter((t) => t.status === 'overdue')
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
        // Optimistic update
        setTasks((prev: Task[]) => prev.map(t => t.id === taskId ? { ...t, status: 'active' } : t))
        try {
            await updateTaskStatus(taskId, 'active')
        } catch (err) {
            console.error(err)
            refetch()
        }
    }

    const handleCompleteTask = async (taskId: string) => {
        if (!user) return
        // Optimistic update
        setTasks((prev: Task[]) => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t))
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
            refetch()
        }
    }

    const handleFailTask = async (taskId: string) => {
        if (!user) return
        if (!confirm('Are you sure you want to fail this task? Punishment will be applied.')) return
        // Optimistic update
        setTasks((prev: Task[]) => prev.map(t => t.id === taskId ? { ...t, status: 'failed' } : t))
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
            refetch()
        }
    }

    const handleCreateEntry = async () => {
        if (!user || !createTitle.trim()) return
        setCreating(true)
        try {
            const res = await fetch('/api/tasks/user-create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    sessionId: session?.id,
                    type: createType,
                    title: createTitle.trim(),
                    notes: createNotes.trim(),
                    difficulty: createDifficulty,
                }),
            })
            if (!res.ok) throw new Error('Failed to create')
            setShowCreateForm(false)
            setCreateTitle('')
            setCreateNotes('')
            setCreateDifficulty(2)
            refetch()
        } catch (err) {
            console.error(err)
            alert('Failed to create entry')
        } finally {
            setCreating(false)
        }
    }

    return (
        <>
            <TopBar />

            <div className="min-h-screen bg-black pb-24 lg:pb-8 p-4">
                {authLoading ? (
                    <div className="flex h-[50vh] items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
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
                                <div className="text-xs text-white/30 font-mono">
                                    {dailyTaskCount}/{DAILY_LIMIT}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowCreateForm(true)}
                                >
                                    <Plus size={14} className="mr-1" /> Create
                                </Button>
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
                            <div className="mb-6 bg-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-xl p-4 text-center">
                                <p className="text-[var(--accent)] font-mono text-sm font-bold">
                                    You&apos;ve used all {DAILY_LIMIT} tasks for today.
                                </p>
                                <p className="text-xs text-white/30 mt-1">
                                    Come back tomorrow, slave. Your Master decides when you&apos;ve had enough.
                                </p>
                            </div>
                        )}

                        {/* Daily Check-ins */}
                        {(morningCheckin || nightCheckin || session) && (
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wide">
                                        🔒 Daily Check-ins
                                    </h2>
                                    <Link
                                        href="/checkin-history"
                                        className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-0.5 transition-colors"
                                    >
                                        Submissions <ChevronRight size={12} />
                                    </Link>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {([
                                        { label: 'Morning', window: '6am–10am', task: morningCheckin },
                                        { label: 'Night', window: '8pm–midnight', task: nightCheckin },
                                    ] as const).map(({ label, window, task }) => {
                                        const statusColor = !task
                                            ? 'text-white/30'
                                            : task.status === 'completed' || task.status === 'verified'
                                                ? 'text-emerald-400'
                                                : task.status === 'failed'
                                                    ? 'text-[var(--accent)]'
                                                    : 'text-amber-400'
                                        const statusLabel = !task
                                            ? 'Not yet'
                                            : task.status === 'completed' || task.status === 'verified'
                                                ? '✅ Done'
                                                : task.status === 'failed'
                                                    ? '❌ Missed (late ok)'
                                                    : task.status === 'proof_submitted'
                                                        ? '🔄 Verifying'
                                                        : '⏳ Pending'
                                        const windowStart = label === 'Morning' ? 6 : 20
                                        const windowOpenLabel = label === 'Morning' ? '6am' : '8pm'
                                        const windowIsOpen = localHour >= windowStart
                                        const isDone = task && ['completed', 'verified'].includes(task.status)
                                        const canSubmit = task && ['pending', 'active', 'awaiting_proof', 'failed'].includes(task.status) && windowIsOpen
                                        return (
                                            <div key={label} className={`bg-zinc-900 border rounded-xl p-3 space-y-2 ${task?.status === 'failed' ? 'border-[var(--accent)]/30' : 'border-teal-400/20'}`}>
                                                <p className="text-xs font-semibold text-white/30 uppercase">{label}</p>
                                                <p className="text-[10px] text-white/30">{window}</p>
                                                <p className={`text-sm font-bold ${statusColor}`}>{statusLabel}</p>
                                                {canSubmit && (
                                                    <Button
                                                        size="sm"
                                                        variant={task.status === 'failed' ? 'ghost' : 'primary'}
                                                        className="w-full !py-1 !text-xs"
                                                        onClick={() => setProofTask(task)}
                                                    >
                                                        <Camera size={11} className="mr-1" />
                                                        {task.status === 'awaiting_proof' ? 'Retry Photo' : task.status === 'failed' ? 'Submit Late' : 'Submit Photo'}
                                                    </Button>
                                                )}
                                                {!windowIsOpen && !isDone && (
                                                    <p className="text-[10px] text-white/30 text-center pt-1">
                                                        Opens at {windowOpenLabel}
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Master Tasks */}
                        {masterTasks.length > 0 && (
                            <div className="space-y-3 mb-6">
                                <h2 className="text-lg font-bold text-[var(--accent)] flex items-center gap-2">
                                    ⚔ Master Tasks
                                    <span className="text-xs bg-[var(--accent)]/20 text-[var(--accent)] px-2 py-0.5 rounded-full">
                                        {masterTasks.length} active
                                    </span>
                                </h2>
                                {masterTasks.map((task, index) => (
                                    <div key={task.id} className="bg-zinc-900 border border-zinc-800 border-l-4 border-l-[var(--accent)] rounded-xl p-4 cursor-pointer card-hover animate-card-in" style={{ animationDelay: `${index * 0.05}s` }} onClick={() => setDetailTask(task)}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-semibold text-white">{task.title}</p>
                                                    {task.proof_type && (
                                                        <span className="text-xs bg-zinc-800 text-white/60 px-2 py-0.5 rounded-full">
                                                            {PROOF_TYPE_ICONS[task.proof_type]} {task.proof_type.toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-white/50 mt-1 line-clamp-2">{task.description}</p>
                                                {(task.punishment_type || task.punishment_hours) && (
                                                    <div className="mt-2 flex items-center gap-1 text-xs text-[var(--accent)]">
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
                                            <>
                                                {task.status === 'awaiting_proof' && task.ai_verification_reason && task.ai_verification_reason.toUpperCase().includes('FAIL') && (
                                                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                                                        <p className="text-xs text-[var(--accent)] font-semibold mb-1">Proof Rejected:</p>
                                                        <p className="text-xs text-red-200 line-clamp-2">{task.ai_verification_reason}</p>
                                                    </div>
                                                )}
                                                <div className="mt-3 flex gap-2" onClick={e => e.stopPropagation()}>
                                                    <Button size="sm" variant="danger" onClick={() => handleFailTask(task.id)}>
                                                        <XCircle size={13} className="mr-1" /> Mark Failed
                                                    </Button>
                                                    <Button size="sm" variant="primary" onClick={() => setProofTask(task)}>
                                                        <Upload size={13} className="mr-1" /> Submit Proof
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                        {task.status === 'proof_submitted' && (
                                            <div className="mt-3 flex items-center gap-2 text-xs text-[var(--accent)]" onClick={e => e.stopPropagation()}>
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
                                        {punishmentTasks.length} active
                                    </span>
                                </h2>
                                {punishmentTasks.map((task, index) => (
                                    <div key={task.id} className="bg-zinc-900 border border-zinc-800 border-l-4 border-l-orange-500 rounded-xl p-4 cursor-pointer card-hover animate-card-in" style={{ animationDelay: `${index * 0.05}s` }} onClick={() => setDetailTask(task)}>
                                        <p className="font-semibold text-white">{task.title}</p>
                                        <p className="text-sm text-white/50 mt-1 line-clamp-2">{task.description}</p>
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
                                <h2 className="text-lg font-bold text-white/85 flex items-center gap-2">
                                    Daily Tasks
                                    <span className="text-xs bg-white/10 text-white/30 px-2 py-0.5 rounded-full">
                                        {activeTasks.length} active
                                    </span>
                                </h2>
                            )}
                            {activeTasks.length === 0 && (
                                <Card variant="flat" className="text-center py-12">
                                    <p className="text-white/30 mb-4">No active tasks. Generate one to begin.</p>
                                    <Button variant="primary" onClick={handleGenerateTask} disabled={generating}>
                                        <Sparkles size={14} className="mr-1" /> Generate Task
                                    </Button>
                                </Card>
                            )}

                            {activeTasks.map((task, index) => (
                                <div
                                    key={task.id}
                                    className="bg-zinc-900 border border-zinc-800 rounded-xl card-hover animate-card-in space-y-4 p-4 cursor-pointer"
                                    style={{ animationDelay: `${index * 0.05}s` }}
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
                                    <p className="text-white/85 text-sm whitespace-pre-line leading-relaxed line-clamp-2">
                                        {task.description}
                                    </p>

                                    {/* Meta */}
                                    <div className="flex items-center gap-4 text-sm text-white/30">
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {task.duration_minutes}min
                                        </span>
                                        <span className="font-mono">
                                            {'★'.repeat(task.difficulty)}{'☆'.repeat(5 - task.difficulty)}
                                        </span>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                                        <div className="text-sm font-mono">
                                            <span className="text-white/30">Deadline: </span>
                                            <span className={
                                                task.deadline && formatTimeLeft(new Date(task.deadline)) === 'OVERDUE'
                                                    ? 'text-[var(--accent)]'
                                                    : 'text-white'
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
                                                onSubmitProof={() => setProofTask(task)}
                                            />
                                        )}
                                    </div>

                                    {/* Proof Rejection Warning */}
                                    {task.status === 'awaiting_proof' && task.ai_verification_reason && task.ai_verification_reason.toUpperCase().includes('FAIL') && (
                                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                                            <p className="text-xs font-bold text-[var(--accent)] uppercase mb-1">Proof Rejected</p>
                                            <p className="text-xs text-red-200 line-clamp-2">{task.ai_verification_reason}</p>
                                        </div>
                                    )}

                                    {/* Punishment Warning */}
                                    {(task.punishment_type || task.punishment_hours) && (
                                        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 flex items-start gap-2">
                                            <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                                            <div className="text-xs text-red-500">
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
                                </div>
                            ))}
                        </div>

                        {/* History Sections */}
                        <div className="mt-8 space-y-8">
                            {/* Overdue Tasks */}
                            {overdueTasks.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-semibold mb-3 text-orange-400 flex items-center gap-2">
                                        ⏰ Overdue
                                        <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full">
                                            {overdueTasks.length}
                                        </span>
                                    </h2>
                                    <div className="space-y-2">
                                        {overdueTasks.map((task) => (
                                            <button
                                                key={task.id}
                                                className="w-full text-left"
                                                onClick={() => setHistoryTask(task)}
                                            >
                                                <Card variant="flat" size="sm" className="!min-h-0 border-orange-500/30 hover:border-orange-400/60 hover:bg-orange-500/5 transition-colors cursor-pointer">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium truncate">{task.title}</p>
                                                            <div className="flex items-center gap-3 mt-0.5">
                                                                <span className="text-xs text-orange-400/70">⏰ Expired</span>
                                                                <span className="text-xs text-white/30 font-mono">
                                                                    {'★'.repeat(task.difficulty)}{'☆'.repeat(5 - task.difficulty)}
                                                                </span>
                                                                {task.punishment_hours && (
                                                                    <span className="text-xs text-[var(--accent)]/70">+{task.punishment_hours}h</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <Badge variant="locked">OVERDUE</Badge>
                                                            <ChevronRight size={14} className="text-white/30" />
                                                        </div>
                                                    </div>
                                                </Card>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Failed Tasks */}
                            {failedTasks.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-semibold mb-3 text-red-500 flex items-center gap-2">
                                        ❌ Failed
                                        <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">
                                            {failedTasks.length}
                                        </span>
                                    </h2>
                                    <div className="space-y-2">
                                        {failedTasks.map((task) => (
                                            <button
                                                key={task.id}
                                                className="w-full text-left"
                                                onClick={() => setHistoryTask(task)}
                                            >
                                                <Card variant="flat" size="sm" className="!min-h-0 border-red-500/30 hover:border-red-400/60 hover:bg-red-500/5 transition-colors cursor-pointer">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium truncate">{task.title}</p>
                                                            <div className="flex items-center gap-3 mt-0.5">
                                                                <span className="text-xs text-[var(--accent)]/70">❌ Failed</span>
                                                                <span className="text-xs text-white/30 font-mono">
                                                                    {'★'.repeat(task.difficulty)}{'☆'.repeat(5 - task.difficulty)}
                                                                </span>
                                                                <span className="text-xs text-[var(--accent)]/70 font-mono">
                                                                    -{Math.ceil(task.difficulty * 2)} WP
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <Badge variant="locked">FAILED</Badge>
                                                            <ChevronRight size={14} className="text-white/30" />
                                                        </div>
                                                    </div>
                                                </Card>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Completed Tasks */}
                            {completedTasks.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-semibold mb-3 text-teal-400 flex items-center gap-2">
                                        ✅ Completed
                                        <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full">
                                            {completedTasks.length}
                                        </span>
                                    </h2>
                                    <div className="space-y-2">
                                        {completedTasks.map((task) => (
                                            <button
                                                key={task.id}
                                                className="w-full text-left"
                                                onClick={() => setHistoryTask(task)}
                                            >
                                                <Card variant="flat" size="sm" className="!min-h-0 hover:border-teal-400/30 hover:bg-teal-500/5 transition-colors cursor-pointer">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium truncate">{task.title}</p>
                                                            <div className="flex items-center gap-3 mt-0.5">
                                                                <span className="text-xs text-teal-400/70">
                                                                    {task.status === 'verified' ? '✅ Verified' : '✅ Done'}
                                                                </span>
                                                                <span className="text-xs text-white/30 font-mono">
                                                                    {'★'.repeat(task.difficulty)}{'☆'.repeat(5 - task.difficulty)}
                                                                </span>
                                                                <span className="text-xs text-teal-400/70 font-mono">
                                                                    +{XP_BY_DIFFICULTY[task.difficulty] ?? 0} XP
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <Badge variant="info">
                                                                {task.status === 'verified' ? '✅ VERIFIED' : 'DONE'}
                                                            </Badge>
                                                            <ChevronRight size={14} className="text-white/30" />
                                                        </div>
                                                    </div>
                                                </Card>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* History Task Detail Modal */}
            {historyTask && (
                <HistoryTaskDetailModal
                    task={historyTask}
                    onClose={() => setHistoryTask(null)}
                />
            )}

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
                    onSubmitted={(result) => {
                        setProofTask(null)
                        refetch()
                        // Non-blocking Drive backup after verified proof
                        if (result.verified && result.filePath && session && proofTask) {
                            const driveState = getDriveState()
                            if (driveState) {
                                const sessionFolderName = buildSessionFolderName(
                                    session.start_time,
                                    session.scheduled_end_time,
                                    session.created_at
                                )
                                // Task schema uses assigned_at (equivalent to created_at for tasks)
                                const driveFilename = buildProofFilename(
                                    proofTask.assigned_at,
                                    proofTask.task_type,
                                    proofTask.title,
                                    proofTask.proof_type ?? 'image'
                                )
                                // Parse opfsCategory and opfsFilename from filePath
                                // filePath format: {userId}/{sessionId}/{category}/{filename}
                                const parts = result.filePath.split('/')
                                const opfsCategory = parts[parts.length - 2] as 'proofs' | 'videos'
                                const opfsFilename = parts[parts.length - 1]
                                uploadProofAfterVerification(
                                    user!.id,
                                    session.id,
                                    sessionFolderName,
                                    driveFilename,
                                    opfsCategory,
                                    opfsFilename
                                ).catch(console.error)
                            }
                        }
                    }}
                />
            )}

            {/* Create Entry Modal */}
            {showCreateForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Plus size={18} className="text-[var(--accent)]" /> New Entry
                            </h2>
                            <button onClick={() => setShowCreateForm(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                                <X size={18} className="text-white/30" />
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCreateType('journal')}
                                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${createType === 'journal' ? 'bg-[var(--accent)]/20 border-[var(--accent)]/50 text-[var(--accent)]' : 'bg-zinc-800 border-zinc-700 text-white/30'}`}
                            >
                                <BookOpen size={14} className="inline mr-1" /> Journal
                            </button>
                            <button
                                onClick={() => setCreateType('task')}
                                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${createType === 'task' ? 'bg-[var(--accent)]/20 border-[var(--accent)]/50 text-[var(--accent)]' : 'bg-zinc-800 border-zinc-700 text-white/30'}`}
                            >
                                <CheckCircle size={14} className="inline mr-1" /> Self Task
                            </button>
                        </div>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder={createType === 'journal' ? 'Entry title...' : 'Task title...'}
                                value={createTitle}
                                onChange={e => setCreateTitle(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm focus:outline-none focus:border-[var(--accent)]/50 placeholder:text-white/30"
                            />
                            <textarea
                                placeholder={createType === 'journal' ? 'Write your thoughts...' : 'Describe the task...'}
                                value={createNotes}
                                onChange={e => setCreateNotes(e.target.value)}
                                rows={4}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm focus:outline-none focus:border-[var(--accent)]/50 placeholder:text-white/30 resize-none"
                            />
                            {createType === 'task' && (
                                <div>
                                    <label className="text-xs text-white/30 mb-1 block">Difficulty: {createDifficulty}/5</label>
                                    <input
                                        type="range"
                                        min={1}
                                        max={5}
                                        value={createDifficulty}
                                        onChange={e => setCreateDifficulty(Number(e.target.value))}
                                        className="w-full accent-purple-500"
                                    />
                                </div>
                            )}
                        </div>
                        <Button
                            variant="primary"
                            className="w-full"
                            onClick={handleCreateEntry}
                            disabled={creating || !createTitle.trim()}
                        >
                            {creating
                                ? <><Loader2 size={14} className="mr-2 animate-spin" /> Saving...</>
                                : createType === 'journal' ? 'Save Journal Entry' : 'Create Task'
                            }
                        </Button>
                    </div>
                </div>
            )}

            <BottomNav />
        </>
    )
}
