import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

interface SessionConfig {
  tier: string
  ai_personality?: string
  hard_limits?: string[]
  soft_limits?: string[]
  regimens?: string[]
  desired_duration_minutes: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, config } = body as { userId: string; config: SessionConfig }

    if (!userId || !config?.desired_duration_minutes) {
      return NextResponse.json({ error: 'userId and config.desired_duration_minutes are required' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    const { data: existing } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['active', 'extending', 'completing'])
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'active_session_exists', sessionId: existing.id }, { status: 409 })
    }

    const now = new Date()
    const scheduledEnd = new Date(now.getTime() + config.desired_duration_minutes * 60 * 1000)

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        status: 'active',
        tier: config.tier || 'Newbie',
        ai_personality: config.ai_personality || null,
        start_time: now.toISOString(),
        scheduled_end_time: scheduledEnd.toISOString(),
        total_duration_minutes: config.desired_duration_minutes,
        session_config: config,
        extension_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('[Sessions/Start] Insert error:', error)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    await supabase.from('session_events').insert({
      session_id: session.id,
      user_id: userId,
      event_type: 'session_started',
      payload: { config, duration_minutes: config.desired_duration_minutes },
    })

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error('[Sessions/Start] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
