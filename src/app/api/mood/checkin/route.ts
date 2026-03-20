import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

const VALID_TAGS = new Set([
  'needy', 'floaty', 'defiant', 'broken', 'eager', 'desperate', 'content', 'frustrated',
])

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, sessionId, submission_depth, frustration_level, headspace_tags, notes } = body as {
      userId?: string
      sessionId?: string
      submission_depth?: number
      frustration_level?: number
      headspace_tags?: string[]
      notes?: string
    }

    if (!userId || !sessionId || submission_depth == null || frustration_level == null || !headspace_tags) {
      return NextResponse.json({ error: 'userId, sessionId, submission_depth, frustration_level, and headspace_tags are required' }, { status: 400 })
    }

    if (submission_depth < 1 || submission_depth > 10) {
      return NextResponse.json({ error: 'submission_depth must be between 1 and 10' }, { status: 400 })
    }

    if (frustration_level < 1 || frustration_level > 10) {
      return NextResponse.json({ error: 'frustration_level must be between 1 and 10' }, { status: 400 })
    }

    for (const tag of headspace_tags) {
      if (!VALID_TAGS.has(tag)) {
        return NextResponse.json({ error: `Unknown headspace tag: ${tag}` }, { status: 400 })
      }
    }

    const supabase = getServerSupabase()
    const today = new Date().toISOString().slice(0, 10) // yyyy-MM-dd

    const { data: checkin, error } = await supabase
      .from('mood_checkins')
      .upsert(
        { user_id: userId, session_id: sessionId, date: today, submission_depth, frustration_level, headspace_tags, notes: notes ?? null },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single() as { data: { id: string; date: string } | null; error: unknown }

    if (error) {
      console.error('[Mood/Checkin] Upsert error:', error)
      return NextResponse.json({ error: 'Failed to save check-in' }, { status: 500 })
    }

    // Trigger care_mode if frustration >= 8 AND broken/desperate tag present
    const shouldTriggerCare =
      frustration_level >= 8 &&
      headspace_tags.some((t) => t === 'broken' || t === 'desperate')

    if (shouldTriggerCare) {
      const { data: activeSession } = await supabase
        .from('sessions')
        .select('id, care_mode_active')
        .eq('user_id', userId)
        .eq('id', sessionId)
        .maybeSingle()

      if (activeSession && !activeSession.care_mode_active) {
        await supabase
          .from('sessions')
          .update({ care_mode_active: true })
          .eq('id', sessionId)
          .eq('user_id', userId)

        await supabase.from('session_events').insert({
          session_id: sessionId,
          user_id: userId,
          event_type: 'care_mode_activated',
          payload: { trigger: 'mood_checkin', frustration_level, headspace_tags },
        })
      }
    }

    return NextResponse.json({ checkin, care_mode_triggered: shouldTriggerCare }, { status: 201 })
  } catch (error) {
    console.error('[Mood/Checkin] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
