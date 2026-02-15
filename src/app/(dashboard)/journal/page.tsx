'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { BookOpen, Smile, Send, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { getSupabase } from '@/lib/supabase/client'
import { getActiveSession } from '@/lib/supabase/sessions'
import type { JournalEntry } from '@/lib/supabase/schema'

const MOODS = [
    { value: 'eager', label: 'Eager', emoji: '🤤' },
    { value: 'submissive', label: 'Submissive', emoji: '🧎' },
    { value: 'neutral', label: 'Neutral', emoji: '😐' },
    { value: 'resistant', label: 'Resistant', emoji: '😤' },
    { value: 'defiant', label: 'Defiant', emoji: '🖕' },
    { value: 'broken', label: 'Broken', emoji: '😵' },
] as const

export default function JournalPage() {
    const { user } = useAuth()
    const [entries, setEntries] = useState<JournalEntry[]>([])
    const [loading, setLoading] = useState(true)

    // Form state
    const [content, setContent] = useState('')
    const [mood, setMood] = useState<string | null>(null)
    const [obedience, setObedience] = useState(5)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (!user) return
        loadEntries()
    }, [user])

    async function loadEntries() {
        if (!user) return
        const supabase = getSupabase()
        const { data } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20)

        setEntries((data ?? []) as JournalEntry[])
        setLoading(false)
    }

    async function handleSubmit() {
        if (!user || !content.trim()) return
        setSubmitting(true)

        const supabase = getSupabase()
        const session = await getActiveSession(user.id)

        const { error } = await supabase.from('journal_entries').insert({
            user_id: user.id,
            session_id: session?.id ?? null,
            content: content.trim(),
            mood: mood,
            obedience_rating: obedience,
        })

        if (!error) {
            setContent('')
            setMood(null)
            setObedience(5)
            await loadEntries()
        }

        setSubmitting(false)
    }

    return (
        <>
            <TopBar />

            <div className="min-h-screen pb-24 lg:pb-8 p-4">
                <div className="max-w-2xl mx-auto space-y-6">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <BookOpen size={28} className="text-purple-primary" />
                        Journal
                    </h1>

                    {/* New Entry Form */}
                    <Card variant="hero">
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">
                                New Entry
                            </h3>

                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="How are you feeling? What happened today? Be honest..."
                                className="w-full bg-bg-tertiary border border-white/10 rounded-[var(--radius-md)] p-3 text-sm text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:border-purple-primary/50 transition-colors"
                                rows={4}
                            />

                            {/* Mood Selector */}
                            <div>
                                <label className="text-xs text-text-tertiary mb-2 block">Mood</label>
                                <div className="flex flex-wrap gap-2">
                                    {MOODS.map((m) => (
                                        <button
                                            key={m.value}
                                            onClick={() => setMood(mood === m.value ? null : m.value)}
                                            className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium transition-colors cursor-pointer border ${mood === m.value
                                                    ? 'bg-purple-primary text-white border-purple-primary'
                                                    : 'bg-bg-tertiary hover:bg-bg-hover border-white/5'
                                                }`}
                                        >
                                            {m.emoji} {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Obedience Slider */}
                            <div>
                                <label className="text-xs text-text-tertiary mb-2 flex justify-between">
                                    <span>Obedience Rating</span>
                                    <span className="font-mono text-text-primary">{obedience}/10</span>
                                </label>
                                <input
                                    type="range"
                                    min={1}
                                    max={10}
                                    value={obedience}
                                    onChange={(e) => setObedience(Number(e.target.value))}
                                    className="w-full accent-purple-primary"
                                />
                                <div className="flex justify-between text-[10px] text-text-tertiary mt-1">
                                    <span>Defiant</span>
                                    <span>Obedient</span>
                                </div>
                            </div>

                            <Button
                                variant="primary"
                                onClick={handleSubmit}
                                disabled={submitting || !content.trim()}
                                className="w-full"
                            >
                                {submitting ? (
                                    <><Loader2 size={14} className="mr-2 animate-spin" /> Saving...</>
                                ) : (
                                    <><Send size={14} className="mr-2" /> Submit Entry</>
                                )}
                            </Button>
                        </div>
                    </Card>

                    {/* Past Entries */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">
                            Past Entries
                        </h3>

                        {loading ? (
                            <div className="text-center py-8 text-text-tertiary text-sm">Loading...</div>
                        ) : entries.length === 0 ? (
                            <Card variant="flat" className="text-center py-8">
                                <Smile size={32} className="mx-auto text-text-tertiary mb-2" />
                                <p className="text-sm text-text-tertiary">No journal entries yet.<br />Write your first one above.</p>
                            </Card>
                        ) : (
                            entries.map((entry) => (
                                <Card key={entry.id} variant="flat" size="sm" className="!min-h-0">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-text-tertiary">
                                                {new Date(entry.created_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {entry.mood && (
                                                    <Badge variant="genre">
                                                        {MOODS.find((m) => m.value === entry.mood)?.emoji ?? '😐'}{' '}
                                                        {entry.mood}
                                                    </Badge>
                                                )}
                                                {entry.obedience_rating && (
                                                    <Badge variant={entry.obedience_rating >= 7 ? 'info' : entry.obedience_rating >= 4 ? 'warning' : 'locked'}>
                                                        {entry.obedience_rating}/10
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-text-secondary leading-relaxed">
                                            {entry.content}
                                        </p>
                                        {entry.ai_analysis && (
                                            <div className="mt-2 p-2 bg-purple-primary/5 border border-purple-primary/20 rounded-[var(--radius-md)]">
                                                <p className="text-xs text-purple-primary font-medium">🤖 AI Analysis</p>
                                                <p className="text-xs text-text-secondary mt-1">{entry.ai_analysis}</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <BottomNav />
        </>
    )
}
