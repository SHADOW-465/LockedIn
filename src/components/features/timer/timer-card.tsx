'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle } from 'lucide-react'

interface TimerCardProps {
    endTime: Date
    startTime: Date
    totalDurationMinutes: number
    tier: string
    status: 'active' | 'extending' | 'completing' | 'completed' | 'emergency' | string
    punishmentActive?: boolean
}

export function TimerCard({ endTime, startTime, totalDurationMinutes, tier, status, punishmentActive }: TimerCardProps) {
    const [timeRemaining, setTimeRemaining] = useState('')
    const [progress, setProgress] = useState(0)

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

            const days    = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)

            setTimeRemaining(
                `${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
            )

            const totalMs   = totalDurationMinutes * 60 * 1000
            const elapsedMs = totalMs - diff
            setProgress(Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)))
        }

        tick()
        const interval = setInterval(tick, 1000)
        return () => clearInterval(interval)
    }, [endTime, totalDurationMinutes, isComplete])

    const tierVariant = `tier${
        tier === 'Newbie' ? '1' : tier === 'Slave' ? '2' : tier === 'Hardcore' ? '3' : tier === 'Extreme' ? '4' : '5'
    }` as 'tier1'

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
            className={`relative overflow-hidden ${punishmentActive ? 'animate-timer-pulse' : ''}`}
        >
            {/* Background gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-primary/5 to-purple-primary/5 pointer-events-none" />

            {/* Progress bar at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-bg-tertiary">
                <div
                    className="h-full bg-gradient-to-r from-red-primary to-purple-primary transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                    <Badge variant="locked">🔒 LOCKED IN</Badge>
                    <Badge variant={tierVariant}>{tier.toUpperCase()}</Badge>
                </div>

                <div className="text-center py-4">
                    <div className="text-5xl md:text-6xl font-mono font-bold mb-4 text-red-primary text-glow-red tracking-wider">
                        {timeRemaining || '—'}
                    </div>
                    <p className="text-text-secondary text-sm">Time Remaining Until Release</p>
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
            </div>
        </Card>
    )
}
