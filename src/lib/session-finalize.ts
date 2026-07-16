import { getSupabase } from '@/lib/supabase/client'
import { invalidateSessionCache } from '@/lib/supabase/sessions'
import { archiveSession } from '@/lib/local-storage/session-archive'
import type { Session, Task } from '@/lib/supabase/schema'

export type FinalizeResult = {
  ok: boolean
  summary: Record<string, unknown> | null
  error?: string
}

/**
 * Client end-of-session pipeline:
 * archive locally → AI summary → purge server heavy data → mark completed.
 */
export async function finalizeSession(
  userId: string,
  session: Session,
): Promise<FinalizeResult> {
  const supabase = getSupabase()
  const sessionId = session.id

  try {
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      await navigator.storage.persist().catch(() => false)
    }

    const [chatRes, tasksRes, eventsRes, proofsRes] = await Promise.all([
      supabase.from('chat_messages').select('*').eq('session_id', sessionId),
      supabase.from('tasks').select('*').eq('session_id', sessionId),
      supabase.from('session_events').select('*').eq('session_id', sessionId),
      supabase.from('proof_documents').select('*').eq('session_id', sessionId),
    ])

    const chat = (chatRes.data || []) as Record<string, unknown>[]
    const tasks = (tasksRes.data || []) as Task[]
    const events = (eventsRes.data || []) as Record<string, unknown>[]
    const proofs = (proofsRes.data || []) as Record<string, unknown>[]

    const completed = tasks.filter((t: Task) =>
      ['completed', 'verified'].includes(t.status),
    ).length
    const failed = tasks.filter((t: Task) => t.status === 'failed').length
    const assigned = tasks.length
    const compliance =
      assigned > 0 ? Math.round((completed / assigned) * 100) : 100

    const start = new Date(session.start_time).getTime()
    const end = Date.now()
    const actualMinutes = Math.max(1, Math.round((end - start) / 60000))
    const planned =
      session.total_duration_minutes ||
      Math.round(
        (new Date(session.scheduled_end_time).getTime() - start) / 60000,
      )

    const sessionData = {
      actual_minutes: actualMinutes,
      planned_minutes: planned,
      tasks_completed: completed,
      tasks_assigned: assigned,
      tasks_failed: failed,
      master_completed: tasks.filter(
        (t: Task) =>
          t.task_type === 'master' &&
          ['completed', 'verified'].includes(t.status),
      ).length,
      master_failed: tasks.filter(
        (t: Task) => t.task_type === 'master' && t.status === 'failed',
      ).length,
      punishment_count: session.total_punishments || 0,
      compliance_rate: compliance,
      willpower_start: 50,
      willpower_end: 50,
      streak_change: 0,
    }

    let summary: Record<string, unknown> | null = null
    try {
      const sumRes = await fetch('/api/sessions/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId, sessionData }),
      })
      if (sumRes.ok) {
        const sumJson = await sumRes.json()
        summary = sumJson.summary || sumJson
      }
    } catch {
      summary = {
        narrative: 'Session ended. Summary unavailable.',
        compliance_rate: compliance,
        performance_grade: 'B',
      }
    }

    await archiveSession(sessionId, userId, {
      session_data: { ...session, ...sessionData } as Record<string, unknown>,
      chat_messages: chat,
      tasks: tasks as unknown as Record<string, unknown>[],
      session_events: events,
      proof_documents: proofs,
      summary,
    })

    await fetch('/api/sessions/purge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, userId }),
    })

    const completeRes = await fetch('/api/sessions/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, userId }),
    })

    if (!completeRes.ok) {
      const err = await completeRes.json().catch(() => ({}))
      return {
        ok: false,
        summary,
        error: (err as { error?: string }).error || 'Complete failed',
      }
    }

    invalidateSessionCache(userId)
    return { ok: true, summary }
  } catch (e) {
    return {
      ok: false,
      summary: null,
      error: e instanceof Error ? e.message : 'Finalize failed',
    }
  }
}
