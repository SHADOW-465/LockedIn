'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import {
    Bell,
    Shield,
    HelpCircle,
    MessageSquare,
    LogOut,
    ChevronRight,
    Crown,
    User,
    AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'

const settingsItems = [
    {
        icon: Bell,
        label: 'Notifications',
        description: 'Frequency & quiet hours',
        href: '#',
    },
    {
        icon: Shield,
        label: 'Hard Limits',
        description: 'Always editable for safety',
        href: '#',
    },
    {
        icon: HelpCircle,
        label: 'Help & Support',
        description: 'Safeword, emergency, crisis resources',
        href: '#',
    },
    {
        icon: MessageSquare,
        label: 'Suggestions',
        description: 'Submit feedback (good suggestions earn XP)',
        href: '#',
    },
]

export default function SettingsPage() {
    return (
        <>
            <TopBar tier="Slave" username="slave_user" />

            <div className="min-h-screen pb-24 lg:pb-8 p-4">
                <div className="max-w-2xl mx-auto space-y-6">
                    <h1 className="text-3xl font-bold">Settings</h1>

                    {/* Profile Card */}
                    <Card variant="hero">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-purple-primary/20 flex items-center justify-center text-2xl font-bold text-purple-primary border border-purple-primary/30">
                                S
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold">slave_user</h2>
                                <p className="text-sm text-text-secondary">slave@lockedin.app</p>
                            </div>
                            <Badge variant="tier2">SLAVE</Badge>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/5">
                            <div className="text-center">
                                <div className="text-lg font-bold font-mono">12</div>
                                <div className="text-[10px] text-text-tertiary uppercase">Sessions</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold font-mono">168h</div>
                                <div className="text-[10px] text-text-tertiary uppercase">Denial</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold font-mono">87</div>
                                <div className="text-[10px] text-text-tertiary uppercase">Edges</div>
                            </div>
                        </div>
                    </Card>

                    {/* Subscription */}
                    <Card variant="raised">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Crown size={20} className="text-tier-slave" />
                                <div>
                                    <h3 className="font-semibold">Subscription</h3>
                                    <p className="text-sm text-text-tertiary">FREE Tier</p>
                                </div>
                            </div>
                            <Button variant="secondary" size="sm">
                                Upgrade
                            </Button>
                        </div>
                    </Card>

                    {/* Tier Switch (Testing Mode) */}
                    <Card variant="flat" size="sm" className="!min-h-0">
                        <div className="flex items-start gap-3">
                            <User size={18} className="text-purple-primary shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-medium">Testing Mode</p>
                                    <Badge variant="info">DEV</Badge>
                                </div>
                                <p className="text-xs text-text-tertiary mb-3">
                                    Tier switching is temporarily open for testing purposes.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {['Newbie', 'Slave', 'Hardcore', 'Extreme', 'Destruction'].map(
                                        (tier) => (
                                            <button
                                                key={tier}
                                                className="px-3 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium bg-bg-tertiary hover:bg-bg-hover transition-colors cursor-pointer border border-white/5"
                                            >
                                                {tier}
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Settings List */}
                    <div className="space-y-2">
                        {settingsItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <Card
                                    key={item.label}
                                    variant="flat"
                                    size="sm"
                                    className="!min-h-0 py-4 cursor-pointer hover:bg-bg-tertiary transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Icon size={20} className="text-text-tertiary" />
                                            <div>
                                                <span className="font-medium text-sm">{item.label}</span>
                                                <p className="text-xs text-text-tertiary">{item.description}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-text-tertiary" />
                                    </div>
                                </Card>
                            )
                        })}
                    </div>

                    {/* Emergency */}
                    <Card
                        variant="flat"
                        size="sm"
                        className="!min-h-0 py-4 border-red-primary/30 cursor-pointer hover:bg-red-primary/5 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <AlertTriangle size={20} className="text-red-primary" />
                            <div>
                                <span className="font-medium text-sm text-red-primary">
                                    Emergency Release
                                </span>
                                <p className="text-xs text-text-tertiary">
                                    Always available. Severe in-game penalties apply.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Sign Out */}
                    <Card
                        variant="flat"
                        size="sm"
                        className="!min-h-0 py-4 cursor-pointer hover:bg-red-primary/10 transition-colors border-red-primary/20"
                    >
                        <div className="flex items-center gap-3">
                            <LogOut size={20} className="text-red-primary" />
                            <span className="font-medium text-sm text-red-primary">Sign Out</span>
                        </div>
                    </Card>
                </div>
            </div>

            <BottomNav />
        </>
    )
}
