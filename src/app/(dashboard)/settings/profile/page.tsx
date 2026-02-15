'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ArrowLeft, Save, Loader2, User } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { getSupabase } from '@/lib/supabase/client'
import Link from 'next/link'

const PERSONALITIES = [
    'Cruel Mistress', 'Strict Governess', 'Sadistic Queen',
    'Cold Domme', 'Teasing Brat', 'Caring Domme',
]

export default function ProfileEditPage() {
    const { user, profile } = useAuth()
    const [username, setUsername] = useState('')
    const [aiPersonality, setAiPersonality] = useState('')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    // Preferences
    const [hardLimits, setHardLimits] = useState<string[]>([])
    const [softLimits, setSoftLimits] = useState<string[]>([])

    useEffect(() => {
        if (profile) {
            setUsername(profile.username ?? '')
            setAiPersonality(profile.ai_personality ?? 'Cruel Mistress')
        }
    }, [profile])

    useEffect(() => {
        if (!user) return
        const supabase = getSupabase()
        supabase
            .from('user_preferences')
            .select('hard_limits, soft_limits')
            .eq('user_id', user.id)
            .single()
            .then(({ data }: { data: { hard_limits: string[]; soft_limits: string[] } | null }) => {
                if (data) {
                    setHardLimits(data.hard_limits ?? [])
                    setSoftLimits(data.soft_limits ?? [])
                }
            })
    }, [user])

    async function handleSave() {
        if (!user) return
        setSaving(true)
        const supabase = getSupabase()

        // Update profile
        await supabase
            .from('profiles')
            .update({
                username: username.trim() || null,
                ai_personality: aiPersonality,
            })
            .eq('id', user.id)

        // Update preferences
        await supabase
            .from('user_preferences')
            .update({
                hard_limits: hardLimits,
                soft_limits: softLimits,
            })
            .eq('user_id', user.id)

        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    function handleLimitChange(type: 'hard' | 'soft', value: string) {
        const setter = type === 'hard' ? setHardLimits : setSoftLimits
        const current = type === 'hard' ? hardLimits : softLimits
        if (current.includes(value)) {
            setter(current.filter((l) => l !== value))
        } else {
            setter([...current, value])
        }
    }

    const LIMIT_OPTIONS = [
        'Blood', 'Permanent marks', 'Public exposure', 'Minors',
        'Animals', 'Financial', 'Extreme pain', 'Humiliation (public)',
        'Scat', 'Vomit', 'Choking', 'Needles',
    ]

    return (
        <>
            <TopBar />

            <div className="min-h-screen pb-24 lg:pb-8 p-4">
                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="flex items-center gap-3">
                        <Link href="/settings" className="text-text-tertiary hover:text-text-primary transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <User size={28} className="text-purple-primary" />
                            Edit Profile
                        </h1>
                    </div>

                    {/* Username */}
                    <Card variant="hero">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-text-tertiary mb-2 block">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username..."
                                    className="w-full bg-bg-tertiary border border-white/10 rounded-[var(--radius-md)] p-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-purple-primary/50 transition-colors"
                                />
                            </div>

                            {/* AI Personality */}
                            <div>
                                <label className="text-xs text-text-tertiary mb-2 block">AI Personality</label>
                                <div className="flex flex-wrap gap-2">
                                    {PERSONALITIES.map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setAiPersonality(p)}
                                            className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium transition-colors cursor-pointer border ${aiPersonality === p
                                                ? 'bg-purple-primary text-white border-purple-primary'
                                                : 'bg-bg-tertiary hover:bg-bg-hover border-white/5'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Hard Limits */}
                    <Card variant="raised">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">Hard Limits</h3>
                                <Badge variant="locked">Always Safe</Badge>
                            </div>
                            <p className="text-xs text-text-tertiary">These are absolute boundaries. The AI will never cross them.</p>
                            <div className="flex flex-wrap gap-2">
                                {LIMIT_OPTIONS.map((opt) => (
                                    <button
                                        key={`hard-${opt}`}
                                        onClick={() => handleLimitChange('hard', opt)}
                                        className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium transition-colors cursor-pointer border ${hardLimits.includes(opt)
                                            ? 'bg-red-primary/20 text-red-primary border-red-primary/50'
                                            : 'bg-bg-tertiary hover:bg-bg-hover border-white/5'
                                            }`}
                                    >
                                        {hardLimits.includes(opt) ? '🚫 ' : ''}{opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Soft Limits */}
                    <Card variant="raised">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">Soft Limits</h3>
                                <Badge variant="warning">Negotiable</Badge>
                            </div>
                            <p className="text-xs text-text-tertiary">The AI may push these boundaries at higher tiers.</p>
                            <div className="flex flex-wrap gap-2">
                                {LIMIT_OPTIONS.map((opt) => (
                                    <button
                                        key={`soft-${opt}`}
                                        onClick={() => handleLimitChange('soft', opt)}
                                        disabled={hardLimits.includes(opt)}
                                        className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium transition-colors cursor-pointer border ${softLimits.includes(opt)
                                            ? 'bg-tier-slave/20 text-tier-slave border-tier-slave/50'
                                            : hardLimits.includes(opt)
                                                ? 'opacity-30 cursor-not-allowed bg-bg-tertiary border-white/5'
                                                : 'bg-bg-tertiary hover:bg-bg-hover border-white/5'
                                            }`}
                                    >
                                        {softLimits.includes(opt) ? '⚠️ ' : ''}{opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Save Button */}
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full"
                    >
                        {saving ? (
                            <><Loader2 size={14} className="mr-2 animate-spin" /> Saving...</>
                        ) : saved ? (
                            <><Save size={14} className="mr-2" /> Saved!</>
                        ) : (
                            <><Save size={14} className="mr-2" /> Save Changes</>
                        )}
                    </Button>
                </div>
            </div>

            <BottomNav />
        </>
    )
}
