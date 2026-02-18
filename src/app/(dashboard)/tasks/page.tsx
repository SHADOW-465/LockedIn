'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import {
    Clock, Camera, AlertTriangle, Sparkles, Upload, Loader2,
    CheckCircle, XCircle, X, Trophy, Zap
} from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { useRealtimeQuery } from '@/lib/hooks/use-realtime'
import { getActiveSession } from '@/lib/supabase/sessions'
import { updateTaskStatus } from '@/lib/supabase/tasks'
import type { Task, Session } from '@/lib/supabase/schema'

function formatTimeLeft(deadline: Date) {
    const diff = deadline.getTime() - Date.now()
    if (diff <= 0) return 'OVERDUE'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
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
// Each instance owns its own fileRef so cards don't share refs.
function TaskQuickActions({
    task,
    isVerifying,
    onPhotoUpload,
    onSelfComplete,
}: {
    task: Task
    isVerifying: boolean
    onPhotoUpload: (file: File) => void
    onSelfComplete: () => void
}) {
    const fileRef = useRef<HTMLInputElement>(null)

    return (
        <>
            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onPhotoUpload(file)
                    e.target.value = ''
                }}
            />
            {task.verification_type === 'self-report' ? (
                <Button
                    size="sm"
                    variant="primary"
                    disabled={isVerifying}
                    onClick={(e) => { e.stopPropagation(); onSelfComplete() }}
                >
                    <CheckCircle size={13} className="mr-1" /> Mark Done
                </Button>
            ) : (
                <Button
                    size="sm"
                    variant="primary"
                    disabled={isVerifying}
                    onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
                >
                    <Camera size={13} className="mr-1" /> Submit Proof
                </Button>
            )}
        </>
    )
}

