import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, userId, startTime, scheduledEndTime, durationMinutes, notes, device } = body as {
      sessionId: string
      userId: string
      startTime?: string
      scheduledEndTime?: string
      durationMinutes?: number
      notes?: string
      device?: string
    }

    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'sessionId and userId are required' }, { status: 400 })
    }

    const supabase = getServerSupabase()

    // Fetch existing session
    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (startTime) {
      updates.start_time = new Date(startTime).toISOString()
    }

    if (scheduledEndTime) {
      updates.scheduled_end_time = new Date(scheduledEndTime).toISOString()
    }

    if (durationMinutes !== undefined) {
      updates.total_duration_minutes = durationMinutes
    }

    if (notes !== undefined || device !== undefined) {
      const existingConfig = (session.session_config as Record<string, unknown>) || {}
      updates.session_config = {
        ...existingConfig,
        ...(notes !== undefined ? { notes } : {}),
        ...(device !== undefined ? { device } : {}),
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from('sessions')
      .update(updates)
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('[Sessions/Update] DB error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ session: updated })
  } catch (error) {
    console.error('[Sessions/Update] Error:', error)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}
