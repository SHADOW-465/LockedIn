'use client'

import { TimerCard } from '@/components/features/timer/timer-card'
import { BentoGrid, BentoItem } from '@/components/layout/bento-grid'
import { TopBar } from '@/components/layout/top-bar'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Flame, TrendingUp, AlertTriangle, Calendar, Target, Zap } from 'lucide-react'

// Mock data — will be replaced with Firestore data
const mockProfile = {
    tier: 'Slave' as const,
    username: 'slave_user',
    willpowerScore: 67,
    complianceStreak: 12,
}

export default function DashboardPage() {
    const mockEndTime = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)

    return (
        <>
            <TopBar tier={mockProfile.tier} username={mockProfile.username} />

            <div className="min-h-screen pb-24 lg:pb-8">
                <BentoGrid>
                    {/* Hero Timer */}
                    <BentoItem span="hero" className="!bg-transparent !shadow-none !border-none !p-0">
                        <TimerCard
                            endTime={mockEndTime}
                            tier={mockProfile.tier}
                            status="locked"
                        />
                    </BentoItem>

                    {/* Willpower */}
                    <BentoItem>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">
                                    Willpower
                                </h3>
                                <Zap size={16} className="text-purple-primary" />
                            </div>
                            <div className="relative w-28 h-28 mx-auto">
                                <svg className="transform -rotate-90 w-28 h-28">
                                    <circle
                                        cx="56"
                                        cy="56"
                                        r="48"
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        fill="none"
                                        className="text-bg-tertiary"
                                    />
                                    <circle
                                        cx="56"
                                        cy="56"
                                        r="48"
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        fill="none"
                                        strokeDasharray={2 * Math.PI * 48}
                                        strokeDashoffset={
                                            2 * Math.PI * 48 * (1 - mockProfile.willpowerScore / 100)
                                        }
                                        className="text-purple-primary transition-all duration-1000"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-3xl font-bold font-mono">
                                        {mockProfile.willpowerScore}
                                    </span>
                                </div>
                            </div>
                            <p className="text-center text-xs text-text-tertiary">
                                {mockProfile.willpowerScore >= 70
                                    ? 'Strong resistance'
                                    : mockProfile.willpowerScore >= 40
                                        ? 'Moderate resolve'
                                        : 'Breaking point near'}
                            </p>
                        </div>
                    </BentoItem>

                    {/* Current Task */}
                    <BentoItem span="wide">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Target size={16} className="text-red-primary" />
                                    <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">
                                        Current Task
                                    </h3>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="genre">JOI</Badge>
                                    <Badge variant="genre">CEI</Badge>
                                    <Badge variant="genre">SPH</Badge>
                                </div>
                            </div>
                            <p className="text-text-secondary text-sm leading-relaxed">
                                Edge 15 times slowly, then ruined orgasm. Consume all evidence.
                                Photo verification required.
                            </p>
                            <div className="flex items-center gap-3">
                                <Badge variant="uncaged">🗝️ UNCAGED TASK</Badge>
                                <span className="text-sm text-text-tertiary font-mono">
                                    Deadline: 2h 34m
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="primary" className="flex-1">
                                    Submit Proof
                                </Button>
                                <Button variant="ghost" size="sm">
                                    Details
                                </Button>
                            </div>
                        </div>
                    </BentoItem>

                    {/* Compliance Streak */}
                    <BentoItem>
                        <div className="text-center space-y-3">
                            <Flame size={32} className="mx-auto text-tier-slave" />
                            <div>
                                <div className="text-4xl font-bold font-mono">
                                    {mockProfile.complianceStreak}
                                </div>
                                <div className="text-sm text-text-secondary mt-1">Day Streak</div>
                            </div>
                            <div className="flex justify-center gap-1">
                                {Array.from({ length: 7 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-3 h-3 rounded-full ${i < mockProfile.complianceStreak % 7
                                                ? 'bg-tier-slave'
                                                : 'bg-bg-tertiary'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </BentoItem>

                    {/* Next Release */}
                    <BentoItem>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-teal-primary" />
                                <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">
                                    Next Release
                                </h3>
                            </div>
                            <div className="text-2xl font-bold font-mono">Feb 21</div>
                            <p className="text-xs text-text-secondary">
                                Based on current compliance. Subject to AI adjustments.
                            </p>
                            <Badge variant="info">Dynamic</Badge>
                        </div>
                    </BentoItem>

                    {/* Future Crime Prediction */}
                    <BentoItem>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={16} className="text-tier-slave" />
                                <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">
                                    Future Crime
                                </h3>
                            </div>
                            <p className="text-sm text-red-primary font-medium">
                                Late night check-in predicted
                            </p>
                            <p className="text-xs text-text-tertiary">
                                AI predicts next violation window: 11 PM – 2 AM
                            </p>
                            <Badge variant="warning">Medium Risk</Badge>
                        </div>
                    </BentoItem>

                    {/* Session Stats */}
                    <BentoItem>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={16} className="text-teal-primary" />
                                <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">
                                    Session Stats
                                </h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="text-lg font-bold font-mono">24</div>
                                    <div className="text-xs text-text-tertiary">Tasks Done</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold font-mono">3</div>
                                    <div className="text-xs text-text-tertiary">Violations</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold font-mono">168h</div>
                                    <div className="text-xs text-text-tertiary">Total Denial</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold font-mono">87</div>
                                    <div className="text-xs text-text-tertiary">Total Edges</div>
                                </div>
                            </div>
                        </div>
                    </BentoItem>
                </BentoGrid>
            </div>

            <BottomNav />
        </>
    )
}
