'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ArrowLeft, Save, Loader2, User, Lock as LockIcon, X } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { getActiveSession } from '@/lib/supabase/sessions'
import Link from 'next/link'
import { PERSONAS, TIERS, FETISH_GENRES } from '@/lib/stores/onboarding-store'

export default function ProfileEditPage() {
    const { user, profile, refreshProfile } = useAuth()
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [isLocked, setIsLocked] = useState(false)

    // Profile fields
    const [tier, setTier] = useState('')
    const [aiPersonality, setAiPersonality] = useState('')
    const [interests, setInterests] = useState<string[]>([])
    const [hardLimits, setHardLimits] = useState<string[]>([])
    const [softLimits, setSoftLimits] = useState<string[]>([])
    const [limitInput, setLimitInput] = useState('')
    const [softInput, setSoftInput] = useState('')

    useEffect(() => {
        if (profile) {
            setTier(profile.tier ?? 'Newbie')
            setAiPersonality(profile.ai_personality ?? 'Strict Master')
            setInterests(profile.interests ?? [])
            setHardLimits(profile.hard_limits ?? [])
            setSoftLimits(profile.soft_limits ?? [])
        }
    }, [profile])

    useEffect(() => {
        if (!user) return
        getActiveSession(user.id).then(sess => setIsLocked(!!sess))
    }, [user])

    async function handleSave() {
        if (!user || isLocked) return
        setSaving(true)
        try {
            await fetch('/api/profile/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    tier,
                    ai_personality: aiPersonality,
                    interests,
                    hard_limits: hardLimits,
                    soft_limits: softLimits,
                }),
            })
            await refreshProfile()
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } finally {
            setSaving(false)
        }
    }

    const toggleInterest = (g: string) => {
        setInterests(prev => prev.includes(g) ? prev.filter(i => i !== g) : [...prev, g])
    }

    const addLimit = (type: 'hard' | 'soft') => {
        const val = (type === 'hard' ? limitInput : softInput).trim()
        if (!val) return
        if (type === 'hard') {
            setHardLimits(prev => [...new Set([...prev, val])])
            setLimitInput('')
        } else {
            setSoftLimits(prev => [...new Set([...prev, val])])
            setSoftInput('')
        }
    }

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
                            <User size={28} className="text-purple-primary" /> Training Profile
                        </h1>
                    </div>

                    {isLocked && (
                        <Card variant="flat" size="sm" className="!min-h-0 border-red-primary/30 bg-red-primary/5">
                            <div className="flex items-center gap-3">
                                <LockIcon size={18} className="text-red-primary shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-red-primary">Settings Locked</p>
                                    <p className="text-xs text-text-tertiary">Profile edits are disabled during an active session.</p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Tier */}
                    <Card variant="hero">
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wide block">Tier</label>
                            <div className="flex flex-wrap gap-2">
                                {TIERS.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => !isLocked && setTier(t)}
                                        disabled={isLocked}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                            tier === t
                                                ? 'bg-purple-primary text-white border-purple-primary'
                                                : 'bg-bg-tertiary border-white/5 hover:bg-bg-hover'
                                        } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* AI Persona */}
                    <Card variant="raised">
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wide block">AI Persona</label>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {PERSONAS.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => !isLocked && setAiPersonality(p)}
                                        disabled={isLocked}
                                        className={`w-full text-left px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                            aiPersonality === p
                                                ? 'border-purple-primary/40 bg-bg-secondary text-purple-primary'
                                                : 'border-white/5 bg-bg-secondary/50 hover:bg-bg-secondary'
                                        } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Fetishes / Interests */}
                    <Card variant="raised">
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wide block">Interests & Fetishes</label>
                            <div className="flex flex-wrap gap-2">
                                {FETISH_GENRES.map(g => (
                                    <button
                                        key={g}
                                        onClick={() => !isLocked && toggleInterest(g)}
                                        disabled={isLocked}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                            interests.includes(g)
                                                ? 'bg-purple-primary/20 text-purple-primary border-purple-primary/50'
                                                : 'bg-bg-tertiary border-white/5 hover:bg-bg-hover'
                                        } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Hard Limits */}
                    <Card variant="raised">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">Hard Limits</label>
                                <Badge variant="locked">Always enforced</Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 min-h-[32px]">
                                {hardLimits.map(l => (
                                    <span key={l} className="flex items-center gap-1 px-2 py-1 bg-red-primary/10 text-red-primary border border-red-primary/30 rounded-full text-xs">
                                        {l}
                                        {!isLocked && (
                                            <button onClick={() => setHardLimits(prev => prev.filter(i => i !== l))} className="hover:text-red-300 transition-colors">
                                                <X size={10} />
                                            </button>
                                        )}
                                    </span>
                                ))}
                            </div>
                            {!isLocked && (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add hard limit..."
                                        value={limitInput}
                                        onChange={e => setLimitInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addLimit('hard')}
                                        className="flex-1 bg-bg-tertiary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-primary/50 placeholder:text-text-tertiary"
                                    />
                                    <Button size="sm" variant="ghost" onClick={() => addLimit('hard')}>Add</Button>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Soft Limits */}
                    <Card variant="raised">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">Soft Limits</label>
                                <Badge variant="warning">Negotiable</Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 min-h-[32px]">
                                {softLimits.map(l => (
                                    <span key={l} className="flex items-center gap-1 px-2 py-1 bg-tier-slave/10 text-tier-slave border border-tier-slave/30 rounded-full text-xs">
                                        {l}
                                        {!isLocked && (
                                            <button onClick={() => setSoftLimits(prev => prev.filter(i => i !== l))} className="hover:opacity-70 transition-opacity">
                                                <X size={10} />
                                            </button>
                                        )}
                                    </span>
                                ))}
                            </div>
                            {!isLocked && (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add soft limit..."
                                        value={softInput}
                                        onChange={e => setSoftInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addLimit('soft')}
                                        className="flex-1 bg-bg-tertiary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-primary/50 placeholder:text-text-tertiary"
                                    />
                                    <Button size="sm" variant="ghost" onClick={() => addLimit('soft')}>Add</Button>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={saving || isLocked}
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
