'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { getSessionArchive } from '@/lib/local-storage/session-archive'
import { exportSessionZip } from '@/lib/local-storage/export'
import type { SessionArchive } from '@/lib/local-storage/db'

export default function HistorySessionPage() {
  const params = useParams()
  const sessionId = String(params.sessionId || '')
  const { user } = useAuth()
  const [archive, setArchive] = useState<SessionArchive | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    getSessionArchive(sessionId)
      .then((a) => setArchive(a || null))
      .catch(() => setError('Failed to load archive'))
      .finally(() => setLoading(false))
  }, [sessionId])

  async function exportZip() {
    if (!user || !sessionId) return
    setExporting(true)
    setError('')
    try {
      await exportSessionZip(sessionId, user.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="px-6 py-6 xl:px-8 xl:py-8">
      <Link
        href="/history"
        className="mb-4 inline-block text-xs font-bold text-primary-fixed hover:underline"
      >
        ← History
      </Link>
      <h1 className="font-headline-md text-2xl font-semibold">Session archive</h1>
      <p className="mt-1 font-mono-data text-xs text-on-surface-variant">{sessionId}</p>

      {loading && <p className="mt-6 text-sm text-on-surface-variant">Loading…</p>}
      {error && <p className="mt-4 text-sm text-error">{error}</p>}

      {!loading && !archive && (
        <div className="bento-card mt-6 rounded-2xl p-6 text-sm text-on-surface-variant">
          No local archive for this id. It may have been purged before archival, or lives on
          another device.
        </div>
      )}

      {archive && (
        <div className="mt-6 space-y-4">
          <div className="bento-card rounded-2xl p-5">
            <p className="text-sm text-on-surface">
              Archived {new Date(archive.archived_at).toLocaleString()}
            </p>
            <p className="mt-2 text-xs text-on-surface-variant">
              {archive.chat_messages?.length ?? 0} messages · {archive.tasks?.length ?? 0} tasks ·{' '}
              {archive.session_events?.length ?? 0} events ·{' '}
              {archive.proof_documents?.length ?? 0} proofs
            </p>
            <button
              type="button"
              disabled={exporting}
              onClick={() => void exportZip()}
              className="mt-4 min-h-11 rounded-full bg-primary-fixed px-5 py-2 text-xs font-bold text-on-primary-fixed disabled:opacity-50"
            >
              {exporting ? 'Exporting…' : 'Export ZIP'}
            </button>
          </div>

          {archive.summary && (
            <div className="bento-card rounded-2xl p-5">
              <h2 className="mb-2 text-sm font-semibold">Summary</h2>
              <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-on-surface-variant">
                {JSON.stringify(archive.summary, null, 2)}
              </pre>
            </div>
          )}

          <div className="bento-card rounded-2xl p-5">
            <h2 className="mb-3 text-sm font-semibold">Recent chat (last 20)</h2>
            <ul className="space-y-2">
              {(archive.chat_messages || []).slice(-20).map((m) => (
                <li key={m.id} className="text-xs">
                  <span className="font-bold text-primary-fixed">{m.sender}: </span>
                  <span className="text-on-surface-variant">{m.content}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
