'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Clock, Camera, AlertTriangle } from 'lucide-react'

// Mock tasks
const mockTasks = [
    {
        taskId: '1',
        title: 'Edge Marathon — 15 Edges',
        description:
            'Step 1: Remove device.\nStep 2: Edge slowly 15 times.\nStep 3: Ruin the 15th edge.\nStep 4: Consume all evidence.\nStep 5: Re-lock immediately.\nStep 6: Submit photo proof of lock.',
        genres: ['JOI', 'CEI', 'Ruined Orgasm'],
        cageStatus: 'uncaged' as const,
        difficulty: 3,
        durationMinutes: 45,
        deadline: new Date(Date.now() + 2 * 60 * 60 * 1000),
        status: 'active' as const,
        verification: { type: 'photo' as const, requirement: 'Clean hand + locked device' },
        punishmentOnFail: { type: 'time_add', hours: 8, additional: '40 ball slaps' },
    },
    {
        taskId: '2',
        title: 'Humiliation Photo Set',
        description:
            'Step 1: Wear assigned clothing.\nStep 2: Take 3 photos from different angles as instructed.\nStep 3: Write degrading message on body.\nStep 4: Submit all photos.',
        genres: ['Humiliation', 'SPH', 'Sissy'],
        cageStatus: 'caged' as const,
        difficulty: 4,
        durationMinutes: 20,
        deadline: new Date(Date.now() + 4 * 60 * 60 * 1000),
        status: 'pending' as const,
        verification: { type: 'photo' as const, requirement: 'Multiple angle photos' },
        punishmentOnFail: { type: 'time_add', hours: 12, additional: '24h punishment mode' },
    },
    {
        taskId: '3',
        title: 'Morning Hygiene Protocol',
        description:
            'Step 1: Cold shower (5 minutes max).\nStep 2: Clean device without removal.\nStep 3: Submit before/after photos.',
        genres: ['Discipline'],
        cageStatus: 'caged' as const,
        difficulty: 1,
        durationMinutes: 10,
        deadline: new Date(Date.now() + 1 * 60 * 60 * 1000),
        status: 'pending' as const,
        verification: { type: 'photo' as const, requirement: 'Before/after device photos' },
        punishmentOnFail: { type: 'time_add', hours: 4 },
    },
]

function formatTimeLeft(deadline: Date) {
    const diff = deadline.getTime() - Date.now()
    if (diff <= 0) return 'OVERDUE'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
}

export default function TasksPage() {
    return (
        <>
            <TopBar tier="Slave" username="slave_user" />

            <div className="min-h-screen pb-24 lg:pb-8 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-bold">Tasks</h1>
                        <Badge variant="locked">{mockTasks.length} Active</Badge>
                    </div>

                    <div className="space-y-4">
                        {mockTasks.map((task, index) => (
                            <Card
                                key={task.taskId}
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
                                                <Badge key={genre} variant="genre">
                                                    {genre}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <Badge
                                        variant={
                                            task.cageStatus === 'caged'
                                                ? 'caged'
                                                : task.cageStatus === 'uncaged'
                                                    ? 'uncaged'
                                                    : 'genre'
                                        }
                                    >
                                        {task.cageStatus === 'caged' ? '🔒' : '🗝️'}{' '}
                                        {task.cageStatus.toUpperCase()}
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
                                        {task.durationMinutes}min
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Camera size={14} />
                                        {task.verification.type}
                                    </span>
                                    <span className="font-mono">
                                        Difficulty: {'★'.repeat(task.difficulty)}
                                        {'☆'.repeat(5 - task.difficulty)}
                                    </span>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="text-sm font-mono">
                                        <span className="text-text-tertiary">Deadline: </span>
                                        <span
                                            className={
                                                formatTimeLeft(task.deadline) === 'OVERDUE'
                                                    ? 'text-red-primary'
                                                    : 'text-text-primary'
                                            }
                                        >
                                            {formatTimeLeft(task.deadline)}
                                        </span>
                                    </div>
                                    <Button
                                        variant={task.status === 'active' ? 'primary' : 'ghost'}
                                        size="sm"
                                    >
                                        {task.status === 'active' ? 'Submit Proof' : 'Start Task'}
                                    </Button>
                                </div>

                                {/* Punishment Warning */}
                                {task.punishmentOnFail && (
                                    <div className="bg-red-primary/5 border border-red-primary/20 rounded-[var(--radius-md)] p-3 flex items-start gap-2">
                                        <AlertTriangle size={14} className="text-red-primary shrink-0 mt-0.5" />
                                        <p className="text-xs text-red-primary">
                                            Failure: +{task.punishmentOnFail.hours}h lock time
                                            {task.punishmentOnFail.additional &&
                                                ` + ${task.punishmentOnFail.additional}`}
                                        </p>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            <BottomNav />
        </>
    )
}
