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

        const { data: inserted, error } = await supabase.from('journal_entries').insert({
            user_id: user.id,
            session_id: session?.id ?? null,
            content: content.trim(),
            mood: mood,
            obedience_rating: obedience,
        }).select('id').single()

        if (!error && inserted) {
            // Fire AI analysis in background
            fetch('/api/ai/journal-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entryId: (inserted as { id: string }).id,
                    userId: user.id,
                    content: content.trim(),
                    mood,
                    obedience,
                }),
            }).then(() => loadEntries()).catch(console.error)

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

            <div className="min-h-screen bg-black pb-24 lg:pb-8 p-4">
                <div className="max-w-2xl mx-auto space-y-6">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <BookOpen size={28} className="text-[var(--accent)]" />
                        Journal
                    </h1>

                    {/* New Entry Form */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-white/30 uppercase tracking-wide">
                                New Entry
                            </h3>

                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="How are you feeling? What happened today? Be honest..."
                                className="w-full bg-zinc-800 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
                                rows={4}
                            />

                            {/* Mood Selector */}
                            <div>
                                <label className="text-xs text-white/30 mb-2 block">Mood</label>
                                <div className="flex flex-wrap gap-2">
                                    {MOODS.map((m) => (
                                        <button
                                            key={m.value}
                                            onClick={() => setMood(mood === m.value ? null : m.value)}
                                            className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium transition-colors cursor-pointer border ${mood === m.value
                                                ? 'text-white border-[var(--accent)]'
                                                : 'bg-zinc-800 hover:bg-zinc-700 border-white/5'
                                                }`}
                                            style={mood === m.value ? { backgroundColor: 'var(--accent)' } : undefined}
                                        >
                                            {m.emoji} {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Obedience Slider */}
                            <div>
                                <label className="text-xs text-white/30 mb-2 flex justify-between">
                                    <span>Obedience Rating</span>
                                    <span className="font-mono text-white">{obedience}/10</span>
                                </label>
                                <input
                                    type="range"
                                    min={1}
                                    max={10}
                                    value={obedience}
                                    onChange={(e) => setObedience(Number(e.target.value))}
                                    className="w-full accent-[var(--accent)]"
                                />
                                <div className="flex justify-between text-[10px] text-white/30 mt-1">
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
                    </div>

                    {/* Past Entries */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-white/30 uppercase tracking-wide">
                            Past Entries
                        </h3>

                        {loading ? (
                            <div className="text-center py-8 text-white/30 text-sm">Loading...</div>
                        ) : entries.length === 0 ? (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center py-8">
                                <Smile size={32} className="mx-auto text-white/30 mb-2" />
                                <p className="text-sm text-white/30">No journal entries yet.<br />Write your first one above.</p>
                            </div>
                        ) : (
                            entries.map((entry) => (
                                <div key={entry.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-white/30">
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
                                        <p className="text-sm text-white/85 leading-relaxed">
                                            {entry.content}
                                        </p>
                                        {entry.ai_analysis && (
                                            <div className="mt-2 p-2 bg-[var(--accent-dim)] border border-[var(--accent)]/20 rounded-xl">
                                                <p className="text-xs text-[var(--accent)] font-medium">🤖 AI Analysis</p>
                                                <p className="text-xs text-white/85 mt-1">{entry.ai_analysis}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <BottomNav />
        </>
    )
}
