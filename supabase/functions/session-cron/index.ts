// index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (_req: Request) => {
  try {
    const now = new Date().toISOString()

    // 1. Mark expired sessions as 'completing'
    const { data: expiredSessions, error: expireError } = await supabase
      .from('sessions')
      .update({ status: 'completing' })
      .in('status', ['active', 'extending'])
      .lt('scheduled_end_time', now)
      .select('id, user_id')

    if (expireError) {
      console.error('[session-cron] expire error:', expireError)
    }

    // Write session_completed events for each expired session
    if (expiredSessions && expiredSessions.length > 0) {
      const events = expiredSessions.map(s => ({
        session_id: s.id,
        user_id: s.user_id,
        event_type: 'session_completed',
        payload: { auto_expired: true, expired_at: now },
      }))
      await supabase.from('session_events').insert(events)
    }

    // 2. Detect overdue master tasks
    const { data: overdueTasks, error: overdueError } = await supabase
      .from('tasks')
      .update({ status: 'overdue' })
      .eq('task_type', 'master')
      .eq('status', 'pending')
      .lt('deadline', now)
      .select('id, user_id, session_id, title, punishment_hours')

    if (overdueError) {
      console.error('[session-cron] overdue tasks error:', overdueError)
    }

    // 3. Trigger punishment for each overdue master task
    const punishmentResults: unknown[] = []
    if (overdueTasks && overdueTasks.length > 0) {
      for (const task of overdueTasks) {
        try {
          // Write task_overdue event
          await supabase.from('session_events').insert({
            session_id: task.session_id,
            user_id: task.user_id,
            event_type: 'task_overdue',
            payload: { task_id: task.id, title: task.title },
          })

          // Trigger punishment via internal API call
          const siteUrl = Deno.env.get('SITE_URL') || Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'http://localhost:3000'
          const punishRes = await fetch(`${siteUrl}/api/punish`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-cron-secret': Deno.env.get('CRON_SECRET') || '',
            },
            body: JSON.stringify({
              userId: task.user_id,
              sessionId: task.session_id,
              taskId: task.id,
              violation: 'overdue_master_task',
              punishmentHours: task.punishment_hours || 2,
            }),
          })

          punishmentResults.push({
            task_id: task.id,
            status: punishRes.status,
          })
        } catch (err) {
          console.error('[session-cron] punishment trigger error:', err)
        }
      }
    }

    return new Response(JSON.stringify({
      expired_sessions: expiredSessions?.length ?? 0,
      overdue_tasks: overdueTasks?.length ?? 0,
      punishments_triggered: punishmentResults.length,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[session-cron] fatal error:', error)
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
