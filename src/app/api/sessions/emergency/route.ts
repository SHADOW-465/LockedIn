import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, reason } = await request.json()

    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'sessionId and userId required' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    const { data: session } = await supabase
      .from('sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .single()

    if (!session || session.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await supabase
      .from('sessions')
      .update({ status: 'emergency', actual_end_time: new Date().toISOString() })
      .eq('id', sessionId)

    await supabase.from('session_events').insert({
      session_id: sessionId,
      user_id: userId,
      event_type: 'session_emergency',
      payload: { reason: reason || 'User triggered emergency release', released_at: new Date().toISOString() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Sessions/Emergency] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
