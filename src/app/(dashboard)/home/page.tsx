'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/auth-context'
import { useSessionHub } from '@/lib/hooks/use-session-hub'
import type { Task } from '@/lib/supabase/schema'
import {
  SessionStartModal,
  type SessionStartConfig,
} from '@/components/features/session/session-start-modal'
import { SessionCompleteOverlay } from '@/components/features/session/session-complete-overlay'
import { finalizeSession } from '@/lib/session-finalize'
import { invalidateSessionCache } from '@/lib/supabase/sessions'
import { invalidateHubCache } from '@/lib/hooks/use-session-hub'
import { MobileHome } from '@/components/mobile/mobile-home'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

function greetingForHour(h: number): string {
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function isDone(t: Task) {
  return t.status === 'completed' || t.status === 'verified'
}

/**
 * Home workbench canvas — Stitch home_dashboard DNA + live data.
 */
export default function HomePage() {
  const { user, profile, refreshProfile } = useAuth()
  const { session, tasks, behavior, proofSlots, loading, refresh } = useSessionHub(user?.id)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [startError, setStartError] = useState('')
  const [logging, setLogging] = useState<string | null>(null)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null)
  const [finalizeError, setFinalizeError] = useState('')
  const finalizeStarted = useRef<string | null>(null)

  const name =
    profile?.username?.trim() || user?.email?.split('@')[0] || 'there'
  const greeting = greetingForHour(new Date().getHours())
  const streak = profile?.compliance_streak ?? 0
  const xp = profile?.xp_total ?? 0
  const willpower = profile?.willpower_score ?? 0
  const level = Math.max(1, Math.floor(xp / 1000) + 1)
  const xpInLevel = xp % 1000
  const xpPct = Math.min(100, Math.round((xpInLevel / 1000) * 100))

  const checkins = useMemo(
    () => tasks.filter((t) => t.task_type === 'checkin'),
    [tasks],
  )
  const morning = checkins.find((t) => t.title.toLowerCase().includes('morning'))
  const night = checkins.find(
    (t) => t.title.toLowerCase().includes('night') || t.title.toLowerCase().includes('evening'),
  )
  const openTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.task_type !== 'checkin' &&
          !['completed', 'verified', 'failed', 'skipped'].includes(t.status),
      ),
    [tasks],
  )
  const primaryTask = openTasks[0]

  const nextProof = proofSlots.find((s) => !s.completed && !s.missed)

  // Detect timer expiry or server `completing` → run archival pipeline once
  useEffect(() => {
    if (!user || !session) return
    const expired =
      session.status === 'completing' ||
      (session.status === 'active' &&
        new Date(session.scheduled_end_time).getTime() <= Date.now())
    if (!expired) return
    if (finalizeStarted.current === session.id) return
    finalizeStarted.current = session.id
    setCompleteOpen(true)
    setArchiving(true)
    setFinalizeError('')
    void (async () => {
      const result = await finalizeSession(user.id, session)
      setArchiving(false)
      setSummary(result.summary)
      if (!result.ok) setFinalizeError(result.error || 'Archive failed')
      await refresh()
      await refreshProfile()
    })()
  }, [user, session, refresh, refreshProfile])

  async function startSession(config: SessionStartConfig) {
    if (!user || !profile) throw new Error('Not signed in')
    setStartError('')
    const res = await fetch('/api/sessions/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        config: {
          tier: config.tier,
          ai_personality: config.ai_personality,
          hard_limits: profile.hard_limits || [],
          soft_limits: profile.soft_limits || [],
          regimens: profile.preferred_regimens || [],
          desired_duration_minutes: config.desired_duration_minutes,
        },
      }),
    })
    const data = await res.json()
    if (!res.ok && res.status !== 409) {
      const msg = data.error || 'Could not start session'
      setStartError(msg)
      throw new Error(msg)
    }
    invalidateSessionCache(user.id)
    invalidateHubCache(user.id)
    await refresh()
    await refreshProfile()
  }

  async function logBehavior(type: 'touch' | 'urge' | 'removal') {
    if (!user) return
    setLogging(type)
    try {
      await fetch('/api/behavior/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          sessionId: session?.id,
          type,
          intensity: type === 'urge' ? 5 : undefined,
          reason: type === 'removal' ? 'Self-reported' : undefined,
        }),
      })
      await refresh()
    } finally {
      setLogging(null)
    }
  }

  return (
    <>
      {/* ── Mobile (Stitch) — dedicated layout below xl ── */}
      <MobileHome
        name={name}
        session={session}
        streak={streak}
        willpower={willpower}
        morning={morning}
        night={night}
        primaryTask={primaryTask}
        behavior={behavior}
        nextProof={nextProof}
        onStartSession={() => setWizardOpen(true)}
        onLogBehavior={(t) => void logBehavior(t)}
        logging={logging}
        startError={startError}
      />

      <SessionStartModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        defaults={{
          tier: profile?.tier,
          ai_personality: profile?.ai_personality,
          initial_lock_goal_hours: profile?.initial_lock_goal_hours,
        }}
        onStart={startSession}
      />

      <SessionCompleteOverlay
        open={completeOpen}
        archiving={archiving}
        summary={summary}
        error={finalizeError}
        onContinue={() => {
          setCompleteOpen(false)
          setSummary(null)
          finalizeStarted.current = null
        }}
      />

      {/* ── Desktop workbench — xl+ only ── */}
      <div className="hidden px-8 pb-12 pt-6 xl:block">
      <header className="mb-6 flex items-center justify-between">
        <h2 className="font-headline-md text-xl font-semibold text-on-surface">Home Dashboard</h2>
        <span
          className={cn(
            'rounded-full border px-3 py-1.5 font-mono-data text-[10px]',
            session
              ? 'border-primary-fixed/30 bg-primary-fixed/10 text-primary-fixed'
              : 'border-white/10 text-on-surface-variant opacity-60',
          )}
        >
          {session ? 'SESSION ACTIVE' : 'IDLE'}
        </span>
      </header>

      {/* Greeting */}
      <section className="relative mb-8 flex min-h-[160px] flex-col justify-end overflow-hidden rounded-2xl border border-white/5 bg-surface-container p-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-fixed/5 via-transparent to-transparent" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-on-surface xl:text-4xl">
              {greeting}, {name}.
            </h2>
            <p className="mt-2 max-w-md text-sm text-on-surface-variant">
              {session
                ? 'You are locked in. Rituals, tasks, and proof stay on this board.'
                : 'Start a lock session to activate check-ins, random proof, and Master control.'}
            </p>
            {startError && <p className="mt-2 text-sm text-error">{startError}</p>}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {!session ? (
              <button
                type="button"
                disabled={!user}
                onClick={() => setWizardOpen(true)}
                className="rounded-full bg-primary-fixed px-6 py-3 text-sm font-bold text-on-primary-fixed transition hover:brightness-110 disabled:opacity-50"
              >
                Start lock session
              </button>
            ) : (
              <Link
                href="/support"
                className="rounded-full border border-error/40 px-5 py-3 text-xs font-bold text-error"
              >
                Support / release
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Metrics */}
      <div className="mb-8 grid grid-cols-4 gap-3">
        <MetricCard label="Compliance streak" value={String(streak)} unit="days" icon="local_fire_department" accent />
        <MetricCard label="Willpower" value={String(willpower)} unit="/ 100" icon="psychology" />
        <div className="bento-card rounded-xl p-5">
          <p className="mb-1 font-label-caps text-[11px] tracking-wide text-on-surface-variant">
            Journey level
          </p>
          <h3 className="text-xl font-semibold text-on-surface">Level {level}</h3>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-on-surface-variant opacity-60">
            {profile?.tier ?? '—'}
          </p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
            <div className="h-full rounded-full bg-primary-fixed" style={{ width: `${xpPct}%` }} />
          </div>
          <div className="mt-2 flex justify-between font-mono-data text-[10px] opacity-40">
            <span>{xp} XP</span>
            <span>{level * 1000}</span>
          </div>
        </div>
        <MetricCard
          label="Today behavior"
          value={String(behavior.urge + behavior.touch + behavior.removal)}
          unit={`U${behavior.urge} T${behavior.touch} R${behavior.removal}`}
          icon="monitoring"
        />
      </div>

      {/* Main bento */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12 xl:gap-bento-gap">
        {/* Rituals */}
        <section className="bento-card rounded-2xl p-6 xl:col-span-7">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-headline-md text-lg font-semibold">Today&apos;s Rituals</h3>
            <Link href="/ritual" className="font-label-caps text-xs text-primary-fixed hover:underline">
              VIEW ALL
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-on-surface-variant">Loading…</p>
          ) : !session ? (
            <p className="text-sm text-on-surface-variant">
              Start a session to generate morning and night check-ins.
            </p>
          ) : (
            <ul className="space-y-3">
              <RitualRow
                icon="wb_sunny"
                title="Morning Check-in"
                subtitle="Cage photo · 6am–10am on-time"
                done={morning ? isDone(morning) : false}
                href="/tasks"
              />
              <RitualRow
                icon="nightlight"
                title="Night Check-in"
                subtitle="Cage photo · 8pm–midnight on-time"
                done={night ? isDone(night) : false}
                href="/tasks"
              />
              <RitualRow
                icon="history_edu"
                title="Daily ritual page"
                subtitle="Intention + reflection"
                done={false}
                href="/ritual"
              />
            </ul>
          )}
        </section>

        {/* Current task */}
        <section className="bento-card rounded-2xl p-6 xl:col-span-5">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-headline-md text-lg font-semibold">Current task</h3>
            <Link href="/tasks" className="font-label-caps text-xs text-primary-fixed hover:underline">
              ALL TASKS
            </Link>
          </div>
          {primaryTask ? (
            <div>
              <p className="mb-1 font-label-caps text-[10px] tracking-widest text-on-surface-variant">
                {primaryTask.task_type.toUpperCase()} · D{primaryTask.difficulty}
              </p>
              <h4 className="text-base font-semibold text-on-surface">{primaryTask.title}</h4>
              {primaryTask.description && (
                <p className="mt-2 line-clamp-3 text-sm text-on-surface-variant">
                  {primaryTask.description}
                </p>
              )}
              <Link
                href="/tasks"
                className="mt-4 inline-flex rounded-full bg-primary-fixed px-4 py-2 text-xs font-bold text-on-primary-fixed"
              >
                Open tasks
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-sm text-on-surface-variant">
                {session
                  ? 'No open tasks. Ask your Master in Companion, or generate from Tasks.'
                  : 'Tasks appear once a session is active.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/chat"
                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold hover:bg-white/5"
                >
                  Companion
                </Link>
                <Link
                  href="/tasks"
                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold hover:bg-white/5"
                >
                  Tasks
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Behavior quick log */}
        <section className="bento-card rounded-2xl p-6 xl:col-span-4">
          <h3 className="mb-4 font-headline-md text-lg font-semibold">Behavior log</h3>
          <p className="mb-4 text-xs text-on-surface-variant">
            Today: {behavior.urge} urges · {behavior.touch} touches · {behavior.removal} removals
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['urge', 'Urge'],
                ['touch', 'Touch'],
                ['removal', 'Removal'],
              ] as const
            ).map(([type, label]) => (
              <button
                key={type}
                type="button"
                disabled={!user || logging === type}
                onClick={() => void logBehavior(type)}
                className="min-h-11 rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-on-surface transition hover:border-primary-fixed/40 hover:bg-primary-fixed/5 disabled:opacity-40"
              >
                {logging === type ? '…' : `+ ${label}`}
              </button>
            ))}
          </div>
        </section>

        {/* Random proof */}
        <section className="bento-card rounded-2xl p-6 xl:col-span-4">
          <h3 className="mb-4 font-headline-md text-lg font-semibold">Random proof</h3>
          {nextProof ? (
            <p className="text-sm text-on-surface-variant">
              Next window{' '}
              <span className="font-mono-data text-primary-fixed">
                {new Date(nextProof.window_start).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                –{' '}
                {new Date(nextProof.window_end).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </p>
          ) : (
            <p className="text-sm text-on-surface-variant">
              {session
                ? 'No pending proof windows right now.'
                : 'Proof schedule activates with a session.'}
            </p>
          )}
          <Link
            href="/tasks"
            className="mt-4 inline-flex text-xs font-bold text-primary-fixed hover:underline"
          >
            Submit from Tasks →
          </Link>
        </section>

        {/* Companion CTA */}
        <section className="bento-card rounded-2xl p-6 xl:col-span-4">
          <div className="mb-3 flex items-center gap-2">
            <Icon name="psychology" className="text-primary-fixed" />
            <h3 className="font-headline-md text-lg font-semibold">
              {profile?.ai_personality || 'Master'}
            </h3>
          </div>
          <p className="text-sm text-on-surface-variant">
            Companion chat is live. Safeword: {profile?.safeword || 'MERCY'}.
          </p>
          <Link
            href="/chat"
            className="mt-4 inline-flex rounded-full bg-primary-fixed px-4 py-2 text-xs font-bold text-on-primary-fixed"
          >
            Open companion
          </Link>
        </section>
      </div>
      </div>
    </>
  )
}

