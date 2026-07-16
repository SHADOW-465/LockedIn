import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const sessionId = searchParams.get('sessionId')

        if (!userId) {
            return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 })
        }

        const supabase = getServerSupabase()
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)
        const isoStart = startOfDay.toISOString()

        let query = supabase
            .from('behavior_logs')
            .select('type, intensity, reason, notes, logged_at')
            .eq('user_id', userId)
            .gte('logged_at', isoStart)

        if (sessionId) {
            query = query.eq('session_id', sessionId)
        }

        const { data: logs, error } = await query

        if (error) {
            console.error('[Behavior/Today] Fetch error:', error)
            return NextResponse.json({ error: 'Failed to fetch behavior logs' }, { status: 500 })
        }

        const counts = {
            touch: 0,
            urge: 0,
            removal: 0,
        }

        logs.forEach((log) => {
            if (log.type === 'touch') counts.touch++
            else if (log.type === 'urge') counts.urge++
            else if (log.type === 'removal') counts.removal++
        })

        return NextResponse.json({ counts, logs }, { status: 200 })
    } catch (err) {
        console.error('[Behavior/Today] Error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
