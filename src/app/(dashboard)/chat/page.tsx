'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Send, Loader2, Heart, Shield, ArrowRight } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { getSupabase } from '@/lib/supabase/client'
import { getActiveSession } from '@/lib/supabase/sessions'
import type { Session } from '@/lib/supabase/schema'

interface DisplayMessage {
    id: string
    sender: 'user' | 'ai'
    content: string
    message_type: string
    created_at: string
}

export default function ChatPage() {
    const { user, profile } = useAuth()
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [session, setSession] = useState<Session | null>(null)
    const [careMode, setCareMode] = useState(false)
    const [messages, setMessages] = useState<DisplayMessage[]>([])
    const [initialLoading, setInitialLoading] = useState(true)
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

        // Save user message to DB (client-side, has auth token)
        const supabase = getSupabase()
        const isSafeword = message.toUpperCase().includes('MERCY')

        await supabase.from('chat_messages').insert({
            user_id: user.id,
            session_id: session?.id || null,
            sender: 'user',
            content: message,
            message_type: isSafeword ? 'safeword_detected' : 'normal',
            persona_used: profile?.ai_personality || 'Strict Master',
        })

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    userId: user.id,
                    sessionId: session?.id,
                    safeword: 'MERCY',
                    skipDbWrite: true, // Tell API not to write to DB
                    context: {
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

                // Add AI reply to local state
                const aiMsg: DisplayMessage = {
                    id: `ai-${Date.now()}`,
                    sender: 'ai',
                    content: data.reply,
                    message_type: data.messageType || 'normal',
                    created_at: new Date().toISOString(),
                }
                setMessages(prev => [...prev, aiMsg])

                // Save AI reply to DB (client-side)
                await supabase.from('chat_messages').insert({
                    user_id: user.id,
                    session_id: session?.id || null,
                    sender: 'ai',
                    content: data.reply,
                    message_type: data.messageType || 'normal',
                    persona_used: profile?.ai_personality || 'Strict Master',
                })
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
    }, [inputValue, isLoading, user, session, profile])

    const formatTime = (timestamp: string) =>
        new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const personality = profile?.ai_personality ?? 'Cruel Mistress'

    return (
        <>
            <TopBar />

            <div className="min-h-screen pb-24 lg:pb-8 flex flex-col">
                {/* Chat Sub-Header */}
                <div className={`px-4 py-2 border-b transition-colors ${careMode
                    ? 'border-teal-primary/30 bg-teal-primary/5'
                    : 'border-white/5 bg-bg-secondary/50'
                    }`}>
                    <div className="flex items-center justify-between max-w-2xl mx-auto">
                        <div>
                            <h2 className="text-sm font-semibold">
                                {careMode ? '💚 Care Mode' : personality}
                            </h2>
                            <p className="text-xs text-text-tertiary">
                                {careMode
                                    ? 'Safe space — no punishments active'
                                    : `Tier: ${profile?.tier ?? 'Newbie'}`
                                }
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {careMode ? (
                                <>
                                    <Shield size={14} className="text-teal-primary" />
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
                    <div className="mx-4 mt-3 bg-teal-primary/10 border border-teal-primary/20 rounded-xl p-4 flex items-start gap-3">
                        <Heart size={20} className="text-teal-primary shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-teal-primary">Care Mode Active</p>
                            <p className="text-xs text-text-secondary mt-1">
                                All training and punishments are paused. You are safe and in control.
                            </p>
                            <button
                                onClick={() => {
                                    setInputValue('resume training')
                                }}
                                className="mt-2 text-xs text-teal-primary hover:text-teal-primary/80 flex items-center gap-1 transition-colors"
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
                            <Loader2 size={24} className="animate-spin mx-auto text-text-tertiary" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-12 text-text-tertiary">
                            <p className="text-sm">Start the conversation. Address your Master respectfully.</p>
                        </div>
                    ) : null}

                    {messages.map((message) => {
                        const isCareMode = message.message_type === 'care_mode'
                        const isPunishment = message.message_type === 'punishment'
                        const isSafeword = message.message_type === 'safeword_detected'

                        return (
                            <div
                                key={message.id}
                                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.sender === 'ai'
                                        ? isCareMode
                                            ? 'bg-teal-primary/10 border border-teal-primary/20'
                                            : isPunishment
                                                ? 'bg-red-primary/10 border border-red-primary/20'
                                                : 'bg-purple-primary/10 border border-purple-primary/20'
                                        : isSafeword
                                            ? 'bg-teal-primary/10 border border-teal-primary/20'
                                            : 'bg-bg-tertiary border border-white/5'
                                        }`}
                                >
                                    {message.sender === 'ai' && (
                                        <p className={`text-xs font-semibold mb-1.5 ${isCareMode
                                            ? 'text-teal-primary'
                                            : isPunishment
                                                ? 'text-red-primary'
                                                : 'text-purple-primary'
                                            }`}>
                                            {isCareMode ? '💚 Care Mode' : personality}
                                            {isPunishment && ' ⚠️'}
                                        </p>
                                    )}
                                    {isSafeword && message.sender === 'user' && (
                                        <p className="text-xs font-semibold mb-1.5 text-teal-primary">
                                            🛡️ Safeword Used
                                        </p>
                                    )}
                                    <p className="text-sm whitespace-pre-line leading-relaxed">
                                        {message.content}
                                    </p>
                                    <span className="text-[10px] text-text-tertiary mt-2 block text-right">
                                        {formatTime(message.created_at)}
                                    </span>
                                </div>
                            </div>
                        )
                    })}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className={`rounded-2xl px-4 py-3 ${careMode
                                ? 'bg-teal-primary/10 border border-teal-primary/20'
                                : 'bg-purple-primary/10 border border-purple-primary/20'
                                }`}>
                                <div className="flex gap-1.5">
                                    <div className={`w-2 h-2 rounded-full animate-bounce ${careMode ? 'bg-teal-primary/50' : 'bg-purple-primary/50'}`} style={{ animationDelay: '0ms' }} />
                                    <div className={`w-2 h-2 rounded-full animate-bounce ${careMode ? 'bg-teal-primary/50' : 'bg-purple-primary/50'}`} style={{ animationDelay: '150ms' }} />
                                    <div className={`w-2 h-2 rounded-full animate-bounce ${careMode ? 'bg-teal-primary/50' : 'bg-purple-primary/50'}`} style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className={`sticky bottom-20 lg:bottom-0 p-4 border-t transition-colors ${careMode
                    ? 'glass-strong border-teal-primary/10'
                    : 'glass-strong border-white/5'
                    }`}>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                            placeholder={careMode ? 'You are safe here...' : 'Address Master respectfully...'}
                            className="flex-1 bg-bg-primary rounded-[var(--radius-pill)] px-4 py-3 shadow-inset focus:outline-none focus:ring-2 focus:ring-purple-primary/50 text-sm"
                            disabled={isLoading}
                        />
                        <Button
                            variant="primary"
                            size="icon"
                            onClick={handleSend}
                            disabled={isLoading || !inputValue.trim()}
                            className="!rounded-full w-12 h-12 shrink-0"
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </Button>
                    </div>
                    <p className="text-[10px] text-text-tertiary mt-2 text-center">
                        {careMode
                            ? 'Type "resume training" when you\'re ready to continue'
                            : 'Type "MERCY" at any time to activate Care Mode'
                        }
                    </p>
                </div>
            </div>

            <BottomNav />
        </>
    )
}
