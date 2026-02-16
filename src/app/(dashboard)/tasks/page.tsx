'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Clock, Camera, AlertTriangle, Sparkles, Upload, Loader2 } from 'lucide-react'
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

export default function TasksPage() {
    const { user, profile } = useAuth()
    const [session, setSession] = useState<Session | null>(null)
    const [generating, setGenerating] = useState(false)
    const [verifying, setVerifying] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedTask, setSelectedTask] = useState<string | null>(null)

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

    const activeTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'active')
    const completedTasks = tasks.filter((t) => t.status === 'completed' || t.status === 'failed')

    const handleGenerateTask = useCallback(async () => {
        if (!user || !profile) return
        setGenerating(true)
        try {
            const res = await fetch('/api/ai/generate-task', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    sessionId: session?.id,
                    tier: profile.tier ?? 'Newbie',
                    fetishTags: [],
                    personality: profile.ai_personality ?? 'Cruel Mistress',
                    hardLimits: [],
                }),
            })
            if (res.ok) refetch()
        } catch (err) {
            console.error('Task generation failed:', err)
        }
        setGenerating(false)
    }, [user, profile, session, refetch])

    const handleStartTask = async (taskId: string) => {
        await updateTaskStatus(taskId, 'active')
        refetch()
    }

    const handlePhotoUpload = async (taskId: string, file: File) => {
        setVerifying(taskId)
        try {
            const reader = new FileReader()
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1]
                const res = await fetch('/api/ai/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        taskId,
                        imageBase64: base64,
                        userId: user?.id,
                    }),
                })
                if (res.ok) refetch()
                setVerifying(null)
            }
            reader.readAsDataURL(file)
        } catch {
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
                            <Badge variant="locked">{activeTasks.length} Active</Badge>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleGenerateTask}
                                disabled={generating}
                            >
                                {generating ? (
                                    <Loader2 size={14} className="mr-1 animate-spin" />
                                ) : (
                                    <Sparkles size={14} className="mr-1" />
                                )}
                                {generating ? 'Generating...' : 'New Task'}
                            </Button>
                        </div>
                    </div>

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
                                className="space-y-4 animate-fade-in"
                                style={{ animationDelay: `${index * 100}ms` }}
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

                                {/* Description */}
                                <p className="text-text-secondary text-sm whitespace-pre-line leading-relaxed">
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
                                        Difficulty: {'★'.repeat(task.difficulty)}{'☆'.repeat(5 - task.difficulty)}
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
                                        <Button variant="ghost" size="sm" onClick={() => handleStartTask(task.id)}>
                                            Start Task
                                        </Button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <input
                                                ref={selectedTask === task.id ? fileInputRef : undefined}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) handlePhotoUpload(task.id, file)
                                                }}
                                            />
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                disabled={verifying === task.id}
                                                onClick={() => {
                                                    setSelectedTask(task.id)
                                                    // Allow browser to process state update before clicking input
                                                    setTimeout(() => fileInputRef.current?.click(), 50)
                                                }}
                                            >
                                                {verifying === task.id ? (
                                                    <><Loader2 size={14} className="mr-1 animate-spin" /> Verifying...</>
                                                ) : (
                                                    <><Upload size={14} className="mr-1" /> Submit Proof</>
                                                )}
                                            </Button>
                                        </div>
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
                                {completedTasks.slice(0, 5).map((task) => (
                                    <Card key={task.id} variant="flat" size="sm" className="!min-h-0">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium">{task.title}</p>
                                                <p className="text-xs text-text-tertiary">
                                                    {task.status === 'completed' ? '✅ Passed' : '❌ Failed'}
                                                    {task.ai_verification_reason && ` — ${task.ai_verification_reason}`}
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

            <BottomNav />
        </>
    )
}
