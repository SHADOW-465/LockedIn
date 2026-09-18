import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

interface SessionConfig {
  tier: string
  ai_personality?: string
  hard_limits?: string[]
  soft_limits?: string[]
  regimens?: string[]
  desired_duration_minutes: number
  startTime?: string
  isCompleted?: boolean
  device?: string
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, config } = body as { userId: string; config: SessionConfig }

    if (!userId || !config?.desired_duration_minutes) {
      return NextResponse.json({ error: 'userId and config.desired_duration_minutes are required' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    // If starting an active session (not logging a past completed one), ensure only 1 active session exists
    if (!config.isCompleted) {
      const { data: existing } = await supabase
        .from('sessions')
        .select('id')
        .eq('user_id', userId)
        .in('status', ['active', 'extending', 'completing'])
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ error: 'active_session_exists', sessionId: existing.id }, { status: 409 })
      }
    }

    const startTimeDate = config.startTime ? new Date(config.startTime) : new Date()
    const scheduledEnd = new Date(startTimeDate.getTime() + config.desired_duration_minutes * 60 * 1000)

    const insertData: Record<string, unknown> = {
      user_id: userId,
      status: config.isCompleted ? 'completed' : 'active',
      tier: config.tier || 'Newbie',
      ai_personality: config.ai_personality || null,
      start_time: startTimeDate.toISOString(),
      scheduled_end_time: scheduledEnd.toISOString(),
      total_duration_minutes: config.desired_duration_minutes,
      session_config: config,
      extension_count: 0,
    }

    if (config.isCompleted) {
      insertData.actual_end_time = scheduledEnd.toISOString()
    }

    const { data: session, error } = await supabase
      .from('sessions')
      .insert(insertData)
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

    // Seed default punishment pool (idempotent — unique(user_id, title, is_custom) ignores duplicates)
    try {
      const { DEFAULT_POOL_SEED } = await import('@/lib/engines/punishment-wheel')
      await supabase.from('punishment_pool').upsert(
        DEFAULT_POOL_SEED.map((entry) => ({ ...entry, user_id: userId })),
        { onConflict: 'user_id,title,is_custom', ignoreDuplicates: true }
      )
    } catch (seedError) {
      // Non-fatal — don't block session creation
      console.warn('[Sessions/Start] Pool seed error:', seedError)
    }

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error('[Sessions/Start] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
