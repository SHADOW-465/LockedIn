'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { getSupabase } from '@/lib/supabase/client'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import type { Session } from '@/lib/supabase/schema'
import { getActiveSession } from '@/lib/supabase/sessions'
import { SessionModal } from '@/components/features/calendar/session-modal'

type DayMark = 'complete' | 'partial' | 'empty' | 'other'

/**
 * Discipline calendar — month grid with session/task density from real data.
 */
export default function CalendarPage() {
  const { user } = useAuth()
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [activity, setActivity] = useState<Record<string, { completed: number; total: number }>>({})
  const [loading, setLoading] = useState(true)

  // Chastity session modal state
  const [modalDate, setModalDate] = useState<Date | null>(null)
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [sessionsList, setSessionsList] = useState<Session[]>([])
  const [sessionDaySet, setSessionDaySet] = useState<Set<string>>(new Set())

  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const loadData = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    const supabase = getSupabase()

    // 1. Fetch active session & list of recent sessions
    const curSession = await getActiveSession(user.id)
    setActiveSession(curSession)

    const { data: allSessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })
      .limit(50)

    const loadedSessions = (allSessions ?? []) as Session[]
    setSessionsList(loadedSessions)

    const daySet = new Set<string>()
    for (const s of loadedSessions) {
      const start = new Date(s.start_time)
      const end = s.actual_end_time ? new Date(s.actual_end_time) : new Date(s.scheduled_end_time)
      const curr = new Date(start)
      while (curr <= end) {
        daySet.add(curr.toISOString().slice(0, 10))
        curr.setDate(curr.getDate() + 1)
      }
    }
    setSessionDaySet(daySet)

    // 2. Fetch tasks for activity heatmap
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0, 23, 59, 59)
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status, completed_at, assigned_at')
      .eq('user_id', user.id)
      .gte('assigned_at', start.toISOString())
      .lte('assigned_at', end.toISOString())

    const map: Record<string, { completed: number; total: number }> = {}
    for (const t of tasks || []) {
      const day = (t.completed_at || t.assigned_at || '').slice(0, 10)
      if (!day) continue
      if (!map[day]) map[day] = { completed: 0, total: 0 }
      map[day].total += 1
      if (['completed', 'verified'].includes(t.status)) map[day].completed += 1
    }

    setActivity(map)
    setLoading(false)
  }, [user?.id, year, month])

  useEffect(() => {
    loadData()
  }, [loadData])

  const getSessionForDate = (day: Date): Session | null => {
    const dStr = day.toISOString().slice(0, 10)
    if (activeSession) {
      const start = activeSession.start_time.slice(0, 10)
      const end = activeSession.scheduled_end_time.slice(0, 10)
      if (dStr >= start && dStr <= end) return activeSession
    }
    for (const s of sessionsList) {
      const start = s.start_time.slice(0, 10)
      const end = (s.actual_end_time || s.scheduled_end_time).slice(0, 10)
      if (dStr >= start && dStr <= end) return s
    }
    return null
  }

  const cells = useMemo(() => {
    const firstDow = new Date(year, month, 1).getDay() // 0 Sun
    // Monday-first
    const offset = (firstDow + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: { day: number | null; key: string; mark: DayMark; date: Date | null; hasSession: boolean }[] = []
    for (let i = 0; i < offset; i++) {
      cells.push({ day: null, key: `pad-${i}`, mark: 'other', date: null, hasSession: false })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const a = activity[key]
      let mark: DayMark = 'empty'
      if (a) {
        if (a.completed > 0 && a.completed >= a.total) mark = 'complete'
        else if (a.completed > 0) mark = 'partial'
        else mark = 'empty'
      }
      cells.push({
        day: d,
        key,
        mark,
        date: new Date(year, month, d),
        hasSession: sessionDaySet.has(key),
      })
    }
    return cells
  }, [year, month, activity, sessionDaySet])

  const monthLabel = cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })
  const completeDays = Object.values(activity).filter(
    (a) => a.completed > 0 && a.completed >= a.total,
  ).length

  return (
    <div className="px-6 py-6 xl:px-8 xl:py-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-label-caps text-[10px] tracking-widest text-primary-fixed">DISCIPLINE</p>
          <h1 className="font-headline-md text-2xl font-semibold">Calendar</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Tap any date to log, backdate, or manage chastity sessions. Lime = full clear.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalDate(new Date())}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary-fixed px-5 text-xs font-bold text-on-primary-fixed shadow-lg shadow-primary-fixed/20 transition hover:brightness-110"
        >
          <Icon name="lock" filled className="text-base" />
          {activeSession ? 'Manage Active Session' : 'Log / Start Session'}
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="bento-card rounded-2xl p-6 xl:col-span-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">{monthLabel}</h2>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setCursor(new Date(year, month - 1, 1))}
                  className="rounded-lg p-1 hover:bg-white/5"
                  aria-label="Previous month"
                >
                  <Icon name="chevron_left" />
                </button>
                <button
                  type="button"
                  onClick={() => setCursor(new Date(year, month + 1, 1))}
                  className="rounded-lg p-1 hover:bg-white/5"
                  aria-label="Next month"
                >
                  <Icon name="chevron_right" />
                </button>
              </div>
            </div>
            <div className="hidden gap-4 sm:flex">
              <Legend color="bg-primary-fixed" label="Complete" />
              <Legend color="bg-on-surface-variant" label="Partial" />
              <Legend color="border border-teal-400" label="Locked" />
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-2 text-center font-mono-data text-[11px] text-on-surface-variant">
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {loading ? (
            <p className="py-12 text-center text-sm text-on-surface-variant">Loading…</p>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {cells.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  disabled={c.day == null}
                  onClick={() => c.date && setModalDate(c.date)}
                  className={cn(
                    'relative flex aspect-square items-center justify-center rounded-lg border text-xs font-mono-data transition',
                    c.day == null && 'border-white/5 opacity-20 cursor-default',
                    c.day != null && 'cursor-pointer hover:scale-105 active:scale-95',
                    c.mark === 'complete' &&
                      'border-primary-fixed/40 bg-primary-fixed/20 text-primary-fixed',
                    c.mark === 'partial' &&
                      'border-on-surface-variant/30 bg-on-surface-variant/10 text-on-surface-variant',
                    c.mark === 'empty' && c.day != null && 'border-white/5 text-on-surface-variant hover:border-white/20',
                    c.hasSession && 'ring-2 ring-teal-400/60 ring-offset-1 ring-offset-background',
                  )}
                >
                  {c.day}
                  {c.mark === 'complete' && (
                    <span className="absolute bottom-1 right-1 h-1 w-1 rounded-full bg-primary-fixed" />
                  )}
                  {c.hasSession && (
                    <span className="absolute top-1 right-1 flex h-1.5 w-1.5 items-center justify-center">
                      <span className="h-1 w-1 rounded-full bg-teal-400" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4 xl:col-span-4">
          {activeSession && (
            <div className="bento-card rounded-2xl p-6 border border-teal-500/30 bg-teal-950/20">
              <div className="flex items-center justify-between">
                <p className="font-label-caps text-[11px] text-teal-400 font-semibold tracking-wider">ACTIVE LOCK</p>
                <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-ping" />
              </div>
              <p className="mt-2 text-2xl font-bold font-mono text-white">
                {new Date(activeSession.scheduled_end_time).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">Scheduled Release</p>
              <button
                type="button"
                onClick={() => setModalDate(new Date())}
                className="mt-4 w-full rounded-xl bg-surface-container py-2.5 text-xs font-bold text-teal-300 border border-teal-500/20 hover:bg-surface-variant transition"
              >
                Manage Session / Log Unlock
              </button>
            </div>
          )}

          <div className="bento-card rounded-2xl p-6">
            <p className="font-label-caps text-[11px] text-on-surface-variant">THIS MONTH</p>
            <p className="mt-2 text-3xl font-bold text-primary-fixed">{completeDays}</p>
            <p className="text-sm text-on-surface-variant">full completion days</p>
          </div>

          <div className="bento-card rounded-2xl p-6 text-sm text-on-surface-variant space-y-2">
            <p className="font-semibold text-on-surface">Friendly Tracker</p>
            <p>
              Click any calendar square to view, backdate, or start a chastity lock session on that day.
            </p>
          </div>
        </aside>
      </div>

      {modalDate && user && (
        <SessionModal
          date={modalDate}
          activeSession={activeSession}
          daySession={getSessionForDate(modalDate)}
          userId={user.id}
          onClose={() => setModalDate(null)}
          onSuccess={() => {
            loadData()
            setModalDate(null)
          }}
        />
      )}
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn('h-2 w-2 rounded-full', color)} />
      <span className="font-label-caps text-[10px] uppercase text-on-surface-variant">{label}</span>
    </div>
  )
}
