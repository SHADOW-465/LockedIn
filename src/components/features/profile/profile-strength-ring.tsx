'use client'

import { calcProfileStrength } from '@/lib/profile-strength'
import type { UserProfile } from '@/lib/supabase/schema'

interface ProfileStrengthRingProps {
    profile: Partial<UserProfile>
    size?: number
}

export function ProfileStrengthRing({ profile, size = 120 }: ProfileStrengthRingProps) {
    const score = calcProfileStrength(profile)
    const radius = (size - 12) / 2
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (score / 100) * circumference

    // Color thresholds
    const color = score >= 80 ? '#14b8a6' : score >= 50 ? '#f59e0b' : '#ef4444'

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                    {/* Background track */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth={10}
                    />
                    {/* Progress arc */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={10}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                    />
                </svg>
                {/* Score label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white">{score}</span>
                    <span className="text-xs text-white/50">/ 100</span>
                </div>
            </div>
            <p className="text-sm text-white/60">Profile Strength</p>
        </div>
    )
}
