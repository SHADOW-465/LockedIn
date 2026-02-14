'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Send } from 'lucide-react'

interface Message {
    id: string
    sender: 'ai' | 'user'
    content: string
    timestamp: Date
    type: 'command' | 'response' | 'punishment' | 'system'
}

const initialMessages: Message[] = [
    {
        id: '1',
        sender: 'ai',
        content:
            'Welcome back, slave. I see you haven\'t completed your morning protocol yet. That\'s strike one today.\n\nYour task queue has been updated. Check your tasks immediately. You have 30 minutes before I add penalty hours.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        type: 'command',
    },
    {
        id: '2',
        sender: 'user',
        content: 'Yes Master. I\'ll complete it right away.',
        timestamp: new Date(Date.now() - 28 * 60 * 1000),
        type: 'response',
    },
    {
        id: '3',
        sender: 'ai',
        content:
            'Good. At least you still remember how to address me properly. Don\'t keep me waiting. Every minute of delay is another edge added to tonight\'s session.\n\nNow go. Don\'t speak until you\'re done.',
        timestamp: new Date(Date.now() - 27 * 60 * 1000),
        type: 'command',
    },
]

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            sender: 'user',
            content: inputValue,
            timestamp: new Date(),
            type: 'response',
        }

        setMessages((prev) => [...prev, userMessage])
        setInputValue('')
        setIsLoading(true)

        // Simulate AI response
        setTimeout(() => {
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                content:
                    'I didn\'t give you permission to speak freely. That\'s 5 additional edges tonight. However, since you were respectful, I\'ll note that.\n\nYour next task will be assigned at 3 PM. Until then, stay locked and silent.',
                timestamp: new Date(),
                type: 'command',
            }
            setMessages((prev) => [...prev, aiMessage])
            setIsLoading(false)
        }, 1500)
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <>
            <div className="min-h-screen pb-24 lg:pb-8 flex flex-col">
                {/* Chat Header */}
                <header className="sticky top-0 z-40 glass-strong px-4 py-3 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-bold">Cruel Mistress</h1>
                            <p className="text-xs text-text-tertiary">Tier 2: Slave</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-tier-newbie animate-pulse" />
                            <Badge variant="tier2">ACTIVE</Badge>
                        </div>
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'
                                } animate-fade-in`}
                        >
                            <div
                                className={`max-w-[85%] ${message.sender === 'ai'
                                        ? 'bg-purple-primary/10 border border-purple-primary/20'
                                        : 'bg-bg-tertiary border border-white/5'
                                    } rounded-2xl px-4 py-3`}
                            >
                                {message.sender === 'ai' && (
                                    <p className="text-xs text-purple-primary font-semibold mb-1.5">
                                        AI Master
                                    </p>
                                )}
                                <p className="text-sm whitespace-pre-line leading-relaxed">
                                    {message.content}
                                </p>
                                <span className="text-[10px] text-text-tertiary mt-2 block text-right">
                                    {formatTime(message.timestamp)}
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
                            <Send size={18} />
                        </Button>
                    </div>
                    <p className="text-[10px] text-text-tertiary mt-2 text-center">
                        Rudeness or disrespect will be punished
                    </p>
                </div>
            </div>

            <BottomNav />
        </>
    )
}
