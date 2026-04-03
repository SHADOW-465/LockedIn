'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle, Plus, X, Loader2 } from 'lucide-react'

interface TimerCardProps {
    endTime: Date
    startTime: Date
    totalDurationMinutes: number
    tier: string
    status: 'active' | 'extending' | 'completing' | 'completed' | 'emergency' | string
    punishmentActive?: boolean
    onAddTime?: (minutes: number) => Promise<void>
}

export function TimerCard({ endTime, startTime, totalDurationMinutes, tier, status, punishmentActive, onAddTime }: TimerCardProps) {
    const [timeRemaining, setTimeRemaining] = useState('')
    const [progress, setProgress] = useState(0)
    const [showAddTime, setShowAddTime] = useState(false)
    const [addDays, setAddDays] = useState(0)
    const [addHours, setAddHours] = useState(1)
    const [addMinutes, setAddMinutes] = useState(0)
    const [isAdding, setIsAdding] = useState(false)

    const isComplete = status === 'completed' || status === 'emergency' || status === 'completing'

    useEffect(() => {
        if (isComplete) {
            setTimeRemaining('00d 00h 00m 00s')
            setProgress(100)
            return
        }

        const tick = () => {
            const now = new Date()
            const diff = endTime.getTime() - now.getTime()

            if (diff <= 0) {
                setTimeRemaining('00d 00h 00m 00s')
                setProgress(100)
                return
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)

            setTimeRemaining(
                `${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
            )

            const totalMs = totalDurationMinutes * 60 * 1000
            const elapsedMs = totalMs - diff
            setProgress(Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)))
        }

        tick()
        const interval = setInterval(tick, 1000)
        return () => clearInterval(interval)
    }, [endTime, totalDurationMinutes, isComplete])

    const tierVariant = `tier${tier === 'Newbie' ? '1' : tier === 'Slave' ? '2' : tier === 'Hardcore' ? '3' : tier === 'Extreme' ? '4' : '5'
        }` as 'tier1'

    const handleAddTime = async () => {
        const totalMinutesToAdd = addDays * 24 * 60 + addHours * 60 + addMinutes
        if (totalMinutesToAdd <= 0 || !onAddTime) return
        setIsAdding(true)
        try {
            await onAddTime(totalMinutesToAdd)
            setShowAddTime(false)
            setAddDays(0)
            setAddHours(1)
            setAddMinutes(0)
        } finally {
            setIsAdding(false)
        }
    }

    if (status === 'completing') {
        return (
            <Card variant="hero" className="relative overflow-hidden text-center py-8">
                <div className="space-y-3">
                    <AlertTriangle size={40} className="mx-auto text-yellow-500 animate-pulse" />
                    <h2 className="text-2xl font-bold font-mono">Session Ending...</h2>
                    <p className="text-text-secondary text-sm">Archiving your session data. Please wait.</p>
                </div>
            </Card>
        )
    }

    if (status === 'completed' || status === 'emergency') {
        return (
            <Card variant="hero" className="relative overflow-hidden text-center py-8">
                <div className="space-y-3">
                    <CheckCircle size={40} className="mx-auto text-teal-primary" />
                    <h2 className="text-2xl font-bold font-mono">
                        {status === 'emergency' ? 'Emergency Release' : 'Session Complete'}
                    </h2>
                    <p className="text-text-secondary text-sm">
                        {status === 'emergency' ? 'You have been released.' : 'Your session has ended. Summary available below.'}
                    </p>
                </div>
            </Card>
        )
    }

    return (
        <Card
            variant="hero"
            className={`relative overflow-hidden border border-zinc-800 ${punishmentActive ? 'animate-timer-pulse' : ''}`}
        >
            <div className="absolute inset-0 bg-zinc-900 pointer-events-none" />

            {/* Progress bar at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800 z-10">
                <div
                    className="h-full bg-[var(--accent)] transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                    <Badge variant="locked">LOCKED IN</Badge>
                    <Badge variant={tierVariant}>{tier.toUpperCase()}</Badge>
                </div>

                <div className="text-center py-4">
                    <div className="text-5xl md:text-6xl font-mono font-bold mb-4 text-white tracking-wider">
                        {timeRemaining || '—'}
                    </div>
                    <p className="text-white/30 text-sm uppercase tracking-widest font-bold">Time Remaining Until Release</p>
                </div>

                {punishmentActive && (
                    <div className="mt-4 text-center">
                        <Badge variant="locked" className="animate-pulse">
                            ⚠ PUNISHMENT MODE ACTIVE
                        </Badge>
                    </div>
                )}

                {status === 'extending' && (
                    <div className="mt-4 text-center">
                        <Badge className="animate-pulse bg-yellow-600 text-white">
                            ⏱ SESSION EXTENDED
                        </Badge>
                    </div>
                )}

                {/* Add Time Button & Picker */}
                {onAddTime && status === 'active' && (
                    <div className="mt-5">
                        {!showAddTime ? (
                            <div className="text-center">
                                <button
                                    onClick={() => setShowAddTime(true)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-pill)] bg-zinc-800 border border-zinc-700 text-white text-sm font-semibold hover:bg-zinc-700 hover:border-zinc-600 transition-all duration-200 cursor-pointer"
                                >
                                    <Plus size={14} />
                                    Add Time
                                </button>
                            </div>
                        ) : (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-[var(--radius-lg)] p-4 space-y-3 backdrop-blur-sm shadow-xl">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-white">Increase Lock Duration</span>
                                    <button
                                        onClick={() => setShowAddTime(false)}
                                        className="text-white/30 hover:text-white transition-colors cursor-pointer"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs text-white/30">Days</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={30}
                                            value={addDays}
                                            onChange={e => setAddDays(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-[var(--radius-md)] p-2 text-center text-white text-sm focus:border-zinc-600 focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-white/30">Hours</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={23}
                                            value={addHours}
                                            onChange={e => setAddHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-[var(--radius-md)] p-2 text-center text-white text-sm focus:border-zinc-600 focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-white/30">Minutes</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={59}
                                            value={addMinutes}
                                            onChange={e => setAddMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-[var(--radius-md)] p-2 text-center text-white text-sm focus:border-zinc-600 focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                                {(addDays * 24 * 60 + addHours * 60 + addMinutes) > 0 && (
                                    <p className="text-xs text-center text-white/30">
                                        Adding {addDays > 0 ? `${addDays}d ` : ''}{addHours > 0 ? `${addHours}h ` : ''}{addMinutes > 0 ? `${addMinutes}m` : ''}
                                    </p>
                                )}
                                <button
                                    onClick={handleAddTime}
                                    disabled={isAdding || (addDays * 24 * 60 + addHours * 60 + addMinutes) <= 0}
                                    className="w-full py-2.5 rounded-[var(--radius-pill)] bg-zinc-800 border border-zinc-700 text-white font-bold text-sm uppercase tracking-wide hover:bg-zinc-700 hover:border-zinc-600 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                                >
                                    {isAdding ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Extending...
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={14} />
                                            Confirm Add Time
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Card>
    )
}
