'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { MessageSquarePlus, Send, Star, Loader2, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { getSupabase } from '@/lib/supabase/client'
import type { UserFeedback } from '@/lib/supabase/schema'
import Link from 'next/link'

const CATEGORIES = ['Bug Report', 'Feature Request', 'UI/UX Improvement', 'Task Suggestion', 'General']

export default function FeedbackPage() {
    const { user } = useAuth()
    const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([])
    const [loading, setLoading] = useState(true)

    // Form
    const [category, setCategory] = useState('General')
    const [suggestion, setSuggestion] = useState('')
    const [rating, setRating] = useState(0)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (user) loadFeedbacks()
    }, [user])

    async function loadFeedbacks() {
        if (!user) return
        const supabase = getSupabase()
        const { data } = await supabase
            .from('user_feedback')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20)

        setFeedbacks((data ?? []) as UserFeedback[])
        setLoading(false)
    }

    async function handleSubmit() {
        if (!user || !suggestion.trim()) return
        setSubmitting(true)
        const supabase = getSupabase()

        await supabase.from('user_feedback').insert({
            user_id: user.id,
            category,
            suggestion: suggestion.trim(),
            rating: rating > 0 ? rating : null,
        })

        // Award XP for good suggestions
        if (suggestion.trim().length > 50) {
            await supabase.from('notifications').insert({
                user_id: user.id,
                type: 'reward',
                title: '+5 XP for Feedback',
                body: 'Thanks for your detailed suggestion!',
            })
        }

        setSuggestion('')
        setRating(0)
        setCategory('General')
        await loadFeedbacks()
        setSubmitting(false)
    }

    return (
        <>
            <TopBar />

            <div className="min-h-screen bg-black pb-24 lg:pb-8 p-4">
                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="flex items-center gap-3">
                        <Link href="/settings" className="text-white/30 hover:text-white transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                            <MessageSquarePlus size={28} className="text-[var(--accent)]" />
                            Feedback
                        </h1>
                    </div>

                    {/* Submit Form */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-white/30 uppercase tracking-wide">
                                Submit Suggestion
                            </h3>

                            {/* Category */}
                            <div>
                                <label className="text-xs text-white/30 mb-2 block">Category</label>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORIES.map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setCategory(c)}
                                            className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium transition-colors cursor-pointer border ${category === c
                                                    ? 'text-white border-[var(--accent)]'
                                                    : 'bg-zinc-800 hover:bg-zinc-700 border-white/5'
                                                }`}
                                            style={category === c ? { backgroundColor: 'var(--accent)' } : undefined}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Suggestion */}
                            <textarea
                                value={suggestion}
                                onChange={(e) => setSuggestion(e.target.value)}
                                placeholder="What would you like to see improved? Be specific for bonus XP..."
                                className="w-full bg-zinc-800 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
                                rows={3}
                            />

                            {/* Star Rating */}
                            <div>
                                <label className="text-xs text-white/30 mb-2 block">App Rating (optional)</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setRating(rating === s ? 0 : s)}
                                            className="cursor-pointer transition-transform hover:scale-110"
                                        >
                                            <Star
                                                size={24}
                                                className={s <= rating ? 'text-tier-slave fill-tier-slave' : 'text-white/30'}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                variant="primary"
                                onClick={handleSubmit}
                                disabled={submitting || !suggestion.trim()}
                                className="w-full"
                            >
                                {submitting ? (
                                    <><Loader2 size={14} className="mr-2 animate-spin" /> Submitting...</>
                                ) : (
                                    <><Send size={14} className="mr-2" /> Submit Feedback</>
                                )}
                            </Button>

                            <p className="text-[10px] text-white/30 text-center">
                                Detailed suggestions (50+ chars) earn bonus XP
                            </p>
                        </div>
                    </div>

                    {/* Past Feedbacks */}
                    {!loading && feedbacks.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-white/30 uppercase tracking-wide">
                                Your Submissions
                            </h3>
                            {feedbacks.map((fb) => (
                                <div key={fb.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1 flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="genre">{fb.category}</Badge>
                                                <Badge variant={
                                                    fb.status === 'implemented' ? 'info' :
                                                        fb.status === 'reviewed' ? 'warning' : 'locked'
                                                }>
                                                    {fb.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-white/85 line-clamp-2">{fb.suggestion}</p>
                                            <span className="text-[10px] text-white/30">
                                                {new Date(fb.created_at).toLocaleDateString('en-US', {
                                                    month: 'short', day: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                        {fb.rating && (
                                            <div className="flex shrink-0 ml-2">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star
                                                        key={s}
                                                        size={12}
                                                        className={s <= fb.rating! ? 'text-tier-slave fill-tier-slave' : 'text-white/30'}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <BottomNav />
        </>
    )
}
