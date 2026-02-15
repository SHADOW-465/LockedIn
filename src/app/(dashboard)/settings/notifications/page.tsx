'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Bell, Moon, Sun, Check, ChevronLeft, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { getSupabase } from '@/lib/supabase/client'
import Link from 'next/link'

const frequencies = [
    { id: 'low', label: 'Low', description: '2-4 notifications per day', icon: '🔔' },
    { id: 'medium', label: 'Medium', description: '6-10 notifications per day', icon: '🔔🔔' },
    { id: 'high', label: 'High', description: '12-20 notifications per day', icon: '🔔🔔🔔' },
    { id: 'extreme', label: 'Extreme', description: 'Constant interruptions', icon: '⚡' },
]

export default function NotificationSettingsPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [freq, setFreq] = useState('medium')
    const [quietStart, setQuietStart] = useState('23:00')
    const [quietEnd, setQuietEnd] = useState('07:00')
    const [quietEnabled, setQuietEnabled] = useState(true)
    const [saving, setSaving] = useState(false)
    const [loaded, setLoaded] = useState(false)

    // Load current preferences
    useEffect(() => {
        if (!user) return
        async function load() {
            const supabase = getSupabase()
            const { data } = await supabase
                .from('user_preferences')
                .select('notification_frequency, quiet_hours')
                .eq('user_id', user!.id)
                .single()

            if (data) {
                setFreq(data.notification_frequency ?? 'medium')
                if (data.quiet_hours) {
                    setQuietStart(data.quiet_hours.start ?? '23:00')
                    setQuietEnd(data.quiet_hours.end ?? '07:00')
                    setQuietEnabled(true)
                }
            }
            setLoaded(true)
        }
        load()
    }, [user])

    const handleSave = async () => {
        if (!user) return
        setSaving(true)
        const supabase = getSupabase()
        await supabase
            .from('user_preferences')
            .update({
                notification_frequency: freq,
                quiet_hours: quietEnabled ? { start: quietStart, end: quietEnd } : null,
            })
            .eq('user_id', user.id)

        setSaving(false)
        router.push('/settings')
    }

    return (
        <>
            <TopBar />
            <div className="min-h-screen pb-24 lg:pb-8 p-4">
                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/settings" className="p-2 rounded-[var(--radius-md)] hover:bg-bg-tertiary transition-colors">
                            <ChevronLeft size={20} />
                        </Link>
                        <h1 className="text-2xl font-bold">Notifications</h1>
                    </div>

                    {/* Frequency */}
                    <div className="space-y-3">
                        <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">Frequency</h2>
                        {frequencies.map((option) => {
                            const isSelected = freq === option.id
                            return (
                                <Card
                                    key={option.id}
                                    variant="flat"
                                    size="sm"
                                    className={`!min-h-0 py-4 cursor-pointer transition-all ${isSelected ? 'border-purple-primary/50 bg-purple-primary/10' : 'hover:bg-bg-tertiary'}`}
                                    onClick={() => setFreq(option.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span>{option.icon}</span>
                                            <div>
                                                <span className="text-sm font-medium">{option.label}</span>
                                                <p className="text-xs text-text-tertiary">{option.description}</p>
                                            </div>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-purple-primary bg-purple-primary' : 'border-white/10'}`}>
                                            {isSelected && <Check size={12} className="text-white" />}
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>

                    {/* Quiet Hours */}
                    <Card variant="raised" size="sm">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Moon size={16} className="text-text-tertiary" />
                                    <span className="text-sm font-medium">Quiet Hours</span>
                                </div>
                                <button
                                    onClick={() => setQuietEnabled(!quietEnabled)}
                                    className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${quietEnabled ? 'bg-purple-primary' : 'bg-bg-tertiary'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-1 ${quietEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {quietEnabled && (
                                <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                                    <div className="flex-1">
                                        <label className="text-xs text-text-tertiary flex items-center gap-1 mb-1">
                                            <Moon size={12} /> Start
                                        </label>
                                        <input
                                            type="time"
                                            value={quietStart}
                                            onChange={(e) => setQuietStart(e.target.value)}
                                            className="w-full bg-bg-primary rounded-[var(--radius-md)] px-3 py-2 text-sm font-mono border border-white/5 focus:outline-none focus:ring-1 focus:ring-purple-primary/50"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs text-text-tertiary flex items-center gap-1 mb-1">
                                            <Sun size={12} /> End
                                        </label>
                                        <input
                                            type="time"
                                            value={quietEnd}
                                            onChange={(e) => setQuietEnd(e.target.value)}
                                            className="w-full bg-bg-primary rounded-[var(--radius-md)] px-3 py-2 text-sm font-mono border border-white/5 focus:outline-none focus:ring-1 focus:ring-purple-primary/50"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Saving...</span>
                        ) : (
                            'Save Preferences'
                        )}
                    </Button>
                </div>
            </div>
            <BottomNav />
        </>
    )
}
