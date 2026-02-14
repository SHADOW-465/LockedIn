'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Send, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { useRealtimeQuery } from '@/lib/hooks/use-realtime'
import { getActiveSession } from '@/lib/supabase/sessions'
import type { ChatMessage, Session } from '@/lib/supabase/schema'

export default function ChatPage() {
    const { user, profile } = useAuth()
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [session, setSession] = useState<Session | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const { data: messages } = useRealtimeQuery<ChatMessage>(
        'chat_messages',
        user ? { user_id: user.id } : {},
        'created_at',
        true
    )

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

        try {
            await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    sessionId: session?.id,
                    message,
                    personality: profile?.ai_personality ?? 'Cruel Mistress',
                    tier: profile?.tier ?? 'Newbie',
                    willpower: profile?.willpower_score ?? 50,
                }),
            })
        } catch (err) {
            console.error('Chat error:', err)
        }

        setIsLoading(false)
    }, [inputValue, isLoading, user, session, profile])

    const formatTime = (timestamp: string) =>
        new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const personality = profile?.ai_personality ?? 'Cruel Mistress'

    return (
        <>
            <div className="min-h-screen pb-24 lg:pb-8 flex flex-col">
                {/* Chat Header */}
                <header className="sticky top-0 z-40 glass-strong px-4 py-3 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-bold">{personality}</h1>
                            <p className="text-xs text-text-tertiary">
                                Tier: {profile?.tier ?? 'Newbie'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-tier-newbie animate-pulse" />
                            <Badge variant="tier2">ACTIVE</Badge>
                        </div>
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center py-12 text-text-tertiary">
                            <p className="text-sm">Start the conversation. Address your Master respectfully.</p>
                        </div>
                    )}

                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                        >
                            <div
                                className={`max-w-[85%] ${message.sender === 'ai'
                                    ? message.message_type === 'punishment'
                                        ? 'bg-red-primary/10 border border-red-primary/20'
                                        : 'bg-purple-primary/10 border border-purple-primary/20'
                                    : 'bg-bg-tertiary border border-white/5'
                                    } rounded-2xl px-4 py-3`}
                            >
                                {message.sender === 'ai' && (
                                    <p className={`text-xs font-semibold mb-1.5 ${message.message_type === 'punishment' ? 'text-red-primary' : 'text-purple-primary'
                                        }`}>
                                        {personality} {message.message_type === 'punishment' && '⚠️'}
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
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-purple-primary/10 border border-purple-primary/20 rounded-2xl px-4 py-3">
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-purple-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-purple-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-purple-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="sticky bottom-20 lg:bottom-0 p-4 glass-strong border-t border-white/5">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                            placeholder="Address Master respectfully..."
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
                        Rudeness or disrespect will be punished with added lock time
                    </p>
                </div>
            </div>

            <BottomNav />
        </>
    )
}
