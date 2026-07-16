'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/auth-context'
import { useSessionHub } from '@/lib/hooks/use-session-hub'
import type { Task } from '@/lib/supabase/schema'
import { ProofCaptureModal } from '@/components/features/proof/proof-capture-modal'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

type Filter = 'open' | 'all' | 'checkin' | 'master' | 'daily' | 'punishment'

export default function TasksPage() {
  const { user, profile, refreshProfile } = useAuth()
  const { session, tasks, proofSlots, loading, refresh } = useSessionHub(user?.id)
  const [filter, setFilter] = useState<Filter>('open')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [proofTask, setProofTask] = useState<Task | null>(null)
  const [randomScheduleId, setRandomScheduleId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = tasks
    if (filter === 'open') {
      list = list.filter(
        (t) => !['completed', 'verified', 'failed', 'skipped'].includes(t.status),
      )
    } else if (filter !== 'all') {
      list = list.filter((t) => t.task_type === filter)
    }
    return list
  }, [tasks, filter])

  const openRandomSlot = useMemo(() => {
    const now = Date.now()
    return proofSlots.find((s) => {
      if (s.completed || s.missed) return false
      const start = new Date(s.window_start).getTime()
      const end = new Date(s.window_end).getTime()
      // Allow submit during window or slightly late (API handles late flag)
      return now >= start - 5 * 60 * 1000 && now <= end + 60 * 60 * 1000
    })
  }, [proofSlots])

  async function completeTask(task: Task) {
    if (!user) return
    if (task.task_type === 'master' || task.task_type === 'checkin' || task.proof_type) {
      setProofTask(task)
      return
    }
    setBusyId(task.id)
    setError('')
    try {
      const res = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          userId: user.id,
          sessionId: session?.id || task.session_id,
          difficulty: task.difficulty,
          selfReport: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Complete failed')
        return
      }
      await refresh()
      await refreshProfile()
    } finally {
      setBusyId(null)
    }
  }

  async function failTask(task: Task) {
    if (!user) return
    if (!confirm(`Mark "${task.title}" as failed? This may trigger punishment.`)) return
    setBusyId(task.id)
    setError('')
    try {
      const res = await fetch('/api/tasks/fail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          userId: user.id,
          sessionId: session?.id || task.session_id,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Fail failed')
        return
      }
      await refresh()
      await refreshProfile()
    } finally {
      setBusyId(null)
    }
  }

  async function generateDaily() {
    if (!user) return
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/tasks/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          sessionId: session?.id,
          tier: profile?.tier || 'Newbie',
          personality: profile?.ai_personality || 'Strict Master',
          fetishes: profile?.interests || [],
          regimens: profile?.preferred_regimens || [],
          hardLimits: profile?.hard_limits || [],
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || data.error || 'Generate failed')
        return
      }
      await refresh()
    } finally {
      setGenerating(false)
    }
  }

  const filters: { id: Filter; label: string }[] = [
    { id: 'open', label: 'Open' },
    { id: 'checkin', label: 'Check-in' },
    { id: 'master', label: 'Master' },
    { id: 'daily', label: 'Daily' },
    { id: 'punishment', label: 'Punish' },
    { id: 'all', label: 'All' },
  ]

  return (
    <div className="px-6 py-6 xl:px-8 xl:py-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-label-caps text-[10px] tracking-widest text-primary-fixed">DISCIPLINE</p>
          <h1 className="font-headline-md text-2xl font-semibold text-on-surface">Tasks</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {session ? 'Session-bound queue' : 'No active session'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={generating || !user}
            onClick={() => void generateDaily()}
            className="min-h-11 rounded-full bg-primary-fixed px-5 py-2 text-xs font-bold text-on-primary-fixed disabled:opacity-50"
          >
            {generating ? 'Generating…' : 'Generate daily'}
          </button>
          <Link
            href="/chat"
            className="min-h-11 rounded-full border border-white/10 px-5 py-2 text-xs font-bold hover:bg-white/5"
          >
            Ask Master
          </Link>
        </div>
      </header>

      {/* Random proof banner */}
      {openRandomSlot && user && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-primary-fixed/30 bg-primary-fixed/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-label-caps text-[10px] tracking-widest text-primary-fixed">
              RANDOM PROOF WINDOW
            </p>
            <p className="mt-1 text-sm text-on-surface">
              Submit cage photo before{' '}
              <span className="font-mono-data">
                {new Date(openRandomSlot.window_end).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRandomScheduleId(openRandomSlot.id)}
            className="min-h-11 rounded-full bg-primary-fixed px-5 py-2 text-xs font-bold text-on-primary-fixed"
          >
            Capture now
          </button>
        </div>
      )}

      {proofSlots.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {proofSlots.map((s) => (
            <span
              key={s.id}
              className={cn(
                'rounded-full border px-3 py-1 font-mono-data text-[10px]',
                s.completed
                  ? 'border-primary-fixed/30 text-primary-fixed'
                  : s.missed
                    ? 'border-error/30 text-error'
                    : 'border-white/10 text-on-surface-variant',
              )}
            >
              {new Date(s.window_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              –{new Date(s.window_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {s.completed ? ' ✓' : s.missed ? ' ✗' : ''}
            </span>
          ))}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              'rounded-full px-4 py-2 text-xs font-bold transition',
              filter === f.id
                ? 'bg-primary-fixed text-on-primary-fixed'
                : 'border border-white/10 text-on-surface-variant hover:text-on-surface',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-on-surface-variant">Loading tasks…</p>
      ) : filtered.length === 0 ? (
        <div className="bento-card rounded-2xl p-8">
          <p className="text-sm text-on-surface-variant">
            No tasks in this filter. Generate daily tasks or open Companion to request a Master task.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              busy={busyId === task.id}
              onProof={() => setProofTask(task)}
              onComplete={() => void completeTask(task)}
              onFail={() => void failTask(task)}
            />
          ))}
        </ul>
      )}

      {user && (
        <ProofCaptureModal
          open={Boolean(proofTask) || Boolean(randomScheduleId)}
          onClose={() => {
            setProofTask(null)
            setRandomScheduleId(null)
          }}
          mode={randomScheduleId ? 'random' : 'task'}
          userId={user.id}
          sessionId={session?.id}
          tier={profile?.tier}
          task={proofTask}
          scheduleId={randomScheduleId}
          onSubmitted={async () => {
            await refresh()
            await refreshProfile()
          }}
        />
      )}
    </div>
  )
}

