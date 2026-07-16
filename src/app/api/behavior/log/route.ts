import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { sessionId, userId, type, intensity, reason, notes } = body as {
            sessionId?: string
            userId?: string
            type?: 'touch' | 'urge' | 'removal'
            intensity?: number
            reason?: string
            notes?: string
        }

        if (!userId || !type) {
            return NextResponse.json({ error: 'userId and type are required' }, { status: 400 })
        }

        if (type !== 'touch' && type !== 'urge' && type !== 'removal') {
            return NextResponse.json({ error: 'Invalid behavior type' }, { status: 400 })
        }

        if (type === 'urge' && (intensity == null || intensity < 1 || intensity > 10)) {
            return NextResponse.json({ error: 'Urge logs require intensity between 1 and 10' }, { status: 400 })
        }

        if (type === 'removal' && !reason) {
            return NextResponse.json({ error: 'Removal logs require a reason' }, { status: 400 })
        }

        const supabase = getServerSupabase()

        // Verify session belongs to user if sessionId is provided, or get active session
        let activeSessionId = sessionId
        if (!activeSessionId) {
            const { data: activeSession, error: sessionErr } = await supabase
                .from('sessions')
                .select('id')
                .eq('user_id', userId)
                .eq('status', 'active')
                .maybeSingle()
            
            if (sessionErr) {
                console.error('[Behavior/Log] Session fetch error:', sessionErr)
            }
            if (activeSession) {
                activeSessionId = activeSession.id
            }
        }

        // Insert log entry
        const { data: logEntry, error: insertErr } = await supabase
            .from('behavior_logs')
            .insert({
                user_id: userId,
                session_id: activeSessionId || null,
                type,
                intensity: type === 'urge' ? intensity : null,
                reason: type === 'removal' ? reason : null,
                notes: notes || null,
                logged_at: new Date().toISOString()
            })
            .select()
            .single()

        if (insertErr) {
            console.error('[Behavior/Log] Insertion error:', insertErr)
            return NextResponse.json({ error: 'Failed to record behavior log' }, { status: 500 })
        }

        // Trigger session event
        if (activeSessionId) {
            await supabase.from('session_events').insert({
                session_id: activeSessionId,
                user_id: userId,
                event_type: `behavior_${type}`,
                payload: {
                    log_id: logEntry.id,
                    intensity: type === 'urge' ? intensity : undefined,
                    reason: type === 'removal' ? reason : undefined,
                }
            })
        }

        return NextResponse.json({ success: true, log: logEntry }, { status: 201 })
    } catch (err) {
        console.error('[Behavior/Log] Error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