// ── Task Detail Modal ────────────────────────────────────────
function TaskDetailModal({
    task,
    onClose,
    onSubmitProof,
    onSelfComplete,
    isVerifying,
}: {
    task: Task
    onClose: () => void
    onSubmitProof: (file: File) => void
    onSelfComplete: () => void
    isVerifying: boolean
}) {
    const fileRef = useRef<HTMLInputElement>(null)

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
                    <div className="grid grid-cols-3 gap-4">
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
                        <div className="text-center">
                            <div className="text-lg font-bold font-mono flex items-center justify-center gap-1">
                                <Camera size={14} /> {task.verification_type}
                            </div>
                            <div className="text-xs text-text-tertiary">Proof Type</div>
                        </div>
                    </div>

                    {/* Verification Requirement */}
                    {task.verification_requirement && (
                        <div className="bg-purple-primary/5 border border-purple-primary/20 rounded-xl p-4">
                            <h3 className="text-xs font-semibold text-purple-primary uppercase tracking-wide mb-1">
                                Verification Requirement
                            </h3>
                            <p className="text-sm text-text-secondary">{task.verification_requirement}</p>
                        </div>
                    )}

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

                {/* Actions */}
                <div className="p-6 border-t border-white/5 space-y-3">
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) onSubmitProof(file)
                        }}
                    />

                    {task.verification_type === 'self-report' ? (
                        <Button
                            variant="primary"
                            className="w-full"
                            disabled={isVerifying}
                            onClick={() => {
                                onSelfComplete()
                                onClose()
                            }}
                        >
                            <CheckCircle size={16} className="mr-2" /> Mark Complete (Honor System)
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            className="w-full"
                            disabled={isVerifying}
                            onClick={() => fileRef.current?.click()}
                        >
                            {isVerifying ? (
                                <><Loader2 size={16} className="mr-2 animate-spin" /> Verifying...</>
                            ) : (
                                <><Upload size={16} className="mr-2" /> Upload Proof Photo</>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Verification Result Overlay ──────────────────────────────
function VerificationOverlay({
    result,
    onClose,
}: {
    result: VerificationResult
    onClose: () => void
}) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
            <div className={`max-w-sm w-full rounded-2xl border-2 p-8 text-center space-y-6 ${result.verified
                ? 'bg-bg-secondary border-teal-primary/40'
                : 'bg-bg-secondary border-red-primary/40'
                }`}>
                {/* Icon */}
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${result.verified
                    ? 'bg-teal-primary/10 text-teal-primary'
                    : 'bg-red-primary/10 text-red-primary'
                    }`}>
                    {result.verified ? (
                        <CheckCircle size={48} className="animate-bounce" />
                    ) : (
                        <XCircle size={48} className="animate-bounce" />
                    )}
                </div>

                {/* Title */}
                <h2 className={`text-2xl font-bold ${result.verified ? 'text-teal-primary' : 'text-red-primary'}`}>
                    {result.verified ? 'VERIFIED ✓' : 'FAILED ✗'}
                </h2>

                {/* Reason */}
                <p className="text-sm text-text-secondary leading-relaxed line-clamp-4">
                    {result.reason}
                </p>

                {/* Reward / Punishment */}
                {result.verified ? (
                    <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2 text-teal-primary">
                            <Zap size={18} />
                            <span className="text-lg font-bold">+{result.xpAwarded} XP</span>
                        </div>
                        {result.achievements.length > 0 && (
                            <div className="space-y-1">
                                {result.achievements.map((a) => (
                                    <div key={a} className="flex items-center justify-center gap-2 text-tier-slave">
                                        <Trophy size={14} />
                                        <span className="text-sm font-medium">{a}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {result.punishmentHours > 0 && (
                            <div className="flex items-center justify-center gap-2 text-red-primary">
                                <AlertTriangle size={18} />
                                <span className="text-lg font-bold">+{result.punishmentHours}h Lock Time</span>
                            </div>
                        )}
                        {result.punishmentReason && (
                            <p className="text-xs text-red-primary/70">{result.punishmentReason}</p>
                        )}
                    </div>
                )}

                <Button
                    variant={result.verified ? 'primary' : 'ghost'}
                    className="w-full"
                    onClick={onClose}
                >
                    {result.verified ? 'Continue' : 'Acknowledge'}
                </Button>
            </div>
        </div>
    )
}

// ── Main Tasks Page ──────────────────────────────────────────
export default function TasksPage() {
    const { user, profile } = useAuth()
    const [session, setSession] = useState<Session | null>(null)
    const [generating, setGenerating] = useState(false)
    const [verifying, setVerifying] = useState<string | null>(null)
    const [detailTask, setDetailTask] = useState<Task | null>(null)
    const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
    const [dailyTaskCount, setDailyTaskCount] = useState(0)
    const [dailyLimitReached, setDailyLimitReached] = useState(false)
    const [pendingMessage, setPendingMessage] = useState<string | null>(null)
    const DAILY_LIMIT = 5

    const { data: tasks, refetch } = useRealtimeQuery<Task>(
        'tasks',
        user ? { user_id: user.id } : {},
        'created_at',
        false
    )

    useEffect(() => {
        if (user) {
            getActiveSession(user.id).then(setSession)
        }
    }, [user])

    const activeTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'active' || t.status === 'verification_pending')
    const completedTasks = tasks.filter((t) => t.status === 'completed' || t.status === 'failed')
    const pendingVerificationTasks = tasks.filter((t) => t.status === 'verification_pending')

    // ── Generate Task ────────────────────────────────────────
    const handleGenerateTask = useCallback(async () => {
        if (!user || !profile) return
        setGenerating(true)
        try {
            const res = await fetch('/api/tasks/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    sessionId: session?.id,
                    tier: profile.tier ?? 'Newbie',
                    fetishes: profile.interests ?? [],
                    regimens: profile.preferred_regimens ?? [],
                    hardLimits: profile.hard_limits ?? [],
                    personality: profile.ai_personality ?? 'Cruel Mistress',
                }),
            })

            if (res.ok) {
                const data = await res.json()
                setDailyTaskCount(data.tasksToday ?? 0)
                setDailyLimitReached(false)
                refetch()
            } else if (res.status === 429) {
                const data = await res.json()
                setDailyLimitReached(true)
                setDailyTaskCount(data.tasksToday ?? 5) // Default to 5 if undefined
            }
        } catch (err) {
            console.error('Task generation failed:', err)
        }
        setGenerating(false)
    }, [user, profile, session, refetch])

    // ── Start Task ───────────────────────────────────────────
    const handleStartTask = async (taskId: string) => {
        await updateTaskStatus(taskId, 'active')
        refetch()
    }

    // ── Self-report complete via API (updates willpower) ─────
    const handleSelfComplete = useCallback(async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId)
        if (!task || !user) return

        try {
            await fetch('/api/tasks/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId,
                    userId: user.id,
                    sessionId: session?.id,
                    difficulty: task.difficulty,
                    selfReport: true,
                }),
            })
            refetch()
        } catch (err) {
            console.error('Self-complete failed:', err)
        }
    }, [tasks, user, session, refetch])

    // ── Photo Upload & Verification ──────────────────────────
    const handlePhotoUpload = async (taskId: string, file: File) => {
        setVerifying(taskId)
        setDetailTask(null) // Close detail modal

        try {
            const reader = new FileReader()
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1]

                const task = tasks.find((t) => t.id === taskId)

                // Show pending message immediately
                setPendingMessage('Submitting your pathetic attempt for review...')

                const res = await fetch('/api/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        taskId,
                        imageBase64: base64,
                        userId: user?.id,
                        sessionId: session?.id,
                        taskType: task?.verification_type || 'general',
                        taskDescription: task?.description || '',
                        tier: profile?.tier || 'Newbie',
                    }),
                })

                if (res.ok) {
                    const data = await res.json()
                    setPendingMessage(null)
                    setVerificationResult(data)
                    refetch()
                }
                setVerifying(null)
            }
            reader.readAsDataURL(file)
        } catch {
            setPendingMessage(null)
            setVerifying(null)
        }
    }

    return (
        <>
            <TopBar />

            <div className="min-h-screen pb-24 lg:pb-8 p-4">
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

                    {/* Pending message */}
                    {pendingMessage && (
                        <div className="mb-4 bg-purple-primary/5 border border-purple-primary/20 rounded-xl p-3 text-center text-sm text-purple-primary font-mono">
                            <Loader2 size={14} className="inline mr-2 animate-spin" />
                            {pendingMessage}
                        </div>
                    )}

                    {/* Active Tasks */}
                    <div className="space-y-4">
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
                                    <span className="flex items-center gap-1">
                                        <Camera size={14} />
                                        {task.verification_type}
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
                                    ) : task.status === 'verification_pending' ? (
                                        <Badge variant="locked">
                                            ⏳ UNDER REVIEW
                                        </Badge>
                                    ) : verifying === task.id ? (
                                        <Badge variant="info">⏳ Verifying...</Badge>
                                    ) : (
                                        <TaskQuickActions
                                            task={task}
                                            isVerifying={verifying === task.id}
                                            onPhotoUpload={(file) => handlePhotoUpload(task.id, file)}
                                            onSelfComplete={() => handleSelfComplete(task.id)}
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
                                                    {task.status === 'completed' ? '✅ Passed' : '❌ Failed'}
                                                    {task.ai_verification_reason && ` — ${task.ai_verification_reason.slice(0, 80)}`}
                                                </p>
                                            </div>
                                            <Badge variant={task.status === 'completed' ? 'info' : 'locked'}>
                                                {task.status.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Task Detail Modal */}
            {detailTask && (
                <TaskDetailModal
                    task={detailTask}
                    onClose={() => setDetailTask(null)}
                    onSubmitProof={(file) => handlePhotoUpload(detailTask.id, file)}
                    onSelfComplete={() => handleSelfComplete(detailTask.id)}
                    isVerifying={verifying === detailTask.id}
                />
            )}

            {/* Verification Result Overlay */}
            {verificationResult && (
                <VerificationOverlay
                    result={verificationResult}
                    onClose={() => {
                        setVerificationResult(null)
                        refetch()
                    }}
                />
            )}

            <BottomNav />
        </>
    )
}
