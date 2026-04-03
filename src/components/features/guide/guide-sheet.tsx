'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { X } from 'lucide-react'

interface NavCard {
  href: string
  label: string
  description: string
}

interface GuideMessage {
  role: 'user' | 'assistant'
  content: string
  navCard?: NavCard
  error?: boolean
}

interface Props {
  onClose: () => void
}

const QUICK_TOPICS = [
  'How does proof work?',
  'What are punishments?',
  'How do sessions work?',
  'What is the mood check-in?',
  'How do I use the calendar?',
  'Where is my session history?',
]

export function GuideSheet({ onClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [messages, setMessages] = useState<GuideMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const history = messages
      .filter((m) => !m.error)
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }))

    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, currentPage: pathname, history }),
      })

      if (res.status === 429) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Slow down — try again in a moment.', error: true },
        ])
        return
      }

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Something went wrong. Try again.', error: true },
        ])
        return
      }

      const data = await res.json()
      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.error, error: true },
        ])
        return
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply, navCard: data.navCard },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Try again.', error: true },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleNavCard = (href: string) => {
    onClose()
    router.push(href)
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative z-10 flex flex-col bg-zinc-900 border-t border-zinc-800 rounded-t-2xl max-h-[78vh]">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-8 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-zinc-800 shrink-0">
          <div className="w-7 h-7 rounded-sm bg-zinc-800 flex items-center justify-center text-xs shrink-0 font-bold text-[var(--accent)] border border-zinc-700">
            M
          </div>
          <div>
            <p className="text-xs font-bold text-white">The Master</p>
            <p className="text-[10px] text-white/40">App Guide · In character</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-white/30 hover:text-white/60 transition-colors"
            aria-label="Close guide"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick topic pills — only shown before any conversation */}
        {messages.length === 0 && (
          <div className="flex gap-2 flex-wrap px-4 py-3 shrink-0">
            {QUICK_TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={() => sendMessage(topic)}
                className="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-[11px] text-white/50 hover:text-white/80 hover:bg-white/10 transition-all whitespace-nowrap"
              >
                {topic}
              </button>
            ))}
          </div>
        )}

        {/* Message list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[85%]">
                <div
                  className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 rounded-br-sm'
                      : msg.error
                      ? 'bg-red-500/10 text-red-500 border border-red-500/20 rounded-bl-sm'
                      : 'bg-zinc-800 text-white rounded-bl-sm border border-zinc-700'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.navCard && (
                  <div className="mt-2 bg-zinc-800/50 border border-[var(--accent)]/30 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--accent)] truncate">
                        {msg.navCard.label}
                      </p>
                      <p className="text-[10px] text-white/40 truncate">
                        {msg.navCard.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleNavCard(msg.navCard!.href)}
                      className="shrink-0 border border-[var(--accent)] text-[var(--accent)] bg-transparent hover:bg-[var(--accent)]/10 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Go →
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]/60 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]/60 animate-pulse delay-150" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]/60 animate-pulse delay-300" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input row */}
        <div className="flex gap-2 items-center px-4 py-3 border-t border-zinc-800 shrink-0 pb-24 sm:pb-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
            placeholder="Ask anything about the app…"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-full border border-[var(--accent)] disabled:border-zinc-700 disabled:text-white/10 text-[var(--accent)] flex items-center justify-center text-sm transition-colors hover:bg-[var(--accent)]/10"
            aria-label="Send message"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}
