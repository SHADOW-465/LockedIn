'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Clock, TrendingDown, TrendingUp } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { getActiveSession } from '@/lib/supabase/sessions'
import { getSupabase } from '@/lib/supabase/client'
import type { Session, CalendarAdjustment } from '@/lib/supabase/schema'

export default function CalendarPage() {
    const { user } = useAuth()
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [session, setSession] = useState<Session | null>(null)
    const [adjustments, setAdjustments] = useState<CalendarAdjustment[]>([])
    const [dayRatings, setDayRatings] = useState<Record<string, number>>({})

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

            // Build day ratings from tasks
            const { data: tasks } = await supabase
                .from('tasks')
                .select('status, completed_at, created_at')
                .eq('user_id', user!.id)

            const ratings: Record<string, number> = {}
            for (const task of tasks ?? []) {
                const date = format(new Date(task.created_at), 'yyyy-MM-dd')
                if (!ratings[date]) ratings[date] = 0
                if (task.status === 'completed') ratings[date] += 1
                if (task.status === 'failed') ratings[date] -= 1
            }
            setDayRatings(ratings)
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
                    <h1 className="text-3xl font-bold">Calendar</h1>

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

                                const dayColors = {
                                    good: 'bg-tier-newbie/20 text-tier-newbie',
                                    mixed: 'bg-tier-slave/20 text-tier-slave',
                                    bad: 'bg-red-primary/20 text-red-primary',
                                }

                                return (
                                    <div
                                        key={day.toString()}
                                        className={`aspect-square flex items-center justify-center rounded-[var(--radius-sm)] text-sm font-mono transition-all cursor-pointer hover:ring-1 hover:ring-purple-primary/30 ${isToday
                                            ? 'bg-purple-primary text-white font-bold ring-2 ring-purple-primary/50'
                                            : isReleaseDay
                                                ? 'bg-red-primary text-white font-bold glow-red'
                                                : dayType
                                                    ? dayColors[dayType]
                                                    : 'text-text-secondary hover:bg-bg-tertiary'
                                            }`}
                                    >
                                        {format(day, 'd')}
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
                        </div>
                    </Card>

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
