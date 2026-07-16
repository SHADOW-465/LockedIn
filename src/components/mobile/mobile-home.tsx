'use client'

import Link from 'next/link'
import type { Session, Task } from '@/lib/supabase/schema'
import type { BehaviorCounts, ProofScheduleRow } from '@/lib/hooks/use-session-hub'
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

type Props = {
  name: string
  session: Session | null
  streak: number
  willpower: number
  morning?: Task
  night?: Task
  primaryTask?: Task
  behavior: BehaviorCounts
  nextProof?: ProofScheduleRow
  onStartSession: () => void
  onLogBehavior: (type: 'touch' | 'urge' | 'removal') => void
  logging: string | null
  startError?: string
}

/**
 * Stitch mobile Home Dashboard — hero lock, rituals, willpower, memoir peek, support FAB.
 * Live data only (no fake Day 42).
 */
export function MobileHome({
  name,
  session,
  streak,
  willpower,
  morning,
  night,
  primaryTask,
  behavior,
  nextProof,
  onStartSession,
  onLogBehavior,
  logging,
  startError,
}: Props) {
  const ringPct = Math.min(100, Math.max(0, willpower))
  const circ = 2 * Math.PI * 88
  const offset = circ * (1 - ringPct / 100)

  const ritualItems = [
    { key: 'm', title: morning?.title || 'Morning Check-in', done: isDone(morning), href: '/tasks' },
    { key: 'n', title: night?.title || 'Night Check-in', done: isDone(night), href: '/tasks' },
    { key: 'r', title: 'Daily ritual page', done: false, href: '/ritual' },
    { key: 't', title: primaryTask?.title || 'Open task queue', done: false, href: '/tasks' },
  ]
  const doneCount = ritualItems.filter((r) => r.done).length
  const eff = Math.round((doneCount / ritualItems.length) * 100)

  return (
    <div className="space-y-6 px-6 pb-4 pt-2 xl:hidden">
      {/* Hero lock card */}
      <section className="relative">
        <div className="glass-card inner-glow animate-breathe relative flex h-[min(420px,70dvh)] flex-col items-center justify-center overflow-hidden rounded-[2rem] p-8 text-center">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-fixed-dim/10 via-transparent to-background/40" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-6 rounded-full border border-primary-fixed-dim/20 bg-primary-fixed-dim/10 p-6 shadow-[0_0_40px_rgba(171,214,0,0.12)]">
              <Icon
                name={session ? 'lock' : 'lock_open'}
                filled
                className="text-[56px] text-primary-fixed-dim"
              />
            </div>
            <h1 className="mb-2 text-3xl font-bold leading-tight tracking-tight text-primary">
              {session ? session.tier || 'Locked in' : 'Ready to lock'}
            </h1>
            <p className="max-w-sm text-base text-on-surface-variant">
              {session ? lockDayLabel(session) : `Hi ${name}. Start a session when you are ready.`}
            </p>
            <div className="mt-8 flex gap-6">
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
            CHECK-INS &amp; TASKS
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
              strokeDasharray={circ}
              strokeDashoffset={offset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-primary">{willpower}</span>
            <span className="font-label-caps text-[10px] text-primary-fixed-dim">SCORE</span>
          </div>
        </div>
        <p className="relative z-10 border-t border-white/5 pt-4 text-sm italic text-on-surface-variant">
          &ldquo;Identity is formed by the evidence of small wins.&rdquo;
        </p>
      </section>

      {/* Behavior quick log */}
      <section className="glass-card inner-glow rounded-3xl p-6">
        <h2 className="mb-1 text-lg font-semibold text-primary">Behavior log</h2>
        <p className="mb-4 text-xs text-on-surface-variant">
          Today · U{behavior.urge} T{behavior.touch} R{behavior.removal}
        </p>
        <div className="flex flex-wrap gap-2">
          {(['urge', 'touch', 'removal'] as const).map((type) => (
            <button
              key={type}
              type="button"
              disabled={logging === type}
              onClick={() => onLogBehavior(type)}
              className="min-h-11 flex-1 rounded-full border border-white/10 px-3 py-2 text-xs font-bold capitalize text-on-surface active:bg-white/5 disabled:opacity-40"
            >
              {logging === type ? '…' : `+ ${type}`}
            </button>
          ))}
        </div>
        {nextProof && (
          <p className="mt-4 font-mono-data text-[11px] text-primary-fixed-dim">
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
        <Link
          href="/tasks"
          className="mt-3 inline-flex text-xs font-bold text-primary-fixed-dim"
        >
          Tasks &amp; proof →
        </Link>
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

      {/* Quote */}
      <section className="glass-card inner-glow flex items-center justify-center rounded-3xl bg-surface-variant/30 p-8">
        <div className="max-w-[280px] text-center">
          <span className="mb-[-28px] block text-[72px] leading-none text-primary-fixed-dim/20">
            “
          </span>
          <h2 className="text-lg font-semibold italic leading-snug text-primary">
            Discipline is remembering what you{' '}
            <span className="not-italic text-primary-fixed-dim">want most</span>.
          </h2>
        </div>
      </section>

      {/* Quick row */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/chat"
          className="glass-card flex min-h-20 flex-col justify-center rounded-2xl p-4 active:scale-[0.99]"
        >
          <Icon name="psychology" className="mb-2 text-primary-fixed" />
          <span className="text-sm font-semibold">Companion</span>
        </Link>
        <Link
          href="/support"
          className="glass-card flex min-h-20 flex-col justify-center rounded-2xl p-4 active:scale-[0.99]"
        >
          <Icon name="shield_with_heart" className="mb-2 text-primary-fixed" />
          <span className="text-sm font-semibold">Support</span>
        </Link>
      </div>

      {/* Support FAB — Stitch */}
      <Link
        href="/support"
        className="fixed bottom-24 right-5 z-[55] flex items-center gap-2 rounded-2xl bg-primary-fixed-dim px-4 py-3.5 text-on-primary-fixed shadow-[0_0_30px_rgba(171,214,0,0.3)] active:scale-95 xl:hidden"
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <Icon name="psychology" className="text-[22px]" />
        <span className="font-label-caps text-[11px] font-bold tracking-wide">SUPPORT</span>
      </Link>
    </div>
  )
}