function MetricCard({
  label,
  value,
  unit,
  icon,
  accent,
}: {
  label: string
  value: string
  unit: string
  icon: string
  accent?: boolean
}) {
  return (
    <div className="bento-card rounded-xl p-5">
      <div className="mb-3 flex items-start justify-between">
        <p className="font-label-caps text-[11px] tracking-wide text-on-surface-variant">{label}</p>
        <Icon
          name={icon}
          filled={accent}
          className={accent ? 'text-primary-fixed' : 'text-on-surface-variant opacity-50'}
        />
      </div>
      <div className="flex flex-wrap items-baseline gap-1">
        <span
          className={cn(
            'text-3xl font-bold xl:text-4xl',
            accent ? 'text-primary-fixed' : 'text-on-surface',
          )}
        >
          {value}
        </span>
        {unit && (
          <span className="font-label-caps text-[10px] text-on-surface-variant opacity-50">
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}

function RitualRow({
  icon,
  title,
  subtitle,
  done,
  href,
}: {
  icon: string
  title: string
  subtitle: string
  done: boolean
  href: string
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-4 rounded-xl border border-white/5 bg-surface-container/40 px-4 py-3 transition hover:border-primary-fixed/25"
      >
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full',
            done ? 'bg-primary-fixed/20 text-primary-fixed' : 'bg-surface-container text-on-surface-variant',
          )}
        >
          <Icon name={done ? 'check' : icon} filled={done} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-semibold', done && 'text-on-surface-variant line-through')}>
            {title}
          </p>
          <p className="text-[11px] text-on-surface-variant opacity-70">{subtitle}</p>
        </div>
        <Icon name="chevron_right" className="text-on-surface-variant opacity-40" />
      </Link>
    </li>
  )
}
