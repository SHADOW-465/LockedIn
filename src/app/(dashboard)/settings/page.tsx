'use client'

import { useState } from 'react'
import Link from 'next/link'
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
    Loader2,
} from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { signOut } from '@/lib/supabase/auth'
import { emergencyRelease, getActiveSession } from '@/lib/supabase/sessions'
import { getSupabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const settingsItems = [
    {
        icon: User,
        label: 'Edit Profile',
        description: 'Username, personality & limits',
        href: '/settings/profile',
    },
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
        href: '/settings/profile',
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
        href: '/feedback',
    },
]

export default function SettingsPage() {
    const { user, profile } = useAuth()
    const router = useRouter()
    const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false)
    const [processing, setProcessing] = useState(false)

    const tier = profile?.tier ?? 'Newbie'
    const username = profile?.username ?? profile?.email?.split('@')[0] ?? 'User'

    const handleSignOut = async () => {
        await signOut()
        router.push('/login')
    }

    const handleTierSwitch = async (newTier: string) => {
        if (!user) return
        const supabase = getSupabase()
        await supabase.from('profiles').update({ tier: newTier }).eq('id', user.id)
    }

    const handleEmergencyRelease = async () => {
        if (!user) return
        setProcessing(true)
        const session = await getActiveSession(user.id)
        if (session) {
            await emergencyRelease(session.id)
            // Apply willpower penalty
            const supabase = getSupabase()
            await supabase
                .from('profiles')
                .update({
                    willpower_score: Math.max((profile?.willpower_score ?? 50) - 30, 0),
                    compliance_streak: 0,
                })
                .eq('id', user.id)
        }
        setProcessing(false)
        setShowEmergencyConfirm(false)
    }

    return (
        <>
            <TopBar />

            <div className="min-h-screen pb-24 lg:pb-8 p-4">
                <div className="max-w-2xl mx-auto space-y-6">
                    <h1 className="text-3xl font-bold">Settings</h1>

                    {/* Profile Card */}
                    <Card variant="hero">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-purple-primary/20 flex items-center justify-center text-2xl font-bold text-purple-primary border border-purple-primary/30">
                                {username.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold">{username}</h2>
                                <p className="text-sm text-text-secondary">{profile?.email ?? 'No email'}</p>
                            </div>
                            <Badge variant={
                                `tier${tier === 'Newbie' ? '1' : tier === 'Slave' ? '2' : tier === 'Hardcore' ? '3' : tier === 'Extreme' ? '4' : '5'}` as 'tier1'
                            }>
                                {tier.toUpperCase()}
                            </Badge>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/5">
                            <div className="text-center">
                                <div className="text-lg font-bold font-mono">{profile?.total_sessions ?? 0}</div>
                                <div className="text-[10px] text-text-tertiary uppercase">Sessions</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold font-mono">{profile?.total_denial_hours ?? 0}h</div>
                                <div className="text-[10px] text-text-tertiary uppercase">Denial</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold font-mono">{profile?.total_edges ?? 0}</div>
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
                                    <p className="text-sm text-text-tertiary">
                                        {profile?.subscription_tier?.toUpperCase() ?? 'FREE'} Tier
                                    </p>
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
                                        (t) => (
                                            <button
                                                key={t}
                                                onClick={() => handleTierSwitch(t)}
                                                className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium transition-colors cursor-pointer border ${t === tier
                                                    ? 'bg-purple-primary text-white border-purple-primary'
                                                    : 'bg-bg-tertiary hover:bg-bg-hover border-white/5'
                                                    }`}
                                            >
                                                {t}
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
                            const content = (
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
                            return item.href !== '#' ? (
                                <Link key={item.label} href={item.href}>{content}</Link>
                            ) : (
                                <div key={item.label}>{content}</div>
                            )
                        })}
                    </div>

                    {/* Emergency Release */}
                    {!showEmergencyConfirm ? (
                        <Card
                            variant="flat"
                            size="sm"
                            className="!min-h-0 py-4 border-red-primary/30 cursor-pointer hover:bg-red-primary/5 transition-colors"
                            onClick={() => setShowEmergencyConfirm(true)}
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
                    ) : (
                        <Card variant="raised" className="border-red-primary/30">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-red-primary">
                                    <AlertTriangle size={20} />
                                    <h3 className="font-bold">Confirm Emergency Release</h3>
                                </div>
                                <p className="text-sm text-text-secondary">
                                    This will immediately end your session. Penalties:
                                </p>
                                <ul className="text-xs text-red-primary space-y-1 list-disc pl-4">
                                    <li>-30 willpower score</li>
                                    <li>Compliance streak reset to 0</li>
                                    <li>Session marked as failed</li>
                                </ul>
                                <div className="flex gap-3">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowEmergencyConfirm(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        className="!bg-red-primary"
                                        onClick={handleEmergencyRelease}
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <><Loader2 size={14} className="mr-1 animate-spin" /> Releasing...</>
                                        ) : (
                                            'Yes, Release Now'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Sign Out */}
                    <Card
                        variant="flat"
                        size="sm"
                        className="!min-h-0 py-4 cursor-pointer hover:bg-red-primary/10 transition-colors border-red-primary/20"
                        onClick={handleSignOut}
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
