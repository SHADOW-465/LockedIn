import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId } = await request.json()

    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'sessionId and userId required' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    const { data: session } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single()

    if (!session || session.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const [chatResult, proofResult, calResult, eventsResult] = await Promise.all([
      supabase.from('chat_messages').delete().eq('session_id', sessionId),
      supabase.from('proof_documents').delete().eq('session_id', sessionId),
      supabase.from('calendar_adjustments').delete().eq('session_id', sessionId),
      supabase.from('session_events').delete().eq('session_id', sessionId),
    ])

    const errors = [chatResult.error, proofResult.error, calResult.error, eventsResult.error].filter(Boolean)
    if (errors.length > 0) {
      console.error('[Sessions/Purge] Partial errors:', errors)
    }

    return NextResponse.json({ success: true, purged: ['chat_messages', 'proof_documents', 'calendar_adjustments', 'session_events'] })
  } catch (error) {
    console.error('[Sessions/Purge] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