function TaskCard({
  task,
  busy,
  onProof,
  onComplete,
  onFail,
}: {
  task: Task
  busy: boolean
  onProof: () => void
  onComplete: () => void
  onFail: () => void
}) {
  const done = ['completed', 'verified'].includes(task.status)
  const failed = task.status === 'failed'
  const needsProof =
    task.task_type === 'master' ||
    task.task_type === 'checkin' ||
    Boolean(task.proof_type)

  return (
    <li className="bento-card rounded-2xl p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 font-label-caps text-[10px] tracking-wide',
                task.task_type === 'master' && 'bg-error/15 text-error',
                task.task_type === 'punishment' && 'bg-orange-500/15 text-orange-300',
                task.task_type === 'checkin' && 'bg-primary-fixed/15 text-primary-fixed',
                (task.task_type === 'daily' || task.task_type === 'journal') &&
                  'bg-white/5 text-on-surface-variant',
              )}
            >
              {task.task_type}
            </span>
            <span className="font-mono-data text-[10px] text-on-surface-variant opacity-60">
              D{task.difficulty} · {task.status}
            </span>
            {task.proof_type && (
              <span className="font-label-caps text-[10px] text-on-surface-variant">
                proof:{task.proof_type}
              </span>
            )}
          </div>
          <h3
            className={cn(
              'text-base font-semibold text-on-surface',
              done && 'text-on-surface-variant line-through',
              failed && 'text-error',
            )}
          >
            {task.title}
          </h3>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant">{task.description}</p>
          )}
          {task.ai_verification_reason && (
            <p className="mt-2 text-xs text-on-surface-variant opacity-80">
              AI: {task.ai_verification_reason}
            </p>
          )}
          {task.deadline && (
            <p className="mt-2 font-mono-data text-[11px] text-on-surface-variant opacity-60">
              Due {new Date(task.deadline).toLocaleString()}
            </p>
          )}
        </div>

        {!done && !failed && (
          <div className="flex shrink-0 flex-wrap gap-2">
            {needsProof ? (
              <button
                type="button"
                disabled={busy}
                onClick={onProof}
                className="min-h-11 rounded-full bg-primary-fixed px-4 py-2 text-xs font-bold text-on-primary-fixed disabled:opacity-50"
              >
                Submit proof
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={onComplete}
                className="min-h-11 rounded-full bg-primary-fixed px-4 py-2 text-xs font-bold text-on-primary-fixed disabled:opacity-50"
              >
                {busy ? '…' : 'Mark done'}
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={onFail}
              className="min-h-11 rounded-full border border-error/40 px-4 py-2 text-xs font-bold text-error disabled:opacity-50"
            >
              Fail
            </button>
          </div>
        )}
        {done && <Icon name="check_circle" filled className="text-primary-fixed" />}
      </div>
    </li>
  )
}
