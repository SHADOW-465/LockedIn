'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/auth-context'
import { getLiveSession } from '@/lib/supabase/sessions'
import type { Session } from '@/lib/supabase/schema'
import {
  fetchChatHistory,
  sendChatMessage,
} from '@/lib/chat-client'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

type UiMessage = {
  id: string
  role: 'user' | 'ai'
  content: string
  messageType?: string
  createdAt: string
}

/**
 * Companion — Stitch dual-pane.
 * History is server-authoritative via GET /api/chat/history.
 */
export default function ChatPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [session, setSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [error, setError] = useState('')
  const [careMode, setCareMode] = useState(false)
  const [lastTask, setLastTask] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const sessionRef = useRef<Session | null>(null)
  /** Bumps on each load/send so stale history responses cannot wipe newer UI. */
  const historyGen = useRef(0)

  const mapRows = useCallback(
    (
      rows: {
        id: string
        sender: string
        content: string
        message_type?: string
        created_at: string
      }[],
    ): UiMessage[] =>
      rows.map((r) => ({
        id: r.id,
        role: r.sender === 'user' ? 'user' : 'ai',
        content: r.content,
        messageType: r.message_type,
        createdAt: r.created_at,
      })),
    [],
  )

  const loadHistory = useCallback(async () => {
    if (!user) return
    const gen = ++historyGen.current
    setLoadingHistory(true)
    setError('')

    // Live session (active | extending | completing) — not just 'active'
    const live = await getLiveSession(user.id)
    if (gen !== historyGen.current) return

    sessionRef.current = live
    setSession(live)

    const { messages: rows, error: histErr } = await fetchChatHistory({
      userId: user.id,
      sessionId: live?.id ?? null,
      limit: 100,
    })

    if (gen !== historyGen.current) return

    if (histErr) {
      console.error('[Chat] History load failed:', histErr)
      setError(`Could not load history: ${histErr}`)
      // Keep any in-flight optimistic bubbles — never blank the thread on a race
    } else {
      setMessages(mapRows(rows))
    }

    if (live && 'care_mode_active' in live) {
      setCareMode(Boolean((live as Session & { care_mode_active?: boolean }).care_mode_active))
    }
    setLoadingHistory(false)
  }, [user, mapRows])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    if (!user || !input.trim() || sending) return
    if (!profile) {
      setError('Profile still loading — try again in a moment.')
      return
    }

    const text = input.trim()
    setInput('')
    setError('')
    setSending(true)

    // Optimistic bubble FIRST — never wait on session lookup / network
    const optimistic: UiMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    }
    setMessages((m) => [...m, optimistic])

    // Invalidate in-flight loadHistory so it cannot clobber this send
    const sendGen = ++historyGen.current

    try {
      // Re-resolve session at send time (state may be stale; cache helps)
      let live = sessionRef.current
      if (!live) {
        live = await getLiveSession(user.id)
        sessionRef.current = live
        if (live) setSession(live)
      }

      const result = await sendChatMessage({
        message: text,
        profile,
        userId: user.id,
        sessionId: live?.id ?? session?.id ?? null,
      })

      if (sendGen !== historyGen.current) return

      if (result.error) {
        setError(result.error)
        // Keep the user bubble so the send is still visible; mark it failed
        setMessages((m) =>
          m.map((x) =>
            x.id === optimistic.id
              ? { ...x, content: `${x.content}\n\n(failed to send)` }
              : x,
          ),
        )
        return
      }

      if (result.persistError) {
        console.warn('[Chat] Persist warning:', result.persistError)
        setError(`Saved with warning: ${result.persistError}`)
      }

      if (result.careMode) setCareMode(true)
      if (text.toLowerCase().includes('resume training')) setCareMode(false)
      if (result.masterTask) setLastTask(result.masterTask.title)

      // Always surface the AI reply from the POST body first (authoritative for this turn)
      const aiLocal: UiMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: result.reply || '…',
        messageType: result.messageType,
        createdAt: new Date().toISOString(),
      }
      setMessages((m) => [...m, aiLocal])

      // Background revalidate — only adopt server history if it includes this turn
      const sid = result.sessionId || live?.id || session?.id || null
      const { messages: rows, error: histErr } = await fetchChatHistory({
        userId: user.id,
        sessionId: sid,
        limit: 100,
      })

      if (sendGen !== historyGen.current) return

      if (!histErr && rows.length > 0) {
        const mapped = mapRows(rows)
        const hasUser = mapped.some((r) => r.role === 'user' && r.content === text)
        const hasAi =
          !result.reply ||
          mapped.some((r) => r.role === 'ai' && r.content === result.reply)
        // Only replace local bubbles when server history actually contains this exchange
        if (hasUser && hasAi) {
          setMessages(mapped)
        } else {
          console.warn(
            '[Chat] Post-send history missing this turn — keeping local bubbles',
            { hasUser, hasAi, histCount: rows.length },
          )
        }
      } else if (histErr) {
        console.warn('[Chat] Post-send history refresh failed:', histErr)
      }

      void refreshProfile()
    } catch (err) {
      console.error('[Chat] Send failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      if (sendGen === historyGen.current) setSending(false)
    }
  }

  const persona = profile?.ai_personality || 'Master'
  const willpower = profile?.willpower_score ?? 0
  const streak = profile?.compliance_streak ?? 0
  const xp = profile?.xp_total ?? 0

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-white/5 px-6 py-4 xl:px-8">
        <div>
          <p className="font-label-caps text-[10px] tracking-widest text-primary-fixed">COMPANION</p>
          <h1 className="font-headline-md text-xl font-semibold text-on-surface">{persona}</h1>
        </div>
        <div className="flex items-center gap-2">
          {careMode && (
            <span className="rounded-full bg-teal-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-300">
              Care mode
            </span>
          )}
          <span className="hidden rounded-full border border-white/10 px-3 py-1 font-mono-data text-[10px] text-on-surface-variant sm:inline">
            Safeword {profile?.safeword || 'MERCY'}
          </span>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-12">
        <section className="flex min-h-0 flex-col xl:col-span-7">
          <div className="custom-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-6 py-6 xl:px-8">
            {loadingHistory && (
              <p className="font-label-caps text-xs tracking-widest text-on-surface-variant animate-pulse">
                Loading history…
              </p>
            )}

            {!loadingHistory && messages.length === 0 && (
              <div className="rounded-2xl border border-white/5 bg-[#161B15] p-6">
                <p className="font-display-lg text-lg italic text-primary-fixed-dim">
                  Report in. Speak carefully.
                </p>
                <p className="mt-3 text-sm text-on-surface-variant">
                  Type freely. Say <strong className="text-on-surface">MERCY</strong> for Care Mode.
                  Say <strong className="text-on-surface">resume training</strong> to leave it.
                </p>
                {!session && (
                  <p className="mt-3 text-xs text-on-surface-variant opacity-70">
                    No active lock — messages still save to your account.
                  </p>
                )}
              </div>
            )}

            {messages.map((msg) =>
              msg.role === 'user' ? (
                <div key={msg.id} className="flex justify-end">
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl rounded-tr-none border bg-[#161B15]/80 p-5 backdrop-blur',
                      msg.messageType === 'safeword_detected'
                        ? 'border-teal-400/40'
                        : 'border-primary-fixed/20',
                    )}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-on-surface">
                      {msg.content}
                    </p>
                    <p className="mt-3 border-t border-white/5 pt-2 font-label-caps text-[10px] text-on-surface-variant">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex justify-start">
                  <div
                    className={cn(
                      'max-w-[90%] space-y-3',
                      msg.messageType === 'care_mode' && 'text-teal-100',
                      msg.messageType === 'punishment' && 'text-error',
                    )}
                  >
                    <p className="whitespace-pre-wrap text-base leading-relaxed text-on-surface/90">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ),
            )}

            {sending && (
              <p className="animate-pulse font-label-caps text-xs tracking-widest text-on-surface-variant">
                Master is considering…
              </p>
            )}
            {error && <p className="text-sm text-error">{error}</p>}
            {lastTask && (
              <div className="rounded-xl border border-primary-fixed/30 bg-primary-fixed/10 p-4 text-sm">
                Task assigned: <strong>{lastTask}</strong>{' '}
                <Link href="/tasks" className="text-primary-fixed underline">
                  Open Tasks
                </Link>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={(e) => void handleSend(e)}
            className="shrink-0 border-t border-white/5 px-6 py-4 xl:px-8"
          >
            <div className="relative">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Reflect on your decisions…"
                disabled={sending || !user}
                className="w-full rounded-xl border-none bg-surface-container-high px-6 py-4 pr-14 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary-fixed"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-primary-fixed p-2 text-on-primary-fixed transition hover:scale-105 disabled:opacity-40"
                aria-label="Send"
              >
                <Icon name="north_east" className="text-[20px]" />
              </button>
            </div>
          </form>
        </section>

        <aside className="custom-scrollbar hidden min-h-0 overflow-y-auto overscroll-contain border-l border-white/5 p-6 xl:col-span-5 xl:block">
          <div className="space-y-3">
            <div className="rounded-xl border border-white/5 bg-[#161B15]/80 p-6 backdrop-blur">
              <p className="font-label-caps text-[11px] tracking-[0.2em] text-primary-fixed">
                CORE METRIC
              </p>
              <h3 className="mt-1 font-headline-md text-lg font-semibold">Willpower</h3>
              <div className="mt-6 flex items-center justify-center">
                <div className="relative flex h-40 w-40 items-center justify-center">
                  <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#1A1F19" strokeWidth="10" />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="#c3f400"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(willpower / 100) * 327} 327`}
                    />
                  </svg>
                  <div className="text-center">
                    <span className="text-4xl font-bold text-on-surface">{willpower}</span>
                    <p className="font-label-caps text-[10px] text-on-surface-variant">SCORE</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="font-mono-data text-sm">{streak}d</p>
                  <p className="font-label-caps text-[9px] text-on-surface-variant opacity-60">
                    Streak
                  </p>
                </div>
                <div className="border-x border-white/5">
                  <p className="font-mono-data text-sm">{xp}</p>
                  <p className="font-label-caps text-[9px] text-on-surface-variant opacity-60">XP</p>
                </div>
                <div>
                  <p className="font-mono-data text-sm">{profile?.tier?.slice(0, 6) || '—'}</p>
                  <p className="font-label-caps text-[9px] text-on-surface-variant opacity-60">
                    Tier
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-[#161B15]/80 p-6">
              <p className="font-label-caps text-[11px] tracking-[0.2em] text-primary-fixed">
                SESSION
              </p>
              <h3 className="mt-1 text-lg font-semibold">
                {session ? 'Locked in' : 'No active lock'}
              </h3>
              <p className="mt-2 text-sm text-on-surface-variant">
                {session
                  ? `Ends ${new Date(session.scheduled_end_time).toLocaleString()}`
                  : 'Start a session from Home — chat still saves to your profile.'}
              </p>
              {!session && (
                <Link
                  href="/home"
                  className="mt-4 inline-flex text-xs font-bold text-primary-fixed hover:underline"
                >
                  Go to Home →
                </Link>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
