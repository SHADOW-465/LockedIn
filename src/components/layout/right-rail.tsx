'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/auth-context'
import { getActiveSession } from '@/lib/supabase/sessions'
import type { Session } from '@/lib/supabase/schema'
import { sendChatMessage } from '@/lib/chat-client'
import { Icon } from '@/components/ui/icon'

function formatRemaining(endIso: string | null | undefined): {
  h: string
  m: string
  s: string
  live: boolean
} {
  if (!endIso) return { h: '—', m: '—', s: '—', live: false }
  const ms = new Date(endIso).getTime() - Date.now()
  if (ms <= 0) return { h: '00', m: '00', s: '00', live: true }
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return {
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
    live: true,
  }
}

/**
 * Desktop right utility rail — lock · memoir · companion dock (live send).
 */
export function RightRail() {
  const { user, profile } = useAuth()
  const [session, setSession] = useState<Session | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [dockInput, setDockInput] = useState('')
  const [dockReply, setDockReply] = useState<string | null>(null)
  const [dockSending, setDockSending] = useState(false)
  const [dockError, setDockError] = useState('')

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    getActiveSession(user.id).then((s) => {
      if (!cancelled) setSession(s)
    })
    return () => {
      cancelled = true
    }
  }, [user?.id])

  useEffect(() => {
    if (!session?.scheduled_end_time) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [session?.scheduled_end_time])

  const remaining = useMemo(
    () => formatRemaining(session?.scheduled_end_time),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session?.scheduled_end_time, now],
  )

  const persona = profile?.ai_personality ?? 'Master'
  const firstName =
    profile?.username?.trim() || user?.email?.split('@')[0] || 'there'

  async function sendDock() {
    if (!user || !profile || !dockInput.trim() || dockSending) return
    const message = dockInput.trim()
    setDockInput('')
    setDockSending(true)
    setDockError('')
    const result = await sendChatMessage({
      message,
      profile,
      userId: user.id,
      sessionId: session?.id,
    })
    setDockSending(false)
    if (result.error) {
      setDockError(result.error)
      return
    }
    setDockReply(result.reply)
  }

  return (
    <aside className="custom-scrollbar hidden h-full min-h-0 w-80 shrink-0 flex-col gap-6 overflow-y-auto overflow-x-hidden border-l border-white/5 bg-surface-container-lowest p-6 xl:flex">
      {/* Lock */}
      <div className="bento-card rounded-2xl p-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h5 className="mb-1 font-label-caps text-[11px] uppercase tracking-wide text-on-surface-variant opacity-50">
              {session ? 'Lock session' : 'No active lock'}
            </h5>
            <p className="flex items-center gap-2 text-sm font-bold text-on-surface">
              <Icon name="lock" className="text-base text-primary-fixed" />
              {session ? session.tier || 'Active' : 'Idle'}
            </p>
          </div>
          {remaining.live && (
            <span className="rounded bg-primary-fixed/10 px-2 py-0.5 font-mono-data text-[10px] text-primary-fixed">
              LIVE
            </span>
          )}
        </div>

        <div className="relative mb-4 flex h-28 items-center justify-center overflow-hidden rounded-xl bg-surface-container">
          <div className="flex gap-3 font-mono-data text-2xl font-bold tracking-widest text-on-surface">
            <div className="text-center">
              <p className={remaining.live ? 'text-primary-fixed' : ''}>{remaining.h}</p>
              <p className="font-sans text-[8px] opacity-50">HRS</p>
            </div>
            <span className="opacity-40">:</span>
            <div className="text-center">
              <p>{remaining.m}</p>
              <p className="font-sans text-[8px] opacity-50">MIN</p>
            </div>
            <span className="opacity-40">:</span>
            <div className="text-center">
              <p>{remaining.s}</p>
              <p className="font-sans text-[8px] opacity-50">SEC</p>
            </div>
          </div>
        </div>

        <Link
          href="/home"
          className="block w-full rounded-lg bg-surface-container py-2.5 text-center text-xs font-bold text-on-surface transition-all hover:bg-surface-container-highest"
        >
          {session ? 'Session hub' : 'Start from Home'}
        </Link>
      </div>

      {/* Memoir peek */}
      <div className="bento-card flex min-h-[140px] flex-col rounded-2xl p-5">
        <h5 className="mb-4 font-label-caps text-[11px] uppercase tracking-wide text-on-surface-variant opacity-50">
          Memoir
        </h5>
        <p className="mb-1 font-mono-data text-[10px] opacity-60">
          Streak {profile?.compliance_streak ?? 0} · Willpower {profile?.willpower_score ?? '—'}
        </p>
        <p className="mb-4 flex-1 text-xs italic leading-snug text-on-surface-variant">
          Rituals and exports fill the book. Open Memoir for chapters.
        </p>
        <Link
          href="/memoir"
          className="block w-full rounded-lg border border-white/10 py-2.5 text-center text-xs font-bold transition-all hover:bg-white/5"
        >
          Open Memoir
        </Link>
      </div>

      {/* Companion dock */}
      <div className="bento-card flex min-h-[300px] flex-col rounded-2xl p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary-fixed/30 bg-primary-fixed/20">
            <Icon name="psychology" className="text-lg text-primary-fixed" />
          </div>
          <div className="min-w-0 flex-1">
            <h5 className="truncate text-sm font-bold text-on-surface">{persona}</h5>
            <p className="text-[10px] text-on-surface-variant opacity-50">Dock · live chat</p>
          </div>
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary-fixed" />
        </div>

        <div className="mb-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <div className="rounded-tr-xl rounded-br-xl rounded-bl-xl bg-surface-container/50 p-3 text-xs text-on-surface">
            How are you feeling today, {firstName}?
          </div>
          {dockReply && (
            <div className="rounded-tr-xl rounded-br-xl rounded-bl-xl bg-surface-container/50 p-3 text-xs text-on-surface whitespace-pre-wrap">
              {dockReply}
            </div>
          )}
          {dockSending && (
            <p className="text-[10px] text-on-surface-variant animate-pulse">Thinking…</p>
          )}
          {dockError && <p className="text-[10px] text-error">{dockError}</p>}
        </div>

        <div className="relative mb-2">
          <input
            value={dockInput}
            onChange={(e) => setDockInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void sendDock()
            }}
            disabled={dockSending || !user}
            className="w-full rounded-full border border-white/10 bg-surface-container-lowest px-4 py-2 pr-10 text-xs focus:border-transparent focus:outline-none focus:ring-1 focus:ring-primary-fixed"
            placeholder="Quick message…"
          />
          <button
            type="button"
            onClick={() => void sendDock()}
            disabled={dockSending || !dockInput.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-fixed disabled:opacity-40"
            aria-label="Send"
          >
            <Icon name="send" className="text-lg" />
          </button>
        </div>
        <Link href="/chat" className="text-center text-[10px] font-bold text-primary-fixed hover:underline">
          Open full companion →
        </Link>
      </div>
    </aside>
  )
}
