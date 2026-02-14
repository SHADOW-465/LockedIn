'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TimerCardProps {
    endTime: Date
    tier: string
    status: 'locked' | 'punishment' | 'lockdown'
}

export function TimerCard({ endTime, tier, status }: TimerCardProps) {
    const [timeRemaining, setTimeRemaining] = useState('')
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date()
            const diff = endTime.getTime() - now.getTime()

            if (diff <= 0) {
                setTimeRemaining('00d 00h 00m 00s')
                setProgress(100)
                clearInterval(interval)
                return
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor(
                (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
            )
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)

            setTimeRemaining(
                `${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
            )

            // Calculate rough progress (assuming 7-day total)
            const total = 7 * 24 * 60 * 60 * 1000
            const elapsed = total - diff
            setProgress(Math.min(100, (elapsed / total) * 100))
        }, 1000)

        return () => clearInterval(interval)
    }, [endTime])

    return (
        <Card
            variant="hero"
            className={`relative overflow-hidden ${status === 'punishment' ? 'animate-timer-pulse' : ''
                }`}
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
                    <Badge
                        variant={
                            `tier${tier === 'Newbie' ? '1' : tier === 'Slave' ? '2' : tier === 'Hardcore' ? '3' : tier === 'Extreme' ? '4' : '5'
                            }` as 'tier1'
                        }
                    >
                        {tier.toUpperCase()}
                    </Badge>
                </div>

                <div className="text-center py-4">
                    <div className="text-5xl md:text-6xl font-mono font-bold mb-4 text-red-primary text-glow-red tracking-wider">
                        {timeRemaining || '—'}
                    </div>
                    <p className="text-text-secondary text-sm">Time Remaining Until Release</p>
                </div>

                {status === 'punishment' && (
                    <div className="mt-4 text-center">
                        <Badge variant="locked" className="animate-pulse">
                            ⚠ PUNISHMENT MODE ACTIVE
                        </Badge>
                    </div>
                )}
            </div>
        </Card>
    )
}
