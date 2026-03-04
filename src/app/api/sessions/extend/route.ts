import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, deltaMinutes, reason } = await request.json()

    if (!sessionId || !userId || !deltaMinutes) {
      return NextResponse.json({ error: 'sessionId, userId, deltaMinutes required' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('id, user_id, total_duration_minutes, start_time, status, extension_count')
      .eq('id', sessionId)
      .single()

    if (fetchError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!['active', 'extending'].includes(session.status)) {
      return NextResponse.json({ error: 'Session not extensible' }, { status: 400 })
    }

    const newDuration = session.total_duration_minutes + deltaMinutes
    const newEnd = new Date(new Date(session.start_time).getTime() + newDuration * 60 * 1000)

    const { data: updated, error: updateError } = await supabase
      .from('sessions')
      .update({
        status: 'extending',
        total_duration_minutes: newDuration,
        scheduled_end_time: newEnd.toISOString(),
        extension_count: (session.extension_count || 0) + 1,
        last_extended_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to extend session' }, { status: 500 })
    }

    await supabase.from('session_events').insert({
      session_id: sessionId,
      user_id: userId,
      event_type: 'timer_extended',
      payload: { delta_minutes: deltaMinutes, reason, new_end: newEnd.toISOString() },
    })

    // Brief extending→active transition
    await supabase.from('sessions').update({ status: 'active' }).eq('id', sessionId)

    return NextResponse.json({ session: { ...updated, status: 'active' } })
  } catch (error) {
    console.error('[Sessions/Extend] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
