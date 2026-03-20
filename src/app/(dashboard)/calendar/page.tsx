'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Clock, TrendingDown, TrendingUp, X } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { getActiveSession } from '@/lib/supabase/sessions'
import { getSupabase } from '@/lib/supabase/client'
import type { Session, CalendarAdjustment, MoodCheckin } from '@/lib/supabase/schema'

export default function CalendarPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [session, setSession] = useState<Session | null>(null)
    const [adjustments, setAdjustments] = useState<CalendarAdjustment[]>([])
    const [dayRatings, setDayRatings] = useState<Record<string, number>>({})
    const [overlays, setOverlays] = useState<Set<string>>(new Set(['tasks']))
    const [moodByDate, setMoodByDate] = useState<Record<string, MoodCheckin>>({})
    const [sessionDaySet, setSessionDaySet] = useState<Set<string>>(new Set())
    const [punishDaySet, setPunishDaySet] = useState<Set<string>>(new Set())
    const [selectedDay, setSelectedDay] = useState<Date | null>(null)
    const [taskDetailByDate, setTaskDetailByDate] = useState<Record<string, { completed: number; failed: number }>>({})

    useEffect(() => {
        if (!user) return

        async function loadCalendar() {
            const activeSession = await getActiveSession(user!.id)
            setSession(activeSession)

            const supabase = getSupabase()
            const { data: adjusts } = await supabase
                .from('calendar_adjustments')
                .select('*')
                .eq('user_id', user!.id)
                .order('created_at', { ascending: false })
                .limit(20)

            setAdjustments((adjusts ?? []) as CalendarAdjustment[])

            // Build day ratings + task detail from tasks
            const { data: tasks } = await supabase
                .from('tasks')
                .select('status, completed_at, created_at')
                .eq('user_id', user!.id)

            const ratings: Record<string, number> = {}
            const detailMap: Record<string, { completed: number; failed: number }> = {}
            for (const task of tasks ?? []) {
                const date = format(new Date(task.created_at), 'yyyy-MM-dd')
                if (!ratings[date]) ratings[date] = 0
                if (!detailMap[date]) detailMap[date] = { completed: 0, failed: 0 }
                if (task.status === 'completed') { ratings[date] += 1; detailMap[date].completed += 1 }
                if (task.status === 'failed') { ratings[date] -= 1; detailMap[date].failed += 1 }
            }
            setDayRatings(ratings)
            setTaskDetailByDate(detailMap)

            // Mood check-ins (all time)
            const { data: moods } = await supabase
                .from('mood_checkins')
                .select('id, user_id, session_id, date, submission_depth, frustration_level, headspace_tags, notes, created_at')
                .eq('user_id', user!.id)

            const moodMap: Record<string, MoodCheckin> = {}
            for (const m of moods ?? []) {
                moodMap[m.date] = m as MoodCheckin
            }
            setMoodByDate(moodMap)

            // All sessions for ring overlay
            const { data: allSessions } = await supabase
                .from('sessions')
                .select('id, start_time, scheduled_end_time')
                .eq('user_id', user!.id)
                .order('start_time', { ascending: false })
                .limit(50)

            const daySet = new Set<string>()
            for (const s of allSessions ?? []) {
                const start = new Date(s.start_time)
                const end = new Date(s.scheduled_end_time)
                const curr = new Date(start)
                while (curr <= end) {
                    daySet.add(format(curr, 'yyyy-MM-dd'))
                    curr.setDate(curr.getDate() + 1)
                }
            }
            setSessionDaySet(daySet)

            // Punishment day set from adjustments
            const pSet = new Set<string>()
            for (const a of adjusts ?? []) {
                if ((a as CalendarAdjustment).hours_added > 0) {
                    pSet.add(format(new Date((a as CalendarAdjustment).created_at), 'yyyy-MM-dd'))
                }
            }
            setPunishDaySet(pSet)
        }

        loadCalendar()
    }, [user])

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const startDay = monthStart.getDay()

    const releaseDate = session ? new Date(session.scheduled_end_time) : null

    const getDayType = (day: Date): 'good' | 'mixed' | 'bad' | null => {
        if (day > new Date()) return null
        const key = format(day, 'yyyy-MM-dd')
        const rating = dayRatings[key]
        if (rating === undefined) return null
        if (rating > 0) return 'good'
        if (rating < 0) return 'bad'
        return 'mixed'
    }

    return (
        <>
            <TopBar />

            <div className="min-h-screen pb-24 lg:pb-8 p-4">
                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold">Calendar</h1>
                        <button
                            onClick={() => router.push('/history')}
                            className="text-sm text-text-tertiary hover:text-text-secondary transition-colors flex items-center gap-1"
                        >
                            Past Sessions ↗
                        </button>
                    </div>

                    {/* Release Date Card */}
                    <Card variant="hero" className="text-center">
                        <p className="text-xs text-text-tertiary uppercase tracking-wide mb-2">
                            Scheduled Release Date
                        </p>
                        <div className="text-4xl font-bold font-mono mb-2 text-red-primary text-glow-red">
                            {releaseDate
                                ? format(releaseDate, 'MMM dd, yyyy')
                                : 'No Active Session'}
                        </div>
                        <Badge variant="locked">
                            {session ? 'Subject to change based on performance' : 'Start a session to see release date'}
                        </Badge>
                    </Card>

                    {/* Month Calendar */}
                    <Card variant="raised" className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                className="p-2 rounded-[var(--radius-md)] hover:bg-bg-tertiary transition-colors cursor-pointer"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <h2 className="text-lg font-semibold font-mono">
                                {format(currentMonth, 'MMMM yyyy')}
                            </h2>
                            <button
                                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                className="p-2 rounded-[var(--radius-md)] hover:bg-bg-tertiary transition-colors cursor-pointer"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        {/* Overlay toggles */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            {[
                                { key: 'tasks', label: 'Tasks' },
                                { key: 'mood', label: 'Mood' },
                                { key: 'sessions', label: 'Sessions' },
                                { key: 'punish', label: 'Punish' },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setOverlays((prev) => {
                                        const next = new Set(prev)
                                        if (next.has(key)) next.delete(key)
                                        else next.add(key)
                                        return next
                                    })}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                                        overlays.has(key)
                                            ? 'bg-purple-primary/20 text-purple-primary border border-purple-primary/30'
                                            : 'bg-bg-tertiary text-text-tertiary hover:text-text-secondary'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Day headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                <div key={`${day}-${i}`} className="text-center text-xs text-text-tertiary font-semibold py-1">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: startDay }).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square" />
                            ))}
                            {daysInMonth.map((day) => {
                                const isReleaseDay = releaseDate && isSameDay(day, releaseDate)
                                const isToday = isSameDay(day, new Date())
                                const dayType = getDayType(day)
                                const dateKey = format(day, 'yyyy-MM-dd')
                                const hasMood = overlays.has('mood') && !!moodByDate[dateKey]
                                const hasSession = overlays.has('sessions') && sessionDaySet.has(dateKey)
                                const hasPunish = overlays.has('punish') && punishDaySet.has(dateKey)
                                const isSelected = selectedDay && isSameDay(day, selectedDay)

                                const dayColors = {
                                    good: 'bg-tier-newbie/20 text-tier-newbie',
                                    mixed: 'bg-tier-slave/20 text-tier-slave',
                                    bad: 'bg-red-primary/20 text-red-primary',
                                }

                                return (
                                    <div
                                        key={day.toString()}
                                        onClick={() => setSelectedDay(isSelected ? null : day)}
                                        className={`aspect-square relative flex items-center justify-center rounded-[var(--radius-sm)] text-sm font-mono transition-all cursor-pointer hover:ring-1 hover:ring-purple-primary/30 ${
                                            isSelected
                                                ? 'ring-2 ring-purple-primary'
                                                : ''
                                        } ${isToday
                                            ? 'bg-purple-primary text-white font-bold ring-2 ring-purple-primary/50'
                                            : isReleaseDay
                                                ? 'bg-red-primary text-white font-bold glow-red'
                                                : overlays.has('tasks') && dayType
                                                    ? dayColors[dayType]
                                                    : 'text-text-secondary hover:bg-bg-tertiary'
                                        }`}
                                    >
                                        {format(day, 'd')}
                                        {/* Session ring */}
                                        {hasSession && (
                                            <span className="absolute inset-0 rounded-[var(--radius-sm)] ring-1 ring-teal-primary/40 pointer-events-none" />
                                        )}
                                        {/* Mood dot */}
                                        {hasMood && (
                                            <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-purple-primary" />
                                        )}
                                        {/* Punish indicator */}
                                        {hasPunish && (
                                            <span className="absolute top-0.5 left-0.5 text-[8px] leading-none">⚠</span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-tier-newbie" />
                                <span className="text-[10px] text-text-tertiary">Good</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-tier-slave" />
                                <span className="text-[10px] text-text-tertiary">Mixed</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-primary" />
                                <span className="text-[10px] text-text-tertiary">Bad</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-purple-primary" />
                                <span className="text-[10px] text-text-tertiary">Today</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full border border-teal-primary/40" />
                                <span className="text-[10px] text-text-tertiary">Session</span>
                            </div>
                        </div>
                    </Card>

                    {/* Day detail panel */}
                    {selectedDay && (
                        <Card variant="raised" className="animate-fade-in">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold">{format(selectedDay, 'MMMM d, yyyy')}</h3>
                                <div className="flex items-center gap-3">
                                    {sessionDaySet.has(format(selectedDay, 'yyyy-MM-dd')) && (
                                        <button
                                            onClick={() => router.push('/history')}
                                            className="text-xs text-teal-primary hover:underline"
                                        >
                                            ↗ Past Sessions
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setSelectedDay(null)}
                                        className="text-text-tertiary hover:text-text-secondary"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            {selectedDay > new Date() ? (
                                <p className="text-sm text-text-tertiary">No data yet for future dates.</p>
                            ) : (
                                <div className="space-y-3 text-sm">
                                    {/* Task counts */}
                                    {(() => {
                                        const dateKey = format(selectedDay, 'yyyy-MM-dd')
                                        const detail = taskDetailByDate[dateKey]
                                        if (!detail) return <p className="text-text-tertiary text-xs">No tasks recorded for this day.</p>
                                        return (
                                            <div className="flex gap-4 text-sm">
                                                <span className="text-teal-primary">✅ {detail.completed} completed</span>
                                                <span className="text-red-primary">❌ {detail.failed} failed</span>
                                            </div>
                                        )
                                    })()}
                                    {/* Mood check-in */}
                                    {(() => {
                                        const m = moodByDate[format(selectedDay, 'yyyy-MM-dd')]
                                        if (!m) return <p className="text-text-tertiary text-xs">No mood check-in for this day.</p>
                                        return (
                                            <div className="bg-bg-tertiary rounded-lg p-3 space-y-1">
                                                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">Mood Check-in</p>
                                                <div className="flex gap-3 text-xs">
                                                    <span className="text-purple-primary">Depth {m.submission_depth}/10</span>
                                                    <span className="text-red-primary">Frust {m.frustration_level}/10</span>
                                                </div>
                                                {m.headspace_tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {m.headspace_tags.map(tag => (
                                                            <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] bg-purple-primary/10 text-purple-primary">{tag}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })()}
                                    {/* Punishment adjustments */}
                                    {adjustments
                                        .filter(a => format(new Date(a.created_at), 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd'))
                                        .map(a => (
                                            <div key={a.id} className="text-xs text-red-primary">
                                                ⚠ +{a.hours_added}h — {a.reason}
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Adjustment Log */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Clock size={18} className="text-text-tertiary" />
                            Recent Adjustments
                        </h2>
                        {adjustments.length === 0 ? (
                            <Card variant="flat" size="sm" className="!min-h-0 text-center py-6">
                                <p className="text-sm text-text-tertiary">No adjustments yet. Complete tasks to see changes.</p>
                            </Card>
                        ) : (
                            <div className="space-y-2">
                                {adjustments.map((log) => (
                                    <Card
                                        key={log.id}
                                        variant="flat"
                                        size="sm"
                                        className="!min-h-0 py-3 animate-fade-in"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {log.hours_added > 0 ? (
                                                    <TrendingUp size={16} className="text-red-primary" />
                                                ) : (
                                                    <TrendingDown size={16} className="text-teal-primary" />
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {log.hours_added > 0
                                                            ? `+${log.hours_added}h`
                                                            : `-${log.hours_subtracted}h`}
                                                    </p>
                                                    <p className="text-xs text-text-tertiary">{log.reason}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-text-tertiary font-mono">
                                                    {format(new Date(log.created_at), 'h:mm a')}
                                                </span>
                                                <Badge variant={log.ai_controlled ? 'locked' : 'genre'}>
                                                    {log.ai_controlled ? 'AI' : 'Manual'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <BottomNav />
        </>
    )
}
