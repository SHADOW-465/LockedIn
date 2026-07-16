import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

/**
 * GET /api/chat/history?userId=&sessionId=
 *
 * Authoritative chat load (service role — not subject to client RLS quirks).
 * When sessionId is set: returns that session's messages PLUS any null-session
 * companion messages for the same user (so pre-session chat is not lost).
 * When no sessionId: returns the user's most recent messages across sessions.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const sessionId = searchParams.get('sessionId')
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') || 100)))

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    let query = supabase
      .from('chat_messages')
      .select('id, sender, content, message_type, session_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (sessionId) {
      // Include session-bound messages and orphan companion messages (session_id null)
      query = query.or(`session_id.eq.${sessionId},session_id.is.null`)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Chat/History] Query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      messages: data ?? [],
      count: data?.length ?? 0,
    })
  } catch (err) {
    console.error('[Chat/History] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
