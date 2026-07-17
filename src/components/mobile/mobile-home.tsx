'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { Session, Task } from '@/lib/supabase/schema'
import type { BehaviorCounts, ProofScheduleRow } from '@/lib/hooks/use-session-hub'
import {
  BehaviorLogPanel,
  type BehaviorType,
} from '@/components/features/behavior/behavior-log-panel'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

function isDone(t: Task | undefined) {
  if (!t) return false
  return t.status === 'completed' || t.status === 'verified'
}

function formatTarget(session: Session | null): string {
  if (!session?.scheduled_end_time) return '—'
  return new Date(session.scheduled_end_time).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function lockDayLabel(session: Session | null): string {
  if (!session?.start_time) return 'No active lock'
  const start = new Date(session.start_time).getTime()
  const day = Math.max(1, Math.floor((Date.now() - start) / 86400000) + 1)
  const totalMin = session.total_duration_minutes || 0
  const totalDays = totalMin > 0 ? Math.max(1, Math.round(totalMin / (24 * 60))) : null
  if (totalDays) return `Day ${day} of ${totalDays}. Stay committed.`
  return `Day ${day}. Your commitment is the foundation.`
}

/** Remaining time as H:M:S or multi-day compact. */
function formatRemaining(ms: number): { primary: string; secondary: string } {
  if (ms <= 0) return { primary: '00:00:00', secondary: 'COMPLETE' }
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  if (days > 0) {
    return {
      primary: `${days}d ${pad(h)}h`,
      secondary: `${pad(m)}m ${pad(s)}s`,
    }
  }
  return {
    primary: `${pad(h)}:${pad(m)}:${pad(s)}`,
    secondary: 'REMAINING',
  }
}

const LOCK_AFFIRMATIONS = [
  'Locked is baseline. Freedom is the exception you earn.',
  'Your hands are free. Your cock is not. Use that focus.',
  'Every hour you stay sealed rewires the craving.',
  'Urges pass. The cage remains. So do you.',
  'Discipline is remembering what you want most.',
  'You chose this key. Don’t negotiate with the old self.',
  'Denial is not emptiness — it is training.',
  'Stay sealed. Stay sharp. Stay mine to the mission.',
  'The device is not a joke. It is your identity today.',
  'One more hour. Then another. That is how keys stay lost.',
  'Touch the thought, not the metal. Breathe. Hold the frame.',
  'You are not waiting to unlock. You are becoming locked.',
]

type Props = {
  name: string
  session: Session | null
  streak: number
  willpower: number
  morning?: Task
  night?: Task
  primaryTask?: Task
  /** Open non-checkin tasks — powers Tasks hub CTA */
  openTaskCount?: number
  behavior: BehaviorCounts
  nextProof?: ProofScheduleRow
  onStartSession: () => void
  onLogBehavior: (payload: {
    type: BehaviorType
    intensity?: number
    reason?: string
  }) => void
  logging: string | null
  startError?: string
}

/**
 * Stitch mobile Home — live ring timer, affirmations, Tasks hub, ritual queue.
 * 5-slot nav purity: no Support FAB / bottom quick row; Companion = top bar only.
 */
export function MobileHome({
  name,
  session,
  streak,
  willpower,
  morning,
  night,
  primaryTask,
  openTaskCount = 0,
  behavior,
  nextProof,
  onStartSession,
  onLogBehavior,
  logging,
  startError,
}: Props) {
  const [now, setNow] = useState(() => Date.now())
  const [affirmIdx, setAffirmIdx] = useState(0)
  const [affirmVisible, setAffirmVisible] = useState(true)

  // Live clock for countdown ring
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  // Rotate affirmations — fade out → swap → fade in
  useEffect(() => {
    const id = window.setInterval(() => {
      setAffirmVisible(false)
      window.setTimeout(() => {
        setAffirmIdx((i) => (i + 1) % LOCK_AFFIRMATIONS.length)
        setAffirmVisible(true)
      }, 400)
    }, 7000)
    return () => window.clearInterval(id)
  }, [])

  const timer = useMemo(() => {
    if (!session?.scheduled_end_time || !session.start_time) {
      return {
        remainingMs: 0,
        remainingFrac: 0,
        label: formatRemaining(0),
        live: false,
      }
    }
    const end = new Date(session.scheduled_end_time).getTime()
    const start = new Date(session.start_time).getTime()
    const total = Math.max(1, end - start)
    const remainingMs = Math.max(0, end - now)
    // Ring like a battery: full when lots of time left, empties as deadline nears
    const remainingFrac = Math.min(1, Math.max(0, remainingMs / total))
    return {
      remainingMs,
      remainingFrac,
      label: formatRemaining(remainingMs),
      live: remainingMs > 0 && ['active', 'extending', 'completing'].includes(session.status),
    }
  }, [session, now])

  // Willpower ring (separate card)
  const wpCirc = 2 * Math.PI * 88
  const wpOffset = wpCirc * (1 - Math.min(100, Math.max(0, willpower)) / 100)

  // Session timer ring geometry
  const R = 100
  const timerCirc = 2 * Math.PI * R
  const timerOffset = timerCirc * (1 - (session ? timer.remainingFrac : 0))

  const ritualItems = [
    { key: 'm', title: morning?.title || 'Morning Check-in', done: isDone(morning), href: '/tasks' },
    { key: 'n', title: night?.title || 'Night Check-in', done: isDone(night), href: '/tasks' },
    { key: 'r', title: 'Daily ritual page', done: false, href: '/ritual' },
    { key: 't', title: primaryTask?.title || 'Open task queue', done: false, href: '/tasks' },
  ]
  const doneCount = ritualItems.filter((r) => r.done).length
  const eff = Math.round((doneCount / ritualItems.length) * 100)

  const affirmation = LOCK_AFFIRMATIONS[affirmIdx]

  return (
    <div className="space-y-6 px-6 pb-4 pt-2 xl:hidden">
      {/* Hero — live session ring timer */}
      <section className="relative">
        <div className="glass-card inner-glow relative flex min-h-[min(460px,78dvh)] flex-col items-center justify-center overflow-hidden rounded-[2rem] px-6 py-10 text-center">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-fixed-dim/12 via-transparent to-background/50" />
          <div className="pointer-events-none absolute inset-0 animate-breathe bg-[radial-gradient(ellipse_at_center,rgba(195,244,0,0.08)_0%,transparent_65%)]" />

          <div className="relative z-10 flex w-full flex-col items-center">
            {/* Motorola-style remaining-time ring */}
            <div className="relative mb-5 flex h-56 w-56 items-center justify-center sm:h-64 sm:w-64">
              <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 224 224" aria-hidden>
                {/* Track */}
                <circle
                  cx="112"
                  cy="112"
                  r={R}
                  fill="none"
                  stroke="#1A1F19"
                  strokeWidth="10"
                />
                {/* Remaining charge (time left) */}
                <circle
                  cx="112"
                  cy="112"
                  r={R}
                  fill="none"
                  stroke={session ? '#c3f400' : '#3c423a'}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={timerCirc}
                  strokeDashoffset={session ? timerOffset : timerCirc * 0.92}
                  className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                  style={{
                    filter: session ? 'drop-shadow(0 0 8px rgba(195,244,0,0.35))' : undefined,
                  }}
                />
              </svg>

              <div className="relative z-10 flex flex-col items-center justify-center px-4">
                {session ? (
                  <>
                    <span className="font-mono-data text-[1.65rem] font-bold tracking-tight text-primary tabular-nums sm:text-3xl">
                      {timer.label.primary}
                    </span>
                    <span className="mt-1 font-label-caps text-[10px] tracking-[0.18em] text-primary-fixed-dim">
                      {timer.label.secondary}
                    </span>
                    <span className="mt-2 flex items-center gap-1.5 font-label-caps text-[9px] tracking-widest text-on-surface-variant">
                      <span
                        className={cn(
                          'inline-block h-1.5 w-1.5 rounded-full',
                          timer.live ? 'animate-pulse bg-primary-fixed' : 'bg-outline-variant',
                        )}
                      />
                      {timer.live ? 'LOCKED LIVE' : 'SESSION'}
                    </span>
                  </>
                ) : (
                  <>
                    <Icon name="lock_open" className="mb-2 text-4xl text-on-surface-variant/50" />
                    <span className="font-label-caps text-[10px] tracking-[0.2em] text-on-surface-variant">
                      NO ACTIVE LOCK
                    </span>
                  </>
                )}
              </div>
            </div>

            <h1 className="mb-1 text-2xl font-bold leading-tight tracking-tight text-primary sm:text-3xl">
              {session ? session.tier || 'Locked in' : 'Ready to lock'}
            </h1>
            <p className="max-w-sm text-sm text-on-surface-variant sm:text-base">
              {session ? lockDayLabel(session) : `Hi ${name}. Start a session when you are ready.`}
            </p>

            {/* Rotating lock affirmations */}
            <p
              className={cn(
                'mt-5 max-w-[20rem] min-h-[2.75rem] text-sm font-medium italic leading-snug text-primary-fixed-dim transition-opacity duration-300',
                affirmVisible ? 'opacity-100' : 'opacity-0',
              )}
              aria-live="polite"
            >
              {affirmation}
            </p>

            <div className="mt-7 flex gap-6">
              <div className="flex flex-col items-center">
                <span className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
                  Streak
                </span>
                <span className="text-xl font-semibold text-primary-fixed-dim">{streak} Days</span>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
                  Target
                </span>
                <span className="text-xl font-semibold text-primary">{formatTarget(session)}</span>
              </div>
            </div>

            {!session && (
              <button
                type="button"
                onClick={onStartSession}
                className="mt-8 min-h-12 rounded-full bg-primary-fixed px-8 text-sm font-bold text-on-primary-fixed shadow-[0_0_30px_rgba(171,214,0,0.25)]"
              >
                Start lock session
              </button>
            )}
            {startError && <p className="mt-3 text-sm text-error">{startError}</p>}
          </div>
        </div>
      </section>

      {/* Tasks hub — primary discovery path (not in 5-slot pill) */}
      <Link
        href="/tasks"
        className="glass-card inner-glow group relative block overflow-hidden rounded-3xl border border-primary-fixed/20 p-5 active:scale-[0.99]"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-fixed/10 via-transparent to-transparent" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-fixed text-on-primary-fixed">
            <Icon name="task_alt" className="text-2xl" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-label-caps text-[10px] tracking-[0.18em] text-primary-fixed">
                TASKS
              </p>
              {openTaskCount > 0 && (
                <span className="rounded-full bg-primary-fixed px-2.5 py-0.5 font-mono-data text-[11px] font-bold text-on-primary-fixed">
                  {openTaskCount} open
                </span>
              )}
            </div>
            <h2 className="mt-1 text-lg font-semibold text-on-surface">
              {primaryTask?.title || 'Task queue & proof'}
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              {primaryTask
                ? 'Tap to complete, fail, or submit proof.'
                : openTaskCount === 0
                  ? 'No open tasks — check-ins and Master work land here.'
                  : `${openTaskCount} waiting in the queue.`}
            </p>
            {nextProof && (
              <p className="mt-2 font-mono-data text-[11px] text-primary-fixed-dim">
                Proof window{' '}
                {new Date(nextProof.window_start).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                –
                {new Date(nextProof.window_end).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary-fixed">
              Open tasks
              <Icon name="chevron_right" className="text-sm" />
            </span>
          </div>
        </div>
      </Link>

      {/* Today's ritual */}
      <section className="glass-card inner-glow flex flex-col gap-5 rounded-3xl p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-primary">Today&apos;s Ritual</h2>
            <p className="text-sm text-on-surface-variant">
              {doneCount} of {ritualItems.length} completed
            </p>
          </div>
          <span className="rounded-full bg-primary-fixed-dim/10 px-3 py-1 font-mono-data text-xs text-primary-fixed-dim">
            {eff}%
          </span>
        </div>
        <div className="space-y-2">
          <span className="font-label-caps text-[10px] tracking-widest text-on-surface-variant/60">
            CHECK-INS &amp; RITUAL
          </span>
          {ritualItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="flex min-h-14 items-center rounded-xl border border-white/5 bg-surface-container-high/50 px-4 py-3 transition active:bg-surface-variant"
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                  item.done
                    ? 'border-primary-fixed-dim bg-primary-fixed-dim text-on-primary-fixed'
                    : 'border-outline-variant bg-transparent',
                )}
              >
                {item.done && <Icon name="check" className="text-[14px]" />}
              </span>
              <span
                className={cn(
                  'ml-4 text-sm',
                  item.done ? 'text-primary' : 'text-on-surface-variant',
                )}
              >
                {item.title}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Willpower ring */}
      <section className="glass-card inner-glow relative flex flex-col items-center overflow-hidden rounded-3xl p-6 text-center">
        <div className="pointer-events-none absolute inset-0 translate-y-1/2 rounded-full bg-primary-fixed-dim/5 blur-3xl" />
        <h2 className="relative z-10 font-label-caps text-[11px] uppercase tracking-widest text-on-surface-variant">
          Willpower
        </h2>
        <div className="relative z-10 my-4 flex items-center justify-center">
          <svg className="h-44 w-44 -rotate-90" viewBox="0 0 192 192">
            <circle cx="96" cy="96" r="88" fill="none" stroke="#1A1F19" strokeWidth="12" />
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="#c3f400"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={wpCirc}
              strokeDashoffset={wpOffset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-primary">{willpower}</span>
            <span className="font-label-caps text-[10px] text-primary-fixed-dim">SCORE</span>
          </div>
        </div>
        <p
          className={cn(
            'relative z-10 border-t border-white/5 pt-4 text-sm italic text-on-surface-variant transition-opacity duration-300',
            affirmVisible ? 'opacity-100' : 'opacity-0',
          )}
        >
          &ldquo;{affirmation}&rdquo;
        </p>
      </section>

      {/* Behavior quick log */}
      <section className="glass-card inner-glow rounded-3xl p-5 sm:p-6">
        <BehaviorLogPanel
          counts={behavior}
          logging={logging}
          density="compact"
          onLog={(payload) => onLogBehavior(payload)}
        />
        {nextProof && (
          <p className="mt-4 border-t border-white/5 pt-4 font-mono-data text-[11px] text-primary-fixed-dim">
            Next proof window{' '}
            {new Date(nextProof.window_start).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
            –
            {new Date(nextProof.window_end).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </section>

      {/* Memoir peek */}
      <Link
        href="/memoir"
        className="glass-card inner-glow group relative block overflow-hidden rounded-3xl p-6"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed-dim/10 to-transparent opacity-60" />
        <div className="relative z-10">
          <div className="mb-3 flex items-center gap-2">
            <Icon name="menu_book" className="text-primary-fixed-dim" />
            <span className="font-label-caps text-[10px] tracking-widest text-on-surface-variant">
              THE MEMOIR
            </span>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-primary">Your chronicle</h3>
          <p className="line-clamp-2 text-sm text-on-surface-variant">
            Ritual pages and session chapters live here. Write today&apos;s entry from Ritual.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 font-label-caps text-[11px] text-primary-fixed-dim">
            OPEN LIBRARY <Icon name="chevron_right" className="text-sm" />
          </span>
        </div>
      </Link>
    </div>
  )
}
