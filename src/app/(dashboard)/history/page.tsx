'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/auth-context'
import { listUserArchives } from '@/lib/local-storage/session-archive'
import { exportSessionZip } from '@/lib/local-storage/export'
import type { SessionArchive } from '@/lib/local-storage/db'
import { getSupabase } from '@/lib/supabase/client'
import { Icon } from '@/components/ui/icon'

type ServerSession = {
  id: string
  status: string
  tier: string
  start_time: string
  scheduled_end_time: string
  actual_end_time: string | null
  total_tasks_completed?: number
}

/**
 * History — local archives + completed server sessions + ZIP export.
 */
export default function HistoryPage() {
  const { user } = useAuth()
  const [archives, setArchives] = useState<SessionArchive[]>([])
  const [serverSessions, setServerSessions] = useState<ServerSession[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const local = await listUserArchives(user.id)
        if (!cancelled) setArchives([...local].reverse())

        const { data } = await getSupabase()
          .from('sessions')
          .select(
            'id, status, tier, start_time, scheduled_end_time, actual_end_time, total_tasks_completed',
          )
          .eq('user_id', user.id)
          .in('status', ['completed', 'emergency', 'failed'])
          .order('start_time', { ascending: false })
          .limit(30)

        if (!cancelled) setServerSessions((data as ServerSession[]) || [])
      } catch {
        if (!cancelled) setError('Could not load history')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  async function handleExport(sessionId: string) {
    if (!user) return
    setExporting(sessionId)
    setError('')
    try {
      await exportSessionZip(sessionId, user.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed — archive may not exist locally')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="px-6 py-6 xl:px-8 xl:py-8">
      <header className="mb-8">
        <p className="font-label-caps text-[10px] tracking-widest text-primary-fixed">ARCHIVE</p>
        <h1 className="font-headline-md text-2xl font-semibold">History</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Heavy data lives on-device after purge. Export ZIP when an archive is present.
        </p>
      </header>

      {error && (
        <p className="mb-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-on-surface-variant">Loading…</p>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-on-surface">Local archives</h2>
            {archives.length === 0 ? (
              <div className="bento-card rounded-2xl p-6 text-sm text-on-surface-variant">
                No local session archives yet. They appear after a session completes and is archived
                on this device.
              </div>
            ) : (
              <ul className="space-y-3">
                {archives.map((a) => (
                  <li
                    key={a.session_id}
                    className="bento-card flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-mono-data text-xs text-primary-fixed">
                        {a.session_id.slice(0, 8)}…
                      </p>
                      <p className="text-sm text-on-surface">
                        Archived {new Date(a.archived_at).toLocaleString()}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {a.chat_messages?.length ?? 0} messages · {a.tasks?.length ?? 0} tasks
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/history/${a.session_id}`}
                        className="min-h-11 rounded-full border border-white/10 px-4 py-2 text-xs font-bold"
                      >
                        Open
                      </Link>
                      <button
                        type="button"
                        disabled={exporting === a.session_id}
                        onClick={() => void handleExport(a.session_id)}
                        className="min-h-11 rounded-full bg-primary-fixed px-4 py-2 text-xs font-bold text-on-primary-fixed disabled:opacity-50"
                      >
                        {exporting === a.session_id ? 'Exporting…' : 'Export ZIP'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-on-surface">Server session log</h2>
            {serverSessions.length === 0 ? (
              <div className="bento-card rounded-2xl p-6 text-sm text-on-surface-variant">
                No completed sessions on the server yet.
              </div>
            ) : (
              <ul className="space-y-3">
                {serverSessions.map((s) => (
                  <li key={s.id} className="bento-card rounded-2xl p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/5 px-2 py-0.5 font-label-caps text-[10px]">
                        {s.status}
                      </span>
                      <span className="text-sm font-semibold">{s.tier}</span>
                    </div>
                    <p className="mt-2 font-mono-data text-xs text-on-surface-variant">
                      {new Date(s.start_time).toLocaleString()}
                      {s.actual_end_time
                        ? ` → ${new Date(s.actual_end_time).toLocaleString()}`
                        : ''}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Tasks completed: {s.total_tasks_completed ?? 0}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Link
            href="/memoir"
            className="inline-flex items-center gap-2 text-xs font-bold text-primary-fixed hover:underline"
          >
            <Icon name="menu_book" className="text-base" />
            Open memoir library
          </Link>
        </div>
      )}
    </div>
  )
}
