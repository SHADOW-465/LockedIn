'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { exportSessionZip } from '@/lib/local-storage/export'
import type { SessionArchive } from '@/lib/local-storage/db'

type Tab = 'timeline' | 'chat' | 'proofs' | 'export'

interface Props {
  archive: SessionArchive
  userId: string
}

export function SessionDetail({ archive, userId }: Props) {
  const [tab, setTab] = useState<Tab>('timeline')
  const [chatPage, setChatPage] = useState(0)
  const [exporting, setExporting] = useState(false)
  const PAGE_SIZE = 50

  const data = archive.session_data
  const summary = archive.summary
  const events = [...archive.session_events].sort(
    (a, b) => new Date(String(a.created_at)).getTime() - new Date(String(b.created_at)).getTime()
  )
  const tasks = archive.tasks
  const messages = [...archive.chat_messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const chatSlice = messages.slice(chatPage * PAGE_SIZE, (chatPage + 1) * PAGE_SIZE)

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportSessionZip(archive.session_id, userId)
    } finally {
      setExporting(false)
    }
  }

  const dotColor = (eventType: string) => {
    if (eventType === 'task_completed') return 'bg-teal-primary'
    if (eventType === 'task_failed' || eventType === 'task_overdue') return 'bg-red-primary'
    if (eventType === 'punishment_applied') return 'bg-tier-slave'
    if (eventType === 'care_mode_activated') return 'bg-blue-400'
    return 'bg-purple-primary'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card variant="hero" className="space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">{String(data.ai_personality ?? 'Session')}</h2>
            <p className="text-xs text-text-tertiary font-mono mt-0.5">
              {data.start_time ? format(new Date(String(data.start_time)), 'MMM d') : '?'}
              {' → '}
              {data.actual_end_time ? format(new Date(String(data.actual_end_time)), 'MMM d, yyyy') : 'ongoing'}
            </p>
          </div>
          {typeof summary?.performance_grade === 'string' && (
            <span className="text-3xl font-black font-mono text-teal-primary">
              {summary.performance_grade}
            </span>
          )}
        </div>
        {summary && (
          <div className="flex gap-3 flex-wrap">
            {typeof summary.compliance_rate === 'number' && (
              <Badge variant="info">{summary.compliance_rate}% compliance</Badge>
            )}
            <Badge variant="genre">{tasks.length} tasks</Badge>
            <Badge variant="genre">{events.length} events</Badge>
          </div>
        )}
        {typeof summary?.narrative === 'string' && (
          <p className="text-sm text-text-secondary italic leading-relaxed">
            {summary.narrative}
          </p>
        )}
      </Card>

      {/* Tab bar */}
      <div className="flex gap-1 bg-bg-tertiary rounded-xl p-1">
        {(['timeline', 'chat', 'proofs', 'export'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              tab === t
                ? 'bg-bg-secondary text-text-primary'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Timeline tab */}
      {tab === 'timeline' && (
        <div className="space-y-2">
          {events.length === 0 && (
            <p className="text-text-tertiary text-sm text-center py-6">No events recorded.</p>
          )}
          {events.map((event, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotColor(String(event.event_type ?? ''))}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-text-secondary capitalize">
                    {String(event.event_type ?? '').replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-text-tertiary font-mono shrink-0">
                    {event.created_at ? format(new Date(String(event.created_at)), 'HH:mm') : ''}
                  </span>
                </div>
                {event.payload && typeof event.payload === 'object' && (
                  <p className="text-[11px] text-text-tertiary mt-0.5 line-clamp-2">
                    {JSON.stringify(event.payload)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat tab */}
      {tab === 'chat' && (
        <div className="space-y-3">
          {messages.length === 0 && (
            <p className="text-text-tertiary text-sm text-center py-6">No chat messages in archive.</p>
          )}
          {chatSlice.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                  msg.sender === 'user'
                    ? 'bg-purple-primary/20 text-text-primary'
                    : 'bg-bg-tertiary text-text-secondary'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <p className="text-[10px] text-text-tertiary mt-1 font-mono">
                  {format(new Date(msg.created_at), 'HH:mm')}
                </p>
              </div>
            </div>
          ))}
          {messages.length > PAGE_SIZE && (
            <div className="flex justify-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChatPage((p) => Math.max(0, p - 1))}
                disabled={chatPage === 0}
              >
                ← Prev
              </Button>
              <span className="text-xs text-text-tertiary self-center">
                {chatPage + 1} / {Math.ceil(messages.length / PAGE_SIZE)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChatPage((p) => p + 1)}
                disabled={(chatPage + 1) * PAGE_SIZE >= messages.length}
              >
                Next →
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Proofs tab */}
      {tab === 'proofs' && (
        <div className="space-y-2">
          {archive.proof_documents.length === 0 && (
            <p className="text-text-tertiary text-sm text-center py-6">No proof documents in archive.</p>
          )}
          {archive.proof_documents.map((proof, i) => (
            <Card key={i} variant="flat" className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{String((proof as Record<string, unknown>).file_type ?? 'file')}</p>
                <p className="text-xs text-text-tertiary font-mono">
                  {(proof as Record<string, unknown>).created_at
                    ? format(new Date(String((proof as Record<string, unknown>).created_at)), 'MMM d, HH:mm')
                    : ''}
                </p>
              </div>
              <Badge variant={
                (proof as Record<string, unknown>).verification_status === 'passed' ? 'success' :
                (proof as Record<string, unknown>).verification_status === 'failed' ? 'locked' : 'info'
              }>
                {String((proof as Record<string, unknown>).verification_status ?? 'pending')}
              </Badge>
            </Card>
          ))}
        </div>
      )}

      {/* Export tab */}
      {tab === 'export' && (
        <Card variant="flat" className="space-y-4 text-center py-8">
          <p className="text-text-secondary text-sm">Download a ZIP of this session including chat logs, events, and proof metadata.</p>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Exporting…' : '⬇ Download Session ZIP'}
          </Button>
        </Card>
      )}
    </div>
  )
}
