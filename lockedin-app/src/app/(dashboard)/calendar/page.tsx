'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Clock, TrendingDown, TrendingUp } from 'lucide-react'

// Mock data
const mockReleaseDate = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
const mockAdjustments = [
    { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), hoursAdded: 4, reason: 'Late check-in response', aiControlled: true },
    { timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), hoursSubtracted: 2, reason: 'Task completed ahead of schedule', aiControlled: true },
    { timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), hoursAdded: 8, reason: 'Attempted to remove device', aiControlled: true },
    { timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000), hoursSubtracted: 1, reason: 'Perfect compliance streak bonus', aiControlled: true },
    { timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), hoursAdded: 12, reason: 'Rude behavior in chat', aiControlled: true },
]

// Mock day ratings
const getDayType = (day: Date): 'good' | 'mixed' | 'bad' | 'lockdown' | null => {
    const seed = day.getDate()
    if (day > new Date()) return null
    if (seed % 7 === 0) return 'bad'
    if (seed % 5 === 0) return 'lockdown'
    if (seed % 3 === 0) return 'mixed'
    return 'good'
}

export default function CalendarPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date())

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const startDay = monthStart.getDay()

    return (
        <>
            <TopBar tier="Slave" username="slave_user" />

            <div className="min-h-screen pb-24 lg:pb-8 p-4">
                <div className="max-w-2xl mx-auto space-y-6">
                    <h1 className="text-3xl font-bold">Calendar</h1>

                    {/* Release Date Card */}
                    <Card variant="hero" className="text-center">
                        <p className="text-xs text-text-tertiary uppercase tracking-wide mb-2">
                            Scheduled Release Date
                        </p>
                        <div className="text-4xl font-bold font-mono mb-2 text-red-primary text-glow-red">
                            {format(mockReleaseDate, 'MMM dd, yyyy')}
                        </div>
                        <Badge variant="locked">Subject to change based on performance</Badge>
                    </Card>

                    {/* Month Navigation */}
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
                                <div
                                    key={`${day}-${i}`}
                                    className="text-center text-xs text-text-tertiary font-semibold py-1"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {/* Empty cells for start offset */}
                            {Array.from({ length: startDay }).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square" />
                            ))}
                            {daysInMonth.map((day) => {
                                const isReleaseDay = isSameDay(day, mockReleaseDate)
                                const isToday = isSameDay(day, new Date())
                                const dayType = getDayType(day)

                                const dayColors = {
                                    good: 'bg-tier-newbie/20 text-tier-newbie',
                                    mixed: 'bg-tier-slave/20 text-tier-slave',
                                    bad: 'bg-red-primary/20 text-red-primary',
                                    lockdown: 'bg-bg-hover text-text-tertiary',
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
                                <div className="w-2.5 h-2.5 rounded-full bg-bg-hover" />
                                <span className="text-[10px] text-text-tertiary">Lockdown</span>
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
                        <div className="space-y-2">
                            {mockAdjustments.map((log, index) => (
                                <Card
                                    key={index}
                                    variant="flat"
                                    size="sm"
                                    className="!min-h-0 py-3 animate-fade-in"
                                    style={{ animationDelay: `${index * 80}ms` }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {log.hoursAdded ? (
                                                <TrendingUp size={16} className="text-red-primary" />
                                            ) : (
                                                <TrendingDown size={16} className="text-teal-primary" />
                                            )}
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {log.hoursAdded
                                                        ? `+${log.hoursAdded}h`
                                                        : `-${log.hoursSubtracted}h`}
                                                </p>
                                                <p className="text-xs text-text-tertiary">{log.reason}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-text-tertiary font-mono">
                                                {format(log.timestamp, 'h:mm a')}
                                            </span>
                                            <Badge variant={log.aiControlled ? 'locked' : 'genre'}>
                                                {log.aiControlled ? 'AI' : 'Manual'}
                                            </Badge>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <BottomNav />
        </>
    )
}
