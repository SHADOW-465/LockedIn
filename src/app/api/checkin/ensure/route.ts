import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

const CHECKIN_VERIFICATION = 'Clear photo of the locked chastity cage showing it is secured and unmodified.'

// On-time windows (local hours) — used only at proof submission to detect late submissions
export const MORNING_WINDOW = { start: 6, end: 10 }   // 6am–10am local
export const NIGHT_WINDOW   = { start: 20, end: 24 }  // 8pm–midnight local

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, sessionId, date } = body as {
            userId: string
            sessionId?: string
            date?: string   // YYYY-MM-DD in client's local timezone
        }

        if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

        const supabase = getServerSupabase()
        const now = new Date()
        const today = date || now.toISOString().split('T')[0]

        // Resolve active session
        let activeSessionId = sessionId
        if (!activeSessionId) {
            const { data: sess } = await supabase
                .from('sessions')
                .select('id')
                .eq('user_id', userId)
                .in('status', ['active', 'extending'])
                .maybeSingle()
            if (sess) activeSessionId = sess.id
        }

        // Query today's check-in tasks (by local date)
        const todayStart = `${today}T00:00:00.000Z`
        const todayEnd   = `${today}T23:59:59.999Z`

        const { data: existing } = await supabase
            .from('tasks')
            .select('id, title')
            .eq('user_id', userId)
            .eq('task_type', 'checkin')
            .gte('assigned_at', todayStart)
            .lte('assigned_at', todayEnd)

        const hasMorning = existing?.some(t => t.title === 'Morning Check-in')
        const hasNight   = existing?.some(t => t.title === 'Night Check-in')

        const created: string[] = []

        // Always create today's check-ins if they don't exist yet.
        // No time-window restriction — the task is always available.
        // Late submissions are penalised at proof-submission time instead.

        if (!hasMorning) {
            await supabase.from('tasks').insert({
                user_id:                  userId,
                session_id:               activeSessionId || null,
                task_type:                'checkin',
                source:                   'system',
                title:                    'Morning Check-in',
                description:              'Submit your morning cage check-in photo. On-time window: 6am–10am. Submitting outside this window incurs a punishment.',
                difficulty:               1,
                genres:                   ['chastity'],
                cage_status:              'caged',
                verification_type:        'photo',
                proof_type:               'image',
                verification_requirement: CHECKIN_VERIFICATION,
                status:                   'pending',
                assigned_at:              now.toISOString(),
                deadline:                 null,   // no hard deadline — always submittable
                punishment_hours:         1,       // applied if submitted late
            })
            created.push('morning')
        }

        if (!hasNight) {
            await supabase.from('tasks').insert({
                user_id:                  userId,
                session_id:               activeSessionId || null,
                task_type:                'checkin',
                source:                   'system',
                title:                    'Night Check-in',
                description:              'Submit your nightly cage check-in photo. On-time window: 8pm–midnight. Submitting outside this window incurs a punishment.',
                difficulty:               1,
                genres:                   ['chastity'],
                cage_status:              'caged',
                verification_type:        'photo',
                proof_type:               'image',
                verification_requirement: CHECKIN_VERIFICATION,
                status:                   'pending',
                assigned_at:              now.toISOString(),
                deadline:                 null,   // no hard deadline — always submittable
                punishment_hours:         1,       // applied if submitted late
            })
            created.push('night')
        }

        return NextResponse.json({ created, ok: true })
    } catch (error) {
        console.error('[CheckIn] Error:', error)
        return NextResponse.json({ error: 'Failed to ensure check-ins' }, { status: 500 })
    }
}
