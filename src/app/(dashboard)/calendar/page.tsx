'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { getSupabase } from '@/lib/supabase/client'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

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

  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const start = new Date(year, month, 1)
      const end = new Date(year, month + 1, 0, 23, 59, 59)
      const { data: tasks } = await getSupabase()
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
      if (!cancelled) {
        setActivity(map)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, year, month])

  const cells = useMemo(() => {
    const firstDow = new Date(year, month, 1).getDay() // 0 Sun
    // Monday-first
    const offset = (firstDow + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: { day: number | null; key: string; mark: DayMark }[] = []
    for (let i = 0; i < offset; i++) {
      cells.push({ day: null, key: `pad-${i}`, mark: 'other' })
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
      cells.push({ day: d, key, mark })
    }
    return cells
  }, [year, month, activity])

  const monthLabel = cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })
  const completeDays = Object.values(activity).filter(
    (a) => a.completed > 0 && a.completed >= a.total,
  ).length

  return (
    <div className="px-6 py-6 xl:px-8 xl:py-8">
      <header className="mb-6">
        <p className="font-label-caps text-[10px] tracking-widest text-primary-fixed">DISCIPLINE</p>
        <h1 className="font-headline-md text-2xl font-semibold">Calendar</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Task completion by day. Lime = full day clear.
        </p>
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
                <div
                  key={c.key}
                  className={cn(
                    'relative flex aspect-square items-center justify-center rounded-lg border text-xs font-mono-data',
                    c.day == null && 'border-white/5 opacity-20',
                    c.mark === 'complete' &&
                      'border-primary-fixed/40 bg-primary-fixed/20 text-primary-fixed',
                    c.mark === 'partial' &&
                      'border-on-surface-variant/30 bg-on-surface-variant/10 text-on-surface-variant',
                    c.mark === 'empty' && c.day != null && 'border-white/5 text-on-surface-variant',
                  )}
                >
                  {c.day}
                  {c.mark === 'complete' && (
                    <span className="absolute bottom-1 right-1 h-1 w-1 rounded-full bg-primary-fixed" />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4 xl:col-span-4">
          <div className="bento-card rounded-2xl p-6">
            <p className="font-label-caps text-[11px] text-on-surface-variant">THIS MONTH</p>
            <p className="mt-2 text-3xl font-bold text-primary-fixed">{completeDays}</p>
            <p className="text-sm text-on-surface-variant">full completion days</p>
          </div>
          <div className="bento-card rounded-2xl p-6 text-sm text-on-surface-variant">
            Days light up from task rows (assigned this month). Rituals and sessions add more
            density as you use the app.
          </div>
        </aside>
      </div>
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
