'use client'

import { Card } from '@/components/ui/card'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ChevronLeft, Shield, AlertTriangle, Heart, Phone, ExternalLink, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default function HelpPage() {
    return (
        <>
            <TopBar />
            <div className="min-h-screen pb-24 lg:pb-8 p-4">
                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/settings" className="p-2 rounded-[var(--radius-md)] hover:bg-bg-tertiary transition-colors">
                            <ChevronLeft size={20} />
                        </Link>
                        <h1 className="text-2xl font-bold">Help & Support</h1>
                    </div>

                    {/* Safeword / Care Mode */}
                    <Card variant="hero">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-teal-primary/20 flex items-center justify-center shrink-0">
                                <Shield size={24} className="text-teal-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-teal-primary">Safeword & Care Mode</h2>
                                <p className="text-sm text-text-secondary mt-2">
                                    If you ever feel unsafe or overwhelmed, you can activate <strong>Care Mode</strong> at
                                    any time. This immediately pauses all tasks, punishments, and aggressive
                                    communication.
                                </p>
                                <div className="mt-3 p-3 rounded-[var(--radius-md)] bg-teal-primary/10 border border-teal-primary/20">
                                    <p className="text-xs text-teal-primary font-semibold">Your safeword pauses everything — no penalties, no questions asked.</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Emergency Release */}
                    <Card variant="raised">
                        <div className="flex items-start gap-3">
                            <AlertTriangle size={20} className="text-red-primary shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold">Emergency Release</h3>
                                <p className="text-sm text-text-secondary mt-1">
                                    Available at all times from Settings. Immediately ends your session.
                                    In-game penalties apply (willpower -30, streak reset), but your
                                    safety always comes first.
                                </p>
                                <Link href="/settings" className="text-sm text-purple-primary hover:underline mt-2 inline-block">
                                    Go to Emergency Release →
                                </Link>
                            </div>
                        </div>
                    </Card>

                    {/* Hard Limits */}
                    <Card variant="raised">
                        <div className="flex items-start gap-3">
                            <Shield size={20} className="text-text-tertiary shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold">Hard Limits</h3>
                                <p className="text-sm text-text-secondary mt-1">
                                    Hard limits are <strong className="text-red-primary">absolutely never</strong> crossed
                                    by the AI, regardless of your tier, session state, or punishment level.
                                    You can edit your hard limits at any time from Settings → Edit Profile.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* How It Works */}
                    <div>
                        <h2 className="text-lg font-semibold mb-3">How LockedIn Works</h2>
                        <div className="space-y-3">
                            <Card variant="flat" size="sm" className="!min-h-0 py-3">
                                <div className="flex items-start gap-3">
                                    <span className="text-lg">🔒</span>
                                    <div>
                                        <p className="text-sm font-medium">Sessions</p>
                                        <p className="text-xs text-text-tertiary">
                                            Lock sessions have a scheduled release date that can change based on your behavior.
                                            Good compliance may reduce time; disobedience adds time.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                            <Card variant="flat" size="sm" className="!min-h-0 py-3">
                                <div className="flex items-start gap-3">
                                    <span className="text-lg">📋</span>
                                    <div>
                                        <p className="text-sm font-medium">Tasks</p>
                                        <p className="text-xs text-text-tertiary">
                                            Your AI assigns daily tasks based on your tier, regimens, and physical details.
                                            Complete them to build compliance and willpower.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                            <Card variant="flat" size="sm" className="!min-h-0 py-3">
                                <div className="flex items-start gap-3">
                                    <span className="text-lg">📊</span>
                                    <div>
                                        <p className="text-sm font-medium">Willpower & Calendar</p>
                                        <p className="text-xs text-text-tertiary">
                                            Your willpower score reflects your obedience. The calendar shows your release date
                                            and any adjustments. The AI controls whether time is added or subtracted.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Crisis Resources */}
                    <div>
                        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Heart size={18} className="text-red-primary" />
                            Crisis Resources
                        </h2>
                        <Card variant="flat" size="sm" className="!min-h-0 border-red-primary/20">
                            <p className="text-sm text-text-secondary mb-3">
                                If you are experiencing a mental health crisis or feel unsafe outside of
                                the app context, please reach out to one of these resources:
                            </p>
                            <div className="space-y-2">
                                <a
                                    href="tel:988"
                                    className="flex items-center gap-2 text-sm text-purple-primary hover:underline"
                                >
                                    <Phone size={14} /> <strong>988</strong> — Suicide & Crisis Lifeline (US)
                                </a>
                                <a
                                    href="https://www.crisistextline.org"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-purple-primary hover:underline"
                                >
                                    <MessageSquare size={14} /> Text HOME to 741741 — Crisis Text Line
                                </a>
                                <a
                                    href="https://findahelpline.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-purple-primary hover:underline"
                                >
                                    <ExternalLink size={14} /> findahelpline.com — International directory
                                </a>
                            </div>
                        </Card>
                    </div>

                    {/* Contact */}
                    <Card variant="flat" size="sm" className="!min-h-0 py-4 text-center">
                        <p className="text-xs text-text-tertiary">
                            For app-related issues, bugs, or feedback, use the Suggestions
                            feature in Settings or email support.
                        </p>
                    </Card>
                </div>
            </div>
            <BottomNav />
        </>
    )
}
