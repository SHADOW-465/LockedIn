'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Send, Loader2, Heart, Shield, ArrowRight, ClipboardList, Clock, Star } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/auth-context'
import { getSupabase } from '@/lib/supabase/client'
import { getActiveSession } from '@/lib/supabase/sessions'
import { buildProfileSummary } from '@/lib/ai/context-builder'
import { PrefUpdateSheet } from '@/components/features/chat/pref-update-sheet'
import type { Session } from '@/lib/supabase/schema'
import type { PrefUpdate } from '@/lib/ai/pref-update-parser'

interface MasterTaskCard {
    id: string
    title: string
    deadline: string
    difficulty: number
}

interface DisplayMessage {
    id: string
    sender: 'user' | 'ai'
    content: string
    message_type: string
    created_at: string
    masterTask?: MasterTaskCard | null
}

export default function ChatPage() {
    const { user, profile, refreshProfile } = useAuth()
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [session, setSession] = useState<Session | null>(null)
    const [careMode, setCareMode] = useState(false)
    const [messages, setMessages] = useState<DisplayMessage[]>([])
    const [initialLoading, setInitialLoading] = useState(true)
    const [profileSummary, setProfileSummary] = useState('')
    const [pendingPrefUpdates, setPendingPrefUpdates] = useState<PrefUpdate[] | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Load existing messages from DB on mount
    useEffect(() => {
        if (!user) return

        const loadMessages = async () => {
            const supabase = getSupabase()
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true })

            if (!error && data) {
                setMessages(data.map((m: Record<string, unknown>) => ({
                    id: m.id as string,
                    sender: m.sender as 'user' | 'ai',
                    content: m.content as string,
                    message_type: (m.message_type as string) || 'normal',
                    created_at: m.created_at as string,
                })))

                // Detect if last AI message was care_mode
                const lastAi = [...data].reverse().find((m: Record<string, unknown>) => m.sender === 'ai')
                if (lastAi && (lastAi as Record<string, unknown>).message_type === 'care_mode') {
                    setCareMode(true)
                }
            }
            setInitialLoading(false)
        }

        loadMessages()
    }, [user])

    // Load active session
    useEffect(() => {
        if (user) {
            getActiveSession(user.id).then(setSession)
        }
    }, [user])

    // Build compact profile summary — includes recent journal entries and self-assigned tasks for AI context
    useEffect(() => {
        if (!profile || !user) return
        const supabase = getSupabase()
        Promise.all([
            supabase.from('tasks').select('title').eq('user_id', user.id).eq('task_type', 'journal').order('created_at', { ascending: false }).limit(5),
            supabase.from('tasks').select('title').eq('user_id', user.id).eq('source', 'user').neq('task_type', 'journal').order('created_at', { ascending: false }).limit(3),
        ]).then(([journalRes, selfRes]) => {
            const journalTitles = (journalRes.data || []).map((t: { title: string }) => t.title)
            const userTaskTitles = (selfRes.data || []).map((t: { title: string }) => t.title)
            setProfileSummary(buildProfileSummary(profile, { journalTitles, userTaskTitles }))
        }).catch(() => {
            setProfileSummary(buildProfileSummary(profile))
        })
    }, [profile, user])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = useCallback(async () => {
        if (!inputValue.trim() || isLoading || !user) return

        const message = inputValue
        setInputValue('')
        setIsLoading(true)

        // Check if user is resuming training
        if (message.toLowerCase().includes('resume training')) {
            setCareMode(false)
        }

        // Optimistically add user message to local state
        const userMsg: DisplayMessage = {
            id: `temp-${Date.now()}`,
            sender: 'user',
            content: message,
            message_type: 'normal',
            created_at: new Date().toISOString(),
        }
        setMessages(prev => [...prev, userMsg])

        // ── GOAL: API handles all DB writes ──────────────────
        // We no longer write to Supabase from the client.
        // This prevents double-writes and race conditions.

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    userId: user.id,
                    sessionId: session?.id,
                    safeword: 'MERCY',
                    // skipDbWrite removed - API always writes
                    profileSummary: profileSummary || undefined,
                    // Fallback full context if summary not yet built
                    context: profileSummary ? undefined : {
                        persona: profile?.ai_personality ?? 'Cruel Mistress',
                        tier: profile?.tier ?? 'Newbie',
                        willpower: profile?.willpower_score ?? 50,
                        fetishes: profile?.interests ?? [],
                        hardLimits: profile?.hard_limits ?? [],
                    },
                }),
            })

            if (res.ok) {
                const data = await res.json()
                if (data.careMode) {
                    setCareMode(true)
                }

                // Handle Care Mode preference updates
                if (data.prefUpdates && data.prefUpdates.length > 0) {
                    setPendingPrefUpdates(data.prefUpdates)
                }

                // Add AI reply to local state
                const aiMsg: DisplayMessage = {
                    id: `ai-${Date.now()}`,
                    sender: 'ai',
                    content: data.reply,
                    message_type: data.messageType || 'normal',
                    created_at: new Date().toISOString(),
                    masterTask: data.masterTask ?? null,
                }
                setMessages(prev => [...prev, aiMsg])

                // No client-side cleanup needed; DB is consistent via API
            } else {
                // Show error message
                const aiMsg: DisplayMessage = {
                    id: `err-${Date.now()}`,
                    sender: 'ai',
                    content: 'I couldn\'t process your message. Try again.',
                    message_type: 'normal',
                    created_at: new Date().toISOString(),
                }
                setMessages(prev => [...prev, aiMsg])
            }
        } catch (err) {
            console.error('Chat error:', err)
            const aiMsg: DisplayMessage = {
                id: `err-${Date.now()}`,
                sender: 'ai',
                content: 'Connection error. Please try again.',
                message_type: 'normal',
                created_at: new Date().toISOString(),
            }
            setMessages(prev => [...prev, aiMsg])
        }

        setIsLoading(false)
    }, [inputValue, isLoading, user, session, profile, profileSummary])

    const handlePrefUpdateConfirm = async () => {
        if (!pendingPrefUpdates || !user) return

        // Build the update object — for 'set', replace; for 'append', we just set (server stores it)
        const updateBody: Record<string, unknown> = { userId: user.id }
        for (const update of pendingPrefUpdates) {
            updateBody[update.field] = update.value
        }

        try {
            await fetch('/api/profile/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateBody),
            })
            await refreshProfile()
        } catch {
            // Silently fail — preference update is best-effort
        } finally {
            setPendingPrefUpdates(null)
        }
    }

    const handlePrefUpdateDismiss = () => {
        setPendingPrefUpdates(null)
    }

    const formatTime = (timestamp: string) =>
        new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const personality = profile?.ai_personality ?? 'Cruel Mistress'

    return (
        <>
            <TopBar />

            <div className="min-h-screen pb-24 lg:pb-8 flex flex-col bg-black">
                {/* Chat Sub-Header */}
                <div className={`px-4 py-2 border-b transition-colors ${careMode
                    ? 'border-teal-500/30 bg-teal-900/10'
                    : 'border-zinc-800 bg-zinc-900/50'
                    }`}>
                    <div className="flex items-center justify-between max-w-2xl mx-auto">
                        <div>
                            <h2 className="text-sm font-semibold">
                                {careMode ? '💚 Care Mode' : personality}
                            </h2>
                            <p className="text-xs text-white/30">
                                {careMode
                                    ? 'Safe space — no punishments active'
                                    : `Tier: ${profile?.tier ?? 'Newbie'}`
                                }
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {careMode ? (
                                <>
                                    <Shield size={14} className="text-teal-400" />
                                    <Badge variant="info">SAFE</Badge>
                                </>
                            ) : (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-tier-newbie animate-pulse" />
                                    <Badge variant="tier2">ACTIVE</Badge>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Care Mode Banner */}
                {careMode && (
                    <div className="mx-4 mt-3 bg-teal-900/30 border border-teal-500/40 rounded-xl p-4 flex items-start gap-3">
                        <Heart size={20} className="text-teal-300 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-teal-300">Care Mode Active</p>
                            <p className="text-xs text-white/85 mt-1">
                                All training and punishments are paused. You are safe and in control.
                            </p>
                            <button
                                onClick={() => {
                                    setInputValue('resume training')
                                }}
                                className="mt-2 text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
                            >
                                <ArrowRight size={12} /> Resume Training when ready
                            </button>
                        </div>
                    </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {initialLoading ? (
                        <div className="text-center py-12">
                            <Loader2 size={24} className="animate-spin mx-auto text-white/30" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-12 text-white/30">
                            <p className="text-sm">Start the conversation. Address your Master respectfully.</p>
                        </div>
                    ) : null}

                    {messages.map((message, index) => {
                        const isCareMode = message.message_type === 'care_mode'
                        const isPunishment = message.message_type === 'punishment'
                        const isSafeword = message.message_type === 'safeword_detected'

                        return (
                            <div
                                key={message.id}
                                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                            >
                                <div
                                    className={`max-w-[85%] ${message.sender === 'ai'
                                        ? isCareMode
                                            ? 'bg-teal-900/20 border border-teal-500/30 rounded-2xl rounded-tl-sm px-4 py-3 animate-bubble-in'
                                            : isPunishment
                                                ? 'bg-zinc-900 border border-orange-500/40 rounded-2xl rounded-tl-sm px-4 py-3 animate-bubble-in'
                                                : 'bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 animate-bubble-in'
                                        : isSafeword
                                            ? 'bg-teal-900/20 border border-teal-500/30 rounded-2xl rounded-tr-sm px-4 py-3 animate-bubble-in'
                                            : 'rounded-2xl rounded-tr-sm px-4 py-3 text-white animate-bubble-in'
                                        }`}
                                    style={message.sender === 'user' && !isSafeword
                                        ? { backgroundColor: 'var(--accent)', animationDelay: `${Math.min(index * 0.04, 0.4)}s` }
                                        : { animationDelay: `${Math.min(index * 0.04, 0.4)}s` }
                                    }
                                >
                                    {message.sender === 'ai' && (
                                        <p className={`text-xs font-semibold mb-1.5 ${isCareMode
                                            ? 'text-teal-300'
                                            : isPunishment
                                                ? 'text-red-500'
                                                : 'text-[var(--accent)]'
                                            }`}>
                                            {isCareMode ? '💚 Care Mode' : personality}
                                            {isPunishment && ' ⚠️'}
                                        </p>
                                    )}
                                    {isSafeword && message.sender === 'user' && (
                                        <p className="text-xs font-semibold mb-1.5 text-teal-300">
                                            🛡️ Safeword Used
                                        </p>
                                    )}
                                    <p className="text-sm whitespace-pre-line leading-relaxed">
                                        {message.content}
                                    </p>
                                    <span className="text-[10px] text-white/30 mt-2 block text-right">
                                        {formatTime(message.created_at)}
                                    </span>
                                </div>

                                {/* Task assigned card */}
                                {message.masterTask && (
                                    <Link
                                        href="/tasks"
                                        className="mt-2 block max-w-[85%] bg-zinc-900 border border-[var(--accent)]/30 rounded-xl p-3 hover:opacity-90 transition-opacity group"
                                    >
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <ClipboardList size={12} className="text-[var(--accent)] shrink-0" />
                                            <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wide">
                                                ⚔ Task Assigned
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold text-white leading-snug">
                                            {message.masterTask.title}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-white/30">
                                            <span className="flex items-center gap-1">
                                                <Star size={10} />
                                                {'★'.repeat(message.masterTask.difficulty)}{'☆'.repeat(5 - message.masterTask.difficulty)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={10} />
                                                Due {new Date(message.masterTask.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-2 text-[10px] text-[var(--accent)]/70 group-hover:text-[var(--accent)] transition-colors">
                                            Go to Tasks <ArrowRight size={10} />
                                        </div>
                                    </Link>
                                )}
                            </div>
                        )
                    })}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className={`rounded-2xl px-4 py-3 ${careMode
                                ? 'bg-teal-900/20 border border-teal-500/30'
                                : 'bg-zinc-900 border border-zinc-800'
                                }`}>
                                <div className="flex gap-1.5">
                                    <div className={`w-2 h-2 rounded-full animate-bounce ${careMode ? 'bg-teal-400/50' : 'bg-white/20'}`} style={{ animationDelay: '0ms' }} />
                                    <div className={`w-2 h-2 rounded-full animate-bounce ${careMode ? 'bg-teal-400/50' : 'bg-white/20'}`} style={{ animationDelay: '150ms' }} />
                                    <div className={`w-2 h-2 rounded-full animate-bounce ${careMode ? 'bg-teal-400/50' : 'bg-white/20'}`} style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className={`sticky bottom-20 lg:bottom-0 transition-colors ${careMode
                    ? 'bg-zinc-900 border-t border-teal-500/20 px-4 py-3'
                    : 'bg-zinc-900 border-t border-zinc-800 px-4 py-3'
                    }`}>
                    <div className="flex gap-2">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && !isLoading && handleSend()}
                            placeholder={careMode ? 'You are safe here...' : 'Address Master respectfully...'}
                            className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-zinc-600 flex-1 resize-none text-sm"
                            rows={1}
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            aria-label="Send message"
                            onClick={handleSend}
                            disabled={isLoading || !inputValue.trim()}
                            className="p-3 rounded-xl text-white disabled:opacity-40 transition-opacity shrink-0"
                            style={{ backgroundColor: 'var(--accent)' }}
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </div>
                    <p className="text-[10px] text-white/30 mt-2 text-center">
                        {careMode
                            ? 'Type "resume training" when you\'re ready to continue'
                            : 'Type "MERCY" at any time to activate Care Mode'
                        }
                    </p>
                </div>
            </div>

            <BottomNav />

            {pendingPrefUpdates && (
                <PrefUpdateSheet
                    updates={pendingPrefUpdates}
                    onConfirm={handlePrefUpdateConfirm}
                    onDismiss={handlePrefUpdateDismiss}
                />
            )}
        </>
    )
}
