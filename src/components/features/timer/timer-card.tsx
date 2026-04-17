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
            setTimeRemaining('00D 00H 00M 00S')
            setProgress(100)
            return
        }

        const tick = () => {
            const now = new Date()
            const diff = endTime.getTime() - now.getTime()

            if (diff <= 0) {
                setTimeRemaining('00D 00H 00M 00S')
                setProgress(100)
                return
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)

            setTimeRemaining(
                `${String(days).padStart(2, '0')}D ${String(hours).padStart(2, '0')}H ${String(minutes).padStart(2, '0')}M ${String(seconds).padStart(2, '0')}S`
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
            <Card variant="hero" className="flex flex-col items-center justify-center py-16 border-l-4 border-l-[var(--color-accent)]">
                <div className="space-y-6 text-center">
                    <AlertTriangle size={48} className="mx-auto text-[var(--color-accent)] animate-pulse" />
                    <div>
                        <h2 className="text-3xl font-bold font-mono uppercase tracking-tighter mb-2">DE-SYNC_IN_PROGRESS</h2>
                        <p className="text-[var(--color-text-secondary)] font-mono text-xs uppercase tracking-widest">ARCHIVING SESSION MANIFEST. REMAIN CONNECTED.</p>
                    </div>
                </div>
            </Card>
        )
    }

    if (status === 'completed' || status === 'emergency') {
        return (
            <Card variant="hero" className="flex flex-col items-center justify-center py-16 border-l-4 border-l-white">
                <div className="space-y-6 text-center">
                    <CheckCircle size={48} className="mx-auto text-white" />
                    <div>
                        <h2 className="text-3xl font-bold font-mono uppercase tracking-tighter mb-2">
                            {status === 'emergency' ? 'OVERRIDE_SUCCESS' : 'CHRONO_COMPLETION'}
                        </h2>
                        <p className="text-[var(--color-text-secondary)] font-mono text-xs uppercase tracking-widest">
                            {status === 'emergency' ? 'SUBJECT_RELEASE_AUTHORIZED.' : 'SESSION_ENDED. DATA_INTEGRITY_VERIFIED.'}
                        </p>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card
            variant="hero"
            className={`relative p-0 border border-[#141414] overflow-hidden ${punishmentActive ? 'animate-timer-pulse' : ''}`}
        >
            {/* Header Strip */}
            <div className="bg-[#0a0a0a] border-b border-[#141414] px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[var(--color-accent)] animate-pulse" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em]">CHRONO_LOCK_ACTIVE</span>
                </div>
                <Badge variant={tierVariant}>{tier.toUpperCase()}</Badge>
            </div>

            <div className="p-8 md:p-12">
                <div className="text-center">
                    <div className="text-5xl md:text-7xl lg:text-8xl font-mono font-bold text-white tracking-widest mb-6">
                        {timeRemaining || '??D ??H ??M ??S'}
                    </div>
                    <div className="w-full h-2 bg-[#0a0a0a] border border-[#141414] mb-4">
                        <div
                            className="h-full bg-white transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono font-bold text-[#444] uppercase tracking-widest">
                        <span>INIT_SEQUENCE</span>
                        <span>{progress.toFixed(1)}%_COMPLETE</span>
                        <span>RELEASE_THRESHOLD</span>
                    </div>
                </div>

                {punishmentActive && (
                    <div className="mt-8 bg-[var(--color-accent)]/10 border border-[var(--color-accent)] p-3 text-center">
                        <span className="text-[var(--color-accent)] text-xs font-mono font-bold uppercase tracking-[0.2em] animate-pulse">
                            ⚠ PUNISHMENT_PROTOCOL_ACTIVE
                        </span>
                    </div>
                )}

                {/* Add Time UI */}
                {onAddTime && status === 'active' && (
                    <div className="mt-10 border-t border-[#141414] pt-8">
                        {!showAddTime ? (
                            <div className="text-center">
                                <button
                                    onClick={() => setShowAddTime(true)}
                                    className="px-6 py-2 border border-[#141414] text-[var(--color-text-secondary)] text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-white hover:text-black hover:border-white transition-all cursor-pointer"
                                >
                                    [ ADD_SESSION_TIME ]
                                </button>
                            </div>
                        ) : (
                            <div className="bg-[#050505] border border-[#141414] p-6 space-y-6 animate-in fade-in slide-in-from-top-4">
                                <div className="flex items-center justify-between border-b border-[#141414] pb-2">
                                    <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">DURATION_EXTENSION_CONFIG</span>
                                    <button
                                        onClick={() => setShowAddTime(false)}
                                        className="text-[#444] hover:text-[var(--color-accent)] transition-colors cursor-pointer"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-mono font-bold text-[#444] uppercase tracking-widest">DAYS</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={30}
                                            value={addDays}
                                            onChange={e => setAddDays(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-full bg-black border border-[#141414] p-3 text-center text-white font-mono text-sm focus:border-white outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-mono font-bold text-[#444] uppercase tracking-widest">HOURS</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={23}
                                            value={addHours}
                                            onChange={e => setAddHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                                            className="w-full bg-black border border-[#141414] p-3 text-center text-white font-mono text-sm focus:border-white outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-mono font-bold text-[#444] uppercase tracking-widest">MINS</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={59}
                                            value={addMinutes}
                                            onChange={e => setAddMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                                            className="w-full bg-black border border-[#141414] p-3 text-center text-white font-mono text-sm focus:border-white outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleAddTime}
                                    disabled={isAdding || (addDays * 24 * 60 + addHours * 60 + addMinutes) <= 0}
                                    className="w-full py-4 bg-white text-black font-mono font-bold text-xs uppercase tracking-[0.2em] hover:bg-[var(--color-accent)] hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-3"
                                >
                                    {isAdding ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            SYSTEM_UPDATIVE...
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={14} />
                                            AUTHORIZE_EXTENSION
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
